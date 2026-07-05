/**
 * Evidence-first report (Stream: demo/visual): the evidence bundle for a
 * verdict card restates existing analysis outputs — reps analyzed/excluded,
 * source reads, per-dimension confidence — without inventing anything new.
 */
import { describe, expect, it } from 'vitest'
import type { RepMetrics } from '../../cv/types'
import { buildPostureConcepts } from '../../analysis/posture/postureConcepts'
import { buildSessionResult } from '../../session/buildSessionResult'
import {
  buildConfidenceDimensions,
  buildExcludedReps,
  buildVerdictEvidence,
} from './verdictEvidence'

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

describe('verdictEvidence', () => {
  it('reports reps analyzed vs counted and per-dimension confidence for a clean set', () => {
    const reps = [makeRep(1), makeRep(2), makeRep(3), makeRep(4)]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    const concepts = buildPostureConcepts(
      result.metrics,
      result.sessionConfidence,
      result.posture,
    )
    const evidence = buildVerdictEvidence(concepts[0], result)

    expect(evidence.repsCounted).toBe(4)
    expect(evidence.repsAnalyzed).toBe(4)
    expect(evidence.excludedReps).toHaveLength(0)
    expect(evidence.derivedFrom.length).toBeGreaterThan(0)

    const ids = evidence.dimensions.map((d) => d.id)
    expect(ids).toEqual(['visibility', 'tracking', 'protocol'])
    for (const dim of evidence.dimensions) {
      expect(dim.score).toBeGreaterThanOrEqual(0)
      expect(dim.score).toBeLessThanOrEqual(100)
    }
    // Clean set: every rep complete and trusted.
    expect(evidence.dimensions[1].score).toBe(100)
    expect(evidence.dimensions[2].score).toBe(100)
  })

  it('surfaces quality-gate untrusted reps with their reasons', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: 176, minRightKneeAngle: 178 }), // standing
      makeRep(2),
      makeRep(3),
      makeRep(4),
      makeRep(5),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    const excluded = buildExcludedReps(result)

    expect(excluded.map((rep) => rep.repNumber)).toContain(1)
    const standing = excluded.find((rep) => rep.repNumber === 1)
    expect(standing?.why).toMatch(/knees never appeared to bend/i)

    // Tracking stays complete (all reps carried reads) but protocol drops.
    const dims = buildConfidenceDimensions(result)
    const protocol = dims.find((d) => d.id === 'protocol')!
    expect(protocol.score).toBeLessThan(100)
    expect(protocol.basis).toMatch(/4 of 5 reps/)
  })

  it('tracking dimension reflects incomplete reads without breaking on null angles', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: null, averageTrunkLean: null }),
      makeRep(2),
      makeRep(3),
      makeRep(4),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    const dims = buildConfidenceDimensions(result)
    const tracking = dims.find((d) => d.id === 'tracking')!
    expect(tracking.score).toBe(75)
  })
})
