import { measureFrameAsymmetry } from './asymmetryDetector'
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

// ── Chair / sit-to-stand rejection ────────────────────────────────
/** Hip drop (normalized) beyond which the movement looks like sitting. */
const SEATED_HIP_DROP_THRESHOLD = 0.30
/** Consecutive frames of seated signal before flagging. */
const SEATED_MIN_FRAMES = 3
/** Bottom hold duration (ms) that triggers seated flag when hipDrop stays high. */
const SEATED_BOTTOM_HOLD_MS = 1200
/** Hip drop considered "high" for bottom-hold detection. */
const SEATED_BOTTOM_HOLD_HIP_DROP = 0.20
/** Minimum hip confidence to count as "visible" near bottom. */
const HIP_CONFIDENCE_MIN = 0.4

/** Consecutive near-standing frames to count a rep without perfect phase lockout. */
const STANDING_COMPLETION_FRAMES = 4
/** Degrees below calibrated upright knee that still counts as lockout. */
const STANDING_KNEE_TOLERANCE = 14
/** Fallback lockout knee when no calibration exists. */
const STANDING_KNEE_FALLBACK = 152
/** Hip returned within this delta of rep start (normalized Y). */
const HIP_RETURN_TOLERANCE = 0.08
/** Minimum pose confidence while finishing a rep. */
const MIN_COMPLETION_POSE_CONFIDENCE = 0.42
/** Average rep confidence floor — rejects reps mostly tracked poorly. */
const MIN_REP_AVG_CONFIDENCE = 0.38
/** Knee angle fallback when phase never reports BOTTOM. */
const BOTTOM_KNEE_ANGLE_THRESHOLD = 105

// ── Types ──────────────────────────────────────────────────────────

export interface RepValidation {
  reachedBottom: boolean
  bilateralBend: boolean
  hipDescended: boolean
  feetStable: boolean
  validDuration: boolean
  isKneeLift: boolean
  seatedMovementDetected: boolean
  maxHipDrop: number
  bottomHoldMs: number
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
  shoulderAsymmetryAtBottom: number | null
  confidenceSamples: number
  confidenceSum: number
  startHipY: number | null
  deepestHipY: number | null
  totalFrames: number
  ankleVisibleFrames: number
  // Chair / seated detection
  maxHipDrop: number
  seatedConsecutiveFrames: number
  seatedMovementDetected: boolean
  bottomHoldStartTimestamp: number | null
  bottomHoldMs: number
}

export interface RepCounterState {
  repCount: number
  reps: RepMetrics[]
  activeRep: ActiveRep | null
  previousPhase: SquatState
  reachedBottom: boolean
  /** Persists until next rep attempt so the debug overlay can show it. */
  lastValidation: RepValidation | null
  /** Frames with near-standing lockout after bottom (grace completion). */
  standingCompletionFrames: number
  /** Live gate blocking rep completion (debug HUD). */
  blockingGate: string | null
  /** Last failed attempt after bottom was reached (debug HUD). */
  lastMissedRepReason: string | null
}

export interface RepCounterInput {
  phase: SquatState
  transitioned: boolean
  frame: PoseFrame
  angles: JointAngles
  hipY: number | null
  smoothedKneeAngle: number | null
  standingKneeBaseline: number | null
  standingHipY: number | null
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
    standingCompletionFrames: 0,
    blockingGate: null,
    lastMissedRepReason: null,
  }
}

/**
 * Start rep 1 when the set activates mid-descent (READY → ACTIVE handoff).
 * Does not relax validation gates — only preserves the in-progress attempt.
 */
