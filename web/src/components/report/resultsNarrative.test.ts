import { describe, expect, it } from 'vitest'
import { buildSessionResult } from '../../session/buildSessionResult'
import type { RepMetrics } from '../../cv/types'
import { buildResultsNarrative } from './resultsNarrative'

function rep(repNumber: number): RepMetrics {
  return {
    repNumber,
    startTimestamp: repNumber * 1000,
    endTimestamp: repNumber * 1000 + 900,
    bottomTimestamp: repNumber * 1000 + 450,
    minLeftKneeAngle: 95,
    minRightKneeAngle: 97,
    averageTrunkLean: 10,
    maxTrunkLean: 12,
    hipShiftAtBottom: 0.01,
    shoulderAsymmetryAtBottom: 1,
    kneeAsymmetry: 2,
    confidence: 0.95,
    durationMs: 900,
    startFrameIndex: repNumber * 30,
    bottomFrameIndex: repNumber * 30 + 15,
    endFrameIndex: repNumber * 30 + 29,
  }
}

describe('results narrative', () => {
  it('covers no-reps and invalid states without coaching', () => {
    const noReps = buildResultsNarrative(buildSessionResult([]))
    expect(noReps.headline).toMatch(/No bodyweight squat repetitions/)
    expect(noReps.cameraConfidence).toMatch(/not movement validity/)
  })

  it('separates camera confidence from scientific validation', () => {
    const result = buildSessionResult([rep(1), rep(2), rep(3)], Array(12).fill(0.95))
    const narrative = buildResultsNarrative(result)
    expect(narrative.cameraConfidence).toMatch(/landmark visibility/)
    expect(narrative.validation).toMatch(/Scientific validation/)
    expect(narrative.next.length).toBeGreaterThan(0)
  })
})
