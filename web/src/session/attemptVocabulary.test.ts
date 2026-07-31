import { describe, expect, it } from 'vitest'

import { attemptNoun } from './attemptVocabulary'
import { reviewSetQuality } from './qualityReview'
import { getProtocol } from '../protocols/registry'
import type { SetQualityAssessment } from './setQualityGate'

const questionable: SetQualityAssessment = {
  verdict: 'questionable',
  reasons: [{ id: 'artifact-heavy-set', detail: 'Something was off.' }],
  captureFixes: ['Record from the side.'],
  untrustedReps: [],
  untrustedRepNumbers: [],
  trustedRepCount: 2,
  phantomCandidateCount: 0,
}

describe('attempt vocabulary', () => {
  it('calls a cyclic unit a rep and a transition unit a trial', () => {
    expect(attemptNoun('cyclic')).toEqual({ singular: 'rep', plural: 'reps' })
    expect(attemptNoun('transition')).toEqual({ singular: 'trial', plural: 'trials' })
  })

  it('falls back to the vague-but-true noun rather than to "reps"', () => {
    expect(attemptNoun(undefined).plural).toBe('attempts')
    expect(attemptNoun('ballistic').plural).toBe('attempts')
    expect(attemptNoun('gait').plural).toBe('attempts')
  })
})

describe('the retake banner speaks the movement’s language', () => {
  it('says reps for squat', () => {
    const review = reviewSetQuality(questionable, getProtocol('squat').definition.kind)
    expect(review.headline).toContain('trusted reps')
  })

  it('says trials for forward lunge, not reps', () => {
    const review = reviewSetQuality(
      questionable,
      getProtocol('forwardLungeStrideReturn').definition.kind,
    )
    expect(review.headline).toContain('trusted trials')
    expect(review.headline).not.toMatch(/\breps?\b/)
  })

  it('says attempts when the caller names no kind', () => {
    expect(reviewSetQuality(questionable).headline).toContain('trusted attempts')
  })
})
