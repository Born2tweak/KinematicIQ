/**
 * Validation corpus manifest (M44).
 *
 * A tracked, REDACTED description of the local (gitignored) tape corpus:
 * which tapes exist, which carry ground-truth labels, and what each may be
 * used for — without committing any athlete motion data (R05 dataset
 * design; privacy guardrails). The manifest holds metadata only; the tapes
 * themselves never enter git (ADR-004, .gitignore `eval-tapes/*`).
 *
 * `eval-tapes/MANIFEST.example.json` is the committed, athlete-free example
 * of this schema; a real local manifest (`eval-tapes/MANIFEST.json`) stays
 * gitignored alongside the tapes it describes.
 */
import { normalizeProtocolId, type ProtocolId } from '../core/protocol'

export const CORPUS_MANIFEST_VERSION = 1

/** Where a tape's frames came from. */
export type CorpusSource = 'live' | 'upload' | 'stock-video'

/** Consent/rights status for using a recording in validation. */
export type CorpusConsent = 'owner' | 'public-stock' | 'unknown'

/** What the tape is allowed to be used for. */
export type CorpusValidationUse = 'regression' | 'benchmark' | 'exploratory'

export interface CorpusEntry {
  /** Stable corpus id (not the filename), e.g. 'stock-01'. */
  id: string
  /** Tape filename under eval-tapes/ (local, gitignored). */
  file: string
  protocolId: ProtocolId
  source: CorpusSource
  /** True when `meta.truth` labels exist (labeling protocol v1). */
  hasTruth: boolean
  /** Labeled rep count when hasTruth; omitted otherwise. */
  truthRepCount?: number
  consent: CorpusConsent
  validationUse: CorpusValidationUse
  /** Edge cases: clipped descents, second person in frame, camera angle… */
  notes?: string
}

export interface CorpusManifest {
  manifestVersion: number
  /** Human context only — never a filesystem path with user names. */
  storageNote: string
  entries: CorpusEntry[]
}

const SOURCES: ReadonlySet<string> = new Set(['live', 'upload', 'stock-video'])
const CONSENTS: ReadonlySet<string> = new Set([
  'owner',
  'public-stock',
  'unknown',
])
const USES: ReadonlySet<string> = new Set([
  'regression',
  'benchmark',
  'exploratory',
])

/**
 * Parse + validate raw JSON into a manifest. Throws with a specific message
 * on the first structural problem — a manifest that cannot be trusted is
 * worse than none. Unknown extra fields are tolerated (forward-compatible);
 * unknown manifest versions are refused (never misread).
 */
export function parseCorpusManifest(raw: unknown): CorpusManifest {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Corpus manifest must be a JSON object.')
  }
  const manifest = raw as Record<string, unknown>
  if (manifest.manifestVersion !== CORPUS_MANIFEST_VERSION) {
    throw new Error(
      `Unsupported corpus manifest version ${String(manifest.manifestVersion)} — this reader understands v${CORPUS_MANIFEST_VERSION}.`,
    )
  }
  if (typeof manifest.storageNote !== 'string') {
    throw new Error('Corpus manifest needs a storageNote string.')
  }
  if (!Array.isArray(manifest.entries)) {
    throw new Error('Corpus manifest needs an entries array.')
  }

  const seenIds = new Set<string>()
  const entries = manifest.entries.map((value, index) => {
    const entry = value as Record<string, unknown>
    const where = `entries[${index}]`
    if (typeof entry.id !== 'string' || entry.id === '') {
      throw new Error(`${where}: id must be a non-empty string.`)
    }
    if (seenIds.has(entry.id)) {
      throw new Error(`${where}: duplicate id "${entry.id}".`)
    }
    seenIds.add(entry.id)
    if (typeof entry.file !== 'string' || !entry.file.endsWith('.posetape.json')) {
      throw new Error(`${where}: file must be a .posetape.json filename.`)
    }
    if (entry.file.includes('/') || entry.file.includes('\\')) {
      throw new Error(
        `${where}: file must be a bare filename (no paths — local layout stays out of git).`,
      )
    }
    if (typeof entry.protocolId !== 'string') {
      throw new Error(`${where}: protocolId must be a string.`)
    }
    if (typeof entry.source !== 'string' || !SOURCES.has(entry.source)) {
      throw new Error(`${where}: source must be one of ${[...SOURCES].join(', ')}.`)
    }
    if (typeof entry.hasTruth !== 'boolean') {
      throw new Error(`${where}: hasTruth must be a boolean.`)
    }
    if (entry.hasTruth && typeof entry.truthRepCount !== 'number') {
      throw new Error(`${where}: truthRepCount is required when hasTruth is true.`)
    }
    if (typeof entry.consent !== 'string' || !CONSENTS.has(entry.consent)) {
      throw new Error(`${where}: consent must be one of ${[...CONSENTS].join(', ')}.`)
    }
    if (
      typeof entry.validationUse !== 'string' ||
      !USES.has(entry.validationUse)
    ) {
      throw new Error(
        `${where}: validationUse must be one of ${[...USES].join(', ')}.`,
      )
    }
    return {
      id: entry.id,
      file: entry.file,
      protocolId: normalizeProtocolId(entry.protocolId),
      source: entry.source as CorpusSource,
      hasTruth: entry.hasTruth,
      truthRepCount:
        typeof entry.truthRepCount === 'number' ? entry.truthRepCount : undefined,
      consent: entry.consent as CorpusConsent,
      validationUse: entry.validationUse as CorpusValidationUse,
      notes: typeof entry.notes === 'string' ? entry.notes : undefined,
    }
  })

  return {
    manifestVersion: CORPUS_MANIFEST_VERSION,
    storageNote: manifest.storageNote,
    entries,
  }
}
