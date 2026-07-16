import { sha256Json } from './perturbations'

export interface ExperimentCandidate {
  id: string
  filter: 'raw' | 'one-euro-live'
  persistenceFrames: number
  returnTolerance: number
  dropoutMs: number
  recovery: 'disabled' | 'bounded-candidate'
}

export interface DevelopmentObservation {
  subjectKey: string
  sequenceId: string
  expectedCount: number
  negative: boolean
  candidates: Record<string, { observedCount: number; lagMs: number; abstained: boolean }>
}

export interface DevelopmentExperimentPlan {
  version: string
  preregisteredAt: string
  sourceManifestSha256: string
  seed: number
  bootstrapSamples: number
  evidenceKind: 'synthetic-dry-run' | 'qualified-real-development'
  candidates: ExperimentCandidate[]
  guardrails: { maximumFalseActivationRate: number; maximumDropoutRate: number; maximumMedianLagMs: number }
}

export interface ExperimentCandidateResult {
  id: string
  configSha256: string
  sequences: number
  subjects: number
  exactCountRate: number
  exactCountRate95Ci: [number, number]
  countMae: number
  falseActivationRate: number
  dropoutRate: number
  medianLagMs: number
  worstCases: Array<{ sequenceId: string; absoluteCountError: number }>
  eligible: boolean
}

export interface DevelopmentExperimentReport { schemaVersion: 1; planVersion: string; sourceManifestSha256: string; rows: ExperimentCandidateResult[]; selectedCandidateId: string | null; disposition: 'selected' | 'retain-baseline' | 'blocked'; blockers: string[] }

const SHA = /^[a-f0-9]{64}$/
const KEY = /^[a-z0-9][a-z0-9_-]*$/i
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) / 2)]
function rng(seed: number): () => number { let value = seed >>> 0; return () => { value = Math.imul(1664525, value) + 1013904223 >>> 0; return value / 4294967296 } }

export async function runDevelopmentExperiment(plan: DevelopmentExperimentPlan, observations: readonly DevelopmentObservation[]): Promise<DevelopmentExperimentReport> {
  if (!KEY.test(plan.version) || !SHA.test(plan.sourceManifestSha256) || !Number.isInteger(plan.seed) || !Number.isInteger(plan.bootstrapSamples) || plan.bootstrapSamples < 100) throw new Error('Experiment plan identity, checksum, seed, or bootstrap count is invalid.')
  if (observations.length === 0 || plan.candidates.length === 0) throw new Error('Experiment requires observations and candidates.')
  const ids = new Set<string>()
  for (const candidate of plan.candidates) {
    if (!KEY.test(candidate.id) || ids.has(candidate.id) || candidate.persistenceFrames < 1 || candidate.returnTolerance < 0 || candidate.dropoutMs < 0) throw new Error('Candidate configurations must be unique and bounded.')
    ids.add(candidate.id)
  }
  for (const observation of observations) if (!KEY.test(observation.subjectKey) || !KEY.test(observation.sequenceId) || [...ids].some(id => !observation.candidates[id])) throw new Error('Every sequence must run every candidate on the identical manifest.')
  const subjects = [...new Set(observations.map(item => item.subjectKey))].sort()
  const random = rng(plan.seed)
  const rows: ExperimentCandidateResult[] = []
  for (const candidate of plan.candidates) {
    const results = observations.map(item => ({ item, result: item.candidates[candidate.id], error: Math.abs(item.candidates[candidate.id].observedCount - item.expectedCount) }))
    const exact = results.map(item => Number(item.error === 0))
    const bootstrap: number[] = []
    for (let sample = 0; sample < plan.bootstrapSamples; sample++) {
      const picked = Array.from({ length: subjects.length }, () => subjects[Math.floor(random() * subjects.length)])
      const values = picked.flatMap(subject => results.filter(row => row.item.subjectKey === subject).map(row => Number(row.error === 0)))
      bootstrap.push(mean(values))
    }
    bootstrap.sort((a, b) => a - b)
    const negative = results.filter(row => row.item.negative)
    const positive = results.filter(row => !row.item.negative && row.item.expectedCount > 0)
    const falseActivationRate = negative.length ? mean(negative.map(row => Number(row.result.observedCount > 0))) : 0
    const dropoutRate = positive.length ? mean(positive.map(row => Number(row.result.observedCount === 0))) : 0
    const medianLagMs = median(results.map(row => row.result.lagMs))
    rows.push({ id: candidate.id, configSha256: await sha256Json(candidate), sequences: observations.length, subjects: subjects.length, exactCountRate: mean(exact), exactCountRate95Ci: [bootstrap[Math.floor(bootstrap.length * 0.025)], bootstrap[Math.min(bootstrap.length - 1, Math.floor(bootstrap.length * 0.975))]], countMae: mean(results.map(row => row.error)), falseActivationRate, dropoutRate, medianLagMs, worstCases: results.map(row => ({ sequenceId: row.item.sequenceId, absoluteCountError: row.error })).sort((a, b) => b.absoluteCountError - a.absoluteCountError), eligible: false })
  }
  rows.forEach(row => { row.eligible = row.falseActivationRate <= plan.guardrails.maximumFalseActivationRate && row.dropoutRate <= plan.guardrails.maximumDropoutRate && row.medianLagMs <= plan.guardrails.maximumMedianLagMs })
  const ranked = rows.filter(row => row.eligible).sort((a, b) => b.exactCountRate - a.exactCountRate || a.countMae - b.countMae || a.medianLagMs - b.medianLagMs || a.id.localeCompare(b.id))
  const blockers = plan.evidenceKind === 'qualified-real-development' ? [] : ['Candidate selection requires qualified real development labels; synthetic dry runs cannot select a configuration.']
  const selected = blockers.length ? null : ranked[0]?.id ?? null
  return { schemaVersion: 1, planVersion: plan.version, sourceManifestSha256: plan.sourceManifestSha256, rows, selectedCandidateId: selected, disposition: blockers.length ? 'blocked' : selected ? 'selected' : 'retain-baseline', blockers }
}
