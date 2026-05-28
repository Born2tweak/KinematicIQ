import type { SquatState } from '../cv/types'

/** Stand upright this long after the last rep before the finish countdown. */
const STANDING_STABLE_MS = 5000
const COUNTDOWN_SECONDS = 3

const STANDING_KNEE_MIN = 155

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
): boolean {
  if (squatPhase !== 'STANDING') return false
  if (kneeAngle === null) return true
  return kneeAngle >= STANDING_KNEE_MIN
}

export function updateAutoFinish(
  state: AutoFinishState,
  input: AutoFinishInput,
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

  if (!isStableStanding(input.squatPhase, input.kneeAngle)) {
    return reset()
  }

  const stableSince = state.stableStandingSince ?? input.timestamp
  const stableDuration = input.timestamp - stableSince

  if (stableDuration < STANDING_STABLE_MS) {
    return {
      state: { stableStandingSince: stableSince, countdownStart: null },
      pending: true,
      countdown: null,
      shouldFinish: false,
    }
  }

  const countdownStart = state.countdownStart ?? input.timestamp
  const elapsedSec = Math.floor((input.timestamp - countdownStart) / 1000)
  const secondsLeft = COUNTDOWN_SECONDS - elapsedSec

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
