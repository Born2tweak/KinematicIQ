import { describe, expect, it } from 'vitest'
import {
  coachRejectionMessage,
  latestRejectionSummary,
  nextRepFeedbackHud,
} from './repRejectionUi'
import type { RepRejection } from '../analysis/repCounter'

describe('coachRejectionMessage', () => {
  it('maps gate reasons to coach-friendly copy', () => {
    expect(coachRejectionMessage('Bottom not held long enough')).toBe(
      'Rep not counted — hold the bottom position a little longer',
    )
    expect(coachRejectionMessage('Too fast (<500ms)')).toBe(
      'Rep not counted — that rep was too quick to count',
    )
    expect(coachRejectionMessage('Pose confidence dropped')).toBe(
      'Rep not counted — tracking lost; check framing and lighting',
    )
    expect(coachRejectionMessage('Knee lift detected')).toBe(
      'Rep not counted — keep both feet planted through the rep',
    )
  })

  it('falls back for unknown reasons without exposing gate ids', () => {
    expect(coachRejectionMessage('Custom gate failure')).toBe(
      'Rep not counted — custom gate failure',
    )
  })
})

describe('nextRepFeedbackHud', () => {
  const base = {
    phase: 'ACTIVE',
    isAnalyst: false,
    lastMissedReason: null,
    rejectionCount: 0,
    completedRepThisFrame: false,
    previousRejectionCount: 0,
    previousMissedReason: null,
  }

  it('shows feedback when a new rejection arrives in normal mode', () => {
    const result = nextRepFeedbackHud({
      ...base,
      lastMissedReason: 'Bottom not held long enough',
      rejectionCount: 1,
      previousRejectionCount: 0,
    })
    expect(result.message).toBe(
      'Rep not counted — hold the bottom position a little longer',
    )
  })

  it('hides feedback in analyst mode', () => {
    const result = nextRepFeedbackHud({
      ...base,
      isAnalyst: true,
      lastMissedReason: 'Bottom not held long enough',
      rejectionCount: 1,
      previousRejectionCount: 0,
    })
    expect(result.message).toBeNull()
  })

  it('clears feedback after a counted rep completes', () => {
    const result = nextRepFeedbackHud({
      ...base,
      lastMissedReason: 'Bottom not held long enough',
      rejectionCount: 1,
      previousRejectionCount: 1,
      previousMissedReason: 'Bottom not held long enough',
      completedRepThisFrame: true,
    })
    expect(result.message).toBeNull()
  })

  it('does not repeat the same rejection message', () => {
    const result = nextRepFeedbackHud({
      ...base,
      lastMissedReason: 'Knee lift detected',
      rejectionCount: 2,
      previousRejectionCount: 2,
      previousMissedReason: 'Knee lift detected',
    })
    expect(result.message).toBeNull()
  })
})

describe('latestRejectionSummary', () => {
  it('returns coach copy for the most recent rejection', () => {
    const rejections: RepRejection[] = [
      {
        gate: 'bottom',
        reason: 'Bottom not held long enough',
        startFrameIndex: 0,
        endFrameIndex: 10,
        startTimestamp: 0,
        endTimestamp: 500,
        durationMs: 500,
        values: {
          minLeftKneeAngle: 90,
          minRightKneeAngle: 92,
          maxHipDrop: 0.2,
          bottomHoldMs: 1500,
          avgConfidence: 0.9,
          reachedBottom: false,
        },
      },
    ]
    expect(latestRejectionSummary(rejections)).toBe(
      'Rep not counted — hold the bottom position a little longer',
    )
  })
})
