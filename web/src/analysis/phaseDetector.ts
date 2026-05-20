import type { SquatState } from '../cv/types'

const STANDING_KNEE_ANGLE = 155
const DESCENDING_KNEE_ANGLE = 145
const BOTTOM_KNEE_ANGLE = 135
const ASCENDING_KNEE_ANGLE = 148
const DESCENT_START_DELTA = 0.06
const BOTTOM_DELTA = 0.14
const ASCENT_DELTA = 0.04
const RETURN_TO_STANDING_DELTA = 0.05
const REQUIRED_CONSECUTIVE_FRAMES = 3

export interface PhaseDetectorInput {
  kneeAngle: number | null
  hipY: number | null
}

export interface PhaseDetectorState {
  phase: SquatState
  candidatePhase: SquatState | null
  candidateFrameCount: number
  standingHipY: number | null
  deepestHipY: number | null
}

export interface PhaseDetectorResult {
  phase: SquatState
  transitioned: boolean
  state: PhaseDetectorState
}

/**
 * Returns the initial squat phase detector state.
 */
export function createPhaseDetectorState(): PhaseDetectorState {
  return {
    phase: 'STANDING',
    candidatePhase: null,
    candidateFrameCount: 0,
    standingHipY: null,
    deepestHipY: null,
  }
}

const getTargetPhase = (
  phase: SquatState,
  kneeAngle: number | null,
  hipY: number | null,
  standingHipY: number | null,
  deepestHipY: number | null,
): SquatState => {
  const hipDrop =
    hipY === null || standingHipY === null ? null : hipY - standingHipY

  switch (phase) {
    case 'STANDING':
      if (
        (hipDrop !== null && hipDrop > DESCENT_START_DELTA) ||
        (kneeAngle !== null && kneeAngle < DESCENDING_KNEE_ANGLE)
      ) {
        return 'DESCENDING'
      }

      return 'STANDING'
    case 'DESCENDING':
      if (
        (hipDrop !== null && hipDrop >= BOTTOM_DELTA) ||
        (kneeAngle !== null && kneeAngle <= BOTTOM_KNEE_ANGLE)
      ) {
        return 'BOTTOM'
      }

      return 'DESCENDING'
    case 'BOTTOM':
      if (
        hipY !== null &&
        deepestHipY !== null &&
        deepestHipY - hipY >= ASCENT_DELTA
      ) {
        return 'ASCENDING'
      }

      if (kneeAngle !== null && kneeAngle > ASCENDING_KNEE_ANGLE) {
        return 'ASCENDING'
      }

      return 'BOTTOM'
    case 'ASCENDING':
      if (
        (hipDrop !== null && hipDrop <= RETURN_TO_STANDING_DELTA) ||
        (kneeAngle !== null && kneeAngle >= STANDING_KNEE_ANGLE)
      ) {
        return 'STANDING'
      }

      return 'ASCENDING'
  }
}

/**
 * Updates the squat phase detector from a knee angle measurement.
 */
export function updatePhaseDetector(
  state: PhaseDetectorState,
  input: PhaseDetectorInput,
): PhaseDetectorResult {
  if (input.kneeAngle === null && input.hipY === null) {
    return {
      phase: state.phase,
      transitioned: false,
      state: {
        ...state,
        candidatePhase: null,
        candidateFrameCount: 0,
      },
    }
  }

  const standingHipY = state.standingHipY ?? input.hipY
  const currentDeepestHipY =
    state.phase === 'STANDING'
      ? input.hipY
      : Math.max(state.deepestHipY ?? Number.NEGATIVE_INFINITY, input.hipY ?? Number.NEGATIVE_INFINITY)
  const deepestHipY = Number.isFinite(currentDeepestHipY) ? currentDeepestHipY : state.deepestHipY

  const targetPhase = getTargetPhase(
    state.phase,
    input.kneeAngle,
    input.hipY,
    standingHipY,
    deepestHipY,
  )

  if (targetPhase === state.phase) {
    const nextStandingHipY =
      state.phase === 'STANDING' &&
      targetPhase === 'STANDING' &&
      input.hipY !== null &&
      (standingHipY === null ||
        Math.abs(input.hipY - standingHipY) <= RETURN_TO_STANDING_DELTA)
        ? standingHipY === null
          ? input.hipY
          : standingHipY * 0.9 + input.hipY * 0.1
        : standingHipY

    return {
      phase: state.phase,
      transitioned: false,
      state: {
        ...state,
        candidatePhase: null,
        candidateFrameCount: 0,
        standingHipY: nextStandingHipY,
        deepestHipY:
          state.phase === 'STANDING' ? input.hipY : deepestHipY,
      },
    }
  }

  const candidateFrameCount =
    state.candidatePhase === targetPhase ? state.candidateFrameCount + 1 : 1

  if (candidateFrameCount < REQUIRED_CONSECUTIVE_FRAMES) {
    return {
      phase: state.phase,
      transitioned: false,
      state: {
        ...state,
        candidatePhase: targetPhase,
        candidateFrameCount,
        standingHipY,
        deepestHipY,
      },
    }
  }

  const nextDeepestHipY =
    targetPhase === 'STANDING' ? input.hipY : deepestHipY

  return {
    phase: targetPhase,
    transitioned: true,
    state: {
      phase: targetPhase,
      candidatePhase: null,
      candidateFrameCount: 0,
      standingHipY,
      deepestHipY: nextDeepestHipY,
    },
  }
}
