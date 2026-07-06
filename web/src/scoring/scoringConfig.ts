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
 * Average L/R bottom-knee difference at or above this is treated as a
 * camera-view artifact, not a movement read: from an angled view the far
 * knee is read through the near leg, which exaggerates the gap. Driven by
 * the 2026-07-06 batch eval, where a 61° "asymmetry" on an angled stock
 * clip was reported as High-confidence coaching.
 */
export const KNEE_ASYMMETRY_IMPLAUSIBLE = 45

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
  /** 50–74: component reads shown with directional disclaimer. */
  mediumMin: 50,
  /** <50: insufficient data — reads shown as rough only, no coaching cards. */
} as const

/** Default component score when a metric cannot be measured (neutral, not punitive). */
export const MISSING_METRIC_NEUTRAL_SCORE = 50

/** Consistency score when only one rep was tracked (cannot compute CV). */
export const SINGLE_REP_CONSISTENCY_SCORE = 70

/** Lower-is-better banding shared by every scored component. */
export interface BandThresholds {
  excellentMax: number
  goodMax: number
  needsWorkMax: number
}

/**
 * The full scoring surface for one movement. Squat's instance bundles
 * the constants above; other MovementProfiles supply their own
 * (see analysis/movement/profiles/).
 */
export interface MovementScoringConfig {
  depth: BandThresholds
  trunk: BandThresholds
  kneeAsymmetry: BandThresholds
  consistencyCV: BandThresholds
  hipShift: BandThresholds
  missingMetricNeutralScore: number
  singleRepConsistencyScore: number
}

/** Bodyweight-squat scoring configuration. */
export const SQUAT_SCORING_CONFIG: MovementScoringConfig = {
  depth: DEPTH_THRESHOLDS,
  trunk: TRUNK_THRESHOLDS,
  kneeAsymmetry: KNEE_ASYMMETRY_THRESHOLDS,
  consistencyCV: CONSISTENCY_CV_THRESHOLDS,
  hipShift: HIP_SHIFT_THRESHOLDS,
  missingMetricNeutralScore: MISSING_METRIC_NEUTRAL_SCORE,
  singleRepConsistencyScore: SINGLE_REP_CONSISTENCY_SCORE,
}
