import { describe, expect, it } from 'vitest'
import { createAutoFinishState, updateAutoFinish } from './autoFinish'
import {
  chairBounceScript,
  deepSquatRepScript,
  partialSquatScript,
  runSquatPipeline,
} from '../test/squatSimulation'

/**
 * Milestone 14A — regression cases from live squat QA (no camera / MediaPipe).
 */
describe('squat regressions (M14A)', () => {
  it('first rep after READY counts when activation happens mid-descent', () => {
    const { repCount } = runSquatPipeline(deepSquatRepScript(), {
      activateMidDescent: true,
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(repCount).toBe(1)
  })

  it('deep squat counts after returning to standing', () => {
    const { repCount } = runSquatPipeline(deepSquatRepScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(repCount).toBe(1)
  })

  it('partial squat does not count', () => {
    const { repCount } = runSquatPipeline(partialSquatScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(repCount).toBe(0)
  })

  it('chair bounce does not count', () => {
    const { repCount, repState } = runSquatPipeline(chairBounceScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(repCount).toBe(0)
    expect(repState.lastValidation?.seatedMovementDetected).toBe(true)
  })

  it('standing still after a completed rep arms auto-finish', () => {
    const armed = updateAutoFinish(createAutoFinishState(), {
      timestamp: 5000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    })
    expect(armed.pending).toBe(true)
    expect(armed.shouldFinish).toBe(false)
  })

  it('squatting again during auto-finish countdown cancels finish', () => {
    let state = createAutoFinishState()
    state = updateAutoFinish(state, {
      timestamp: 0,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    }).state
    state = updateAutoFinish(state, {
      timestamp: 5000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    }).state
    state = updateAutoFinish(state, {
      timestamp: 6000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    }).state

    const cancelled = updateAutoFinish(state, {
      timestamp: 6500,
      squatPhase: 'DESCENDING',
      kneeAngle: 130,
      completedRepCount: 1,
      isActive: true,
    })
    expect(cancelled.shouldFinish).toBe(false)
    expect(cancelled.countdown).toBeNull()
  })
})
