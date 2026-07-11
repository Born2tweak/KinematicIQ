/**
 * Public-dataset registry schema and validator (M61).
 *
 * A tracked, metadata-first description of the external movement datasets
 * KinematicIQ may evaluate against — provenance, license, access terms,
 * intended use, and the LOCAL-only path each dataset's raw bytes live at.
 * Registration is deliberately NOT acquisition: an entry records what a
 * dataset is and what it may be used for; accepting terms, creating
 * accounts, and downloading remain manual human approval steps (ADR-006,
 * ADR-010, R05 governance).
 *
 * Git tracks this registry (metadata only). Raw archives, extracted frames,
 * video, participant-linked landmarks, and credentials are gitignored and
 * never committed — the `localPathConvention` names where they live locally,
 * it does not put them in the repo.
 *
 * Mirrors `corpusManifest.ts`: throw on the first structural problem (a
 * registry that cannot be trusted is worse than none), tolerate unknown
 * extra fields (forward-compatible), refuse unknown versions (never
 * misread). The committed data lives at `web/eval/datasets/registry.json`;
 * a real approved/acquired archive adds checksums locally.
 */

export const DATASET_REGISTRY_VERSION = 1

/**
 * ADR-010 allowed-role classification — what a dataset may be used FOR,
 * independent of whether it has been acquired yet.
 */
export type DatasetRole =
  | 'metadata-only'
  | 'evaluation-only'
  | 'research-only'
  | 'commercial-pending'
  | 'future-ml'
  | 'excluded'

/** Acquisition state — the manual-approval boundary a fresh operator reads. */
export type ApprovalStatus =
  | 'metadata-only' // registered; terms NOT accepted, nothing downloaded
  | 'requested' // approval sought, not yet granted
  | 'approved' // human approved acquisition (checksums may exist)
  | 'declined' // deliberately not acquiring

export type CommercialUseStatus =
  | 'permitted'
  | 'prohibited'
  | 'unclear'
  | 'per-source' // depends on the underlying image/video/source license

export type Redistribution =
  | 'prohibited'
  | 'derived-only' // only de-identified derivatives may leave the machine
  | 'permitted'
  | 'unclear'

export type AccessRequirement =
  | 'none'
  | 'registration'
  | 'agreement' // click-through / signed research agreement
  | 'credentialed-dua' // credentialed access + data-use agreement

export interface DatasetChecksum {
  algorithm: 'sha256' | 'md5'
  /** Lowercase hex digest. */
  value: string
  /** Which archive/artifact this digest covers (bare filename, no path). */
  covers: string
}

export interface DatasetSource {
  officialUrl: string
  citation: string
  paperDoi?: string
}

export interface DatasetLicense {
  /** License label (SPDX-ish or e.g. 'custom-research-terms'). */
  name: string
  /** License or terms URL, when one exists. */
  url?: string
  commercialUse: CommercialUseStatus
  redistribution: Redistribution
  accessRequirement: AccessRequirement
}

export interface DatasetContent {
  /** Approximate on-disk size, e.g. '~7 GB' or 'hundreds of GB'. */
  approxSize: string
  /** e.g. 'rgb-video', 'markers', 'opensim', 'kinect-depth', 'imu'. */
  modalities: string[]
  /** Source skeleton id, e.g. 'vicon-markers', 'kinect-25', 'coco-17'. */
  skeleton: string
  /** e.g. 'sagittal', 'frontal', 'multi-view'. */
  views: string[]
  subjects?: string
  splits?: string
  /** Movement/activity labels relevant to KinematicIQ, e.g. 'deep-squat'. */
  movementLabels: string[]
}

export interface DatasetUsePolicy {
  /** What KinematicIQ is allowed to do with it. Must be non-empty. */
  allowedUses: string[]
  /** Claim uses explicitly forbidden (R07 claims-policy). Must be non-empty. */
  prohibitedClaimUses: string[]
}

export interface DatasetRegistryEntry {
  id: string
  version: string
  role: DatasetRole
  approvalStatus: ApprovalStatus
  source: DatasetSource
  license: DatasetLicense
  content: DatasetContent
  use: DatasetUsePolicy
  /**
   * Local-only cache path convention (gitignored). Must be a bare relative
   * path — no drive letters, no user names, no `..`. Where the raw bytes
   * live on an operator's machine, never in git.
   */
  localPathConvention: string
  /** Present ONLY once an archive is human-approved and acquired. */
  checksums?: DatasetChecksum[]
  notes?: string
}

export interface DatasetRegistry {
  registryVersion: number
  /** Human context only — never a filesystem path with user names. */
  storageNote: string
  entries: DatasetRegistryEntry[]
}

