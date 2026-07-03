import type { SquatState } from '../cv/types'

/**
 * Thresholds for the cyclic phase FSM. Movement-specific — each
 * MovementProfile supplies its own instance; the exported default is
 * the bodyweight-squat tuning (see analysis/movement/profiles/squat.ts).
 */
export interface CyclicPhaseConfig {
  /** Entry into STANDING requires knees straighter than this (degrees). */
  standingKneeAngle: number
  descendingKneeAngle: number
  /** Entry into BOTTOM requires knees deeper than this (degrees). */
  bottomKneeAngle: number
  ascendingKneeAngle: number
  /** Hip-displacement thresholds (normalized 0-1 coords, Y increases downward). */
  descentStartDelta: number
  bottomDelta: number
  ascentDelta: number
  returnToStandingDelta: number
  /** Frame debouncing before a phase transition is confirmed. */
  requiredConsecutiveFrames: number
  /** Extra frames for lockout (ASCENDING -> STANDING) to avoid false reps. */
  lockoutConsecutiveFrames: number
  /** EMA alpha — higher = more responsive, lower = smoother. */
  emaAlpha: number
  /** Coast through confidence dips this long before resetting candidates. */
  confidenceDipToleranceMs: number
  /** Lockout = max(calibrated standing knee − offset, floor). */
  lockoutKneeOffset: number
  lockoutKneeFloor: number
}

/** Bodyweight-squat phase tuning (hysteresis band prevents oscillation). */
export const SQUAT_PHASE_CONFIG: CyclicPhaseConfig = {
  standingKneeAngle: 160,
  descendingKneeAngle: 145,
  bottomKneeAngle: 105,
  ascendingKneeAngle: 120,
  descentStartDelta: 0.06,
  bottomDelta: 0.14,
  ascentDelta: 0.04,
  returnToStandingDelta: 0.05,
  requiredConsecutiveFrames: 3,
  lockoutConsecutiveFrames: 4,
  emaAlpha: 0.35,
  confidenceDipToleranceMs: 500,
  lockoutKneeOffset: 12,
  lockoutKneeFloor: 152,
}

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
  /** Learned upright knee angle while in STANDING (for lockout + rep completion). */
  standingKneeAngle: number | null
  /** Timestamp (ms) of the last frame with valid knee/hip data. */
  lastValidTimestamp: number | null
  /** Movement-specific thresholds, fixed at creation. */
  config: CyclicPhaseConfig
}

export interface PhaseDetectorResult {
  phase: SquatState
  transitioned: boolean
  state: PhaseDetectorState
  /** The EMA-smoothed knee angle used for this frame's decision. */
  smoothedKneeAngle: number | null
}

export function createPhaseDetectorState(
  config: CyclicPhaseConfig = SQUAT_PHASE_CONFIG,
): PhaseDetectorState {
  return {
    phase: 'STANDING',
    candidatePhase: null,
    candidateFrameCount: 0,
    standingHipY: null,
    deepestHipY: null,
    emaKneeAngle: null,
    standingKneeAngle: null,
    lastValidTimestamp: null,
    config,
  }
}

/** Standing lockout threshold from calibrated upright knee (movement-specific, not global loosening). */
export function standingKneeThreshold(state: PhaseDetectorState): number {
  const cfg = state.config
  if (state.standingKneeAngle !== null) {
    return Math.max(
      state.standingKneeAngle - cfg.lockoutKneeOffset,
      cfg.lockoutKneeFloor,
    )
  }
  return cfg.standingKneeAngle
}

function updateStandingKneeBaseline(
  phase: SquatState,
  smoothedKnee: number | null,
  prev: number | null,
): number | null {
  if (phase !== 'STANDING' || smoothedKnee === null) return prev
  if (prev === null) return smoothedKnee
  return 0.92 * prev + 0.08 * smoothedKnee
}

