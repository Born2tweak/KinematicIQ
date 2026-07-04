import { describe, expect, it } from 'vitest'
import { buildComponentScoreExplanations } from './scoringExplanations'

describe('scoringExplanations', () => {
  it('links shallow depth metrics to an observable, score-free explanation', () => {
    const metrics = {
      repCount: 3,
      reps: [],
      avgDepth: 125,
      avgTrunkLean: 25,
      depthCV: 6,
      minDepth: 120,
      maxDepth: 130,
      avgHipShift: 0.02,
      avgKneeAsymmetry: 5,
      avgShoulderAsymmetry: 0.01,
      overallConfidence: 80,
    }
    const explanations = buildComponentScoreExplanations(metrics)
    const depth = explanations.find((e) => e.key === 'depth')!
    expect(depth.measured).toMatch(/125°/)
    expect(depth.explanation).toMatch(/shallow|110°/i)
    // No 0–100 score or weighting is surfaced (composite score removed).
    expect(depth).not.toHaveProperty('score')
    expect(depth).not.toHaveProperty('weightPercent')
    expect(depth.explanation).not.toMatch(/of total|% of|score/i)
  })
})
