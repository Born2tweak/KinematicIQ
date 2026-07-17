import { icc21 } from '../validation/statistics'

export interface RepeatSessionMeasurement { participantKey: string; sessionKey: string; metricId: string; setupId: string; deviceClass: string; value: number | null; validityGate: 'pass' | 'fail' | 'inconclusive' | 'blocked'; captureFailed: boolean; abstained: boolean }
export interface RepeatSessionPlan { version: string; frozen: boolean; realRepeatSessions: boolean; expectedParticipants: number; requiredCompleteParticipants: 40 | 60 | 90; bootstrapSamples: number; seed: number; signedRoles: string[] }
export interface RepeatMetricReport { metricId: string; setupId: string; completeParticipants: number; missingParticipants: number; captureFailures: number; abstentions: number; icc21: number | null; icc95Ci: [number, number] | null; sem: number | null; mdc95: number | null; meanAbsoluteDifference: number | null; blandAltman: { bias: number; lower: number; upper: number } | null; eligible: boolean; limitations: string[] }
export interface RepeatSessionReport { schemaVersion: 1; planVersion: string; expectedParticipants: number; achievedCompleteParticipants: number; attrition: number; metrics: RepeatMetricReport[]; disposition: 'ready-for-owner-disposition' | 'inconclusive' | 'blocked'; blockers: string[] }

const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
const sd = (values: number[]) => values.length < 2 ? null : Math.sqrt(values.reduce((sum, value) => sum + (value - mean(values)) ** 2, 0) / (values.length - 1))
function rng(seed: number): () => number { let value = seed >>> 0; return () => { value = Math.imul(value, 1103515245) + 12345 >>> 0; return value / 4294967296 } }

export function buildRepeatSessionReport(plan: RepeatSessionPlan, measurements: readonly RepeatSessionMeasurement[]): RepeatSessionReport {
  if (!KEY.test(plan.version) || plan.expectedParticipants < 1 || plan.bootstrapSamples < 100 || !Number.isInteger(plan.seed)) throw new Error('Repeat-session plan is invalid.')
  if (!measurements.length) throw new Error('Repeat-session report requires all attempted measurements.')
  measurements.forEach(item => { if (![item.participantKey, item.sessionKey, item.metricId, item.setupId, item.deviceClass].every(value => KEY.test(value))) throw new Error('Repeat-session keys must be pseudonymous and safe.') })
  const metricKeys = [...new Set(measurements.map(item => `${item.metricId}:${item.setupId}`))].sort()
  const metrics = metricKeys.map(key => {
    const [metricId, setupId] = key.split(':')
    const rows = measurements.filter(item => item.metricId === metricId && item.setupId === setupId)
    const eligible = rows.every(item => item.validityGate === 'pass')
    const sessions = [...new Set(rows.map(item => item.sessionKey))].sort()
    const byParticipant = new Map<string, RepeatSessionMeasurement[]>()
    rows.forEach(item => byParticipant.set(item.participantKey, [...(byParticipant.get(item.participantKey) ?? []), item]))
    const complete = [...byParticipant.entries()].flatMap(([participant, items]) => {
      const values = sessions.map(session => items.find(item => item.sessionKey === session)?.value)
      return values.length >= 2 && values.every((value): value is number => typeof value === 'number' && Number.isFinite(value)) ? [{ participant, values }] : []
    })
    const matrix = complete.map(item => item.values)
    const icc = eligible ? icc21(matrix)?.value ?? null : null
    const random = rng(plan.seed + metricId.length + setupId.length)
    const boot = icc === null ? [] : Array.from({ length: plan.bootstrapSamples }, () => {
      const sampled = Array.from({ length: matrix.length }, () => matrix[Math.floor(random() * matrix.length)])
      return icc21(sampled)?.value ?? Number.NaN
    }).filter(Number.isFinite).sort((a, b) => a - b)
    const differences = matrix.map(values => values[1] - values[0])
    const differenceSd = sd(differences)
    const sem = differenceSd === null ? null : differenceSd / Math.sqrt(2)
    const bias = differences.length ? mean(differences) : null
    const limitations: string[] = []
    if (!eligible) limitations.push('Metric failed or lacks its prerequisite validity gate; repeatability cannot rehabilitate it.')
    if (sessions.length !== 2) limitations.push('Formal report expects exactly two prespecified sessions.')
    if (complete.length < plan.requiredCompleteParticipants) limitations.push(`Complete participants ${complete.length} are below frozen target ${plan.requiredCompleteParticipants}.`)
    return { metricId, setupId, completeParticipants: complete.length, missingParticipants: Math.max(0, plan.expectedParticipants - complete.length), captureFailures: rows.filter(item => item.captureFailed).length, abstentions: rows.filter(item => item.abstained).length, icc21: icc, icc95Ci: boot.length ? [boot[Math.floor(boot.length * 0.025)], boot[Math.min(boot.length - 1, Math.floor(boot.length * 0.975))]] : null, sem, mdc95: sem === null ? null : 1.96 * Math.sqrt(2) * sem, meanAbsoluteDifference: differences.length ? mean(differences.map(Math.abs)) : null, blandAltman: bias === null || differenceSd === null ? null : { bias, lower: bias - 1.96 * differenceSd, upper: bias + 1.96 * differenceSd }, eligible, limitations } satisfies RepeatMetricReport
  })
  const achieved = Math.min(...metrics.map(metric => metric.completeParticipants))
  const blockers: string[] = []
  if (!plan.frozen) blockers.push('Reliability plan is not frozen.')
  if (!plan.realRepeatSessions) blockers.push('Approved real repeat-session evidence is absent.')
  if (plan.signedRoles.length < 2) blockers.push('Statistics and validation owner signatures are required.')
  const insufficient = metrics.some(metric => metric.completeParticipants < plan.requiredCompleteParticipants || !metric.eligible || metric.icc95Ci === null)
  return { schemaVersion: 1, planVersion: plan.version, expectedParticipants: plan.expectedParticipants, achievedCompleteParticipants: achieved, attrition: Math.max(0, plan.expectedParticipants - achieved), metrics, disposition: blockers.length ? 'blocked' : insufficient ? 'inconclusive' : 'ready-for-owner-disposition', blockers }
}
