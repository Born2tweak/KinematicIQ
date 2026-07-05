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

  it('builds component evidence and feedback for a valid multi-rep set', () => {
    const reps = [makeRep(1), makeRep(2), makeRep(3)]
    const result = buildSessionResult(reps, [0.85, 0.88, 0.9])
    expect(result.noRepsDetected).toBe(false)
    expect(result.metrics.repCount).toBe(3)
    expect(result.scoring).not.toBeNull()
    // Components survive as evidence; no composite total/band is produced.
    expect(result.scoring!.depth).toBeGreaterThanOrEqual(0)
    expect(result.scoring).not.toHaveProperty('totalScore')
    expect(result.scoring).not.toHaveProperty('band')
    expect(result.sessionConfidence).toBeTruthy()
  })

  it('summary mentions rep count and never shows a 0–100 score', () => {
    // 3 trustworthy reps — the minimum for a set to escape the quality gate.
    const reps = [makeRep(1), makeRep(2), makeRep(3)]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    const summary = buildResultsSummary(result)
    expect(summary).toContain('3')
    expect(summary).not.toMatch(/\/100/)
    expect(summary).not.toMatch(/movement score/i)
  })

  it('summary uses no-reps message when empty', () => {
    const result = buildSessionResult([])
    expect(buildResultsSummary(result)).toMatch(/no full reps were counted/i)
  })

  it('excludes a flagged outlier rep from set aggregates with disclosure', () => {
    // Rep 1 is a setup artifact: implausibly deep and slow vs the pattern.
    const reps = [
      makeRep(1, { minLeftKneeAngle: 41, minRightKneeAngle: 45, durationMs: 6000, endTimestamp: 6000 }),
      makeRep(2, { minLeftKneeAngle: 100, minRightKneeAngle: 103 }),
      makeRep(3, { minLeftKneeAngle: 102, minRightKneeAngle: 105 }),
      makeRep(4, { minLeftKneeAngle: 98, minRightKneeAngle: 101 }),
      makeRep(5, { minLeftKneeAngle: 101, minRightKneeAngle: 104 }),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.9))

    expect(result.metrics.excludedRepNumbers).toEqual([1])
    // Rep count still reports every counted rep.
    expect(result.metrics.repCount).toBe(5)
    // Aggregates no longer include the 41° artifact.
    expect(result.metrics.minDepth).toBeGreaterThan(90)
    expect(result.metrics.avgDepth).toBeGreaterThan(90)
    // Disclosure is coach-visible.
    expect(buildResultsSummary(result)).toMatch(/rep 1.*left out of the averages/i)
  })

  it('keeps every rep in aggregates for small sets (under 4 reps)', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: 41, minRightKneeAngle: 45 }),
      makeRep(2, { minLeftKneeAngle: 100, minRightKneeAngle: 103 }),
      makeRep(3, { minLeftKneeAngle: 102, minRightKneeAngle: 105 }),
    ]
    const result = buildSessionResult(reps, [0.85, 0.88, 0.9])
    expect(result.metrics.excludedRepNumbers).toEqual([])
    expect(result.metrics.minDepth).toBeLessThan(50)
  })
})
