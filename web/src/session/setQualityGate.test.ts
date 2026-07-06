import { describe, expect, it } from 'vitest'
import type { RepMetrics } from '../cv/types'
import type { RepRejection } from '../analysis/repCounter'
import {
  buildResultsSummary,
  buildSessionResult,
  UNTRUSTWORTHY_REPORT_MESSAGE,
} from './buildSessionResult'
import {
  MIN_TRUSTED_REPS,
  PHANTOM_CHURN_QUESTIONABLE,
  assessSetQuality,
} from './setQualityGate'

function makeRep(
  repNumber: number,
  overrides: Partial<RepMetrics> = {},
): RepMetrics {
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

function makePhantomRejection(index: number): RepRejection {
  return {
    gate: 'bottom',
    reason: 'Bottom not held long enough',
    phantom: true,
    startFrameIndex: index * 10,
    endFrameIndex: index * 10 + 5,
    startTimestamp: index * 400,
    endTimestamp: index * 400 + 160,
    durationMs: 160,
    values: {
      minLeftKneeAngle: 172,
      minRightKneeAngle: 174,
      maxHipDrop: 0,
      bottomHoldMs: 0,
      avgConfidence: 0.95,
      reachedBottom: false,
    },
  }
}

/**
 * The owner's real 25-rep session c (docs/validation/session-log.md):
 * reps 1–7 counted at 175–178° bottoms (standing), reps 13/16/17/18 at
 * 13–20° (tracking artifacts), plausible genuine squats in between.
 * The canonical invalid case for the quality gate.
 */
function sessionCReps(): RepMetrics[] {
  const standingBottoms = [175, 176, 177, 178, 175, 176, 177]
  const reps: RepMetrics[] = []
  for (let i = 1; i <= 25; i++) {
    if (i <= 7) {
      const angle = standingBottoms[i - 1]
      reps.push(
        makeRep(i, { minLeftKneeAngle: angle, minRightKneeAngle: angle + 1 }),
      )
    } else if ([13, 16, 17, 18].includes(i)) {
      reps.push(
        makeRep(i, { minLeftKneeAngle: 13 + (i % 8), minRightKneeAngle: 164 }),
      )
    } else {
      reps.push(
        makeRep(i, {
          minLeftKneeAngle: 65 + ((i * 7) % 60),
          minRightKneeAngle: 70 + ((i * 5) % 60),
        }),
      )
    }
  }
  return reps
}

describe('assessSetQuality', () => {
  it('marks a clean set valid with no reasons', () => {
    const quality = assessSetQuality([makeRep(1), makeRep(2), makeRep(3), makeRep(4)])
    expect(quality.verdict).toBe('valid')
    expect(quality.reasons).toHaveLength(0)
    expect(quality.untrustedReps).toHaveLength(0)
    expect(quality.trustedRepCount).toBe(4)
  })

  it('flags standing-bottom reps (finding #5) and invalidates an artifact-heavy set', () => {
    // 3 of 5 reps counted at >170° bottoms — standing, no knee bend.
    const reps = [
      makeRep(1, { minLeftKneeAngle: 176, minRightKneeAngle: 178 }),
      makeRep(2, { minLeftKneeAngle: 175, minRightKneeAngle: 177 }),
      makeRep(3, { minLeftKneeAngle: 174, minRightKneeAngle: 172 }),
      makeRep(4),
      makeRep(5),
    ]
    const quality = assessSetQuality(reps)
    expect(quality.untrustedRepNumbers).toEqual([1, 2, 3])
    expect(quality.verdict).toBe('invalid')
    expect(quality.reasons.map((r) => r.id)).toContain('standing-reps-counted')
    expect(quality.reasons.map((r) => r.id)).toContain('too-few-trusted-reps')
  })

  it('flags extreme-flexion artifacts (finding #6)', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: 13, minRightKneeAngle: 164 }),
      makeRep(2),
      makeRep(3),
      makeRep(4),
      makeRep(5),
    ]
    const quality = assessSetQuality(reps)
    expect(quality.untrustedRepNumbers).toEqual([1])
    expect(quality.untrustedReps[0].reason).toBe('impossible-flexion')
    expect(quality.verdict).toBe('questionable')
  })

  it('flags a rep counted with no knee data at all (finding #8)', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: null, minRightKneeAngle: null }),
      makeRep(2),
      makeRep(3),
      makeRep(4),
      makeRep(5),
    ]
    const quality = assessSetQuality(reps)
    expect(quality.untrustedReps[0].reason).toBe('no-knee-data')
    expect(quality.verdict).toBe('questionable')
  })

  it('invalidates when fewer than the minimum trustworthy reps remain', () => {
    const reps = [
      makeRep(1),
      makeRep(2),
      makeRep(3, { minLeftKneeAngle: null, minRightKneeAngle: null }),
    ]
    const quality = assessSetQuality(reps)
    expect(quality.trustedRepCount).toBe(2)
    expect(quality.trustedRepCount).toBeLessThan(MIN_TRUSTED_REPS)
    expect(quality.verdict).toBe('invalid')
  })

  it('marks a CLEAN short set questionable (small-sample), not invalid', () => {
    // 2026-07-06 batch eval: 5 of 9 upload tapes were clean 1–2-rep clips
    // wrongly branded untrustworthy by the full abstain.
    const quality = assessSetQuality([makeRep(1), makeRep(2)])
    expect(quality.verdict).toBe('questionable')
    expect(quality.reasons.map((r) => r.id)).toEqual(['small-sample'])
    expect(quality.trustedRepCount).toBe(2)
    expect(quality.captureFixes.join(' ')).toMatch(/at least 3 reps/i)
  })

  it('extends small-sample to a clean single rep', () => {
    const quality = assessSetQuality([makeRep(1)])
    expect(quality.verdict).toBe('questionable')
    expect(quality.reasons.map((r) => r.id)).toEqual(['small-sample'])
  })

  it('keeps a short set invalid when it is short because of artifacts', () => {
    const quality = assessSetQuality([
      makeRep(1, { minLeftKneeAngle: 176, minRightKneeAngle: 178 }),
      makeRep(2),
      makeRep(3, { minLeftKneeAngle: null, minRightKneeAngle: null }),
    ])
    expect(quality.trustedRepCount).toBe(1)
    expect(quality.verdict).toBe('invalid')
    expect(quality.reasons.map((r) => r.id)).toContain('too-few-trusted-reps')
  })

  it('keeps a short churn-heavy set invalid', () => {
    const churn = Array.from(
      { length: PHANTOM_CHURN_QUESTIONABLE },
      (_, i) => makePhantomRejection(i),
    )
    const quality = assessSetQuality([makeRep(1), makeRep(2)], churn)
    expect(quality.verdict).toBe('invalid')
    expect(quality.reasons.map((r) => r.id)).toContain('too-few-trusted-reps')
  })

  it('marks heavy phantom-candidate churn questionable, but tolerates normal jitter', () => {
    const cleanSet = [makeRep(1), makeRep(2), makeRep(3), makeRep(4)]

    // Session a: 15 phantoms on a genuinely clean 9-rep set — must stay valid.
    const normalJitter = Array.from({ length: 15 }, (_, i) => makePhantomRejection(i))
    expect(assessSetQuality(cleanSet, normalJitter).verdict).toBe('valid')

    const churn = Array.from(
      { length: PHANTOM_CHURN_QUESTIONABLE },
      (_, i) => makePhantomRejection(i),
    )
    const quality = assessSetQuality(cleanSet, churn)
    expect(quality.verdict).toBe('questionable')
    expect(quality.reasons.map((r) => r.id)).toContain('phantom-candidate-churn')
  })

  it('classifies the real session-c set (25 reps, ~11 artifacts) as invalid', () => {
    const quality = assessSetQuality(sessionCReps(), [
      ...Array.from({ length: 46 }, (_, i) => makePhantomRejection(i)),
    ])
    expect(quality.verdict).toBe('invalid')
    expect(quality.untrustedRepNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 13, 16, 17, 18])
    expect(quality.reasons.map((r) => r.id)).toEqual(
      expect.arrayContaining([
        'standing-reps-counted',
        'impossible-flexion-reps',
        'phantom-candidate-churn',
        'artifact-heavy-set',
      ]),
    )
    expect(quality.captureFixes.length).toBeGreaterThan(0)
  })
})

