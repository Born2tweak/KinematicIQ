import { describe, expect, it } from 'vitest'
import {
  createPhaseDetectorState,
  standingKneeThreshold,
  updatePhaseDetector,
} from './phaseDetector'

describe('phaseDetector', () => {
  it('starts in STANDING', () => {
    const state = createPhaseDetectorState()
    expect(state.phase).toBe('STANDING')
  })

  it('uses calibrated lockout threshold below upright baseline', () => {
    const state = {
      ...createPhaseDetectorState(),
      standingKneeAngle: 168,
    }
    expect(standingKneeThreshold(state)).toBe(156)
  })

  it('debounces transition into DESCENDING', () => {
    let state = createPhaseDetectorState()
    let phase = 'STANDING'
    const standingHip = 0.4

    for (let i = 0; i < 2; i++) {
      const result = updatePhaseDetector(state, {
        kneeAngle: 140,
        hipY: standingHip + 0.07,
        timestamp: i * 33,
      })
      state = result.state
      phase = result.phase
    }
    expect(phase).toBe('STANDING')

    const third = updatePhaseDetector(state, {
      kneeAngle: 140,
      hipY: standingHip + 0.07,
      timestamp: 99,
    })
    expect(third.phase).toBe('DESCENDING')
    expect(third.transitioned).toBe(true)
  })

  it('reaches BOTTOM on deep knee bend and hip drop', () => {
    let state = createPhaseDetectorState()
    let t = 0
    const script = [
      ...Array(5).fill({ knee: 170, hip: 0.4 }),
      ...Array(4).fill({ knee: 130, hip: 0.48 }),
      ...Array(4).fill({ knee: 95, hip: 0.56 }),
    ]

    let phase = 'STANDING'
    for (const frame of script) {
      const result = updatePhaseDetector(state, {
        kneeAngle: frame.knee,
        hipY: frame.hip,
        timestamp: t,
      })
      state = result.state
      phase = result.phase
      t += 33
    }
    expect(phase).toBe('BOTTOM')
  })
})
