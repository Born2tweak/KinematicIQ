import { measureFrameAsymmetry } from './asymmetryDetector'
import { midpoint, safeLandmark } from './geometry'
import type { JointAngles, PoseFrame, RepMetrics, SquatState } from '../cv/types'
import { LANDMARK_INDICES } from '../cv/types'

/**
 * Rep validation gates. Movement-specific — each MovementProfile
 * supplies its own instance; the exported default is the bodyweight-
 * squat tuning (see analysis/movement/profiles/squat.ts).
 */
export interface RepGateConfig {
  /** Average knee angle must drop below this during the rep. */
  avgKneeDepthThreshold: number
  /** Max left/right asymmetry before bilateral check fails. */
  bilateralAsymmetryMax: number
  /** Minimum hip descent (normalized Y, downward = positive). */
  minHipDescent: number
  /** Ankle visibility ratio — only reject obvious lifts where a foot vanishes. */
  ankleVisibilityRatio: number
  minRepDurationMs: number
  maxRepDurationMs: number
  /**
   * Knee-lift detector: one knee bends deeply while the other stays
   * nearly straight AND hips barely move.
   */
  kneeLiftSingleKneeMax: number
  kneeLiftOtherKneeMin: number
  kneeLiftHipDropMax: number
  /** Hip drop beyond which the movement looks like sitting. */
  seatedHipDropThreshold: number
  /**
   * Seated signal must persist this long (ms) before flagging. Time-based,
   * not frame-based (M17): capture rate varies between devices and paths.
   */
  seatedMinMs: number
  /** Bottom hold (ms) that triggers seated flag when hipDrop stays high. */
  seatedBottomHoldMs: number
  /** Hip drop considered "high" for bottom-hold detection. */
  seatedBottomHoldHipDrop: number
  /** Minimum hip confidence to count as "visible" near bottom. */
  hipConfidenceMin: number
  /** Near-standing hold (ms) that completes a rep without perfect lockout. */
  standingCompletionMs: number
  /** Degrees below calibrated upright knee that still counts as lockout. */
  standingKneeTolerance: number
  /** Fallback lockout knee when no calibration exists. */
  standingKneeFallback: number
  /** Hip returned within this delta of rep start (normalized Y). */
  hipReturnTolerance: number
  /** Hip drop from the calibrated stand that still counts as returned. */
  hipDropFromCalibratedMax: number
  /** Minimum pose confidence while finishing a rep. */
  minCompletionPoseConfidence: number
  /** Average rep confidence floor. */
  minRepAvgConfidence: number
  /** Knee angle fallback when phase never reports BOTTOM. */
  bottomKneeAngleThreshold: number
  /**
   * Bottom knee angle (min of sides) at or above this = no knee bend at
   * all; the candidate is rejected instead of counted (M16, labeled tapes:
   * phase-jitter "bottoms" while standing were counted at 175–178°).
   */
  standingBottomKneeMin: number
  /**
   * Hip descent that, TOGETHER with a bilateral knee bend past
   * `avgKneeDepthThreshold`, counts as bottom evidence at completion (M16).
   * Deliberately below `minHipDescent`: close/front-on framing reads a real
   * shallow squat as ~0.01–0.02 normalized hip drop on the labeled tapes.
   */
  minHipDescentEvidence: number
}

/** Bodyweight-squat gate tuning (deliberately relaxed). */
export const SQUAT_REP_GATES: RepGateConfig = {
  avgKneeDepthThreshold: 145,
  bilateralAsymmetryMax: 35,
  minHipDescent: 0.03,
  ankleVisibilityRatio: 0.4,
  minRepDurationMs: 500,
  maxRepDurationMs: 8_000,
  kneeLiftSingleKneeMax: 120,
  kneeLiftOtherKneeMin: 155,
  kneeLiftHipDropMax: 0.025,
  seatedHipDropThreshold: 0.3,
  // 130ms ≈ the old 3-consecutive-frames streak at the 15fps analysis rate.
  seatedMinMs: 130,
  seatedBottomHoldMs: 1200,
  seatedBottomHoldHipDrop: 0.2,
  hipConfidenceMin: 0.4,
  // 200ms ≈ the old 4-frame streak at the 15fps analysis rate.
  standingCompletionMs: 200,
  standingKneeTolerance: 14,
  standingKneeFallback: 152,
  hipReturnTolerance: 0.08,
  hipDropFromCalibratedMax: 0.07,
  minCompletionPoseConfidence: 0.42,
  minRepAvgConfidence: 0.38,
  bottomKneeAngleThreshold: 105,
  standingBottomKneeMin: 170,
  minHipDescentEvidence: 0.01,
}

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

