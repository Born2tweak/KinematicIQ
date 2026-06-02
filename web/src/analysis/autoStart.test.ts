import { describe, expect, it } from 'vitest'
import {
  STABLE_FRAMES_REQUIRED,
  createAutoStartState,
  updateAutoStart,
} from './autoStart'
import { makeAngles } from '../test/squatFixtures'

function calibratedInput(overrides: {
  angles?: ReturnType<typeof makeAngles> | null
  hipY?: number | null
  poseConfidence?: number
} = {}) {
  return {
    calibration: {
      isCalibrated: true,
      missingJoints: [] as string[],
    },
    angles: overrides.angles ?? makeAngles(165),
    hipY: overrides.hipY ?? 0.4,
    poseConfidence: overrides.poseConfidence ?? 0.8,
  }
}

describe('autoStart', () => {
  it('requires stable upright frames before READY', () => {
    let state = createAutoStartState()
    let phase = 'WAITING'

    for (let i = 0; i < STABLE_FRAMES_REQUIRED - 1; i++) {
      const result = updateAutoStart(state, calibratedInput())
      state = result.state
      phase = result.phase
    }
    expect(phase).not.toBe('READY')

    const ready = updateAutoStart(state, calibratedInput())
    expect(ready.phase).toBe('READY')
  })

  it('activates on descent from READY with activatedByDescent', () => {
    let state = createAutoStartState()
    for (let i = 0; i <= STABLE_FRAMES_REQUIRED; i++) {
      const result = updateAutoStart(state, calibratedInput())
      state = result.state
    }
    expect(state.phase).toBe('READY')

    const active = updateAutoStart(
      state,
      calibratedInput({ angles: makeAngles(130), hipY: 0.48 }),
    )
    expect(active.phase).toBe('ACTIVE')
    expect(active.transitioned).toBe(true)
    expect(active.activatedByDescent).toBe(true)
  })

  it('stays WAITING when body is not calibrated', () => {
    const result = updateAutoStart(createAutoStartState(), {
      calibration: {
        isCalibrated: false,
        missingJoints: ['left_knee'],
      },
      angles: makeAngles(165),
      hipY: 0.4,
      poseConfidence: 0.9,
    })
    expect(result.phase).toBe('WAITING')
  })
})
