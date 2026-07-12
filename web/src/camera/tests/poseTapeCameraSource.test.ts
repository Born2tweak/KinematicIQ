import { describe, expect, it } from 'vitest'
import { getJointAngles } from '../../analysis/angles'
import { checkCalibration } from '../../cv/drawCalibration'
import { assessCaptureReadiness } from '../../cv/captureReadiness'
import { createPoseTapeCameraSource } from '../sources/poseTapeCameraSource'
import {
  CLEAN_SQUAT_LOOP_TO_FRAME,
  CLEAN_SQUAT_PREROLL_FRAMES,
  buildCleanSquatPoseTape,
} from '../fixtures/cleanSquatPoseTape'
import { buildMissingFeetPoseTape } from '../fixtures/missingFeetPoseTape'
import { simulateCameraLoop } from './cameraLoopSim'

describe('poseTapeCameraSource frame stepping', () => {
  it('anchors the tape to the first requested timestamp and rebases frames', () => {
    const tape = buildCleanSquatPoseTape()
    const source = createPoseTapeCameraSource(tape, 'clean-squat')

    const first = source.getFrame(5_000, 7)
    expect(first).not.toBeNull()
    expect(first!.timestamp).toBe(5_000)
    expect(first!.frameIndex).toBe(7)
    expect(first!.landmarks).toEqual(tape.frames[0].landmarks)

    // 100ms later at 30fps → tape frame 3.
    const later = source.getFrame(5_100, 8)
    expect(later!.landmarks).toEqual(tape.frames[3].landmarks)
  })

  it('is deterministic: the same timestamps yield the same frames', () => {
    const tape = buildCleanSquatPoseTape()
    const a = createPoseTapeCameraSource(tape, 'clean-squat')
    const b = createPoseTapeCameraSource(tape, 'clean-squat')
    for (let t = 0; t <= 2_000; t += 33) {
      expect(a.getFrame(1_000 + t, 0)!.landmarks).toEqual(
        b.getFrame(1_000 + t, 0)!.landmarks,
      )
    }
  })

  it('holds the last frame when looping is disabled', () => {
    const tape = buildMissingFeetPoseTape()
    const source = createPoseTapeCameraSource(tape, 'missing-feet', {
      loop: false,
    })
    source.getFrame(0, 0)
    const wayPast = source.getFrame(1_000_000, 1)
    expect(wayPast!.landmarks).toEqual(
      tape.frames[tape.frames.length - 1].landmarks,
    )
  })

  it('loops back to loopToFrame after the tape ends', () => {
    const tape = buildCleanSquatPoseTape()
    const source = createPoseTapeCameraSource(tape, 'clean-squat', {
      loop: true,
      loopToFrame: CLEAN_SQUAT_LOOP_TO_FRAME,
    })
    const frameMs = 1000 / 30
    source.getFrame(0, 0)

    // First frame past the end must be the loop target, not the preroll.
    const pastEnd = source.getFrame(tape.frames.length * frameMs + 1, 1)
    expect(pastEnd!.landmarks).toEqual(
      tape.frames[CLEAN_SQUAT_LOOP_TO_FRAME].landmarks,
    )
  })

  it('does not let a throttled wall clock skip a guarded calibration preroll', () => {
    const tape = buildCleanSquatPoseTape()
    const source = createPoseTapeCameraSource(tape, 'clean-squat', {
      loop: true,
      loopToFrame: CLEAN_SQUAT_LOOP_TO_FRAME,
      minimumPrerollTicks: 75,
    })

    for (let tick = 0; tick < 75; tick++) {
      const frame = source.getFrame(tick * 1_000, tick)
      expect(frame!.landmarks).toEqual(
        tape.frames[Math.floor((tick * CLEAN_SQUAT_LOOP_TO_FRAME) / 75)].landmarks,
      )
    }
    expect(source.getFrame(75_000, 75)!.landmarks).toEqual(
      tape.frames[CLEAN_SQUAT_LOOP_TO_FRAME].landmarks,
    )
  })

  it('stop() resets the time anchor so a fresh attach starts from frame 0', () => {
    const tape = buildCleanSquatPoseTape()
    const source = createPoseTapeCameraSource(tape, 'clean-squat')
    source.getFrame(1_000, 0)
    source.stop()
    const afterRestart = source.getFrame(50_000, 0)
    expect(afterRestart!.landmarks).toEqual(tape.frames[0].landmarks)
  })

  it('returns null for an empty tape', () => {
    const source = createPoseTapeCameraSource(
      { meta: { fps: 30 }, frames: [] },
      'empty',
    )
    expect(source.getFrame(0, 0)).toBeNull()
  })
})

