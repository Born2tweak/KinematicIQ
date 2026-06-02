import { describe, expect, it } from 'vitest'
import {
  beginSetDuringDescent,
  createRepCounterState,
  updateRepCounter,
} from './repCounter'
import { makeAngles, makeFrame } from '../test/squatFixtures'
import {
  chairBounceScript,
  deepSquatRepScript,
  partialSquatScript,
  runSquatPipeline,
} from '../test/squatSimulation'

describe('repCounter', () => {
  it('counts a deep squat after returning upright (grace completion)', () => {
    const result = runSquatPipeline(deepSquatRepScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(1)
    expect(result.reps).toHaveLength(1)
    expect(result.reps[0].minLeftKneeAngle).toBeLessThanOrEqual(105)
  })

  it('counts first rep when set activates mid-descent (READY → ACTIVE)', () => {
    const script = deepSquatRepScript()
    const result = runSquatPipeline(script, {
      activateMidDescent: true,
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(1)
    expect(result.reps).toHaveLength(1)
  })

  it('does not count a partial squat (never reaches bottom)', () => {
    const result = runSquatPipeline(partialSquatScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(0)
    expect(result.reps).toHaveLength(0)
  })

  it('rejects chair bounce (seated movement heuristic)', () => {
    const result = runSquatPipeline(chairBounceScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(0)
    const validation = result.repState.lastValidation
    expect(validation?.seatedMovementDetected).toBe(true)
    expect(validation?.rejectionReason).toMatch(/seated|Too fast/)
  })

  it('beginSetDuringDescent seeds an active rep without waiting for DESCENDING transition', () => {
    const frame = makeFrame(0, 0)
    const angles = makeAngles(120)
    let state = beginSetDuringDescent(
      createRepCounterState(),
      frame,
      angles,
      0.48,
      'DESCENDING',
    )
    expect(state.activeRep).not.toBeNull()
    expect(state.previousPhase).toBe('DESCENDING')

    const standing = updateRepCounter(state, {
      phase: 'STANDING',
      transitioned: true,
      frame: makeFrame(40, 2000),
      angles: makeAngles(170),
      hipY: 0.4,
      smoothedKneeAngle: 170,
      standingKneeBaseline: 168,
      standingHipY: 0.4,
    })
    // No bottom reached — should reject or miss
    expect(standing.repCount).toBe(0)
  })

  it('exposes blocking gate while rep is in progress', () => {
    const result = runSquatPipeline(
      [
        ...Array(6).fill({ knee: 170, hip: 0.4 }),
        ...Array(4).fill({ knee: 140, hip: 0.48 }),
        ...Array(4).fill({ knee: 100, hip: 0.55 }),
      ],
      { standingKneeBaseline: 168, calibratedHipY: 0.4 },
    )
    expect(result.repState.activeRep).not.toBeNull()
    expect(result.repState.blockingGate).toBeTruthy()
  })
})