describe('buildSessionResult with the quality gate', () => {
  it('fully abstains on an invalid set: no coaching, abstain headline', () => {
    const result = buildSessionResult(sessionCReps(), Array(20).fill(0.9))
    expect(result.quality.verdict).toBe('invalid')
    expect(result.feedback).toHaveLength(0)
    expect(buildResultsSummary(result)).toBe(UNTRUSTWORTHY_REPORT_MESSAGE)
  })

  it('excludes untrusted reps from every aggregate, with disclosure', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: 176, minRightKneeAngle: 178 }),
      makeRep(2, { minLeftKneeAngle: 100, minRightKneeAngle: 103 }),
      makeRep(3, { minLeftKneeAngle: 102, minRightKneeAngle: 105 }),
      makeRep(4, { minLeftKneeAngle: 98, minRightKneeAngle: 101 }),
      makeRep(5, { minLeftKneeAngle: 101, minRightKneeAngle: 104 }),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    expect(result.quality.verdict).toBe('questionable')
    // The 176° standing artifact never drives averages/min/max.
    expect(result.metrics.excludedRepNumbers).toContain(1)
    expect(result.metrics.maxDepth).toBeLessThan(170)
    expect(result.metrics.avgDepth).toBeLessThan(120)
    // Disclosure is coach-visible.
    expect(buildResultsSummary(result)).toMatch(/rep 1.*cannot trust.*left out of the averages/i)
  })

  it('suppresses coaching for questionable sets (observations only)', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: null, minRightKneeAngle: null }),
      makeRep(2),
      makeRep(3),
      makeRep(4),
      makeRep(5),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    expect(result.quality.verdict).toBe('questionable')
    expect(result.feedback).toHaveLength(0)
    expect(result.scoring).not.toBeNull()
  })

  it('keeps coaching for a valid set', () => {
    const reps = [makeRep(1), makeRep(2), makeRep(3), makeRep(4)]
    const result = buildSessionResult(reps, Array(12).fill(0.9))
    expect(result.quality.verdict).toBe('valid')
    expect(result.feedback.length).toBeGreaterThan(0)
  })

  it('gives a clean short set observations without coaching or the abstain headline', () => {
    const result = buildSessionResult([makeRep(1), makeRep(2)], Array(12).fill(0.9))
    expect(result.quality.verdict).toBe('questionable')
    // No set-pattern coaching from 2 reps…
    expect(result.feedback).toHaveLength(0)
    expect(result.findings).toHaveLength(0)
    // …but the report renders instead of fully abstaining.
    const summary = buildResultsSummary(result)
    expect(summary).not.toBe(UNTRUSTWORTHY_REPORT_MESSAGE)
    expect(summary).toMatch(/2 reps/)
  })

  it('a rep with missing knee data can never carry High confidence anywhere', () => {
    const reps = [
      makeRep(1, { minLeftKneeAngle: null, minRightKneeAngle: null }),
      makeRep(2),
      makeRep(3),
      makeRep(4),
    ]
    const result = buildSessionResult(reps, Array(12).fill(0.95))
    // Report-level: the rep is excluded from aggregates outright.
    expect(result.metrics.excludedRepNumbers).toContain(1)
    expect(result.quality.verdict).toBe('questionable')
  })
})
