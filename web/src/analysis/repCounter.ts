import { midpoint, safeLandmark } from './geometry'
import type { JointAngles, PoseFrame, RepMetrics, SquatState } from '../cv/types'
import { LANDMARK_INDICES } from '../cv/types'

// ── Validation thresholds (relaxed) ────────────────────────────────
/** Average knee angle must drop below this during the rep. */
const AVG_KNEE_DEPTH_THRESHOLD = 145
/** Max left/right asymmetry before bilateral check fails. */
const BILATERAL_ASYMMETRY_MAX = 35
/** Minimum hip descent (normalized Y, downward = positive). Low bar — just needs real drop. */
const MIN_HIP_DESCENT = 0.03
/** Ankle visibility ratio — only reject obvious knee lifts where a foot vanishes. */
const ANKLE_VISIBILITY_RATIO = 0.4
/** Minimum realistic rep duration. */
const MIN_REP_DURATION_MS = 500
/** Maximum realistic rep duration. */
const MAX_REP_DURATION_MS = 8_000
/**
 * Knee-lift detector: if one knee bends deeply while the other stays
 * nearly straight AND hips barely move, it's a knee lift, not a squat.
 */
const KNEE_LIFT_SINGLE_KNEE_MAX = 120
const KNEE_LIFT_OTHER_KNEE_MIN = 155
const KNEE_LIFT_HIP_DROP_MAX = 0.025

// ── Types ──────────────────────────────────────────────────────────

export interface RepValidation {
  reachedBottom: boolean
  bilateralBend: boolean
  hipDescended: boolean
  feetStable: boolean
  validDuration: boolean
  isKneeLift: boolean
  /** null = rep accepted; string = reason it was rejected. */
  rejectionReason: string | null
}

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
  startHipY: number | null
  deepestHipY: number | null
  totalFrames: number
  ankleVisibleFrames: number
}

export interface RepCounterState {
  repCount: number
  reps: RepMetrics[]
  activeRep: ActiveRep | null
  previousPhase: SquatState
  reachedBottom: boolean
  /** Persists until next rep attempt so the debug overlay can show it. */
  lastValidation: RepValidation | null
}

export interface RepCounterInput {
  phase: SquatState
  transitioned: boolean
  frame: PoseFrame
  angles: JointAngles
  hipY: number | null
}

export interface RepCounterResult {
  repCount: number
  reps: RepMetrics[]
  completedRep: RepMetrics | null
  state: RepCounterState
}

export function createRepCounterState(): RepCounterState {
  return {
    repCount: 0,
    reps: [],
    activeRep: null,
    previousPhase: 'STANDING',
    reachedBottom: false,
    lastValidation: null,
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

const minOrValue = (current: number | null, next: number | null): number | null => {
  if (next === null) return current
  if (current === null) return next
  return Math.min(current, next)
}

const maxOrValue = (current: number | null, next: number | null): number | null => {
  if (next === null) return current
  if (current === null) return next
  return Math.max(current, next)
}

const averageKneeAngle = (angles: JointAngles): number | null => {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )
  if (knees.length === 0) return null
  return knees.reduce((sum, value) => sum + value, 0) / knees.length
}

const calculateHipShiftAtBottom = (frame: PoseFrame): number | null => {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  const leftAnkle = safeLandmark(frame, LANDMARK_INDICES.LEFT_ANKLE)
  const rightAnkle = safeLandmark(frame, LANDMARK_INDICES.RIGHT_ANKLE)

  if (!leftHip || !rightHip || !leftAnkle || !rightAnkle) return null

  const hipMidpoint = midpoint(leftHip, rightHip)
  const footMidpoint = midpoint(leftAnkle, rightAnkle)
  return Math.abs(hipMidpoint.x - footMidpoint.x)
}

function bothAnklesVisible(frame: PoseFrame): boolean {
  const left = safeLandmark(frame, LANDMARK_INDICES.LEFT_ANKLE)
  const right = safeLandmark(frame, LANDMARK_INDICES.RIGHT_ANKLE)
  return left !== null && right !== null
}

// ── ActiveRep lifecycle ─────────────────────────────────────────────

const createActiveRep = (
  frame: PoseFrame,
  angles: JointAngles,
  hipY: number | null,
): ActiveRep => ({
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
  startHipY: hipY,
  deepestHipY: hipY,
  totalFrames: 1,
  ankleVisibleFrames: bothAnklesVisible(frame) ? 1 : 0,
})

const updateActiveRep = (
  activeRep: ActiveRep,
  frame: PoseFrame,
  angles: JointAngles,
  phase: SquatState,
  hipY: number | null,
): ActiveRep => {
  const nextBottomAverageKneeAngle = averageKneeAngle(angles)
  const shouldReplaceBottomFrame =
    phase === 'BOTTOM' &&
    nextBottomAverageKneeAngle !== null &&
    (activeRep.bottomAverageKneeAngle === null ||
      nextBottomAverageKneeAngle < activeRep.bottomAverageKneeAngle)

  const nextDeepestHipY = maxOrValue(activeRep.deepestHipY, hipY)

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
    deepestHipY: nextDeepestHipY,
    totalFrames: activeRep.totalFrames + 1,
    ankleVisibleFrames:
      activeRep.ankleVisibleFrames + (bothAnklesVisible(frame) ? 1 : 0),
  }
}

// ── Validation (soft scoring) ───────────────────────────────────────

