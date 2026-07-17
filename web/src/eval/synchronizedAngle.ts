import { pairedAgreement } from '../validation/statistics'

export interface AnglePairInput {
  subjectKey: string
  deviceClass: string
  estimatedValue: number | null
  estimatedUnit: 'degrees' | 'radians'
  estimatedSign: 1 | -1
  referenceValue: number | null
  referenceUnit: 'degrees' | 'radians'
  referenceSign: 1 | -1
  cameraTimestampMs: number
  referenceTimestampMs: number
}

export interface SynchronizedAnglePlan {
  version: string
  freezeSha256: string
  referenceApproved: boolean
  referenceCalibrationSha256: string
  synchronizationToleranceMs: number
  eventMatchingToleranceMs: number
  minimumUsableSubjects: 30 | 50 | 80
  signedRoles: string[]
}

export interface SynchronizedAngleReport {
  schemaVersion: 1
  planVersion: string
  totalPairs: number
  usablePairs: number
  usableSubjects: number
  missingPairs: number
  outsideSynchronizationTolerance: number
  maximumSynchronizationErrorMs: number
  agreement: { mae: number; rmse: number; bias: number; biasCi95: [number, number] | null; limitsOfAgreement: { lower: number; upper: number; lowerCi95: [number, number]; upperCi95: [number, number] } | null } | null
  sensitivity: Array<{ toleranceMs: number; usablePairs: number }>
  worstCases: Array<{ subjectKey: string; deviceClass: string; absoluteError: number }>
  disposition: 'suppress' | 'experimental-for-frozen-scope' | 'tier-proposal-pending-claims' | 'blocked'
  blockers: string[]
}

const SHA = /^[a-f0-9]{64}$/
const KEY = /^[a-z0-9][a-z0-9_-]*$/i
export const toSignedDegrees = (value: number, unit: 'degrees' | 'radians', sign: 1 | -1) => sign * (unit === 'radians' ? value * 180 / Math.PI : value)

export function buildSynchronizedAngleReport(plan: SynchronizedAnglePlan, pairs: readonly AnglePairInput[]): SynchronizedAngleReport {
  if (!KEY.test(plan.version) || !SHA.test(plan.freezeSha256) || !SHA.test(plan.referenceCalibrationSha256) || plan.synchronizationToleranceMs < 0 || plan.eventMatchingToleranceMs < 0) throw new Error('Synchronized-angle plan is invalid.')
  if (!pairs.length) throw new Error('Synchronized-angle report requires declared pairs, including missing pairs.')
  const blockers: string[] = []
  if (!plan.referenceApproved) blockers.push('Reference system/calibration is not approved by the biomechanics lab owner.')
  if (plan.signedRoles.length < 3) blockers.push('Biomechanics, statistics, and claims sign-off are required.')
  const usable = pairs.flatMap(pair => {
    if (!KEY.test(pair.subjectKey) || !KEY.test(pair.deviceClass)) throw new Error('Angle pair keys must be pseudonymous and safe.')
    const syncError = Math.abs(pair.cameraTimestampMs - pair.referenceTimestampMs)
    if (pair.estimatedValue === null || pair.referenceValue === null || syncError > plan.synchronizationToleranceMs) return []
    return [{ pair, syncError, estimate: toSignedDegrees(pair.estimatedValue, pair.estimatedUnit, pair.estimatedSign), reference: toSignedDegrees(pair.referenceValue, pair.referenceUnit, pair.referenceSign) }]
  })
  const subjects = new Set(usable.map(item => item.pair.subjectKey))
  if (subjects.size < plan.minimumUsableSubjects) blockers.push(`Usable subject count ${subjects.size} is below frozen decision point ${plan.minimumUsableSubjects}.`)
  const stats = pairedAgreement(usable.map(item => item.reference), usable.map(item => item.estimate))
  let agreement: SynchronizedAngleReport['agreement'] = null
  if (stats) {
    const differences = usable.map(item => item.estimate - item.reference)
    const sd = differences.length > 1 ? Math.sqrt(differences.reduce((sum, value) => sum + (value - stats.bias) ** 2, 0) / (differences.length - 1)) : null
    const biasMargin = sd === null ? null : 1.96 * sd / Math.sqrt(differences.length)
    const loaMargin = sd === null ? null : 1.96 * sd * Math.sqrt(3 / differences.length)
    agreement = { mae: stats.mae, rmse: stats.rmse, bias: stats.bias, biasCi95: biasMargin === null ? null : [stats.bias - biasMargin, stats.bias + biasMargin], limitsOfAgreement: !stats.blandAltman || loaMargin === null ? null : { lower: stats.blandAltman.lower, upper: stats.blandAltman.upper, lowerCi95: [stats.blandAltman.lower - loaMargin, stats.blandAltman.lower + loaMargin], upperCi95: [stats.blandAltman.upper - loaMargin, stats.blandAltman.upper + loaMargin] } }
  }
  const tolerances = [...new Set([0, plan.synchronizationToleranceMs / 2, plan.synchronizationToleranceMs])].sort((a, b) => a - b)
  const requestedDisposition = blockers.length ? 'blocked' : 'tier-proposal-pending-claims'
  return { schemaVersion: 1, planVersion: plan.version, totalPairs: pairs.length, usablePairs: usable.length, usableSubjects: subjects.size, missingPairs: pairs.filter(pair => pair.estimatedValue === null || pair.referenceValue === null).length, outsideSynchronizationTolerance: pairs.filter(pair => Math.abs(pair.cameraTimestampMs - pair.referenceTimestampMs) > plan.synchronizationToleranceMs).length, maximumSynchronizationErrorMs: Math.max(...pairs.map(pair => Math.abs(pair.cameraTimestampMs - pair.referenceTimestampMs))), agreement, sensitivity: tolerances.map(toleranceMs => ({ toleranceMs, usablePairs: pairs.filter(pair => pair.estimatedValue !== null && pair.referenceValue !== null && Math.abs(pair.cameraTimestampMs - pair.referenceTimestampMs) <= toleranceMs).length })), worstCases: usable.map(item => ({ subjectKey: item.pair.subjectKey, deviceClass: item.pair.deviceClass, absoluteError: Math.abs(item.estimate - item.reference) })).sort((a, b) => b.absoluteError - a.absoluteError), disposition: requestedDisposition, blockers }
}