/** Machine-readable id of the gate that rejected a rep candidate. */
export type RepGateId =
  | 'bottom'
  | 'no-knee-bend'
  | 'duration'
  | 'confidence'
  | 'knee-lift'
  | 'seated'
  | 'tracking-lost'
  | 'lockout'
  | 'standing-return'
  | 'unknown'

/**
 * Diagnostic record of a rejected rep candidate — which gate fired, when,
 * and the supporting values at rejection time. Collected so real sessions
 * can be audited against ground truth (validation program) WITHOUT any
 * threshold changes. Never used for live decisions.
 */
export interface RepRejection {
  gate: RepGateId
  reason: string
  /**
   * True when the candidate never showed meaningful hip descent — phase
   * jitter while standing, not a real rep attempt. Kept in the ledger for
   * audit but excluded from coach-facing rejection counts and lists.
   */
  phantom: boolean
  startFrameIndex: number
  endFrameIndex: number
  startTimestamp: number
  endTimestamp: number
  durationMs: number
  values: {
    minLeftKneeAngle: number | null
    minRightKneeAngle: number | null
    maxHipDrop: number
    bottomHoldMs: number
    avgConfidence: number
    reachedBottom: boolean
  }
}

/** Bound the diagnostic log so a long noisy session can't grow unbounded. */
const MAX_REJECTIONS = 50

function gateForReason(reason: string): RepGateId {
  if (reason.startsWith('Bottom not held')) return 'bottom'
  if (reason.startsWith('No knee bend')) return 'no-knee-bend'
  if (reason.startsWith('Too fast') || reason.startsWith('Too slow')) {
    return 'duration'
  }
  if (reason.startsWith('Pose confidence')) return 'confidence'
  if (reason.startsWith('Knee lift')) return 'knee-lift'
  if (reason.startsWith('Movement looked seated')) return 'seated'
  if (reason.startsWith('Tracking lost')) return 'tracking-lost'
  if (reason.startsWith('Knee angle never passed')) return 'lockout'
  if (reason.startsWith('Did not return')) return 'standing-return'
  return 'unknown'
}

function buildRejection(
  activeRep: ActiveRep,
  reason: string,
  frame: PoseFrame,
  reachedBottom: boolean,
  cfg: RepGateConfig,
): RepRejection {
  return {
    gate: gateForReason(reason),
    reason,
    phantom: !reachedBottom && activeRep.maxHipDrop < cfg.minHipDescent,
    startFrameIndex: activeRep.startFrameIndex,
    endFrameIndex: frame.frameIndex,
    startTimestamp: activeRep.startTimestamp,
    endTimestamp: frame.timestamp,
    durationMs: frame.timestamp - activeRep.startTimestamp,
    values: {
      minLeftKneeAngle: activeRep.minLeftKneeAngle,
      minRightKneeAngle: activeRep.minRightKneeAngle,
      maxHipDrop: activeRep.maxHipDrop,
      bottomHoldMs: activeRep.bottomHoldMs,
      avgConfidence:
        activeRep.confidenceSamples > 0
          ? activeRep.confidenceSum / activeRep.confidenceSamples
          : 0,
      reachedBottom,
    },
  }
}

interface ActiveRep {
  startFrameIndex: number
  startTimestamp: number
  minLeftKneeAngle: number | null
  minRightKneeAngle: number | null
  // ROM proxies (M19): deepest hip flexion / ankle dorsiflexion seen.
  minLeftHipAngle: number | null
  minRightHipAngle: number | null
  minLeftAnkleAngle: number | null
  minRightAnkleAngle: number | null
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
  /** Timestamp the current seated-signal streak began; null when clear. */
  seatedStreakStartTs: number | null
  seatedMovementDetected: boolean
  bottomHoldStartTimestamp: number | null
  bottomHoldMs: number
  /**
   * True once the knee re-straightened past the lockout threshold AFTER the
   * bottom. Until then, STANDING/DESCENDING phase transitions are treated as
   * mid-ascent jitter, not rep boundaries (M16: one slow ascent from a deep
   * hold was split into two counted reps).
   */
  kneeRecoveredSinceBottom: boolean
}

