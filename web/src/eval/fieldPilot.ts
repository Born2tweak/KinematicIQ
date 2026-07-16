export interface PilotApproval {
  role: 'privacy' | 'legal' | 'product' | 'custodian' | 'biomechanics'
  signerKey: string
  signedAt: string
  approved: boolean
}

export interface FieldPilotAttempt {
  sourceId: string
  sourceSha256: string
  subjectKey: string
  attemptIndex: number
  consent: 'consented-study' | 'synthetic'
  developmentOnly: true
  rightsApproved: boolean
  leadSide: 'left' | 'right'
  deviceClass: string
  conditionIds: string[]
  durationMs: number
  readable: boolean
  complete: boolean
  exclusionReason: string | null
  complaint: boolean
}

export interface FieldPilotPreflight {
  readyForCollection: boolean
  blockers: string[]
  approvalRoles: string[]
}

export interface FieldPilotReport {
  schemaVersion: 1
  attemptedSubjects: number
  attempts: number
  readableAttempts: number
  completeAttempts: number
  excludedAttempts: number
  complaints: number
  leadSides: Record<'left' | 'right', number>
  deviceCells: Record<string, number>
  conditionCells: Record<string, number>
  missingFailureFamilies: string[]
  syntheticOnly: boolean
}

const SHA = /^[a-f0-9]{64}$/
const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const REQUIRED_ROLES: PilotApproval['role'][] = ['privacy', 'legal', 'product', 'custodian', 'biomechanics']

export function preflightFieldPilot(approvals: readonly PilotApproval[]): FieldPilotPreflight {
  const valid = new Set(approvals.filter(item => item.approved && KEY.test(item.signerKey) && !Number.isNaN(Date.parse(item.signedAt))).map(item => item.role))
  const blockers = REQUIRED_ROLES.filter(role => !valid.has(role)).map(role => `Missing signed ${role} approval.`)
  return { readyForCollection: blockers.length === 0, blockers, approvalRoles: [...valid].sort() }
}

export function buildFieldPilotReport(attempts: readonly FieldPilotAttempt[], requiredFailureFamilies: readonly string[] = []): FieldPilotReport {
  if (attempts.length === 0) throw new Error('Field-pilot report requires every attempted recording, including failures.')
  const sourceIds = new Set<string>()
  const attemptKeys = new Set<string>()
  for (const item of attempts) {
    if (!KEY.test(item.sourceId) || !KEY.test(item.subjectKey) || !SHA.test(item.sourceSha256)) throw new Error('Pilot identifiers/checksums must be pseudonymous and valid.')
    if (!Number.isInteger(item.attemptIndex) || item.attemptIndex < 0 || !(item.durationMs >= 0)) throw new Error('Pilot attempt index/duration is invalid.')
    if (!item.developmentOnly) throw new Error('Field-pilot records must remain development-only.')
    if (item.consent === 'consented-study' && !item.rightsApproved) throw new Error('Human pilot evidence requires approved rights/consent.')
    if (sourceIds.has(item.sourceId)) throw new Error(`Duplicate source ${item.sourceId}.`)
    sourceIds.add(item.sourceId)
    const key = `${item.subjectKey}:${item.attemptIndex}`
    if (attemptKeys.has(key)) throw new Error(`Duplicate attempt ${key}.`)
    attemptKeys.add(key)
  }
  const count = (values: string[]) => values.reduce<Record<string, number>>((out, value) => ({ ...out, [value]: (out[value] ?? 0) + 1 }), {})
  const observedFailures = new Set(attempts.flatMap(item => item.exclusionReason ? [item.exclusionReason] : []))
  return {
    schemaVersion: 1,
    attemptedSubjects: new Set(attempts.map(item => item.subjectKey)).size,
    attempts: attempts.length,
    readableAttempts: attempts.filter(item => item.readable).length,
    completeAttempts: attempts.filter(item => item.complete).length,
    excludedAttempts: attempts.filter(item => item.exclusionReason !== null).length,
    complaints: attempts.filter(item => item.complaint).length,
    leadSides: { left: attempts.filter(item => item.leadSide === 'left').length, right: attempts.filter(item => item.leadSide === 'right').length },
    deviceCells: count(attempts.map(item => item.deviceClass)),
    conditionCells: count(attempts.flatMap(item => item.conditionIds)),
    missingFailureFamilies: requiredFailureFamilies.filter(item => !observedFailures.has(item)),
    syntheticOnly: attempts.every(item => item.consent === 'synthetic'),
  }
}

export function scanTrackedPilotArtifact(text: string): void {
  if (/(?:[a-z]:\\|\/Users\/|\.\.\/|@|\b(?:mp4|mov|avi|mkv)\b)/i.test(text)) throw new Error('Tracked pilot artifacts must not expose local paths, contact identifiers, or raw-media references.')
}
