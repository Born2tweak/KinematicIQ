import { describe, expect, it } from 'vitest'
import { createAutoFinishState, updateAutoFinish } from './autoFinish'

describe('autoFinish', () => {
  it('does not arm before at least one rep', () => {
    const result = updateAutoFinish(createAutoFinishState(), {
      timestamp: 10_000,
      squatPhase: 'STANDING',
      kneeAngle: 170,
      completedRepCount: 0,
      isActive: true,
    })
    expect(result.pending).toBe(false)
    expect(result.shouldFinish).toBe(false)
  })

  it('arms after stable standing for 5s with one rep', () => {
    const state = createAutoFinishState()
    const t0 = 1000
    const armed = updateAutoFinish(state, {
      timestamp: t0 + 5000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    })
    expect(armed.pending).toBe(true)
    expect(armed.countdown).toBeNull()
    expect(armed.shouldFinish).toBe(false)
  })

  it('counts down and finishes after 3s', () => {
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

    const at3 = updateAutoFinish(state, {
      timestamp: 8000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    })
    expect(at3.shouldFinish).toBe(true)
  })

  it('cancels countdown when user squats again', () => {
    let state = createAutoFinishState()
    const stableAt = 0
    state = updateAutoFinish(state, {
      timestamp: stableAt + 5000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    }).state
    state = updateAutoFinish(state, {
      timestamp: stableAt + 6000,
      squatPhase: 'STANDING',
      kneeAngle: 165,
      completedRepCount: 1,
      isActive: true,
    }).state

    const cancelled = updateAutoFinish(state, {
      timestamp: stableAt + 6500,
      squatPhase: 'DESCENDING',
      kneeAngle: 130,
      completedRepCount: 1,
      isActive: true,
    })
    expect(cancelled.pending).toBe(false)
    expect(cancelled.countdown).toBeNull()
    expect(cancelled.shouldFinish).toBe(false)
  })
})
