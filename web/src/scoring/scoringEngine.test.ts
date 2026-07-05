import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../session/types'
import { computeComponentScores } from './scoringEngine'

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
    excludedRepNumbers: [],
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

  it('exposes exactly the five evidence components and no composite total', () => {
    const components = computeComponentScores(mockMetrics())
    expect(Object.keys(components).sort()).toEqual(
      ['consistency', 'depth', 'kneeTracking', 'symmetry', 'trunkControl'].sort(),
    )
    // No aggregated 0–100 total or band is produced (ontology §6 #15).
    expect('totalScore' in components).toBe(false)
    expect('band' in components).toBe(false)
  })

  it('penalizes shallow depth and high asymmetry per component', () => {
    const good = computeComponentScores(
      mockMetrics({ avgDepth: 95, avgKneeAsymmetry: 3 }),
    )
    const poor = computeComponentScores(
      mockMetrics({ avgDepth: 140, avgKneeAsymmetry: 25 }),
    )
    expect(poor.depth).toBeLessThan(good.depth)
    expect(poor.kneeTracking).toBeLessThan(good.kneeTracking)
  })

  it('keeps every component within 0–100 even on a poor set', () => {
    const components = computeComponentScores(
      mockMetrics({
        avgDepth: 170,
        avgTrunkLean: 80,
        depthCV: 0.9,
        avgHipShift: 0.2,
        avgKneeAsymmetry: 40,
        repCount: 1,
      }),
    )
    for (const value of Object.values(components)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })
})
