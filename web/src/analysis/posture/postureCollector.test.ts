import { describe, expect, it } from 'vitest'
import type { RepMetrics } from '../../cv/types'
import { collectPostureMetrics } from './postureCollector'
import type { PostureFrameSample } from './postureFrame'

function makeRep(
  repNumber: number,
  startTimestamp: number,
  endTimestamp: number,
  overrides: Partial<RepMetrics> = {},
): RepMetrics {
  return {
    repNumber,
    startFrameIndex: 0,
    bottomFrameIndex: 0,
    endFrameIndex: 0,
    startTimestamp,
    endTimestamp,
    minLeftKneeAngle: 95,
    minRightKneeAngle: 97,
    averageTrunkLean: 32,
    maxTrunkLean: 40,
    hipShiftAtBottom: 0.02,
    shoulderAsymmetryAtBottom: 0.01,
    kneeAsymmetry: 3,
    confidence: 0.9,
    durationMs: endTimestamp - startTimestamp,
    ...overrides,
  }
}

/** Samples sweeping down into a bottom and back up across one rep window. */
function repSamples(
  start: number,
  end: number,
  opts: { hipAtBottom: number; kneeAtBottom: number; trunkDrift?: number } =
    { hipAtBottom: 80, kneeAtBottom: 90 },
): PostureFrameSample[] {
  const n = 12
  const samples: PostureFrameSample[] = []
  for (let i = 0; i < n; i++) {
    const phase = Math.sin((Math.PI * i) / (n - 1)) // 0 → 1 → 0
    const t = start + ((end - start) * i) / (n - 1)
    samples.push({
      timestamp: t,
      hipFlexion: opts.hipAtBottom * phase,
      kneeFlexion: opts.kneeAtBottom * phase,
      trunkAngle: 20 + (opts.trunkDrift ?? 0) * phase,
      hipCenter: { x: 0, y: 0.4 * phase, z: 0 },
      confidence: 0.9,
    })
  }
  return samples
}

describe('collectPostureMetrics', () => {
  it('computes hinge ratio from the deepest sample of each rep', () => {
    const reps = [makeRep(1, 0, 2000)]
    const samples = repSamples(0, 2000, { hipAtBottom: 110, kneeAtBottom: 70 })
    const summary = collectPostureMetrics(reps, samples)
    expect(summary.repPosture[0].hingeRatio).toBeCloseTo(110 / 70, 2)
    expect(summary.avgHingeRatio).toBeCloseTo(110 / 70, 2)
    expect(summary.sampleCoverage).toBe(1)
  })

  it('reports trunk variability and smoothness per rep', () => {
    const reps = [makeRep(1, 0, 2000)]
    const drifting = repSamples(0, 2000, {
      hipAtBottom: 80,
      kneeAtBottom: 90,
      trunkDrift: 15,
    })
    const summary = collectPostureMetrics(reps, drifting)
    expect(summary.repPosture[0].trunkVariability).toBeGreaterThan(3)
    expect(summary.repPosture[0].normalizedJerk).not.toBeNull()
  })

  it('degrades to nulls when a rep has too few 3D samples', () => {
    const reps = [makeRep(1, 0, 2000)]
    const summary = collectPostureMetrics(reps, repSamples(0, 2000).slice(0, 3))
    expect(summary.repPosture[0].hingeRatio).toBeNull()
    expect(summary.repPosture[0].trunkVariability).toBeNull()
    expect(summary.sampleCoverage).toBe(0)
    expect(summary.avgHingeRatio).toBeNull()
  })

  it('flags the rep deviating most from the set pattern (2D-only floor)', () => {
    const reps = [
      makeRep(1, 0, 2000),
      makeRep(2, 2500, 4500),
      makeRep(3, 5000, 7000, { minLeftKneeAngle: 140, minRightKneeAngle: 142 }),
      makeRep(4, 7500, 9500),
      makeRep(5, 10000, 12000),
    ]
    const summary = collectPostureMetrics(reps, [])
    expect(summary.mostDeviantRep).toBe(3)
  })

  it('does not flag deviation for small or uniform sets', () => {
    const uniform = [
      makeRep(1, 0, 2000),
      makeRep(2, 2500, 4500),
      makeRep(3, 5000, 7000),
    ]
    expect(collectPostureMetrics(uniform, []).mostDeviantRep).toBeNull()

    const tiny = [makeRep(1, 0, 2000), makeRep(2, 2500, 4500)]
    expect(collectPostureMetrics(tiny, []).mostDeviantRep).toBeNull()
  })
})