export function beginSetDuringDescent(
  state: RepCounterState,
  frame: PoseFrame,
  angles: JointAngles,
  hipY: number | null,
  initialPhase: SquatState,
): RepCounterState {
  const activeRep = createActiveRep(frame, angles, hipY)
  let reachedBottom = initialPhase === 'BOTTOM'

  if (!reachedBottom) {
    const avgKnee = averageKneeAngle(angles)
    if (avgKnee !== null && avgKnee <= 105) {
      reachedBottom = true
    }
  }

  console.log(
    `[RepCounter] SET ACTIVATED mid-descent | phase=${initialPhase} reachedBottom=${reachedBottom} frame=${frame.frameIndex}`,
  )

  return {
    ...state,
    activeRep,
    previousPhase: initialPhase,
    reachedBottom,
    lastValidation: null,
    standingCompletionFrames: 0,
    blockingGate: reachedBottom
      ? 'Awaiting standing completion'
      : 'Awaiting bottom',
    lastMissedRepReason: null,
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

function lockoutKneeThreshold(standingKneeBaseline: number | null): number {
  if (standingKneeBaseline !== null) {
    return Math.max(standingKneeBaseline - STANDING_KNEE_TOLERANCE, STANDING_KNEE_FALLBACK)
  }
  return STANDING_KNEE_FALLBACK
}

function isNearStandingLockout(
  input: RepCounterInput,
  activeRep: ActiveRep,
  reachedBottom: boolean,
): boolean {
  if (!reachedBottom) return false
  if (input.phase === 'DESCENDING' || input.phase === 'BOTTOM') return false
  if (input.phase !== 'ASCENDING' && input.phase !== 'STANDING') return false

  if (input.frame.poseConfidence < MIN_COMPLETION_POSE_CONFIDENCE) {
    return false
  }

  const avgKnee = averageKneeAngle(input.angles)
  const kneeForLockout = input.smoothedKneeAngle ?? avgKnee
  if (kneeForLockout === null) return false

  if (kneeForLockout < lockoutKneeThreshold(input.standingKneeBaseline)) {
    return false
  }

  const hipReturned =
    activeRep.startHipY !== null &&
    input.hipY !== null &&
    Math.abs(input.hipY - activeRep.startHipY) <= HIP_RETURN_TOLERANCE

  const hipDropFromCalibrated =
    input.standingHipY !== null &&
    input.hipY !== null &&
    input.hipY - input.standingHipY <= 0.07

  return hipReturned || hipDropFromCalibrated
}

function computeBlockingGate(
  activeRep: ActiveRep | null,
  reachedBottom: boolean,
  standingCompletionFrames: number,
  input: RepCounterInput,
): string | null {
  if (activeRep === null) return null

  if (activeRep.seatedMovementDetected) {
    return 'Movement looked seated'
  }

  if (!reachedBottom) {
    if (input.phase === 'DESCENDING' || input.phase === 'BOTTOM') {
      return 'Awaiting bottom'
    }
    return 'Bottom not held long enough'
  }

  if (input.frame.poseConfidence < MIN_COMPLETION_POSE_CONFIDENCE) {
    return 'Pose confidence dropped'
  }

  if (!isNearStandingLockout(input, activeRep, reachedBottom)) {
    if (input.phase === 'ASCENDING' || input.phase === 'STANDING') {
      const threshold = lockoutKneeThreshold(input.standingKneeBaseline)
      const knee = input.smoothedKneeAngle ?? averageKneeAngle(input.angles)
      if (knee !== null && knee < threshold) {
        return 'Knee angle never passed standing threshold'
      }
    }
    return 'Did not return to standing'
  }

  if (standingCompletionFrames < STANDING_COMPLETION_FRAMES) {
    return `Awaiting standing completion (${standingCompletionFrames}/${STANDING_COMPLETION_FRAMES})`
  }

  return null
}

function missedRepReason(
  activeRep: ActiveRep,
  standingCompletionFrames: number,
  reachedBottom: boolean,
  input: RepCounterInput,
): string {
  if (activeRep.seatedMovementDetected) {
    return 'Movement looked seated'
  }
  if (input.frame.poseConfidence < MIN_COMPLETION_POSE_CONFIDENCE) {
    return 'Pose confidence dropped'
  }
  if (!reachedBottom) {
    return 'Bottom not held long enough'
  }
  if (standingCompletionFrames > 0) {
    return 'Tracking lost during ascent'
  }
  const knee = input.smoothedKneeAngle ?? averageKneeAngle(input.angles)
  const threshold = lockoutKneeThreshold(input.standingKneeBaseline)
  if (knee !== null && knee < threshold) {
    return 'Knee angle never passed standing threshold'
  }
  return 'Did not return to standing'
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
  shoulderAsymmetryAtBottom: measureFrameAsymmetry(frame).shoulderAsymmetry,
  confidenceSamples: 1,
  confidenceSum: frame.poseConfidence,
  startHipY: hipY,
  deepestHipY: hipY,
  totalFrames: 1,
  ankleVisibleFrames: bothAnklesVisible(frame) ? 1 : 0,
  maxHipDrop: 0,
  seatedConsecutiveFrames: 0,
  seatedMovementDetected: false,
  bottomHoldStartTimestamp: null,
  bottomHoldMs: 0,
})

function hipLandmarksLowConfidence(frame: PoseFrame): boolean {
  const leftHip = frame.landmarks[LANDMARK_INDICES.LEFT_HIP]
  const rightHip = frame.landmarks[LANDMARK_INDICES.RIGHT_HIP]
  if (!leftHip || !rightHip) return true
  return (
    (leftHip.visibility ?? 0) < HIP_CONFIDENCE_MIN ||
    (rightHip.visibility ?? 0) < HIP_CONFIDENCE_MIN
  )
}

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

  // ── Seated / chair detection per-frame ──────────────────────────
  const currentHipDrop =
    activeRep.startHipY !== null && hipY !== null
      ? hipY - activeRep.startHipY
      : 0
  const nextMaxHipDrop = Math.max(activeRep.maxHipDrop, currentHipDrop)

  // Check seated signals this frame
  const excessiveHipDrop = currentHipDrop > SEATED_HIP_DROP_THRESHOLD
  const hipOccluded = hipLandmarksLowConfidence(frame)
  const seatedSignalThisFrame = excessiveHipDrop || hipOccluded

  const nextSeatedConsecutive = seatedSignalThisFrame
    ? activeRep.seatedConsecutiveFrames + 1
    : 0
  const nextSeatedDetected =
    activeRep.seatedMovementDetected ||
    nextSeatedConsecutive >= SEATED_MIN_FRAMES

  // Bottom hold tracking: time spent with high hip drop
  const inHighDrop = currentHipDrop >= SEATED_BOTTOM_HOLD_HIP_DROP
  let nextBottomHoldStart = activeRep.bottomHoldStartTimestamp
  let nextBottomHoldMs = activeRep.bottomHoldMs

  if (inHighDrop) {
    if (nextBottomHoldStart === null) {
      nextBottomHoldStart = frame.timestamp
    }
    nextBottomHoldMs = frame.timestamp - nextBottomHoldStart
  } else {
    nextBottomHoldStart = null
  }

  // Prolonged bottom hold with high drop also triggers seated flag
  const seatedFromHold =
    !nextSeatedDetected &&
    nextBottomHoldMs >= SEATED_BOTTOM_HOLD_MS &&
    nextMaxHipDrop >= SEATED_BOTTOM_HOLD_HIP_DROP

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
    shoulderAsymmetryAtBottom: shouldReplaceBottomFrame
      ? measureFrameAsymmetry(frame).shoulderAsymmetry
      : activeRep.shoulderAsymmetryAtBottom,
    confidenceSamples: activeRep.confidenceSamples + 1,
    confidenceSum: activeRep.confidenceSum + frame.poseConfidence,
    deepestHipY: nextDeepestHipY,
    totalFrames: activeRep.totalFrames + 1,
    ankleVisibleFrames:
      activeRep.ankleVisibleFrames + (bothAnklesVisible(frame) ? 1 : 0),
    maxHipDrop: nextMaxHipDrop,
    seatedConsecutiveFrames: nextSeatedConsecutive,
    seatedMovementDetected: nextSeatedDetected || seatedFromHold,
    bottomHoldStartTimestamp: nextBottomHoldStart,
    bottomHoldMs: nextBottomHoldMs,
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

  const avgConfidence =
    activeRep.confidenceSamples > 0
      ? activeRep.confidenceSum / activeRep.confidenceSamples
      : 0
  const confidenceOk = avgConfidence >= MIN_REP_AVG_CONFIDENCE

  // Knee-lift detector: one knee bends deeply, other stays straight, hips don't move
  const isKneeLift = detectKneeLift(minLeft, minRight, hipDrop)

  // Chair / seated detection
  const seatedMovementDetected = activeRep.seatedMovementDetected
  const maxHipDrop = activeRep.maxHipDrop
  const bottomHoldMs = activeRep.bottomHoldMs

  // ── Rejection logic ─────────────────────────────────────────────
  let rejectionReason: string | null = null

  if (!reachedBottom) {
    rejectionReason = 'Bottom not held long enough'
  } else if (!validDuration) {
    rejectionReason =
      durationMs < MIN_REP_DURATION_MS ? 'Too fast (<500ms)' : 'Too slow (>8s)'
  } else if (!confidenceOk) {
    rejectionReason = 'Pose confidence dropped'
  } else if (isKneeLift) {
    rejectionReason = 'Knee lift detected'
  } else if (seatedMovementDetected) {
    rejectionReason = 'Movement looked seated'
  }

  return {
    reachedBottom,
    bilateralBend,
    hipDescended,
    feetStable,
    validDuration,
    isKneeLift,
    seatedMovementDetected,
    maxHipDrop,
    bottomHoldMs,
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
    shoulderAsymmetryAtBottom: activeRep.shoulderAsymmetryAtBottom,
    kneeAsymmetry:
      activeRep.minLeftKneeAngle === null || activeRep.minRightKneeAngle === null
        ? null
        : Math.abs(activeRep.minLeftKneeAngle - activeRep.minRightKneeAngle),
    confidence: activeRep.confidenceSum / activeRep.confidenceSamples,
    durationMs: frame.timestamp - activeRep.startTimestamp,
  }
}

