import { describe, expect, it } from 'vitest'
import { buildComponentScoreExplanations } from './scoringExplanations'
import { computeComponentScores } from './scoringEngine'

describe('scoringExplanations', () => {
  it('links shallow depth metrics to score explanation', () => {
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
    const components = computeComponentScores(metrics)
    const explanations = buildComponentScoreExplanations(metrics, components)
    const depth = explanations.find((e) => e.key === 'depth')!
    expect(depth.score).toBeLessThan(80)
    expect(depth.measured).toMatch(/125°/)
    expect(depth.explanation).toMatch(/30%|shallow|110°/i)
  })
})
