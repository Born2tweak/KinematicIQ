import type { JointAngles } from '../cv/types'
import type { CalibrationResult } from '../cv/drawCalibration'

/**
 * Auto-start state machine for hands-free session initiation.
 *
 * Flow: WAITING -> CALIBRATING -> READY -> ACTIVE
 *
 * - WAITING: No full body visible yet.
 * - CALIBRATING: Body visible + upright posture detected, accumulating stable frames.
 * - READY: Stable for ~1.5s. Session starts automatically on first descent.
 * - ACTIVE: First descent detected, analysis pipeline running.
 */

export type AutoStartPhase = 'WAITING' | 'CALIBRATING' | 'READY' | 'ACTIVE'

/** ~2s at 30fps = 60 frames of consecutive stability required. */
const STABLE_FRAMES_REQUIRED = 60

/** Knee angle must be above this to count as "upright standing". */
const UPRIGHT_KNEE_THRESHOLD = 150

/** Max frame-to-frame hip Y jitter (normalized coords) allowed during calibration. */
const HIP_STABILITY_THRESHOLD = 0.012

/** Minimum pose confidence to accept a frame during calibration. */
const MIN_CALIBRATION_CONFIDENCE = 0.55

/** Knee angle below this triggers session start from READY state. */
const DESCENT_TRIGGER_ANGLE = 148

/** Hip drop (normalized) that triggers session start from READY state. */
const DESCENT_TRIGGER_HIP_DROP = 0.04

export interface AutoStartState {
  phase: AutoStartPhase
  stableFrameCount: number
  lastHipY: number | null
  calibratedHipY: number | null
}

export interface AutoStartInput {
  calibration: CalibrationResult
  angles: JointAngles | null
  hipY: number | null
  poseConfidence: number
}

export interface AutoStartResult {
  phase: AutoStartPhase
  transitioned: boolean
  state: AutoStartState
}

export function createAutoStartState(): AutoStartState {
  return {
    phase: 'WAITING',
    stableFrameCount: 0,
    lastHipY: null,
    calibratedHipY: null,
  }
}

function isUprightStanding(angles: JointAngles): boolean {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (v): v is number => v !== null,
  )
  if (knees.length === 0) return false
  return knees.every((k) => k >= UPRIGHT_KNEE_THRESHOLD)
}

function isHipStable(currentHipY: number | null, lastHipY: number | null): boolean {
  if (currentHipY === null || lastHipY === null) return true
  return Math.abs(currentHipY - lastHipY) <= HIP_STABILITY_THRESHOLD
}

function isDescentStarted(
  angles: JointAngles | null,
  hipY: number | null,
  calibratedHipY: number | null,
): boolean {
  if (angles !== null) {
    const knees = [angles.leftKnee, angles.rightKnee].filter(
      (v): v is number => v !== null,
    )
    if (knees.length > 0 && Math.min(...knees) < DESCENT_TRIGGER_ANGLE) {
      return true
    }
  }

  if (hipY !== null && calibratedHipY !== null) {
    const hipDrop = hipY - calibratedHipY
    if (hipDrop > DESCENT_TRIGGER_HIP_DROP) {
      return true
    }
  }

  return false
}

export function updateAutoStart(
  state: AutoStartState,
  input: AutoStartInput,
): AutoStartResult {
  switch (state.phase) {
    case 'WAITING': {
      if (
        input.calibration.isCalibrated &&
        input.poseConfidence >= MIN_CALIBRATION_CONFIDENCE &&
        input.angles !== null &&
        isUprightStanding(input.angles) &&
        isHipStable(input.hipY, state.lastHipY)
      ) {
        return {
          phase: 'CALIBRATING',
          transitioned: true,
          state: {
            phase: 'CALIBRATING',
            stableFrameCount: 1,
            lastHipY: input.hipY,
            calibratedHipY: null,
          },
        }
      }

      return {
        phase: 'WAITING',
        transitioned: false,
        state: {
          ...state,
          lastHipY: input.hipY,
        },
      }
    }

    case 'CALIBRATING': {
      const bodyVisible = input.calibration.isCalibrated
      const confident = input.poseConfidence >= MIN_CALIBRATION_CONFIDENCE
      const upright = input.angles !== null && isUprightStanding(input.angles)
      const stable = isHipStable(input.hipY, state.lastHipY)

      if (!bodyVisible || !confident || !upright || !stable) {
        return {
          phase: 'WAITING',
          transitioned: true,
          state: {
            phase: 'WAITING',
            stableFrameCount: 0,
            lastHipY: input.hipY,
            calibratedHipY: null,
          },
        }
      }

      const nextCount = state.stableFrameCount + 1

      if (nextCount >= STABLE_FRAMES_REQUIRED) {
        return {
          phase: 'READY',
          transitioned: true,
          state: {
            phase: 'READY',
            stableFrameCount: nextCount,
            lastHipY: input.hipY,
            calibratedHipY: input.hipY,
          },
        }
      }

      return {
        phase: 'CALIBRATING',
        transitioned: false,
        state: {
          ...state,
          stableFrameCount: nextCount,
          lastHipY: input.hipY,
        },
      }
    }

    case 'READY': {
      if (!input.calibration.isCalibrated) {
        return {
          phase: 'WAITING',
          transitioned: true,
          state: {
            phase: 'WAITING',
            stableFrameCount: 0,
            lastHipY: input.hipY,
            calibratedHipY: null,
          },
        }
      }

      if (isDescentStarted(input.angles, input.hipY, state.calibratedHipY)) {
        return {
          phase: 'ACTIVE',
          transitioned: true,
          state: {
            ...state,
            phase: 'ACTIVE',
            lastHipY: input.hipY,
          },
        }
      }

      return {
        phase: 'READY',
        transitioned: false,
        state: {
          ...state,
          lastHipY: input.hipY,
        },
      }
    }

    case 'ACTIVE': {
      return {
        phase: 'ACTIVE',
        transitioned: false,
        state: {
          ...state,
          lastHipY: input.hipY,
        },
      }
    }
  }
}
