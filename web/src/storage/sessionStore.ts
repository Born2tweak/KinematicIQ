/**
 * Local session history (M9).
 *
 * Browser-only persistence for completed sets: IndexedDB when available, an
 * in-memory adapter otherwise (tests, unsupported browsers). No accounts, no
 * network, no cloud — saving is an explicit user action on the results screen
 * and everything stays on this device (docs/research/08 §9 local-first flavor
 * only; docs/doctrine/deferred-scope.md defers all backend persistence).
 *
 * The stored record is versioned so future schema changes can migrate or
 * refuse old records instead of misreading them.
 */

import type { ProtocolId } from '../core/protocol'
import { makeProvenance, type Provenance } from '../core/provenance'
// Value import is cycle-safe: sessionArtifact imports only TYPES from here.
import { ANALYSIS_ALGORITHM_VERSION } from '../session/sessionArtifact'
import type { SessionResult } from '../session/types'

/** Bump when the stored shape changes; readers must check before trusting. */
export const SESSION_STORE_SCHEMA_VERSION = 2

/**
 * Versions this reader understands. v1 (pre-M40) lacks `algorithmVersion`;
 * v2 adds it. v1 records are kept readable forever-until-migrated — they are
 * normalized in memory by `session/sessionArtifact.ts`, never rewritten on
 * disk (M40: no on-disk migration; a real storage migration would be its own
 * milestone with UI tests before any legacy field is dropped).
 */
export const READABLE_SCHEMA_VERSIONS: ReadonlySet<number> = new Set([1, 2])

export interface StoredSession {
  /** Unique record id (UUID). */
  id: string
  schemaVersion: number
  protocolId: ProtocolId
  /** Epoch ms when the record was saved. */
  timestamp: number
  result: SessionResult
  provenance: Provenance
  /**
   * Analysis pipeline version that produced `result` (M40, schema v2).
   * Absent on v1 records — readers surface `unversioned-legacy` instead of
   * guessing (see session/sessionArtifact.ts).
   */
  algorithmVersion?: string
}

export interface SessionStore {
  save(record: StoredSession): Promise<void>
  /** All saved sessions, newest first. */
  list(): Promise<StoredSession[]>
  /** Privacy control: irreversibly removes every saved session. */
  deleteAll(): Promise<void>
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Snapshot a finished session into a versioned record. Provenance comes from
 * the metric results when present (they all share one capture) and falls back
 * to a live-capture default rather than being faked as something richer.
 */
export function buildStoredSession(
  result: SessionResult,
  options: {
    now?: number
    id?: string
    provenance?: Provenance
    algorithmVersion?: string
  } = {},
): StoredSession {
  const provenance =
    options.provenance ??
    result.metricResults[0]?.provenance ??
    makeProvenance({ captureSource: 'live' })
  return {
    id: options.id ?? generateId(),
    schemaVersion: SESSION_STORE_SCHEMA_VERSION,
    protocolId: result.protocolId,
    timestamp: options.now ?? Date.now(),
    result,
    provenance,
    algorithmVersion: options.algorithmVersion ?? ANALYSIS_ALGORITHM_VERSION,
  }
}

/** Records this reader understands; unknown versions are skipped, not guessed at. */
export function isReadableRecord(record: StoredSession): boolean {
  return READABLE_SCHEMA_VERSIONS.has(record.schemaVersion)
}

/** In-memory adapter for tests and environments without IndexedDB. */
export function createMemorySessionStore(): SessionStore {
  const records = new Map<string, StoredSession>()
  return {
    async save(record) {
      records.set(record.id, record)
    },
    async list() {
      return [...records.values()]
        .filter(isReadableRecord)
        .sort((a, b) => b.timestamp - a.timestamp)
    },
    async deleteAll() {
      records.clear()
    },
  }
}

const DB_NAME = 'kinematiciq'
const DB_VERSION = 1
const STORE_NAME = 'sessions'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

/** IndexedDB-backed store. One object store keyed by record id. */
export function createIndexedDbSessionStore(): SessionStore {
  async function withStore<T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await openDatabase()
    try {
      const tx = db.transaction(STORE_NAME, mode)
      return await requestToPromise(run(tx.objectStore(STORE_NAME)))
    } finally {
      db.close()
    }
  }

  return {
    async save(record) {
      await withStore('readwrite', (store) => store.put(record))
    },
    async list() {
      const records = await withStore<StoredSession[]>('readonly', (store) =>
        store.getAll(),
      )
      return records
        .filter(isReadableRecord)
        .sort((a, b) => b.timestamp - a.timestamp)
    },
    async deleteAll() {
      await withStore('readwrite', (store) => store.clear())
    },
  }
}

let sharedStore: SessionStore | null = null

/**
 * The app-wide session store. IndexedDB when the browser provides it, memory
 * otherwise (data then lasts only for the page's lifetime — still no network).
 */
export function getSessionStore(): SessionStore {
  if (sharedStore === null) {
    sharedStore =
      typeof indexedDB === 'undefined'
        ? createMemorySessionStore()
        : createIndexedDbSessionStore()
  }
  return sharedStore
}
