import { describe, expect, it } from 'vitest'
import type { RepMetrics } from '../cv/types'
import { buildResultsSummary, buildSessionResult } from './buildSessionResult'

function makeRep(repNumber: number, overrides: Partial<RepMetrics> = {}): RepMetrics {
  return {
    repNumber,
    startFrameIndex: 0,
    bottomFrameIndex: 10,
    endFrameIndex: 40,
    startTimestamp: 0,
    endTimestamp: 1200,
    minLeftKneeAngle: 95,
    minRightKneeAngle: 98,
    averageTrunkLean: 24,
    maxTrunkLean: 32,
    hipShiftAtBottom: 0.02,
    shoulderAsymmetryAtBottom: 0.01,
    kneeAsymmetry: 3,
    confidence: 0.85,
    durationMs: 1200,
    ...overrides,
  }
}

describe('buildSessionResult', () => {
  it('marks empty sets as no reps with insufficient data', () => {
    const result = buildSessionResult([], [0.8, 0.82])
    expect(result.noRepsDetected).toBe(true)
    expect(result.insufficientData).toBe(true)
    expect(result.scoring).toBeNull()
    expect(result.feedback).toHaveLength(0)
    expect(result.metrics.repCount).toBe(0)
  })

  it('builds scoring and feedback for a valid multi-rep set', () => {
    const reps = [makeRep(1), makeRep(2), makeRep(3)]
    const result = buildSessionResult(reps, [0.85, 0.88, 0.9])
    expect(result.noRepsDetected).toBe(false)
    expect(result.metrics.repCount).toBe(3)
    expect(result.scoring).not.toBeNull()
    expect(result.scoring!.totalScore).toBeGreaterThan(0)
    expect(result.sessionConfidence).toBeTruthy()
  })

  it('summary mentions rep count when scoring is available', () => {
    const reps = [makeRep(1), makeRep(2)]
    const result = buildSessionResult(reps, [0.9, 0.9, 0.88])
    const summary = buildResultsSummary(result)
    expect(summary).toContain('2')
    expect(summary).toContain('100')
  })

  it('summary uses no-reps message when empty', () => {
    const result = buildSessionResult([])
    expect(buildResultsSummary(result)).toMatch(/no squats were detected/i)
  })
})
