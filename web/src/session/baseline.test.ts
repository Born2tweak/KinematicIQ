import { describe, expect, it } from 'vitest'
import { buildSessionResult } from './buildSessionResult'
import { buildStoredSession } from '../storage/sessionStore'
import { MIN_BASELINE_SESSIONS, computeBaseline } from './baseline'
import type { RepMetrics } from '../cv/types'

function rep(repNumber: number, depth: number): RepMetrics {
  return {
    repNumber,
    startFrameIndex: 0,
    bottomFrameIndex: 10,
    endFrameIndex: 40,
    startTimestamp: repNumber * 3000,
    endTimestamp: repNumber * 3000 + 1500,
    bottomTimestamp: repNumber * 3000 + 800,
    minLeftKneeAngle: depth,
    minRightKneeAngle: depth + 2,
    averageTrunkLean: 24,
    maxTrunkLean: 30,
    hipShiftAtBottom: 0.02,
    shoulderAsymmetryAtBottom: 0.01,
    kneeAsymmetry: 2,
    confidence: 0.9,
    durationMs: 1500,
  }
}

function session(depth: number) {
  const result = buildSessionResult(
    [rep(1, depth), rep(2, depth), rep(3, depth), rep(4, depth)],
    Array(12).fill(0.9),
  )
  return buildStoredSession(result)
}

describe('personal baseline (M31)', () => {
  it('claims no baseline under the minimum saved-session count', () => {
    const history = [session(95), session(97)]
    expect(history.length).toBeLessThan(MIN_BASELINE_SESSIONS)
    expect(computeBaseline(history, session(100).result)).toBeNull()
  })

  it('averages same-protocol history and reports current-vs-baseline deltas', () => {
    const history = [session(90), session(95), session(100)]
    const current = session(110).result
    const baseline = computeBaseline(history, current)
    expect(baseline).not.toBeNull()
    expect(baseline?.sessionCount).toBe(3)
    const depth = baseline?.deltas.find(
      (d) => d.metricId === 'squat.depth.min-knee-angle',
    )
    expect(depth).toBeDefined()
    // History averages ~91/96/101 bottoms (min of sides); delta positive.
    expect(depth!.baselineValue).toBeCloseTo(95, 0)
    expect(depth!.delta).toBeGreaterThan(10)
    // M32: a delta beyond the heuristic threshold reads as possible change,
    // never as certainty.
    expect(depth!.change?.classification).toBe('possible-change')
    expect(depth!.change?.basis).toBe('heuristic')
  })

  it('marks small deltas as within noise (M32)', () => {
    const history = [session(95), session(96), session(97)]
    const current = session(97).result
    const baseline = computeBaseline(history, current)
    const depth = baseline?.deltas.find(
      (d) => d.metricId === 'squat.depth.min-knee-angle',
    )
    expect(depth?.change?.classification).toBe('within-noise')
    expect(depth?.change?.copy).toContain('measurement noise')
  })

  it('excludes invalid sessions from the baseline', () => {
    const invalid = session(95)
    invalid.result = {
      ...invalid.result,
      quality: { ...invalid.result.quality, verdict: 'invalid' },
    }
    const history = [invalid, session(95), session(97)]
    expect(computeBaseline(history, session(100).result)).toBeNull()
  })
})
