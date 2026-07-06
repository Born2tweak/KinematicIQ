import { describe, expect, it } from 'vitest'
import type { RepMetrics } from '../cv/types'
import { collectSetMetrics } from './metricCollector'

function rep(
  repNumber: number,
  startMs: number,
  bottomMs: number | undefined,
  endMs: number,
): RepMetrics {
  return {
    repNumber,
    startFrameIndex: 0,
    bottomFrameIndex: 0,
    endFrameIndex: 0,
    startTimestamp: startMs,
    endTimestamp: endMs,
    ...(bottomMs !== undefined ? { bottomTimestamp: bottomMs } : {}),
    minLeftKneeAngle: 95,
    minRightKneeAngle: 97,
    averageTrunkLean: 20,
    maxTrunkLean: 25,
    hipShiftAtBottom: 0.02,
    shoulderAsymmetryAtBottom: 0.01,
    kneeAsymmetry: 2,
    minHipAngle: 80,
    minAnkleAngle: 100,
    confidence: 0.9,
    durationMs: endMs - startMs,
  }
}

describe('ROM proxy aggregates (M19)', () => {
  it('averages per-rep deepest hip and ankle proxy angles', () => {
    const m = collectSetMetrics(
      [rep(1, 0, 1_000, 2_000), rep(2, 3_000, 4_000, 5_000)],
      90,
    )
    expect(m.avgMinHipAngle).toBe(80)
    expect(m.avgMinAnkleAngle).toBe(100)
  })

  it('abstains when hip/ankle reads are missing (pre-M19 reps)', () => {
    const legacy = { ...rep(1, 0, 1_000, 2_000) }
    delete legacy.minHipAngle
    delete legacy.minAnkleAngle
    const m = collectSetMetrics([legacy], 90)
    expect(m.avgMinHipAngle).toBeNull()
    expect(m.avgMinAnkleAngle).toBeNull()
  })
})

describe('tempo & phase-timing aggregates (M18)', () => {
  it('computes rep duration, descent/ascent splits, and cadence', () => {
    const reps = [
      rep(1, 0, 1_000, 2_000),
      rep(2, 3_000, 4_200, 5_000),
      rep(3, 6_000, 7_100, 8_000),
    ]
    const m = collectSetMetrics(reps, 90)
    expect(m.avgRepDurationMs).toBe(2_000)
    expect(m.avgDescentMs).toBeCloseTo((1_000 + 1_200 + 1_100) / 3, 5)
    expect(m.avgAscentMs).toBeCloseTo((1_000 + 800 + 900) / 3, 5)
    // 3 reps over 8s span = 22.5 reps/min.
    expect(m.cadenceRepsPerMin).toBeCloseTo(22.5, 5)
    expect(m.repDurationCV).toBe(0)
  })

  it('abstains from descent/ascent when bottomTimestamp is missing (pre-M18 reps)', () => {
    const reps = [rep(1, 0, undefined, 2_000), rep(2, 3_000, undefined, 5_000)]
    const m = collectSetMetrics(reps, 90)
    expect(m.avgDescentMs).toBeNull()
    expect(m.avgAscentMs).toBeNull()
    expect(m.avgRepDurationMs).toBe(2_000)
  })

  it('abstains from cadence with fewer than 2 reps', () => {
    const m = collectSetMetrics([rep(1, 0, 1_000, 2_000)], 90)
    expect(m.cadenceRepsPerMin).toBeNull()
    expect(m.avgRepDurationMs).toBe(2_000)
  })

  it('excluded reps do not drive tempo aggregates', () => {
    const reps = [
      rep(1, 0, 1_000, 2_000),
      rep(2, 3_000, 4_000, 5_000),
      rep(3, 6_000, 7_000, 20_000), // outlier duration
    ]
    const m = collectSetMetrics(reps, 90, new Set([3]))
    expect(m.avgRepDurationMs).toBe(2_000)
  })
})
