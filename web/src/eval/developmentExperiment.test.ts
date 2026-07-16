import { describe, expect, it } from 'vitest'
import { runDevelopmentExperiment, type DevelopmentExperimentPlan } from './developmentExperiment'

const plan = (evidenceKind: DevelopmentExperimentPlan['evidenceKind'] = 'synthetic-dry-run'): DevelopmentExperimentPlan => ({ version: 'flsr-experiment-v1', preregisteredAt: '2026-07-16T00:00:00Z', sourceManifestSha256: 'a'.repeat(64), seed: 7, bootstrapSamples: 200, evidenceKind, candidates: [{ id: 'baseline', filter: 'raw', persistenceFrames: 2, returnTolerance: 0.03, dropoutMs: 100, recovery: 'disabled' }, { id: 'candidate-a', filter: 'one-euro-live', persistenceFrames: 3, returnTolerance: 0.03, dropoutMs: 100, recovery: 'disabled' }], guardrails: { maximumFalseActivationRate: 0.1, maximumDropoutRate: 0.1, maximumMedianLagMs: 100 } })
const observations = [{ subjectKey: 'subject-1', sequenceId: 'positive-1', expectedCount: 1, negative: false, candidates: { baseline: { observedCount: 1, lagMs: 0, abstained: false }, 'candidate-a': { observedCount: 1, lagMs: 20, abstained: false } } }, { subjectKey: 'subject-2', sequenceId: 'negative-1', expectedCount: 0, negative: true, candidates: { baseline: { observedCount: 0, lagMs: 0, abstained: false }, 'candidate-a': { observedCount: 0, lagMs: 20, abstained: false } } }]

describe('development experiment package', () => {
  it('is deterministic, subject-grouped, hashed, and worst-case visible', async () => {
    const first = await runDevelopmentExperiment(plan(), observations)
    expect(first).toEqual(await runDevelopmentExperiment(plan(), observations))
    expect(first.rows[0].subjects).toBe(2)
    expect(first.rows[0].configSha256).toHaveLength(64)
    expect(first.rows[0].worstCases).toHaveLength(2)
  })
  it('blocks synthetic selection and applies the frozen rule only to qualified real development evidence', async () => {
    expect((await runDevelopmentExperiment(plan(), observations)).disposition).toBe('blocked')
    const report = await runDevelopmentExperiment(plan('qualified-real-development'), observations)
    expect(report.disposition).toBe('selected')
    expect(report.selectedCandidateId).toBe('baseline')
  })
  it('rejects candidate omissions', async () => {
    const malformed = [{ ...observations[0], candidates: { baseline: observations[0].candidates.baseline } }]
    await expect(runDevelopmentExperiment(plan(), malformed)).rejects.toThrow('every candidate')
  })
})
