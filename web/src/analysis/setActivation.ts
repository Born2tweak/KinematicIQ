import type { JointAngles, PoseFrame, SquatState } from '../cv/types'
import {
  beginSetDuringDescent,
  createRepCounterState,
  type RepCounterState,
} from './repCounter'
import {
  createPhaseDetectorState,
  type PhaseDetectorState,
} from './phaseDetector'

const BOTTOM_KNEE_AT_ACTIVATION = 105
const DESCENDING_KNEE_AT_ACTIVATION = 145
const BOTTOM_HIP_DROP_AT_ACTIVATION = 0.1
const DESCENT_HIP_DROP_AT_ACTIVATION = 0.04

export interface SetActivationInput {
  frame: PoseFrame
  angles: JointAngles
  hipY: number | null
  calibratedHipY: number | null
  trackingKneeAngle: number | null
  /** Upright knee baseline learned before descent (from phase detector). */
  standingKneeAngle?: number | null
}

/** Infer squat phase at the moment the set becomes ACTIVE (mid-descent is common). */
export function inferSquatPhaseAtActivation(
  trackingKneeAngle: number | null,
  hipY: number | null,
  calibratedHipY: number | null,
): SquatState {
  const hipDrop =
    hipY !== null && calibratedHipY !== null ? hipY - calibratedHipY : null

  if (
    trackingKneeAngle !== null &&
    trackingKneeAngle <= BOTTOM_KNEE_AT_ACTIVATION
  ) {
    return 'BOTTOM'
  }
  if (hipDrop !== null && hipDrop >= BOTTOM_HIP_DROP_AT_ACTIVATION) {
    return 'BOTTOM'
  }
  if (
    trackingKneeAngle !== null &&
    trackingKneeAngle < DESCENDING_KNEE_AT_ACTIVATION
  ) {
    return 'DESCENDING'
  }
  if (hipDrop !== null && hipDrop >= DESCENT_HIP_DROP_AT_ACTIVATION) {
    return 'DESCENDING'
  }
  return 'DESCENDING'
}

/**
 * Seed phase detector + rep counter when READY → ACTIVE during a descent.
 * Preserves the in-progress first rep instead of resetting to STANDING.
 */
export function activateAnalysisPipeline(input: SetActivationInput): {
  phaseDetector: PhaseDetectorState
  repCounter: RepCounterState
  initialPhase: SquatState
} {
  const initialPhase = inferSquatPhaseAtActivation(
    input.trackingKneeAngle,
    input.hipY,
    input.calibratedHipY,
  )
  const standingHipY = input.calibratedHipY ?? input.hipY

  const phaseDetector: PhaseDetectorState = {
    phase: initialPhase,
    candidatePhase: null,
    candidateFrameCount: 0,
    standingHipY,
    deepestHipY: input.hipY,
    emaKneeAngle: input.trackingKneeAngle,
    standingKneeAngle: input.standingKneeAngle ?? null,
    lastValidTimestamp: input.frame.timestamp,
  }

  const repCounter = beginSetDuringDescent(
    createRepCounterState(),
    input.frame,
    input.angles,
    input.hipY,
    initialPhase,
  )

  return { phaseDetector, repCounter, initialPhase }
}

/** Fresh pipeline when ACTIVE without an in-flight descent (fallback). */
export function createFreshAnalysisPipeline(): {
  phaseDetector: PhaseDetectorState
  repCounter: RepCounterState
} {
  return {
    phaseDetector: createPhaseDetectorState(),
    repCounter: createRepCounterState(),
  }
}
