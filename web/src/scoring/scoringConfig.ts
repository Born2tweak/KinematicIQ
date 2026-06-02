import type { ScoreBand } from '../session/types'

/**
 * How much each component contributes to the total score (must sum to 1.0).
 * Depth and trunk matter most for a side-view bodyweight squat read.
 */
export const SCORE_WEIGHTS = {
  depth: 0.3,
  trunkControl: 0.25,
  kneeTracking: 0.2,
  consistency: 0.15,
  symmetry: 0.1,
} as const

/** Total score → user-facing band labels. */
export const TOTAL_SCORE_BAND_THRESHOLDS = {
  /** 80–100: strong set on all weighted components. */
  excellentMin: 80,
  /** 60–79: solid with clear room in one or two areas. */
  goodMin: 60,
  /** 40–59: several components below target. */
  needsWorkMin: 40,
  /** 0–39: multiple limiting factors in this camera view. */
} as const

/**
 * Depth — average minimum knee angle across reps (degrees).
 * Smaller angle = deeper squat (more hip/knee flexion).
 *
 * Reference (side view, approximate):
 * - ≤90°: deep (thigh near parallel or below)
 * - 90–110°: good working depth
 * - 110–130°: shallow / above parallel
 * - >130°: very limited depth for scoring
 */
export const DEPTH_THRESHOLDS = {
  excellentMax: 90,
  goodMax: 110,
  needsWorkMax: 130,
} as const

/**
 * Trunk control — average forward lean from vertical (degrees).
 * Measured shoulder-to-hip angle; higher = more chest pitch.
 *
 * - ≤30°: upright torso through the set
 * - 30–45°: moderate lean, common on squats
 * - 45–60°: pronounced forward lean
 * - >60°: heavy lean; score drops quickly
 */
export const TRUNK_THRESHOLDS = {
  excellentMax: 30,
  goodMax: 45,
  needsWorkMax: 60,
} as const

/**
 * Knee tracking — average |left min knee − right min knee| per rep (degrees).
 * Proxy for even loading; not a medical valgus diagnosis.
 *
 * - ≤8°: even bend side to side
 * - 8–15°: noticeable mismatch
 * - 15–25°: strong asymmetry
 * - >25°: large left/right difference
 */
export const KNEE_ASYMMETRY_THRESHOLDS = {
  excellentMax: 8,
  goodMax: 15,
  needsWorkMax: 25,
} as const

/**
 * Consistency — coefficient of variation of per-rep depth (%).
 * std dev of bottom knee angles ÷ mean × 100. Lower = more repeatable depth.
 *
 * Requires ≥2 tracked reps; single-rep sets use a neutral default (see scoringEngine).
 *
 * - ≤5%: very repeatable depth
 * - 5–10%: normal rep-to-rep variation
 * - 10–20%: inconsistent depth
 * - >20%: large spread between reps
 */
export const CONSISTENCY_CV_THRESHOLDS = {
  excellentMax: 5,
  goodMax: 10,
  needsWorkMax: 20,
} as const

/**
 * Symmetry — average horizontal hip shift at bottom (0–1 of frame width).
 * 0 = centered over base; higher = weight shifted sideways in the image.
 *
 * - ≤0.02: hips near midline
 * - 0.02–0.05: slight shift
 * - 0.05–0.10: clear lateral bias
 * - >0.10: strong off-center pattern
 */
export const HIP_SHIFT_THRESHOLDS = {
  excellentMax: 0.02,
  goodMax: 0.05,
  needsWorkMax: 0.1,
} as const

/**
 * Observation confidence — from rep landmark quality + live pose samples (0–100).
 * Low confidence suppresses coaching cues and shows a warning on results.
 */
export const SESSION_CONFIDENCE_THRESHOLDS = {
  /** ≥75: metrics and cues treated as reliable for this setup. */
  highMin: 75,
  /** 50–74: scores shown with directional disclaimer. */
  mediumMin: 50,
  /** <50: insufficient data — total score shown but no coaching cards. */
} as const

/** Default component score when a metric cannot be measured (neutral, not punitive). */
export const MISSING_METRIC_NEUTRAL_SCORE = 50

/** Consistency score when only one rep was tracked (cannot compute CV). */
export const SINGLE_REP_CONSISTENCY_SCORE = 70

export function bandFromScore(score: number): ScoreBand {
  if (score >= TOTAL_SCORE_BAND_THRESHOLDS.excellentMin) return 'Excellent'
  if (score >= TOTAL_SCORE_BAND_THRESHOLDS.goodMin) return 'Good'
  if (score >= TOTAL_SCORE_BAND_THRESHOLDS.needsWorkMin) return 'Needs Work'
  return 'Poor'
}
