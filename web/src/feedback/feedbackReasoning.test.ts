import { describe, expect, it } from 'vitest'
import type { SetMetricsSummary } from '../session/types'
import { buildBiomechanicalCue } from './feedbackReasoning'
import { sampleRep } from '../test/fixtures/poseFixtures'

function metrics(overrides: Partial<SetMetricsSummary>): SetMetricsSummary {
  return {
    repCount: 3,
    reps: [sampleRep({ repNumber: 1 }), sampleRep({ repNumber: 2 }), sampleRep({ repNumber: 3 })],
    avgDepth: 125,
    avgTrunkLean: 28,
    depthCV: 6,
    minDepth: 118,
    maxDepth: 132,
    avgHipShift: 0.02,
    avgKneeAsymmetry: 4,
    avgShoulderAsymmetry: 0.01,
    overallConfidence: 82,
    ...overrides,
  }
}

describe('feedbackReasoning', () => {
  it('explains shallow depth with score-linked observation', () => {
    const cue = buildBiomechanicalCue(
      'depth',
      metrics({
        avgDepth: 125,
        minDepth: 120,
        maxDepth: 130,
        depthCV: 4,
      }),
      'High',
    )
    expect(cue.observed).toMatch(/125°|above roughly parallel|lowered your depth score/i)
    expect(cue.whyItMatters).toMatch(/hip|depth|quads|glutes/i)
    expect(cue.tryNext).toMatch(/hips slightly lower|hips back/i)
    expect(cue.confidenceNote).toBeNull()
  })

  it('explains knee tracking asymmetry with sided observation', () => {
    const cue = buildBiomechanicalCue(
      'kneeTracking',
      metrics({
        avgKneeAsymmetry: 18,
        reps: [
          sampleRep({ minLeftKneeAngle: 88, minRightKneeAngle: 108 }),
          sampleRep({ minLeftKneeAngle: 90, minRightKneeAngle: 110 }),
          sampleRep({ minLeftKneeAngle: 92, minRightKneeAngle: 112 }),
        ],
      }),
      'Medium',
    )
    expect(cue.observed).toMatch(/left knee|18°/i)
    expect(cue.whyItMatters).toMatch(/even|load|not a medical/i)
    expect(cue.tryNext).toMatch(/knee|feet|second toe/i)
    expect(cue.confidenceNote).toMatch(/moderate|directional/i)
  })
})
