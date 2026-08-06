/**
 * Local capture-media store (P3): the source video and pose tape belonging to
 * a saved session.
 *
 * Before this, neither survived the results screen. `UploadScreen` revoked its
 * object URL on unmount, the live path recorded no video at all, and the pose
 * tape lived in a module-level variable that died with the page — so a
 * reloaded report rendered metrics with no replay.
 *
 * Deliberately a SEPARATE database from `storage/sessionStore.ts`:
 *
 *   - Media is orders of magnitude larger than a report. Keeping it apart
 *     means a quota failure while writing a video cannot cost the athlete the
 *     analysis, and the report stays readable when the video is gone.
 *   - `sessionStore` opens `kinematiciq` at version 1. Adding an object store
 *     there would force a version bump and an upgrade path over records that
 *     already exist on real devices, for no benefit.
 *
 * Everything is browser-local. Nothing here is uploaded, and every write is
 * keyed by the session id so deleting a session can delete its media with it.
 */
import type { PoseTape } from '../eval/poseTape'

export type CaptureMediaSource = 'camera' | 'upload'

export interface CaptureMediaRecord {
  /** The owning `StoredSession.id`. */
  sessionId: string
  blob: Blob
  mimeType: string
  source: CaptureMediaSource
  /** Null when the browser did not report a usable duration. */
  durationMs: number | null
  sizeBytes: number
}

export interface PoseTapeRecord {
  sessionId: string
  tape: PoseTape
}

export interface CaptureMediaStore {
  saveMedia(record: CaptureMediaRecord): Promise<void>
  getMedia(sessionId: string): Promise<CaptureMediaRecord | null>
  saveTape(record: PoseTapeRecord): Promise<void>
  getTape(sessionId: string): Promise<PoseTape | null>
  /** Removes both the media and the tape for one session. */
  delete(sessionId: string): Promise<void>
  deleteAll(): Promise<void>
}

const DB_NAME = 'kinematiciq-media'
const DB_VERSION = 1
const MEDIA_STORE = 'captureMedia'
const TAPE_STORE = 'poseTapes'

export function createMemoryCaptureMediaStore(): CaptureMediaStore {
  const media = new Map<string, CaptureMediaRecord>()
  const tapes = new Map<string, PoseTape>()
  return {
    async saveMedia(record) {
      media.set(record.sessionId, record)
    },
    async getMedia(sessionId) {
      return media.get(sessionId) ?? null
    },
    async saveTape(record) {
      tapes.set(record.sessionId, record.tape)
    },
    async getTape(sessionId) {
      return tapes.get(sessionId) ?? null
    },
    async delete(sessionId) {
      media.delete(sessionId)
      tapes.delete(sessionId)
    },
    async deleteAll() {
      media.clear()
      tapes.clear()
    },
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'sessionId' })
      }
      if (!db.objectStoreNames.contains(TAPE_STORE)) {
        db.createObjectStore(TAPE_STORE, { keyPath: 'sessionId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

export function createIndexedDbCaptureMediaStore(): CaptureMediaStore {
  async function withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await openDatabase()
    try {
      const tx = db.transaction(storeName, mode)
      return await requestToPromise(run(tx.objectStore(storeName)))
    } finally {
      db.close()
    }
  }

  return {
    async saveMedia(record) {
      await withStore(MEDIA_STORE, 'readwrite', (store) => store.put(record))
    },
    async getMedia(sessionId) {
      const record = await withStore<CaptureMediaRecord | undefined>(
        MEDIA_STORE,
        'readonly',
        (store) => store.get(sessionId),
      )
      return record ?? null
    },
    async saveTape(record) {
      await withStore(TAPE_STORE, 'readwrite', (store) => store.put(record))
    },
    async getTape(sessionId) {
      const record = await withStore<PoseTapeRecord | undefined>(
        TAPE_STORE,
        'readonly',
        (store) => store.get(sessionId),
      )
      return record?.tape ?? null
    },
    async delete(sessionId) {
      await withStore(MEDIA_STORE, 'readwrite', (store) => store.delete(sessionId))
      await withStore(TAPE_STORE, 'readwrite', (store) => store.delete(sessionId))
    },
    async deleteAll() {
      await withStore(MEDIA_STORE, 'readwrite', (store) => store.clear())
      await withStore(TAPE_STORE, 'readwrite', (store) => store.clear())
    },
  }
}

let sharedStore: CaptureMediaStore | null = null

export function getCaptureMediaStore(): CaptureMediaStore {
  if (sharedStore === null) {
    sharedStore =
      typeof indexedDB === 'undefined'
        ? createMemoryCaptureMediaStore()
        : createIndexedDbCaptureMediaStore()
  }
  return sharedStore
}

/** Test seam: replace the shared store. */
export function setCaptureMediaStore(store: CaptureMediaStore | null): void {
  sharedStore = store
}