const ROLES: ReadonlySet<string> = new Set([
  'metadata-only',
  'evaluation-only',
  'research-only',
  'commercial-pending',
  'future-ml',
  'excluded',
])
const APPROVALS: ReadonlySet<string> = new Set([
  'metadata-only',
  'requested',
  'approved',
  'declined',
])
const COMMERCIAL: ReadonlySet<string> = new Set([
  'permitted',
  'prohibited',
  'unclear',
  'per-source',
])
const REDISTRIBUTION: ReadonlySet<string> = new Set([
  'prohibited',
  'derived-only',
  'permitted',
  'unclear',
])
const ACCESS: ReadonlySet<string> = new Set([
  'none',
  'registration',
  'agreement',
  'credentialed-dua',
])
const CHECKSUM_ALGOS: ReadonlySet<string> = new Set(['sha256', 'md5'])

function requireString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value === '') {
    throw new Error(`${where} must be a non-empty string.`)
  }
  return value
}

function requireNonEmptyStringArray(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${where} must be a non-empty array of strings.`)
  }
  value.forEach((item, i) => requireString(item, `${where}[${i}]`))
  return value as string[]
}

/**
 * A tracked local path must never leak an absolute location or a user name
 * into git, and must never escape the cache root. Reject drive letters,
 * leading slashes, backslashes, `~`, and `..` segments.
 */
function requireSafeLocalPath(value: unknown, where: string): string {
  const path = requireString(value, where)
  if (/^[a-zA-Z]:/.test(path) || path.startsWith('/') || path.startsWith('\\')) {
    throw new Error(`${where} must be a relative path (no drive letter or root).`)
  }
  if (path.includes('\\')) {
    throw new Error(`${where} must use forward slashes (no backslashes).`)
  }
  if (path.includes('~')) {
    throw new Error(`${where} must not contain a home-directory reference.`)
  }
  if (path.split('/').some((seg) => seg === '..')) {
    throw new Error(`${where} must not contain a ".." path segment.`)
  }
  return path
}

function parseSource(raw: unknown, where: string): DatasetSource {
  const s = (raw ?? {}) as Record<string, unknown>
  const source: DatasetSource = {
    officialUrl: requireString(s.officialUrl, `${where}.officialUrl`),
    citation: requireString(s.citation, `${where}.citation`),
  }
  if (s.paperDoi !== undefined) {
    source.paperDoi = requireString(s.paperDoi, `${where}.paperDoi`)
  }
  return source
}

function parseLicense(raw: unknown, where: string): DatasetLicense {
  const l = (raw ?? {}) as Record<string, unknown>
  const name = requireString(l.name, `${where}.name`)
  if (typeof l.commercialUse !== 'string' || !COMMERCIAL.has(l.commercialUse)) {
    throw new Error(`${where}.commercialUse must be one of ${[...COMMERCIAL].join(', ')}.`)
  }
  if (
    typeof l.redistribution !== 'string' ||
    !REDISTRIBUTION.has(l.redistribution)
  ) {
    throw new Error(
      `${where}.redistribution must be one of ${[...REDISTRIBUTION].join(', ')}.`,
    )
  }
  if (
    typeof l.accessRequirement !== 'string' ||
    !ACCESS.has(l.accessRequirement)
  ) {
    throw new Error(
      `${where}.accessRequirement must be one of ${[...ACCESS].join(', ')}.`,
    )
  }
  const license: DatasetLicense = {
    name,
    commercialUse: l.commercialUse as CommercialUseStatus,
    redistribution: l.redistribution as Redistribution,
    accessRequirement: l.accessRequirement as AccessRequirement,
  }
  if (l.url !== undefined) license.url = requireString(l.url, `${where}.url`)
  return license
}

function parseContent(raw: unknown, where: string): DatasetContent {
  const c = (raw ?? {}) as Record<string, unknown>
  const content: DatasetContent = {
    approxSize: requireString(c.approxSize, `${where}.approxSize`),
    modalities: requireNonEmptyStringArray(c.modalities, `${where}.modalities`),
    skeleton: requireString(c.skeleton, `${where}.skeleton`),
    views: requireNonEmptyStringArray(c.views, `${where}.views`),
    movementLabels: requireNonEmptyStringArray(
      c.movementLabels,
      `${where}.movementLabels`,
    ),
  }
  if (c.subjects !== undefined) {
    content.subjects = requireString(c.subjects, `${where}.subjects`)
  }
  if (c.splits !== undefined) {
    content.splits = requireString(c.splits, `${where}.splits`)
  }
  return content
}

function parseUse(raw: unknown, where: string): DatasetUsePolicy {
  const u = (raw ?? {}) as Record<string, unknown>
  return {
    allowedUses: requireNonEmptyStringArray(u.allowedUses, `${where}.allowedUses`),
    prohibitedClaimUses: requireNonEmptyStringArray(
      u.prohibitedClaimUses,
      `${where}.prohibitedClaimUses`,
    ),
  }
}

function parseChecksums(raw: unknown, where: string): DatasetChecksum[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(`${where} must be a non-empty array when present.`)
  }
  return raw.map((value, i) => {
    const ck = (value ?? {}) as Record<string, unknown>
    const at = `${where}[${i}]`
    if (typeof ck.algorithm !== 'string' || !CHECKSUM_ALGOS.has(ck.algorithm)) {
      throw new Error(`${at}.algorithm must be one of ${[...CHECKSUM_ALGOS].join(', ')}.`)
    }
    const value_ = requireString(ck.value, `${at}.value`)
    if (!/^[0-9a-f]+$/.test(value_)) {
      throw new Error(`${at}.value must be a lowercase hex digest.`)
    }
    return {
      algorithm: ck.algorithm as DatasetChecksum['algorithm'],
      value: value_,
      covers: requireString(ck.covers, `${at}.covers`),
    }
  })
}

function parseEntry(raw: unknown, where: string): DatasetRegistryEntry {
  const e = (raw ?? {}) as Record<string, unknown>
  const id = requireString(e.id, `${where}.id`)
  const version = requireString(e.version, `${where}.version`)
  if (typeof e.role !== 'string' || !ROLES.has(e.role)) {
    throw new Error(`${where}.role must be one of ${[...ROLES].join(', ')}.`)
  }
  if (
    typeof e.approvalStatus !== 'string' ||
    !APPROVALS.has(e.approvalStatus)
  ) {
    throw new Error(
      `${where}.approvalStatus must be one of ${[...APPROVALS].join(', ')}.`,
    )
  }
  const role = e.role as DatasetRole
  const approvalStatus = e.approvalStatus as ApprovalStatus

  // Safety invariants tying acquisition state to role and evidence.
  if (role === 'metadata-only' && approvalStatus !== 'metadata-only') {
    throw new Error(
      `${where}: a metadata-only dataset cannot have approvalStatus "${approvalStatus}".`,
    )
  }
  const entry: DatasetRegistryEntry = {
    id,
    version,
    role,
    approvalStatus,
    source: parseSource(e.source, `${where}.source`),
    license: parseLicense(e.license, `${where}.license`),
    content: parseContent(e.content, `${where}.content`),
    use: parseUse(e.use, `${where}.use`),
    localPathConvention: requireSafeLocalPath(
      e.localPathConvention,
      `${where}.localPathConvention`,
    ),
  }

  if (e.checksums !== undefined) {
    // Checksums exist only after an archive is actually acquired; acquisition
    // requires human approval. Refuse checksums that imply an un-approved
    // download — that would silently defeat the approval boundary.
    if (approvalStatus !== 'approved') {
      throw new Error(
        `${where}: checksums are only valid when approvalStatus is "approved" (found "${approvalStatus}").`,
      )
    }
    entry.checksums = parseChecksums(e.checksums, `${where}.checksums`)
  }
  if (e.notes !== undefined) {
    entry.notes = requireString(e.notes, `${where}.notes`)
  }
  return entry
}

/**
 * Parse + validate raw JSON into a dataset registry. Throws with a specific
 * message on the first structural or safety problem.
 */
export function parseDatasetRegistry(raw: unknown): DatasetRegistry {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Dataset registry must be a JSON object.')
  }
  const registry = raw as Record<string, unknown>
  if (registry.registryVersion !== DATASET_REGISTRY_VERSION) {
    throw new Error(
      `Unsupported dataset registry version ${String(registry.registryVersion)} — this reader understands v${DATASET_REGISTRY_VERSION}.`,
    )
  }
  if (typeof registry.storageNote !== 'string') {
    throw new Error('Dataset registry needs a storageNote string.')
  }
  if (!Array.isArray(registry.entries)) {
    throw new Error('Dataset registry needs an entries array.')
  }

  const seenIds = new Set<string>()
  const entries = registry.entries.map((value, index) => {
    const entry = parseEntry(value, `entries[${index}]`)
    if (seenIds.has(entry.id)) {
      throw new Error(`entries[${index}]: duplicate id "${entry.id}".`)
    }
    seenIds.add(entry.id)
    return entry
  })

  return {
    registryVersion: DATASET_REGISTRY_VERSION,
    storageNote: registry.storageNote,
    entries,
  }
}
