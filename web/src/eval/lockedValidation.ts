import type { ProtocolStudyManifestV1 } from './protocolStudyManifest'
import { REQUIRED_LOCKED_GATE_IDS, type ValidationFreezeCertificate } from './validationFreeze'

export type GateDisposition = 'pass' | 'fail' | 'inconclusive' | 'blocked'
export interface LockedGateResult { id: string; disposition: GateDisposition; estimate: number | null; ci95: [number, number] | null; denominator: number; note: string }
export interface LockedSequenceResult {
  sourceId: string
  subjectKey: string
  expectedCount: number
  observedCount: number
  expectedComplete: boolean
  observedComplete: boolean
  invalidCapture: boolean
  abstained: boolean
  wrongMovement: boolean
  sideInversion: boolean
  timestampViolation: boolean
  excluded: boolean
  exclusionReason: string | null
}
export interface LockedRunInput { certificate: ValidationFreezeCertificate; expectedPackageSha256: string; observedPackageSha256: string; manifest: ProtocolStudyManifestV1 }
export interface LockedValidationReport {
  schemaVersion: 1
  packageId: string
  packageSha256: string
  denominators: { subjects: number; sequences: number; excluded: number; invalid: number }
  summary: { exactCountRate: number; countMae: number; completionSensitivity: number | null; completionSpecificity: number | null; falseCompletionRate: number; abstentionOnInvalidRate: number | null; falseAbstentionRate: number; sideInversions: number; timestampViolations: number }
  gates: LockedGateResult[]
  rows: LockedSequenceResult[]
  immutable: true
}

const SHA = /^[a-f0-9]{64}$/

export function preflightLockedValidation(input: LockedRunInput): string[] {
  const blockers: string[] = []
  if (input.certificate.status !== 'frozen' || !input.certificate.packageSha256) blockers.push('Validation package is not frozen.')
  if (!SHA.test(input.expectedPackageSha256) || input.expectedPackageSha256 !== input.certificate.packageSha256 || input.observedPackageSha256 !== input.expectedPackageSha256) blockers.push('Freeze/code/config hash mismatch.')
  if (input.manifest.sources.length === 0) blockers.push('Locked manifest is empty.')
  for (const source of input.manifest.sources) {
    if (!source.frozen || source.use !== 'locked-validation' || !['validation', 'test'].includes(source.split)) blockers.push(`Source ${source.id} is not a frozen locked allocation.`)
    if (source.consent !== 'consented-study') blockers.push(`Source ${source.id} lacks consented-study authority.`)
    const labels = input.manifest.labelSets.filter(label => label.sourceId === source.id && label.frozen)
    if (labels.length < 3 || new Set(labels.map(label => label.raterKey)).size < 3) blockers.push(`Source ${source.id} lacks frozen A/B/adjudication label lineage.`)
  }
  return [...new Set(blockers)]
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
const ratio = (numerator: number, denominator: number) => denominator ? numerator / denominator : null

export function recomputeLockedSummary(rows: readonly LockedSequenceResult[]): LockedValidationReport['summary'] {
  if (!rows.length) throw new Error('Locked summary requires rows.')
  const positive = rows.filter(row => row.expectedComplete)
  const negative = rows.filter(row => !row.expectedComplete)
  const invalid = rows.filter(row => row.invalidCapture)
  const valid = rows.filter(row => !row.invalidCapture)
  return {
    exactCountRate: mean(rows.map(row => Number(row.expectedCount === row.observedCount))),
    countMae: mean(rows.map(row => Math.abs(row.observedCount - row.expectedCount))),
    completionSensitivity: ratio(positive.filter(row => row.observedComplete).length, positive.length),
    completionSpecificity: ratio(negative.filter(row => !row.observedComplete).length, negative.length),
    falseCompletionRate: negative.length ? negative.filter(row => row.observedComplete).length / negative.length : 0,
    abstentionOnInvalidRate: ratio(invalid.filter(row => row.abstained).length, invalid.length),
    falseAbstentionRate: valid.length ? valid.filter(row => row.abstained).length / valid.length : 0,
    sideInversions: rows.filter(row => row.sideInversion).length,
    timestampViolations: rows.filter(row => row.timestampViolation).length,
  }
}

export function buildLockedValidationReport(input: LockedRunInput, rows: readonly LockedSequenceResult[], gates: readonly LockedGateResult[]): LockedValidationReport {
  const blockers = preflightLockedValidation(input)
  if (blockers.length) throw new Error(`Locked run blocked: ${blockers.join(' ')}`)
  const sourceIds = new Set(input.manifest.sources.map(source => source.id))
  if (rows.length !== sourceIds.size || new Set(rows.map(row => row.sourceId)).size !== rows.length || rows.some(row => !sourceIds.has(row.sourceId))) throw new Error('Every frozen source must appear exactly once in locked rows.')
  for (const row of rows) {
    const source = input.manifest.sources.find(item => item.id === row.sourceId)!
    if (row.subjectKey !== source.subjectKey) throw new Error(`Subject/source mismatch for ${row.sourceId}.`)
    if (row.excluded !== Boolean(row.exclusionReason)) throw new Error('Exclusions require a visible reason and non-exclusions require null.')
  }
  const gateIds = new Set(gates.map(gate => gate.id))
  const missing = REQUIRED_LOCKED_GATE_IDS.filter(id => !gateIds.has(id))
  if (missing.length || gates.some(gate => gate.denominator < 0 || (gate.disposition === 'pass' && gate.ci95 === null))) throw new Error('Locked gate results are incomplete or claim passage without uncertainty.')
  return { schemaVersion: 1, packageId: input.certificate.packageId, packageSha256: input.expectedPackageSha256, denominators: { subjects: new Set(rows.map(row => row.subjectKey)).size, sequences: rows.length, excluded: rows.filter(row => row.excluded).length, invalid: rows.filter(row => row.invalidCapture).length }, summary: recomputeLockedSummary(rows), gates: [...gates], rows: [...rows], immutable: true }
}
