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

/** Movement-specific auto-start tuning. */
export interface AutoStartConfig {
  /** Consecutive stable frames before READY (~2s at 30fps = 60). */
  stableFramesRequired: number
  /** Knee angle must be above this to count as "upright standing". */
  uprightKneeThreshold: number
  /** Max frame-to-frame hip Y jitter (normalized) allowed during calibration. */
  hipStabilityThreshold: number
  /** Minimum pose confidence to accept a frame during calibration. */
  minCalibrationConfidence: number
  /** Knee angle below this triggers session start from READY. */
  descentTriggerAngle: number
  /** Hip drop (normalized) that triggers session start from READY. */
  descentTriggerHipDrop: number
}

/** Bodyweight-squat auto-start tuning. */
export const SQUAT_AUTO_START_CONFIG: AutoStartConfig = {
  stableFramesRequired: 60,
  uprightKneeThreshold: 150,
  hipStabilityThreshold: 0.012,
  minCalibrationConfidence: 0.55,
  descentTriggerAngle: 148,
  descentTriggerHipDrop: 0.04,
}

/** Back-compat alias for UI progress display. */
export const STABLE_FRAMES_REQUIRED = SQUAT_AUTO_START_CONFIG.stableFramesRequired

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
  /** True when READY → ACTIVE because descent was already underway. */
  activatedByDescent: boolean
}

export function createAutoStartState(): AutoStartState {
  return {
    phase: 'WAITING',
    stableFrameCount: 0,
    lastHipY: null,
    calibratedHipY: null,
  }
}

function isUprightStanding(angles: JointAngles, cfg: AutoStartConfig): boolean {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (v): v is number => v !== null,
  )
  if (knees.length === 0) return false
  return knees.every((k) => k >= cfg.uprightKneeThreshold)
}

function isHipStable(
  currentHipY: number | null,
  lastHipY: number | null,
  cfg: AutoStartConfig,
): boolean {
  if (currentHipY === null || lastHipY === null) return true
  return Math.abs(currentHipY - lastHipY) <= cfg.hipStabilityThreshold
}

function isDescentStarted(
  angles: JointAngles | null,
  hipY: number | null,
  calibratedHipY: number | null,
  cfg: AutoStartConfig,
): boolean {
  if (angles !== null) {
    const knees = [angles.leftKnee, angles.rightKnee].filter(
      (v): v is number => v !== null,
    )
    if (knees.length > 0 && Math.min(...knees) < cfg.descentTriggerAngle) {
      return true
    }
  }

  if (hipY !== null && calibratedHipY !== null) {
    const hipDrop = hipY - calibratedHipY
    if (hipDrop > cfg.descentTriggerHipDrop) {
      return true
    }
  }

  return false
}

export function updateAutoStart(
  state: AutoStartState,
  input: AutoStartInput,
  cfg: AutoStartConfig = SQUAT_AUTO_START_CONFIG,
): AutoStartResult {
  switch (state.phase) {
    case 'WAITING': {
      if (
        input.calibration.isCalibrated &&
        input.poseConfidence >= cfg.minCalibrationConfidence &&
        input.angles !== null &&
        isUprightStanding(input.angles, cfg) &&
        isHipStable(input.hipY, state.lastHipY, cfg)
      ) {
        return {
          phase: 'CALIBRATING',
          transitioned: true,
          activatedByDescent: false,
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
        activatedByDescent: false,
        state: {
          ...state,
          lastHipY: input.hipY,
        },
      }
    }

    case 'CALIBRATING': {
      const bodyVisible = input.calibration.isCalibrated
      const confident = input.poseConfidence >= cfg.minCalibrationConfidence
      const upright = input.angles !== null && isUprightStanding(input.angles, cfg)
      const stable = isHipStable(input.hipY, state.lastHipY, cfg)

      if (!bodyVisible || !confident || !upright || !stable) {
        return {
          phase: 'WAITING',
          transitioned: true,
          activatedByDescent: false,
          state: {
            phase: 'WAITING',
            stableFrameCount: 0,
            lastHipY: input.hipY,
            calibratedHipY: null,
          },
        }
      }

      const nextCount = state.stableFrameCount + 1

      if (nextCount >= cfg.stableFramesRequired) {
        return {
          phase: 'READY',
          transitioned: true,
          activatedByDescent: false,
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
        activatedByDescent: false,
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
          activatedByDescent: false,
          state: {
            phase: 'WAITING',
            stableFrameCount: 0,
            lastHipY: input.hipY,
            calibratedHipY: null,
          },
        }
      }

      if (isDescentStarted(input.angles, input.hipY, state.calibratedHipY, cfg)) {
        return {
          phase: 'ACTIVE',
          transitioned: true,
          activatedByDescent: true,
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
        activatedByDescent: false,
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
        activatedByDescent: false,
        state: {
          ...state,
          lastHipY: input.hipY,
        },
      }
    }
  }
}
