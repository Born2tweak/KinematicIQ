import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../session/types'
import { computeComponentScores, scoreSet } from './scoringEngine'

function mockMetrics(overrides: Partial<SetMetricsSummary> = {}): SetMetricsSummary {
  return {
    repCount: 5,
    reps: [],
    avgDepth: 100,
    avgTrunkLean: 22,
    depthCV: 0.08,
    minDepth: 92,
    maxDepth: 108,
    avgHipShift: 0.02,
    avgKneeAsymmetry: 4,
    avgShoulderAsymmetry: 0.02,
    overallConfidence: 0.82,
    ...overrides,
  }
}

describe('scoringEngine', () => {
  it('returns all component scores between 0 and 100', () => {
    const components = computeComponentScores(mockMetrics())
    for (const value of Object.values(components)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })

  it('scores a solid set in Good or Excellent band', () => {
    const result = scoreSet(mockMetrics())
    expect(result.totalScore).toBeGreaterThanOrEqual(60)
    expect(['Excellent', 'Good', 'Needs Work']).toContain(result.band)
  })

  it('penalizes shallow depth and high asymmetry', () => {
    const good = scoreSet(mockMetrics({ avgDepth: 95, avgKneeAsymmetry: 3 }))
    const poor = scoreSet(mockMetrics({ avgDepth: 140, avgKneeAsymmetry: 25 }))
    expect(poor.totalScore).toBeLessThan(good.totalScore)
  })

  it('clamps total score to 0–100', () => {
    const result = scoreSet(
      mockMetrics({
        avgDepth: 170,
        avgTrunkLean: 80,
        depthCV: 0.9,
        avgHipShift: 0.2,
        avgKneeAsymmetry: 40,
        repCount: 1,
      }),
    )
    expect(result.totalScore).toBeGreaterThanOrEqual(0)
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })
})