export interface RepCounterState {
  repCount: number
  reps: RepMetrics[]
  activeRep: ActiveRep | null
  previousPhase: SquatState
  reachedBottom: boolean
  /** Persists until next rep attempt so the debug overlay can show it. */
  lastValidation: RepValidation | null
  /** Timestamp the near-standing streak after bottom began (grace completion). */
  standingStreakStartTs: number | null
  /** Live gate blocking rep completion (debug HUD). */
  blockingGate: string | null
  /** Last failed attempt after bottom was reached (debug HUD). */
  lastMissedRepReason: string | null
  /** Diagnostic log of every rejected rep candidate this set (capped). */
  rejections: RepRejection[]
  /** Movement-specific validation gates, fixed at creation. */
  config: RepGateConfig
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

export function createRepCounterState(
  config: RepGateConfig = SQUAT_REP_GATES,
): RepCounterState {
  return {
    repCount: 0,
    reps: [],
    activeRep: null,
    previousPhase: 'STANDING',
    reachedBottom: false,
    lastValidation: null,
    standingStreakStartTs: null,
    blockingGate: null,
    lastMissedRepReason: null,
    rejections: [],
    config,
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
    if (avgKnee !== null && avgKnee <= state.config.bottomKneeAngleThreshold) {
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
    standingStreakStartTs: null,
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

function lockoutKneeThreshold(
  standingKneeBaseline: number | null,
  cfg: RepGateConfig,
): number {
  if (standingKneeBaseline !== null) {
    return Math.max(
      standingKneeBaseline - cfg.standingKneeTolerance,
      cfg.standingKneeFallback,
    )
  }
  return cfg.standingKneeFallback
}

function isNearStandingLockout(
  input: RepCounterInput,
  activeRep: ActiveRep,
  reachedBottom: boolean,
  cfg: RepGateConfig,
): boolean {
  if (!reachedBottom) return false
  if (input.phase === 'DESCENDING' || input.phase === 'BOTTOM') return false
  if (input.phase !== 'ASCENDING' && input.phase !== 'STANDING') return false

  if (input.frame.poseConfidence < cfg.minCompletionPoseConfidence) {
    return false
  }

  const avgKnee = averageKneeAngle(input.angles)
  const kneeForLockout = input.smoothedKneeAngle ?? avgKnee
  if (kneeForLockout === null) return false

  if (kneeForLockout < lockoutKneeThreshold(input.standingKneeBaseline, cfg)) {
    return false
  }

  const hipReturned =
    activeRep.startHipY !== null &&
    input.hipY !== null &&
    Math.abs(input.hipY - activeRep.startHipY) <= cfg.hipReturnTolerance

  const hipDropFromCalibrated =
    input.standingHipY !== null &&
    input.hipY !== null &&
    input.hipY - input.standingHipY <= cfg.hipDropFromCalibratedMax

  return hipReturned || hipDropFromCalibrated
}

function computeBlockingGate(
  activeRep: ActiveRep | null,
  reachedBottom: boolean,
  standingStreakMs: number,
  input: RepCounterInput,
  cfg: RepGateConfig,
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

  if (input.frame.poseConfidence < cfg.minCompletionPoseConfidence) {
    return 'Pose confidence dropped'
  }

  if (!isNearStandingLockout(input, activeRep, reachedBottom, cfg)) {
    if (input.phase === 'ASCENDING' || input.phase === 'STANDING') {
      const threshold = lockoutKneeThreshold(input.standingKneeBaseline, cfg)
      const knee = input.smoothedKneeAngle ?? averageKneeAngle(input.angles)
      if (knee !== null && knee < threshold) {
        return 'Knee angle never passed standing threshold'
      }
    }
    return 'Did not return to standing'
  }

  if (standingStreakMs < cfg.standingCompletionMs) {
    return `Awaiting standing completion (${Math.round(standingStreakMs)}ms/${cfg.standingCompletionMs}ms)`
  }

  return null
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
  minLeftHipAngle: angles.leftHip,
  minRightHipAngle: angles.rightHip,
  minLeftAnkleAngle: angles.leftAnkle,
  minRightAnkleAngle: angles.rightAnkle,
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
  seatedStreakStartTs: null,
  seatedMovementDetected: false,
  bottomHoldStartTimestamp: null,
  bottomHoldMs: 0,
  kneeRecoveredSinceBottom: false,
})

function hipLandmarksLowConfidence(
  frame: PoseFrame,
  cfg: RepGateConfig,
): boolean {
  const leftHip = frame.landmarks[LANDMARK_INDICES.LEFT_HIP]
  const rightHip = frame.landmarks[LANDMARK_INDICES.RIGHT_HIP]
  if (!leftHip || !rightHip) return true
  return (
    (leftHip.visibility ?? 0) < cfg.hipConfidenceMin ||
    (rightHip.visibility ?? 0) < cfg.hipConfidenceMin
  )
}

const updateActiveRep = (
  activeRep: ActiveRep,
  frame: PoseFrame,
  angles: JointAngles,
  phase: SquatState,
  hipY: number | null,
  cfg: RepGateConfig,
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
  const excessiveHipDrop = currentHipDrop > cfg.seatedHipDropThreshold
  const hipOccluded = hipLandmarksLowConfidence(frame, cfg)
  const seatedSignalThisFrame = excessiveHipDrop || hipOccluded

  const nextSeatedStreakStart = seatedSignalThisFrame
    ? activeRep.seatedStreakStartTs ?? frame.timestamp
    : null
  const seatedStreakMs =
    nextSeatedStreakStart === null ? 0 : frame.timestamp - nextSeatedStreakStart
  const nextSeatedDetected =
    activeRep.seatedMovementDetected || seatedStreakMs >= cfg.seatedMinMs

  // Bottom hold tracking: time spent with high hip drop
  const inHighDrop = currentHipDrop >= cfg.seatedBottomHoldHipDrop
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
    nextBottomHoldMs >= cfg.seatedBottomHoldMs &&
    nextMaxHipDrop >= cfg.seatedBottomHoldHipDrop

  return {
    ...activeRep,
    minLeftKneeAngle: minOrValue(activeRep.minLeftKneeAngle, angles.leftKnee),
    minRightKneeAngle: minOrValue(activeRep.minRightKneeAngle, angles.rightKnee),
    minLeftHipAngle: minOrValue(activeRep.minLeftHipAngle, angles.leftHip),
    minRightHipAngle: minOrValue(activeRep.minRightHipAngle, angles.rightHip),
    minLeftAnkleAngle: minOrValue(activeRep.minLeftAnkleAngle, angles.leftAnkle),
    minRightAnkleAngle: minOrValue(activeRep.minRightAnkleAngle, angles.rightAnkle),
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
    seatedStreakStartTs: nextSeatedStreakStart,
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
  cfg: RepGateConfig,
): RepValidation {
  // Bilateral bend: use average of both knees, allow configured asymmetry
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
    avgMin <= cfg.avgKneeDepthThreshold &&
    asymmetry <= cfg.bilateralAsymmetryMax

  // Hip descent
  const hipDrop =
    activeRep.startHipY !== null && activeRep.deepestHipY !== null
      ? activeRep.deepestHipY - activeRep.startHipY
      : 0
  const hipDescended = hipDrop >= cfg.minHipDescent

  // Feet stability — only catches obvious lifts
  const ankleRatio =
    activeRep.totalFrames > 0
      ? activeRep.ankleVisibleFrames / activeRep.totalFrames
      : 0
  const feetStable = ankleRatio >= cfg.ankleVisibilityRatio

  // Duration
  const validDuration =
    durationMs >= cfg.minRepDurationMs && durationMs <= cfg.maxRepDurationMs

  const avgConfidence =
    activeRep.confidenceSamples > 0
      ? activeRep.confidenceSum / activeRep.confidenceSamples
      : 0
  const confidenceOk = avgConfidence >= cfg.minRepAvgConfidence

  // Knee-lift detector: one knee bends deeply, other stays straight, hips don't move
  const isKneeLift = detectKneeLift(minLeft, minRight, hipDrop, cfg)

  // Chair / seated detection
  const seatedMovementDetected = activeRep.seatedMovementDetected
  const maxHipDrop = activeRep.maxHipDrop
  const bottomHoldMs = activeRep.bottomHoldMs

  // Descent-evidence fallback (M16, labeled tapes): quick shallow reps can
  // finish without the phase FSM ever reporting BOTTOM. Real hip descent
  // plus bilateral knee bend IS a bottom — 4 true reps were rejected as
  // "bottom not held" on the labeled suite without this.
  const descentEvidence =
    activeRep.maxHipDrop >= cfg.minHipDescentEvidence &&
    avgMin !== null &&
    avgMin <= cfg.avgKneeDepthThreshold
  const reachedBottomEffective = reachedBottom || descentEvidence

  // Bottom knee angle exactly as the report gate reads it (min of sides).
  const bottomKnee =
    minLeft !== null && minRight !== null
      ? Math.min(minLeft, minRight)
      : minLeft ?? minRight

  // ── Rejection logic ─────────────────────────────────────────────
  let rejectionReason: string | null = null

  if (!reachedBottomEffective) {
    rejectionReason = 'Bottom not held long enough'
  } else if (bottomKnee !== null && bottomKnee >= cfg.standingBottomKneeMin) {
    // No knee bend at all: a phase-jitter "bottom" while standing (M16) —
    // reject instead of counting a rep the report gate would only distrust.
    rejectionReason = 'No knee bend detected'
  } else if (!validDuration) {
    rejectionReason =
      durationMs < cfg.minRepDurationMs ? 'Too fast (<500ms)' : 'Too slow (>8s)'
  } else if (!confidenceOk) {
    rejectionReason = 'Pose confidence dropped'
  } else if (isKneeLift) {
    rejectionReason = 'Knee lift detected'
  } else if (seatedMovementDetected) {
    rejectionReason = 'Movement looked seated'
  }

  return {
    reachedBottom: reachedBottomEffective,
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
  cfg: RepGateConfig,
): boolean {
  if (minLeft === null || minRight === null) return false

  const leftDeep =
    minLeft <= cfg.kneeLiftSingleKneeMax &&
    minRight >= cfg.kneeLiftOtherKneeMin
  const rightDeep =
    minRight <= cfg.kneeLiftSingleKneeMax &&
    minLeft >= cfg.kneeLiftOtherKneeMin

  if (!leftDeep && !rightDeep) return false

  return hipDrop < cfg.kneeLiftHipDropMax
}

// ── Finalize ────────────────────────────────────────────────────────

/** Deepest of the two sides; null only when neither side was readable. */
const minOfSides = (a: number | null, b: number | null): number | null =>
  a === null ? b : b === null ? a : Math.min(a, b)

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
    bottomTimestamp: activeRep.bottomTimestamp,
    minLeftKneeAngle: activeRep.minLeftKneeAngle,
    minRightKneeAngle: activeRep.minRightKneeAngle,
    minHipAngle: minOfSides(activeRep.minLeftHipAngle, activeRep.minRightHipAngle),
    minAnkleAngle: minOfSides(activeRep.minLeftAnkleAngle, activeRep.minRightAnkleAngle),
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
  cfg: RepGateConfig,
): {
  repCount: number
  reps: RepMetrics[]
  completedRep: RepMetrics | null
  lastValidation: RepValidation
} {
  const durationMs = frame.timestamp - activeRep.startTimestamp
  const validation = validateRep(activeRep, reachedBottom, durationMs, cfg)

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
  const cfg = state.config
  let activeRep = state.activeRep
  let repCount = state.repCount
  let reps = state.reps
  let completedRep: RepMetrics | null = null
  let reachedBottom = state.reachedBottom
  let lastValidation = state.lastValidation
  let standingStreakStartTs = state.standingStreakStartTs
  let blockingGate = state.blockingGate
  let lastMissedRepReason = state.lastMissedRepReason
  let rejections = state.rejections

  const prevPhase = state.previousPhase

  // A new descent while a rep is active is a rep BOUNDARY. Exception (M16):
  // after the bottom, a DESCENDING transition BEFORE the knee ever
  // re-straightened is mid-ascent phase jitter — the same rep continues;
  // splitting here double-counted slow deep-hold reps on the labeled suite.
  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'DESCENDING' &&
    prevPhase !== 'DESCENDING' &&
    !(reachedBottom && !activeRep.kneeRecoveredSinceBottom)
  ) {
    // Give the outgoing candidate its validation shot instead of discarding
    // it blind (M16): quick shallow reps often reach the next descent
    // without a STANDING transition, and descent evidence can accept them.
    const outcome = tryFinishRep(activeRep, reachedBottom, input.frame, repCount, cfg)
    repCount = outcome.repCount
    lastValidation = outcome.lastValidation
    if (outcome.completedRep) {
      completedRep = outcome.completedRep
      reps = [...reps, completedRep]
    } else {
      const reason = outcome.lastValidation.rejectionReason ?? 'Rep rejected'
      lastMissedRepReason = reason
      rejections = [
        ...rejections,
        buildRejection(activeRep, reason, input.frame, reachedBottom, cfg),
      ].slice(-MAX_REJECTIONS)
      console.log(`[RepCounter] MISSED REP: ${reason}`)
    }
    activeRep = null
    reachedBottom = false
    standingStreakStartTs = null
  }

  // Start tracking a new rep on descent
  if (activeRep === null && input.transitioned && input.phase === 'DESCENDING') {
    activeRep = createActiveRep(input.frame, input.angles, input.hipY)
    reachedBottom = false
    standingStreakStartTs = null
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
      cfg,
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
      if (avgKnee !== null && avgKnee <= cfg.bottomKneeAngleThreshold) {
        console.log(
          `[RepCounter] BOTTOM REACHED (knee=${avgKnee.toFixed(1)}°) | frame=${input.frame.frameIndex}`,
        )
        reachedBottom = true
      }
    }
  }

  // Track knee recovery after the bottom: only a knee back past the lockout
  // threshold makes a later STANDING/DESCENDING transition a real boundary.
  if (activeRep !== null && reachedBottom && !activeRep.kneeRecoveredSinceBottom) {
    // Raw knee, not the EMA: recovery must not lag a fast stand-up, or the
    // STANDING transition gets skipped and a clip-end rep is lost.
    const recoveryKnee = averageKneeAngle(input.angles) ?? input.smoothedKneeAngle
    if (
      recoveryKnee !== null &&
      recoveryKnee >= lockoutKneeThreshold(input.standingKneeBaseline, cfg)
    ) {
      activeRep = { ...activeRep, kneeRecoveredSinceBottom: true }
    }
  }

  // Grace standing completion (does not require phase FSM lockout).
  // Time-based (M17): the near-standing hold is measured in ms so the gate
  // means the same thing at any capture rate.
  if (activeRep !== null && reachedBottom) {
    if (isNearStandingLockout(input, activeRep, reachedBottom, cfg)) {
      standingStreakStartTs = standingStreakStartTs ?? input.frame.timestamp
    } else {
      standingStreakStartTs = null
    }
  } else {
    standingStreakStartTs = null
  }
  const standingStreakMs =
    standingStreakStartTs === null
      ? 0
      : input.frame.timestamp - standingStreakStartTs

  blockingGate = computeBlockingGate(
    activeRep,
    reachedBottom,
    standingStreakMs,
    input,
    cfg,
  )

  const finishRep = (): void => {
    if (activeRep === null) return
    const outcome = tryFinishRep(
      activeRep,
      reachedBottom,
      input.frame,
      repCount,
      cfg,
    )
    repCount = outcome.repCount
    lastValidation = outcome.lastValidation
    if (outcome.completedRep) {
      completedRep = outcome.completedRep
      reps = [...reps, completedRep]
    } else {
      const reason = outcome.lastValidation.rejectionReason ?? 'Rep rejected'
      lastMissedRepReason = reason
      rejections = [
        ...rejections,
        buildRejection(activeRep, reason, input.frame, reachedBottom, cfg),
      ].slice(-MAX_REJECTIONS)
    }
    activeRep = null
    reachedBottom = false
    standingStreakStartTs = null
    blockingGate = null
  }

  if (
    activeRep !== null &&
    reachedBottom &&
    standingStreakStartTs !== null &&
    standingStreakMs >= cfg.standingCompletionMs
  ) {
    console.log(
      `[RepCounter] GRACE COMPLETION | standingMs=${Math.round(standingStreakMs)}`,
    )
    finishRep()
  }

  // Rep completion: phase detector confirmed STANDING. After a bottom, the
  // knee must have actually re-straightened (M16) — a STANDING label fired
  // mid-ascent (knee ~80°) must not finish the rep.
  if (
    activeRep !== null &&
    input.transitioned &&
    input.phase === 'STANDING' &&
    (!reachedBottom || activeRep.kneeRecoveredSinceBottom)
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
      standingStreakStartTs,
      blockingGate,
      lastMissedRepReason,
      rejections,
      config: cfg,
    },
  }
}