describe('clean-squat fixture geometry', () => {
  const tape = buildCleanSquatPoseTape()

  it('passes calibration and reads as upright standing in the preroll', () => {
    const standing = tape.frames[0]
    expect(checkCalibration(standing).isCalibrated).toBe(true)

    const angles = getJointAngles(standing)
    expect(angles.leftKnee).not.toBeNull()
    expect(angles.leftKnee!).toBeGreaterThanOrEqual(165)
    expect(angles.rightKnee!).toBeGreaterThanOrEqual(165)
  })

  it('is capture-ready during the preroll (no setup guidance blockers)', () => {
    const readiness = assessCaptureReadiness(tape.frames[0])
    expect(readiness.state).toBe('ready')
  })

  it('reaches a deep bilateral knee bend at the bottom of each rep', () => {
    // Deepest frame of rep 1: preroll + descent + mid-bottom-hold.
    const bottomIndex = CLEAN_SQUAT_PREROLL_FRAMES + 21 + 9
    const angles = getJointAngles(tape.frames[bottomIndex])
    expect(angles.leftKnee!).toBeLessThanOrEqual(105)
    expect(angles.rightKnee!).toBeLessThanOrEqual(105)
  })
})

describe('camera loop end-to-end against fixtures (no webcam, no MediaPipe)', () => {
  it('clean-squat auto-starts and counts at least two reps', () => {
    const source = createPoseTapeCameraSource(
      buildCleanSquatPoseTape(),
      'clean-squat',
      { loop: true, loopToFrame: CLEAN_SQUAT_LOOP_TO_FRAME },
    )

    const result = simulateCameraLoop(source, 16_000)

    expect(result.autoStartPhase).toBe('ACTIVE')
    expect(result.repCount).toBeGreaterThanOrEqual(2)
    expect(result.autoFinishFired).toBe(false)
  })

  it('clean-squat is deterministic across runs', () => {
    const run = () =>
      simulateCameraLoop(
        createPoseTapeCameraSource(buildCleanSquatPoseTape(), 'clean-squat', {
          loop: true,
          loopToFrame: CLEAN_SQUAT_LOOP_TO_FRAME,
        }),
        12_000,
      )
    const first = run()
    const second = run()
    expect(first.repCount).toBe(second.repCount)
    expect(first.autoStartPhase).toBe(second.autoStartPhase)
  })

  it('missing-feet stays in setup with feet guidance and zero reps', () => {
    const source = createPoseTapeCameraSource(
      buildMissingFeetPoseTape(),
      'missing-feet',
      { loop: true },
    )

    const result = simulateCameraLoop(source, 8_000)

    expect(result.autoStartPhase).toBe('WAITING')
    expect(result.repCount).toBe(0)
    expect(result.readinessStates).toContain('notReady')
    expect(
      result.setupInstructions.some((instruction) =>
        /feet are out of frame/i.test(instruction),
      ),
    ).toBe(true)
  })

  it('missing-feet fixture fails calibration on ankles/feet', () => {
    const frame = buildMissingFeetPoseTape().frames[0]
    const calibration = checkCalibration(frame)
    expect(calibration.isCalibrated).toBe(false)
    expect(calibration.missingJoints).toContain('Ankles/Feet')
  })
})