// ── Main update ─────────────────────────────────────────────────────

function tryFinishRep(
  activeRep: ActiveRep,
  reachedBottom: boolean,
  frame: PoseFrame,
  repCount: number,
): {
  repCount: number
  reps: RepMetrics[]
  completedRep: RepMetrics | null
  lastValidation: RepValidation
} {
  const durationMs = frame.timestamp - activeRep.startTimestamp
  const validation = validateRep(activeRep, reachedBottom, durationMs)

  console.log(
    `[RepCounter] VALIDATION | reason=${validation.rejectionReason} duration=${durationMs}ms bilateral=${validation.bilateralBend} hipDesc=${validation.hipDescended} feet=${validation.feetStable} kneeLift=${validation.isKneeLift}`,
  )

  if (validation.rejectionReason === null) {
    const nextCount = repCount + 1
    const completedRep = finalizeRep(activeRep, nextCount, frame)
    console.log(`[RepCounter] REP COUNTED #${nextCount}`)
    return {
      repCount: nextCount,
      reps: [], // caller merges
      completedRep,
      lastValidation: validation,
    }
  }

  console.log(`[RepCounter] REP REJECTED: ${validation.rejectionReason}`)
  return {
    repCount,
    reps: [],
    completedRep: null,
    lastValidation: validation,
  }
}

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
  let standingCompletionFrames = state.standingCompletionFrames
  let blockingGate = state.blockingGate
  let lastMissedRepReason = state.lastMissedRepReason

  const prevPhase = state.previousPhase

  // Abandon incomplete rep when a new descent starts (double-dip without lockout)
  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'DESCENDING' &&
    prevPhase !== 'DESCENDING'
  ) {
    const reason = missedRepReason(
      activeRep,
      standingCompletionFrames,
      reachedBottom,
      input,
    )
    lastMissedRepReason = reason
    console.log(`[RepCounter] MISSED REP: ${reason}`)
    activeRep = null
    reachedBottom = false
    standingCompletionFrames = 0
  }

  // Start tracking a new rep on descent
  if (activeRep === null && input.transitioned && input.phase === 'DESCENDING') {
    activeRep = createActiveRep(input.frame, input.angles, input.hipY)
    reachedBottom = false
    standingCompletionFrames = 0
    lastValidation = null
    console.log(
      `[RepCounter] REP ATTEMPT STARTED | frame=${input.frame.frameIndex} hipY=${input.hipY?.toFixed(4)}`,
    )
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

  // Mark bottom reached via phase OR knee angle fallback
  if (!reachedBottom && activeRep !== null) {
    if (input.phase === 'BOTTOM') {
      console.log(
        `[RepCounter] BOTTOM REACHED (phase) | frame=${input.frame.frameIndex}`,
      )
      reachedBottom = true
    } else {
      const avgKnee = averageKneeAngle(input.angles)
      if (avgKnee !== null && avgKnee <= BOTTOM_KNEE_ANGLE_THRESHOLD) {
        console.log(
          `[RepCounter] BOTTOM REACHED (knee=${avgKnee.toFixed(1)}°) | frame=${input.frame.frameIndex}`,
        )
        reachedBottom = true
      }
    }
  }

  // Grace standing completion (does not require phase FSM lockout)
  if (activeRep !== null && reachedBottom) {
    if (isNearStandingLockout(input, activeRep, reachedBottom)) {
      standingCompletionFrames += 1
    } else {
      standingCompletionFrames = 0
    }
  } else {
    standingCompletionFrames = 0
  }

  blockingGate = computeBlockingGate(
    activeRep,
    reachedBottom,
    standingCompletionFrames,
    input,
  )

  const finishRep = (): void => {
    if (activeRep === null) return
    const outcome = tryFinishRep(activeRep, reachedBottom, input.frame, repCount)
    repCount = outcome.repCount
    lastValidation = outcome.lastValidation
    if (outcome.completedRep) {
      completedRep = outcome.completedRep
      reps = [...reps, completedRep]
    } else {
      lastMissedRepReason =
        outcome.lastValidation.rejectionReason ?? 'Rep rejected'
    }
    activeRep = null
    reachedBottom = false
    standingCompletionFrames = 0
    blockingGate = null
  }

  if (
    activeRep !== null &&
    reachedBottom &&
    standingCompletionFrames === STANDING_COMPLETION_FRAMES
  ) {
    console.log(
      `[RepCounter] GRACE COMPLETION | standingFrames=${standingCompletionFrames}`,
    )
    finishRep()
  }

  // Rep completion: phase detector confirmed STANDING
  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'STANDING'
  ) {
    console.log(
      `[RepCounter] STANDING RETURN | prevPhase=${prevPhase} reachedBottom=${reachedBottom}`,
    )
    finishRep()
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
      standingCompletionFrames,
      blockingGate,
      lastMissedRepReason,
    },
  }
}
