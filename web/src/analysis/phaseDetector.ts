import type { SquatState } from '../cv/types'

// ── Hysteresis thresholds ──────────────────────────────────────────
// Wide band prevents oscillation between adjacent states.
// Entry into STANDING requires knees straighter than 160°.
// Entry into BOTTOM requires knees deeper than 105°.
const STANDING_KNEE_ANGLE = 160
const DESCENDING_KNEE_ANGLE = 145
const BOTTOM_KNEE_ANGLE = 105
const ASCENDING_KNEE_ANGLE = 120

// Hip-displacement thresholds (normalized 0-1 coords, Y increases downward)
const DESCENT_START_DELTA = 0.06
const BOTTOM_DELTA = 0.14
const ASCENT_DELTA = 0.04
const RETURN_TO_STANDING_DELTA = 0.05

// ── Frame debouncing ───────────────────────────────────────────────
const REQUIRED_CONSECUTIVE_FRAMES = 3
/** Extra frames required for lockout (ASCENDING -> STANDING) to avoid false reps. */
const LOCKOUT_CONSECUTIVE_FRAMES = 5

// ── EMA smoothing ──────────────────────────────────────────────────
/** EMA alpha — higher = more responsive, lower = smoother. 0.35 is ~3-frame lag. */
const EMA_ALPHA = 0.35

// ── Confidence dip persistence ─────────────────────────────────────
/** Coast through confidence dips for up to 500 ms before resetting candidates. */
const CONFIDENCE_DIP_TOLERANCE_MS = 500

export interface PhaseDetectorInput {
  kneeAngle: number | null
  hipY: number | null
  /** Current wall-clock timestamp from performance.now(). */
  timestamp: number
}

export interface PhaseDetectorState {
  phase: SquatState
  candidatePhase: SquatState | null
  candidateFrameCount: number
  standingHipY: number | null
  deepestHipY: number | null
  /** EMA-smoothed knee angle. null until the first valid reading. */
  emaKneeAngle: number | null
  /** Timestamp (ms) of the last frame with valid knee/hip data. */
  lastValidTimestamp: number | null
}

export interface PhaseDetectorResult {
  phase: SquatState
  transitioned: boolean
  state: PhaseDetectorState
  /** The EMA-smoothed knee angle used for this frame's decision. */
  smoothedKneeAngle: number | null
}

export function createPhaseDetectorState(): PhaseDetectorState {
  return {
    phase: 'STANDING',
    candidatePhase: null,
    candidateFrameCount: 0,
    standingHipY: null,
    deepestHipY: null,
    emaKneeAngle: null,
    lastValidTimestamp: null,
  }
}

// ── EMA helper ─────────────────────────────────────────────────────
function applyEma(prev: number | null, raw: number | null): number | null {
  if (raw === null) return prev
  if (prev === null) return raw
  return EMA_ALPHA * raw + (1 - EMA_ALPHA) * prev
}

// ── Target phase resolution (uses smoothed angle) ──────────────────
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

// ── Main update ────────────────────────────────────────────────────
export function updatePhaseDetector(
  state: PhaseDetectorState,
  input: PhaseDetectorInput,
): PhaseDetectorResult {
  const smoothedKnee = applyEma(state.emaKneeAngle, input.kneeAngle)
  const hasValidData = input.kneeAngle !== null || input.hipY !== null

  // ── Confidence dip persistence ───────────────────────────────────
  // If this frame has no usable data, check whether we're within the
  // 500 ms tolerance window. If so, coast — keep state and candidates
  // intact so a brief tracking glitch doesn't blow away progress.
  if (!hasValidData) {
    const withinTolerance =
      state.lastValidTimestamp !== null &&
      input.timestamp - state.lastValidTimestamp < CONFIDENCE_DIP_TOLERANCE_MS

    if (withinTolerance) {
      // Coast: return previous phase unchanged, preserve all state
      return {
        phase: state.phase,
        transitioned: false,
        state: {
          ...state,
          emaKneeAngle: smoothedKnee,
        },
        smoothedKneeAngle: smoothedKnee,
      }
    }

    // Past tolerance — reset candidates but keep phase
    return {
      phase: state.phase,
      transitioned: false,
      state: {
        ...state,
        candidatePhase: null,
        candidateFrameCount: 0,
        emaKneeAngle: smoothedKnee,
      },
      smoothedKneeAngle: smoothedKnee,
    }
  }

  // We have valid data — update lastValidTimestamp
  const lastValidTimestamp = input.timestamp

  const standingHipY = state.standingHipY ?? input.hipY
  const currentDeepestHipY =
    state.phase === 'STANDING'
      ? input.hipY
      : Math.max(
          state.deepestHipY ?? Number.NEGATIVE_INFINITY,
          input.hipY ?? Number.NEGATIVE_INFINITY,
        )
  const deepestHipY = Number.isFinite(currentDeepestHipY)
    ? currentDeepestHipY
    : state.deepestHipY

  // Use EMA-smoothed knee angle for phase decisions
  const targetPhase = getTargetPhase(
    state.phase,
    smoothedKnee,
    input.hipY,
    standingHipY,
    deepestHipY,
  )

  // ── No transition requested ──────────────────────────────────────
  if (targetPhase === state.phase) {
    const nextStandingHipY =
      state.phase === 'STANDING' &&
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
        deepestHipY: state.phase === 'STANDING' ? input.hipY : deepestHipY,
        emaKneeAngle: smoothedKnee,
        lastValidTimestamp,
      },
      smoothedKneeAngle: smoothedKnee,
    }
  }

  // ── Candidate debouncing ─────────────────────────────────────────
  const candidateFrameCount =
    state.candidatePhase === targetPhase ? state.candidateFrameCount + 1 : 1

  // Require more consecutive frames for lockout to prevent false rep completions
  const requiredFrames =
    state.phase === 'ASCENDING' && targetPhase === 'STANDING'
      ? LOCKOUT_CONSECUTIVE_FRAMES
      : REQUIRED_CONSECUTIVE_FRAMES

  if (candidateFrameCount < requiredFrames) {
    return {
      phase: state.phase,
      transitioned: false,
      state: {
        ...state,
        candidatePhase: targetPhase,
        candidateFrameCount,
        standingHipY,
        deepestHipY,
        emaKneeAngle: smoothedKnee,
        lastValidTimestamp,
      },
      smoothedKneeAngle: smoothedKnee,
    }
  }

  // ── Transition confirmed ─────────────────────────────────────────
  console.log(
    `[PhaseDetector] TRANSITION: ${state.phase} -> ${targetPhase} | emaKnee=${smoothedKnee?.toFixed(1)} rawKnee=${input.kneeAngle?.toFixed(1)} hipY=${input.hipY?.toFixed(4)} standingHipY=${standingHipY?.toFixed(4)} hipDrop=${(input.hipY !== null && standingHipY !== null ? input.hipY - standingHipY : null)?.toFixed(4)}`,
  )

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
      emaKneeAngle: smoothedKnee,
      lastValidTimestamp,
    },
    smoothedKneeAngle: smoothedKnee,
  }
}