// ── EMA helper ─────────────────────────────────────────────────────
function applyEma(
  prev: number | null,
  raw: number | null,
  alpha: number,
): number | null {
  if (raw === null) return prev
  if (prev === null) return raw
  return alpha * raw + (1 - alpha) * prev
}

// ── Target phase resolution (uses smoothed angle) ──────────────────
const getTargetPhase = (
  phase: SquatState,
  kneeAngle: number | null,
  hipY: number | null,
  standingHipY: number | null,
  deepestHipY: number | null,
  standingKneeBaseline: number | null,
  cfg: CyclicPhaseConfig,
): SquatState => {
  const lockoutKnee = standingKneeBaseline !== null
    ? Math.max(standingKneeBaseline - cfg.lockoutKneeOffset, cfg.lockoutKneeFloor)
    : cfg.standingKneeAngle
  const hipDrop =
    hipY === null || standingHipY === null ? null : hipY - standingHipY

  switch (phase) {
    case 'STANDING':
      if (
        (hipDrop !== null && hipDrop > cfg.descentStartDelta) ||
        (kneeAngle !== null && kneeAngle < cfg.descendingKneeAngle)
      ) {
        return 'DESCENDING'
      }
      return 'STANDING'

    case 'DESCENDING':
      if (
        (hipDrop !== null && hipDrop >= cfg.bottomDelta) ||
        (kneeAngle !== null && kneeAngle <= cfg.bottomKneeAngle)
      ) {
        return 'BOTTOM'
      }
      // Escape hatch: if knees straighten back to standing, allow exit
      if (kneeAngle !== null && kneeAngle >= lockoutKnee) {
        return 'STANDING'
      }
      return 'DESCENDING'

    case 'BOTTOM':
      if (
        hipY !== null &&
        deepestHipY !== null &&
        deepestHipY - hipY >= cfg.ascentDelta
      ) {
        return 'ASCENDING'
      }
      if (kneeAngle !== null && kneeAngle > cfg.ascendingKneeAngle) {
        return 'ASCENDING'
      }
      return 'BOTTOM'

    case 'ASCENDING':
      if (
        (hipDrop !== null && hipDrop <= cfg.returnToStandingDelta) ||
        (kneeAngle !== null && kneeAngle >= lockoutKnee)
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
  const cfg = state.config
  const smoothedKnee = applyEma(state.emaKneeAngle, input.kneeAngle, cfg.emaAlpha)
  const hasValidData = input.kneeAngle !== null || input.hipY !== null

  // ── Confidence dip persistence ───────────────────────────────────
  // If this frame has no usable data, check whether we're within the
  // tolerance window. If so, coast — keep state and candidates
  // intact so a brief tracking glitch doesn't blow away progress.
  if (!hasValidData) {
    const withinTolerance =
      state.lastValidTimestamp !== null &&
      input.timestamp - state.lastValidTimestamp < cfg.confidenceDipToleranceMs

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
  const standingKneeAngle = updateStandingKneeBaseline(
    state.phase,
    smoothedKnee,
    state.standingKneeAngle,
  )

  const targetPhase = getTargetPhase(
    state.phase,
    smoothedKnee,
    input.hipY,
    standingHipY,
    deepestHipY,
    standingKneeAngle,
    cfg,
  )

  // ── No transition requested ──────────────────────────────────────
  if (targetPhase === state.phase) {
    const nextStandingHipY =
      state.phase === 'STANDING' &&
      input.hipY !== null &&
      (standingHipY === null ||
        Math.abs(input.hipY - standingHipY) <= cfg.returnToStandingDelta)
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
        standingKneeAngle,
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
      ? cfg.lockoutConsecutiveFrames
      : cfg.requiredConsecutiveFrames

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
        standingKneeAngle,
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
      standingKneeAngle,
      lastValidTimestamp,
      config: cfg,
    },
    smoothedKneeAngle: smoothedKnee,
  }
}