function validateRep(
  activeRep: ActiveRep,
  reachedBottom: boolean,
  durationMs: number,
): RepValidation {
  // Bilateral bend: use average of both knees, allow asymmetry up to 35°
  const minLeft = activeRep.minLeftKneeAngle
  const minRight = activeRep.minRightKneeAngle
  const avgMin =
    minLeft !== null && minRight !== null
      ? (minLeft + minRight) / 2
      : minLeft ?? minRight
  const asymmetry =
    minLeft !== null && minRight !== null ? Math.abs(minLeft - minRight) : 0
  const bilateralBend =
    avgMin !== null &&
    avgMin <= AVG_KNEE_DEPTH_THRESHOLD &&
    asymmetry <= BILATERAL_ASYMMETRY_MAX

  // Hip descent
  const hipDrop =
    activeRep.startHipY !== null && activeRep.deepestHipY !== null
      ? activeRep.deepestHipY - activeRep.startHipY
      : 0
  const hipDescended = hipDrop >= MIN_HIP_DESCENT

  // Feet stability — only catches obvious lifts
  const ankleRatio =
    activeRep.totalFrames > 0
      ? activeRep.ankleVisibleFrames / activeRep.totalFrames
      : 0
  const feetStable = ankleRatio >= ANKLE_VISIBILITY_RATIO

  // Duration
  const validDuration =
    durationMs >= MIN_REP_DURATION_MS && durationMs <= MAX_REP_DURATION_MS

  // Knee-lift detector: one knee bends deeply, other stays straight, hips don't move
  const isKneeLift = detectKneeLift(minLeft, minRight, hipDrop)

  // ── Temporarily loosened: only require reachedBottom + validDuration ──
  // All other gates are computed and displayed but do NOT block counting.
  let rejectionReason: string | null = null

  if (!reachedBottom) {
    rejectionReason = 'Never reached bottom'
  } else if (!validDuration) {
    rejectionReason =
      durationMs < MIN_REP_DURATION_MS ? 'Too fast (<500ms)' : 'Too slow (>8s)'
  }
  // TODO: re-enable after reps count reliably
  // if (isKneeLift) rejectionReason = 'Knee lift detected'
  // if (!bilateralBend && !hipDescended) rejectionReason = 'No bilateral bend AND no hip descent'

  return {
    reachedBottom,
    bilateralBend,
    hipDescended,
    feetStable,
    validDuration,
    isKneeLift,
    rejectionReason,
  }
}

function detectKneeLift(
  minLeft: number | null,
  minRight: number | null,
  hipDrop: number,
): boolean {
  if (minLeft === null || minRight === null) return false

  const leftDeep =
    minLeft <= KNEE_LIFT_SINGLE_KNEE_MAX &&
    minRight >= KNEE_LIFT_OTHER_KNEE_MIN
  const rightDeep =
    minRight <= KNEE_LIFT_SINGLE_KNEE_MAX &&
    minLeft >= KNEE_LIFT_OTHER_KNEE_MIN

  if (!leftDeep && !rightDeep) return false

  return hipDrop < KNEE_LIFT_HIP_DROP_MAX
}

// ── Finalize ────────────────────────────────────────────────────────

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

// ── Main update ─────────────────────────────────────────────────────

export function updateRepCounter(
  state: RepCounterState,
  input: RepCounterInput,
): RepCounterResult {
  let activeRep = state.activeRep
  let repCount = state.repCount
  let reps = state.reps
  let completedRep: RepMetrics | null = null
  let reachedBottom = state.reachedBottom
  let lastValidation = state.lastValidation

  // Start tracking a new rep on descent
  if (activeRep === null && input.transitioned && input.phase === 'DESCENDING') {
    activeRep = createActiveRep(input.frame, input.angles, input.hipY)
    reachedBottom = false
    lastValidation = null
    console.log(`[RepCounter] REP ATTEMPT STARTED | frame=${input.frame.frameIndex} hipY=${input.hipY?.toFixed(4)}`)
  }

  // Update per-frame tracking
  if (activeRep !== null) {
    activeRep = updateActiveRep(
      activeRep,
      input.frame,
      input.angles,
      input.phase,
      input.hipY,
    )
  }

  if (input.phase === 'BOTTOM' && !reachedBottom) {
    console.log(`[RepCounter] BOTTOM REACHED | frame=${input.frame.frameIndex}`)
    reachedBottom = true
  }

  // Rep completion attempt: full cycle ASCENDING -> STANDING
  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'STANDING'
  ) {
    console.log(`[RepCounter] STANDING RETURN | prevPhase=${state.previousPhase} reachedBottom=${reachedBottom}`)

    if (state.previousPhase === 'ASCENDING') {
      const durationMs = input.frame.timestamp - activeRep.startTimestamp
      const validation = validateRep(activeRep, reachedBottom, durationMs)
      lastValidation = validation

      console.log(`[RepCounter] VALIDATION | reason=${validation.rejectionReason} duration=${durationMs}ms bilateral=${validation.bilateralBend} hipDesc=${validation.hipDescended} feet=${validation.feetStable} kneeLift=${validation.isKneeLift}`)

      if (validation.rejectionReason === null) {
        repCount += 1
        completedRep = finalizeRep(activeRep, repCount, input.frame)
        reps = [...reps, completedRep]
        console.log(`[RepCounter] REP COUNTED #${repCount}`)
      } else {
        console.log(`[RepCounter] REP REJECTED: ${validation.rejectionReason}`)
      }
      // Clean reset after return to standing regardless of outcome
      activeRep = null
      reachedBottom = false
    } else {
      console.log(`[RepCounter] STANDING but previousPhase=${state.previousPhase} (not ASCENDING) — rep attempt abandoned`)
      activeRep = null
      reachedBottom = false
    }
  }

  return {
    repCount,
    reps,
    completedRep,
    state: {
      repCount,
      reps,
      activeRep,
      previousPhase: input.phase,
      reachedBottom,
      lastValidation,
    },
  }
}
