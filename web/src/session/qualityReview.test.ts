import { describe, expect, it } from 'vitest'
import type { SetQualityAssessment } from './setQualityGate'
import { reviewSetQuality } from './qualityReview'
import {
  FORBIDDEN_PHRASES,
  NEGATION_CONTEXT_PATTERNS,
} from '../test/claimsForbiddenTerms'

function assessment(
  overrides: Partial<SetQualityAssessment>,
): SetQualityAssessment {
  return {
    verdict: 'valid',
    reasons: [],
    captureFixes: [],
    untrustedReps: [],
    untrustedRepNumbers: [],
    trustedRepCount: 5,
    phantomCandidateCount: 0,
    ...overrides,
  }
}

describe('qualityReview (M51)', () => {
  it('sends a valid set straight to results with no retake nag', () => {
    const review = reviewSetQuality(assessment({}))
    expect(review.decision).toBe('show-results')
    expect(review.retakeRecommended).toBe(false)
    expect(review.retakeGuidance).toEqual([])
    expect(review.allowInspection).toBe(true)
  })

  it('recommends a retake for a questionable set but keeps observations open', () => {
    const review = reviewSetQuality(
      assessment({
        verdict: 'questionable',
        reasons: [{ id: 'small-sample', detail: 'Only 2 reps.' }],
        captureFixes: ['Record at least 3 reps in one continuous set.'],
        trustedRepCount: 2,
      }),
    )
    expect(review.decision).toBe('recommend-retake')
    expect(review.retakeRecommended).toBe(true)
    expect(review.retakeGuidance).toEqual([
      'Record at least 3 reps in one continuous set.',
    ])
    // "Inspect anyway" — observation view never blocked.
    expect(review.allowInspection).toBe(true)
  })

  it('blocks the movement report for an invalid set and carries the fixes', () => {
    const review = reviewSetQuality(
      assessment({
        verdict: 'invalid',
        reasons: [{ id: 'no-reps', detail: 'No full reps counted.' }],
        captureFixes: ['Get your whole body in frame.'],
        trustedRepCount: 0,
      }),
    )
    expect(review.decision).toBe('block-report')
    expect(review.retakeRecommended).toBe(true)
    expect(review.retakeGuidance).toEqual(['Get your whole body in frame.'])
    // Full abstain never means hiding the evidence — audit stays reachable.
    expect(review.allowInspection).toBe(true)
  })

  it('headlines carry no forbidden claim language (claims policy)', () => {
    // Check against the project's real forbidden-terms source of truth, with
    // the same same-line negation allowance the copy audit uses — so
    // engineering words like "diagnostics" are not mistaken for "diagnosis".
    for (const verdict of ['valid', 'questionable', 'invalid'] as const) {
      const review = reviewSetQuality(assessment({ verdict }))
      const line = review.headline
      const lower = line.toLowerCase()
      for (const { phrase } of FORBIDDEN_PHRASES) {
        if (!lower.includes(phrase)) continue
        const negated = NEGATION_CONTEXT_PATTERNS.some((p) => p.test(line))
        expect(negated, `headline claims "${phrase}": ${line}`).toBe(true)
      }
    }
  })
})
