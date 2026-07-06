import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../session/types'
import { computeEvidenceStrengths, rankIssuesByEvidence } from './evidenceStrength'

const base: SetMetricsSummary = {
  repCount: 5,
  reps: [],
  excludedRepNumbers: [],
  avgDepth: 100, // inside good (≤110)
  avgTrunkLean: 30, // inside good (≤45)
  depthCV: 6, // inside good (≤10)
  minDepth: 95,
  maxDepth: 106,
  avgHipShift: 0.03, // inside good (≤0.05)
  avgKneeAsymmetry: 6, // inside good (≤15)
  avgShoulderAsymmetry: 0.01,
  overallConfidence: 85,
}

describe('evidence-strength ranking (M23)', () => {
  it('assigns zero strength when every read sits inside the good range', () => {
    const s = computeEvidenceStrengths(base)
    expect(Object.values(s).every((v) => v === 0)).toBe(true)
  })

  it('ranks the largest threshold exceedance first', () => {
    const metrics = { ...base, avgDepth: 125, avgTrunkLean: 47 }
    // depth exceeds by 15/20 = 0.75; trunk by 2/15 ≈ 0.13.
    const keys = rankIssuesByEvidence(metrics, 2)
    expect(keys[0]).toBe('depth')
  })

  it('floors an implausible knee-asymmetry read so a view artifact never leads', () => {
    const metrics = { ...base, avgKneeAsymmetry: 61, avgTrunkLean: 50 }
    const s = computeEvidenceStrengths(metrics)
    expect(s.kneeTracking).toBeLessThan(s.trunkControl)
    expect(rankIssuesByEvidence(metrics, 2)[0]).toBe('trunkControl')
  })

  it('treats unreadable metrics as zero strength (abstain, not alarm)', () => {
    const metrics = { ...base, avgDepth: null, avgHipShift: null }
    const s = computeEvidenceStrengths(metrics)
    expect(s.depth).toBe(0)
    expect(s.symmetry).toBe(0)
  })

  it('is deterministic on ties via canonical order', () => {
    expect(rankIssuesByEvidence(base, 2)).toEqual(['depth', 'trunkControl'])
  })
})
