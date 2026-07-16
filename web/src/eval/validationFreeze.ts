import { sha256Json } from './perturbations'

export const REQUIRED_LOCKED_GATE_IDS = ['ALG-COUNT-EXACT', 'ALG-COUNT-MAE', 'ALG-BOTTOM-PRF', 'ALG-BOTTOM-MED', 'ALG-BOTTOM-P95', 'ALG-COMP-SENS', 'ALG-COMP-SPEC', 'ALG-FALSE-COMP', 'ALG-ABSTAIN-INVALID', 'ALG-FALSE-ABSTAIN', 'ALG-WRONG-MOVE', 'ALG-SIDE-INVERT', 'ALG-TIME-DISC'] as const

export interface GateDefinition {
  id: string
  endpoint: string
  unitOfAnalysis: string
  populationSetup: string
  threshold: string
  ciMethod: string
  denominator: string
  missingnessRule: string
  ownerRole: string
  evidencePath: string
  consequence: string
}

export interface FreezeSignature { role: 'statistics' | 'custodian' | 'validation' | 'privacy' | 'biomechanics'; signerKey: string; signedAt: string }
export interface FreezeAllocation { subjectKey: string; split: 'development' | 'qualification' | 'locked' | 'reference' | 'reliability'; siteKey: string; deviceClass: string }
export interface ValidationFreezeInput {
  packageId: string
  registryVersion: string
  supersedes: string
  protocolVersion: string
  labelVersion: string
  algorithmVersion: string
  modelVersion: string
  filterVersion: string
  thresholdVersion: string
  perturbationVersion: string
  manifestSha256: string
  analysisSha256: string
  gates: GateDefinition[]
  allocations: FreezeAllocation[]
  signatures: FreezeSignature[]
  humanAuthorityConfirmed: boolean
}

export interface ValidationFreezeCertificate { schemaVersion: 1; packageId: string; packageSha256: string | null; status: 'frozen' | 'blocked'; blockers: string[]; subjectCounts: Record<string, number> }

const KEY = /^[a-z0-9][a-z0-9_.-]*$/i
const SHA = /^[a-f0-9]{64}$/
const REQUIRED_ROLES: FreezeSignature['role'][] = ['statistics', 'custodian', 'validation', 'privacy', 'biomechanics']

export function lintGateRegistry(gates: readonly GateDefinition[]): void {
  const ids = new Set<string>()
  for (const gate of gates) {
    if (!KEY.test(gate.id) || ids.has(gate.id)) throw new Error(`Gate ID ${gate.id} is invalid or duplicated.`)
    ids.add(gate.id)
    for (const [key, value] of Object.entries(gate)) if (key !== 'id' && (typeof value !== 'string' || !value.trim())) throw new Error(`Gate ${gate.id} is missing ${key}.`)
  }
  const missing = REQUIRED_LOCKED_GATE_IDS.filter(id => !ids.has(id))
  if (missing.length) throw new Error(`Gate registry is incomplete: ${missing.join(', ')}.`)
}

export function zeroEventSampleSize(maximumRate: number, confidence = 0.95): number {
  if (!(maximumRate > 0 && maximumRate < 1) || !(confidence > 0 && confidence < 1)) throw new Error('Rate/confidence must be in 0..1.')
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - maximumRate))
}

export function proportionPrecisionSampleSize(expectedRate: number, halfWidth: number, confidenceZ = 1.96): number {
  if (!(expectedRate > 0 && expectedRate < 1) || !(halfWidth > 0) || !(confidenceZ > 0)) throw new Error('Proportion precision assumptions are invalid.')
  return Math.ceil(confidenceZ ** 2 * expectedRate * (1 - expectedRate) / halfWidth ** 2)
}

export function meanPrecisionSampleSize(expectedSd: number, halfWidth: number, confidenceZ = 1.96): number {
  if (!(expectedSd > 0) || !(halfWidth > 0) || !(confidenceZ > 0)) throw new Error('Mean precision assumptions are invalid.')
  return Math.ceil((confidenceZ * expectedSd / halfWidth) ** 2)
}

export async function createValidationFreeze(input: ValidationFreezeInput): Promise<ValidationFreezeCertificate> {
  lintGateRegistry(input.gates)
  if (![input.packageId, input.registryVersion, input.supersedes, input.protocolVersion, input.labelVersion, input.algorithmVersion, input.modelVersion, input.filterVersion, input.thresholdVersion, input.perturbationVersion].every(KEY.test.bind(KEY))) throw new Error('Freeze package versions/identity are invalid.')
  if (!SHA.test(input.manifestSha256) || !SHA.test(input.analysisSha256)) throw new Error('Freeze package checksums must be SHA-256.')
  const subjectSplits = new Map<string, string>()
  for (const allocation of input.allocations) {
    if (![allocation.subjectKey, allocation.siteKey, allocation.deviceClass].every(KEY.test.bind(KEY))) throw new Error('Freeze allocations require safe pseudonymous keys.')
    const prior = subjectSplits.get(allocation.subjectKey)
    if (prior && prior !== allocation.split) throw new Error(`Subject ${allocation.subjectKey} crosses freeze allocations.`)
    subjectSplits.set(allocation.subjectKey, allocation.split)
  }
  const signedRoles = new Set(input.signatures.filter(item => KEY.test(item.signerKey) && !Number.isNaN(Date.parse(item.signedAt))).map(item => item.role))
  const blockers = REQUIRED_ROLES.filter(role => !signedRoles.has(role)).map(role => `Missing ${role} signature.`)
  if (!input.humanAuthorityConfirmed) blockers.push('Human freeze authority is not confirmed.')
  if (!input.allocations.some(item => item.split === 'locked')) blockers.push('No locked allocation is present.')
  const subjectCounts = input.allocations.reduce<Record<string, number>>((out, item) => ({ ...out, [item.split]: (out[item.split] ?? 0) + 1 }), {})
  const packageSha256 = blockers.length ? null : await sha256Json({ ...input, signatures: [...input.signatures].sort((a, b) => a.role.localeCompare(b.role)), allocations: [...input.allocations].sort((a, b) => a.subjectKey.localeCompare(b.subjectKey)), gates: [...input.gates].sort((a, b) => a.id.localeCompare(b.id)) })
  return { schemaVersion: 1, packageId: input.packageId, packageSha256, status: blockers.length ? 'blocked' : 'frozen', blockers, subjectCounts }
}
