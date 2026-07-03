import type { SquatState } from '../cv/types'

/** Movement-specific auto-finish tuning. */
export interface AutoFinishConfig {
  /** Stand upright this long after the last rep before the finish countdown. */
  standingStableMs: number
  countdownSeconds: number
  /** Knee angle at/above this counts as standing for the finish check. */
  standingKneeMin: number
}

/** Bodyweight-squat auto-finish tuning. */
export const SQUAT_AUTO_FINISH_CONFIG: AutoFinishConfig = {
  standingStableMs: 5000,
  countdownSeconds: 3,
  standingKneeMin: 155,
}

export interface AutoFinishState {
  stableStandingSince: number | null
  countdownStart: number | null
}

export interface AutoFinishInput {
  timestamp: number
  squatPhase: SquatState
  kneeAngle: number | null
  completedRepCount: number
  isActive: boolean
}

export interface AutoFinishResult {
  state: AutoFinishState
  /** Standing still after ≥1 rep, before or during countdown. */
  pending: boolean
  /** 3, 2, or 1 while countdown is active; null during arming only. */
  countdown: number | null
  shouldFinish: boolean
}

export function createAutoFinishState(): AutoFinishState {
  return {
    stableStandingSince: null,
    countdownStart: null,
  }
}

function isStableStanding(
  squatPhase: SquatState,
  kneeAngle: number | null,
  cfg: AutoFinishConfig,
): boolean {
  if (squatPhase !== 'STANDING') return false
  if (kneeAngle === null) return true
  return kneeAngle >= cfg.standingKneeMin
}

export function updateAutoFinish(
  state: AutoFinishState,
  input: AutoFinishInput,
  cfg: AutoFinishConfig = SQUAT_AUTO_FINISH_CONFIG,
): AutoFinishResult {
  const reset = (): AutoFinishResult => ({
    state: createAutoFinishState(),
    pending: false,
    countdown: null,
    shouldFinish: false,
  })

  if (!input.isActive || input.completedRepCount < 1) {
    return reset()
  }

  if (!isStableStanding(input.squatPhase, input.kneeAngle, cfg)) {
    return reset()
  }

  const stableSince = state.stableStandingSince ?? input.timestamp
  const stableDuration = input.timestamp - stableSince

  if (stableDuration < cfg.standingStableMs) {
    return {
      state: { stableStandingSince: stableSince, countdownStart: null },
      pending: true,
      countdown: null,
      shouldFinish: false,
    }
  }

  const countdownStart = state.countdownStart ?? input.timestamp
  const elapsedSec = Math.floor((input.timestamp - countdownStart) / 1000)
  const secondsLeft = cfg.countdownSeconds - elapsedSec

  if (secondsLeft <= 0) {
    return {
      state: createAutoFinishState(),
      pending: false,
      countdown: null,
      shouldFinish: true,
    }
  }

  return {
    state: {
      stableStandingSince: stableSince,
      countdownStart,
    },
    pending: true,
    countdown: secondsLeft,
    shouldFinish: false,
  }
}
