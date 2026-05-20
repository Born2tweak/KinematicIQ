import { midpoint, safeLandmark } from './geometry'
import type { JointAngles, PoseFrame, RepMetrics, SquatState } from '../cv/types'
import { LANDMARK_INDICES } from '../cv/types'

interface ActiveRep {
  startFrameIndex: number
  startTimestamp: number
  minLeftKneeAngle: number | null
  minRightKneeAngle: number | null
  trunkLeanSum: number
  trunkLeanSamples: number
  maxTrunkLean: number | null
  bottomFrameIndex: number
  bottomTimestamp: number
  bottomAverageKneeAngle: number | null
  hipShiftAtBottom: number | null
  confidenceSamples: number
  confidenceSum: number
}

export interface RepCounterState {
  repCount: number
  reps: RepMetrics[]
  activeRep: ActiveRep | null
  previousPhase: SquatState
}

export interface RepCounterInput {
  phase: SquatState
  transitioned: boolean
  frame: PoseFrame
  angles: JointAngles
}

export interface RepCounterResult {
  repCount: number
  reps: RepMetrics[]
  completedRep: RepMetrics | null
  state: RepCounterState
}

/**
 * Returns the initial rep counter state.
 */
export function createRepCounterState(): RepCounterState {
  return {
    repCount: 0,
    reps: [],
    activeRep: null,
    previousPhase: 'STANDING',
  }
}

const minOrValue = (current: number | null, next: number | null): number | null => {
  if (next === null) {
    return current
  }

  if (current === null) {
    return next
  }

  return Math.min(current, next)
}

const maxOrValue = (current: number | null, next: number | null): number | null => {
  if (next === null) {
    return current
  }

  if (current === null) {
    return next
  }

  return Math.max(current, next)
}

const averageKneeAngle = (angles: JointAngles): number | null => {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )

  if (knees.length === 0) {
    return null
  }

  return knees.reduce((sum, value) => sum + value, 0) / knees.length
}

const calculateHipShiftAtBottom = (frame: PoseFrame): number | null => {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  const leftAnkle = safeLandmark(frame, LANDMARK_INDICES.LEFT_ANKLE)
  const rightAnkle = safeLandmark(frame, LANDMARK_INDICES.RIGHT_ANKLE)

  if (!leftHip || !rightHip || !leftAnkle || !rightAnkle) {
    return null
  }

  const hipMidpoint = midpoint(leftHip, rightHip)
  const footMidpoint = midpoint(leftAnkle, rightAnkle)

  return Math.abs(hipMidpoint.x - footMidpoint.x)
}

const createActiveRep = (frame: PoseFrame, angles: JointAngles): ActiveRep => ({
  startFrameIndex: frame.frameIndex,
  startTimestamp: frame.timestamp,
  minLeftKneeAngle: angles.leftKnee,
  minRightKneeAngle: angles.rightKnee,
  trunkLeanSum: angles.trunkLean ?? 0,
  trunkLeanSamples: angles.trunkLean === null ? 0 : 1,
  maxTrunkLean: angles.trunkLean,
  bottomFrameIndex: frame.frameIndex,
  bottomTimestamp: frame.timestamp,
  bottomAverageKneeAngle: averageKneeAngle(angles),
  hipShiftAtBottom: calculateHipShiftAtBottom(frame),
  confidenceSamples: 1,
  confidenceSum: frame.poseConfidence,
})

const updateActiveRep = (
  activeRep: ActiveRep,
  frame: PoseFrame,
  angles: JointAngles,
  phase: SquatState,
): ActiveRep => {
  const nextBottomAverageKneeAngle = averageKneeAngle(angles)
  const shouldReplaceBottomFrame =
    phase === 'BOTTOM' &&
    nextBottomAverageKneeAngle !== null &&
    (activeRep.bottomAverageKneeAngle === null ||
      nextBottomAverageKneeAngle < activeRep.bottomAverageKneeAngle)

  return {
    ...activeRep,
    minLeftKneeAngle: minOrValue(activeRep.minLeftKneeAngle, angles.leftKnee),
    minRightKneeAngle: minOrValue(activeRep.minRightKneeAngle, angles.rightKnee),
    trunkLeanSum:
      activeRep.trunkLeanSum + (angles.trunkLean === null ? 0 : angles.trunkLean),
    trunkLeanSamples:
      activeRep.trunkLeanSamples + (angles.trunkLean === null ? 0 : 1),
    maxTrunkLean: maxOrValue(activeRep.maxTrunkLean, angles.trunkLean),
    bottomFrameIndex: shouldReplaceBottomFrame
      ? frame.frameIndex
      : activeRep.bottomFrameIndex,
    bottomTimestamp: shouldReplaceBottomFrame
      ? frame.timestamp
      : activeRep.bottomTimestamp,
    bottomAverageKneeAngle: shouldReplaceBottomFrame
      ? nextBottomAverageKneeAngle
      : activeRep.bottomAverageKneeAngle,
    hipShiftAtBottom: shouldReplaceBottomFrame
      ? calculateHipShiftAtBottom(frame)
      : activeRep.hipShiftAtBottom,
    confidenceSamples: activeRep.confidenceSamples + 1,
    confidenceSum: activeRep.confidenceSum + frame.poseConfidence,
  }
}

const finalizeRep = (
  activeRep: ActiveRep,
  repNumber: number,
  frame: PoseFrame,
): RepMetrics => {
  const averageTrunkLean =
    activeRep.trunkLeanSamples === 0
      ? null
      : activeRep.trunkLeanSum / activeRep.trunkLeanSamples

  return {
    repNumber,
    startFrameIndex: activeRep.startFrameIndex,
    bottomFrameIndex: activeRep.bottomFrameIndex,
    endFrameIndex: frame.frameIndex,
    startTimestamp: activeRep.startTimestamp,
    endTimestamp: frame.timestamp,
    minLeftKneeAngle: activeRep.minLeftKneeAngle,
    minRightKneeAngle: activeRep.minRightKneeAngle,
    averageTrunkLean,
    maxTrunkLean: activeRep.maxTrunkLean,
    hipShiftAtBottom: activeRep.hipShiftAtBottom,
    kneeAsymmetry:
      activeRep.minLeftKneeAngle === null || activeRep.minRightKneeAngle === null
        ? null
        : Math.abs(activeRep.minLeftKneeAngle - activeRep.minRightKneeAngle),
    confidence: activeRep.confidenceSum / activeRep.confidenceSamples,
    durationMs: frame.timestamp - activeRep.startTimestamp,
  }
}

/**
 * Updates rep counting state from the current squat phase and frame metrics.
 */
export function updateRepCounter(
  state: RepCounterState,
  input: RepCounterInput,
): RepCounterResult {
  let activeRep = state.activeRep
  let repCount = state.repCount
  let reps = state.reps
  let completedRep: RepMetrics | null = null

  if (activeRep === null && input.transitioned && input.phase === 'DESCENDING') {
    activeRep = createActiveRep(input.frame, input.angles)
  }

  if (activeRep !== null) {
    activeRep = updateActiveRep(activeRep, input.frame, input.angles, input.phase)
  }

  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'STANDING' &&
    state.previousPhase === 'ASCENDING'
  ) {
    repCount += 1
    completedRep = finalizeRep(activeRep, repCount, input.frame)
    reps = [...reps, completedRep]
    activeRep = null
  }

  const nextState: RepCounterState = {
    repCount,
    reps,
    activeRep,
    previousPhase: input.phase,
  }

  return {
    repCount,
    reps,
    completedRep,
    state: nextState,
  }
}
