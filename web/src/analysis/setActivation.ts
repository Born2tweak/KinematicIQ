import type { JointAngles, PoseFrame, SquatState } from '../cv/types'
import {
  beginSetDuringDescent,
  createRepCounterState,
  type RepCounterState,
} from './repCounter'
import {
  SQUAT_PHASE_CONFIG,
  createPhaseDetectorState,
  type CyclicPhaseConfig,
  type PhaseDetectorState,
} from './phaseDetector'

/** Thresholds for inferring the in-flight phase when a set activates mid-descent. */
export interface ActivationConfig {
  bottomKneeAtActivation: number
  descendingKneeAtActivation: number
  bottomHipDropAtActivation: number
  descentHipDropAtActivation: number
}

/** Bodyweight-squat activation tuning. */
export const SQUAT_ACTIVATION_CONFIG: ActivationConfig = {
  bottomKneeAtActivation: 105,
  descendingKneeAtActivation: 145,
  bottomHipDropAtActivation: 0.1,
  descentHipDropAtActivation: 0.04,
}

export interface SetActivationInput {
  frame: PoseFrame
  angles: JointAngles
  hipY: number | null
  calibratedHipY: number | null
  trackingKneeAngle: number | null
  /** Upright knee baseline learned before descent (from phase detector). */
  standingKneeAngle?: number | null
}

/** Infer movement phase at the moment the set becomes ACTIVE (mid-descent is common). */
export function inferSquatPhaseAtActivation(
  trackingKneeAngle: number | null,
  hipY: number | null,
  calibratedHipY: number | null,
  cfg: ActivationConfig = SQUAT_ACTIVATION_CONFIG,
): SquatState {
  const hipDrop =
    hipY !== null && calibratedHipY !== null ? hipY - calibratedHipY : null

  if (
    trackingKneeAngle !== null &&
    trackingKneeAngle <= cfg.bottomKneeAtActivation
  ) {
    return 'BOTTOM'
  }
  if (hipDrop !== null && hipDrop >= cfg.bottomHipDropAtActivation) {
    return 'BOTTOM'
  }
  if (
    trackingKneeAngle !== null &&
    trackingKneeAngle < cfg.descendingKneeAtActivation
  ) {
    return 'DESCENDING'
  }
  if (hipDrop !== null && hipDrop >= cfg.descentHipDropAtActivation) {
    return 'DESCENDING'
  }
  return 'DESCENDING'
}

/**
 * Seed phase detector + rep counter when READY → ACTIVE during a descent.
 * Preserves the in-progress first rep instead of resetting to STANDING.
 */
export function activateAnalysisPipeline(
  input: SetActivationInput,
  configs: {
    activation?: ActivationConfig
    phase?: CyclicPhaseConfig
  } = {},
): {
  phaseDetector: PhaseDetectorState
  repCounter: RepCounterState
  initialPhase: SquatState
} {
  const activation = configs.activation ?? SQUAT_ACTIVATION_CONFIG
  const phaseConfig = configs.phase ?? SQUAT_PHASE_CONFIG
  const initialPhase = inferSquatPhaseAtActivation(
    input.trackingKneeAngle,
    input.hipY,
    input.calibratedHipY,
    activation,
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
    config: phaseConfig,
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
export function createFreshAnalysisPipeline(
  configs: { phase?: CyclicPhaseConfig } = {},
): {
  phaseDetector: PhaseDetectorState
  repCounter: RepCounterState
} {
  return {
    phaseDetector: createPhaseDetectorState(configs.phase ?? SQUAT_PHASE_CONFIG),
    repCounter: createRepCounterState(),
  }
}
