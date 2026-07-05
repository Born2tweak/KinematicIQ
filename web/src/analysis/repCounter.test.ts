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

  it('records a gate diagnostic for every rejected rep candidate', () => {
    const result = runSquatPipeline(partialSquatScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(0)
    const rejections = result.repState.rejections
    expect(rejections.length).toBeGreaterThan(0)
    const first = rejections[0]
    expect(first.gate).toBe('bottom')
    expect(first.reason).toMatch(/bottom not held/i)
    expect(first.durationMs).toBeGreaterThan(0)
    expect(first.endFrameIndex).toBeGreaterThanOrEqual(first.startFrameIndex)
    expect(first.values.reachedBottom).toBe(false)
    expect(first.values.avgConfidence).toBeGreaterThan(0)
  })

  it('does not record diagnostics for counted reps', () => {
    const result = runSquatPipeline(deepSquatRepScript(), {
      standingKneeBaseline: 168,
      calibratedHipY: 0.4,
    })
    expect(result.repCount).toBe(1)
    expect(result.repState.rejections).toHaveLength(0)
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

  it('marks a zero-descent candidate rejection as phantom', () => {
    // Phase jitter while standing: DESCENDING fires but the hips never drop.
    let state = beginSetDuringDescent(
      createRepCounterState(),
      makeFrame(0, 0),
      makeAngles(150),
      0.4,
      'DESCENDING',
    )
    const result = updateRepCounter(state, {
      phase: 'STANDING',
      transitioned: true,
      frame: makeFrame(40, 2000),
      angles: makeAngles(170),
      hipY: 0.4,
      smoothedKneeAngle: 170,
      standingKneeBaseline: 168,
      standingHipY: 0.4,
    })
    expect(result.repCount).toBe(0)
    expect(result.state.rejections).toHaveLength(1)
    expect(result.state.rejections[0].phantom).toBe(true)
  })

  it('keeps a real shallow attempt (hips descended) as a non-phantom rejection', () => {
    let state = beginSetDuringDescent(
      createRepCounterState(),
      makeFrame(0, 0),
      makeAngles(150),
      0.4,
      'DESCENDING',
    )
    // Hips actually drop mid-attempt (0.4 → 0.46 = 0.06 > minHipDescent).
    state = updateRepCounter(state, {
      phase: 'DESCENDING',
      transitioned: false,
      frame: makeFrame(20, 1000),
      angles: makeAngles(130),
      hipY: 0.46,
      smoothedKneeAngle: 130,
      standingKneeBaseline: 168,
      standingHipY: 0.4,
    }).state
    const result = updateRepCounter(state, {
      phase: 'STANDING',
      transitioned: true,
      frame: makeFrame(40, 2000),
      angles: makeAngles(170),
      hipY: 0.4,
      smoothedKneeAngle: 170,
      standingKneeBaseline: 168,
      standingHipY: 0.4,
    })
    expect(result.repCount).toBe(0)
    expect(result.state.rejections).toHaveLength(1)
    expect(result.state.rejections[0].phantom).toBe(false)
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
