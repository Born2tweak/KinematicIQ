import { describe, expect, it } from 'vitest'
import { buildDebugOverlayLines, type DebugOverlayData } from './drawDebugOverlay'
import type { SquatState } from './types'

function minimalDebugData(
  overrides: Partial<DebugOverlayData> = {},
): DebugOverlayData {
  return {
    autoStartPhase: 'ACTIVE',
    squatPhase: 'STANDING' as SquatState,
    emaKneeAngle: 170,
    leftKneeAngle: 170,
    rightKneeAngle: 170,
    hipY: 0.5,
    hipDrop: 0.02,
    repCount: 3,
    repCountDisplayed: 3,
    poseConfidence: 0.85,
    lastValidation: null,
    candidateRepActive: false,
    reachedBottom: false,
    awaitingStandingCompletion: false,
    standingFrames: 0,
    standingKneeBaseline: 168,
    lockoutKneeThreshold: 155,
    blockingGate: null,
    lastMissedRepReason: null,
    completedRepThisFrame: false,
    previousPhase: 'STANDING' as SquatState,
    seatedLive: false,
    maxHipDropLive: 0.1,
    rejectionCount: 0,
    ...overrides,
  }
}

describe('buildDebugOverlayLines', () => {
  it('shows matching rep counts when display ref is in sync', () => {
    const lines = buildDebugOverlayLines(minimalDebugData({ repCount: 18, repCountDisplayed: 18 }))
    const stateLine = lines.find((line) => line.label === 'REPS(state)')
    const dispLine = lines.find((line) => line.label === 'REPS(disp)')
    expect(stateLine?.value).toBe('18')
    expect(dispLine?.value).toBe('18')
    expect(dispLine?.color).toBe('#f9a8d4')
  })

  it('highlights desynced display rep count in red', () => {
    const lines = buildDebugOverlayLines(
      minimalDebugData({ repCount: 18, repCountDisplayed: 0 }),
    )
    const dispLine = lines.find((line) => line.label === 'REPS(disp)')
    expect(dispLine?.color).toBe('#ef4444')
  })
})
