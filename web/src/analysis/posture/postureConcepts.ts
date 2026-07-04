import type {
  ConfidenceLevel,
  SetMetricsSummary,
} from '../../session/types'
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_THRESHOLDS,
  TRUNK_THRESHOLDS,
} from '../../scoring/scoringConfig'
import type { PostureSetSummary } from './postureCollector'

/**
 * Posture concepts: coach-vocabulary reads derived from set metrics.
 * These are observations, never diagnoses — copy must follow
 * docs/strategy/safety-claims.md (observation verbs, set-scoped,
 * confidence attached).
 */

export type PostureConceptId =
  | 'workingDepth'
  | 'tallChest'
  | 'evenBase'
  | 'evenDrive'
  | 'repeatable'
  | 'hingeStrategy'
  | 'spineStability'
  | 'smoothness'
  | 'deviation'

export type PostureConceptStatus = 'ok' | 'watch' | 'info' | 'unavailable'

/** Hinge ratio ≥ this = hip-led pattern; ≤ inverse threshold = knee-led. */
export const HINGE_HIP_LED_MIN = 1.15
export const HINGE_KNEE_LED_MAX = 0.85

/** Trunk-angle drift (std dev, degrees) above this is worth a look. */
export const TRUNK_DRIFT_WATCH_DEG = 6

/**
 * Normalized-jerk watch threshold. Expert-review tier and unvalidated —
 * used only for within-set qualitative banding, never a measurement claim.
 */
export const SMOOTHNESS_WATCH_NJ = 150

const CONFIDENCE_ORDER: Record<ConfidenceLevel, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
}

/** Cap a confidence level (expert-review-tier concepts never claim High). */
function capConfidence(
  level: ConfidenceLevel,
  cap: ConfidenceLevel,
): ConfidenceLevel {
  return CONFIDENCE_ORDER[level] <= CONFIDENCE_ORDER[cap] ? level : cap
}

export interface PostureConcept {
  id: PostureConceptId
  /** Coach-vocabulary name of the concept. */
  label: string
  status: PostureConceptStatus
  /** Observation-language summary of what the camera saw in this set. */
  observation: string
  confidence: ConfidenceLevel
}

const UNAVAILABLE_OBSERVATION =
  'Not enough tracked data in this set to read this.'

function concept(
  id: PostureConceptId,
  label: string,
  status: PostureConceptStatus,
  observation: string,
  confidence: ConfidenceLevel,
): PostureConcept {
  return { id, label, status, observation, confidence }
}

/**
 * Derive the posture profile from a set summary plus (optionally) the
 * 3D posture reads. 2D boundaries reuse the per-component thresholds
 * ("good" band = ok) so the chips stay consistent with the component
 * evidence. 3D concepts render only when the data was actually usable,
 * and their confidence is capped to their validation tier
 * (docs/strategy/validation-strategy.md).
 */
export function buildPostureConcepts(
  metrics: SetMetricsSummary,
  sessionConfidence: ConfidenceLevel,
  posture: PostureSetSummary | null = null,
): PostureConcept[] {
  const concepts: PostureConcept[] = []

  if (metrics.avgDepth === null) {
    concepts.push(
      concept(
        'workingDepth',
        'Working depth',
        'unavailable',
        UNAVAILABLE_OBSERVATION,
        'Low',
      ),
    )
  } else {
    const depth = Math.round(metrics.avgDepth)
    const ok = metrics.avgDepth <= DEPTH_THRESHOLDS.goodMax
    concepts.push(
      concept(
        'workingDepth',
        'Working depth',
        ok ? 'ok' : 'watch',
        ok
          ? `Bottom-of-rep knee angle averaged ${depth}° — working depth looks solid in this set.`
          : `Bottom-of-rep knee angle averaged ${depth}° — depth appears shallow in this set.`,
        sessionConfidence,
      ),
    )
  }

  if (metrics.avgTrunkLean === null) {
    concepts.push(
      concept(
        'tallChest',
        'Tall chest',
        'unavailable',
        UNAVAILABLE_OBSERVATION,
        'Low',
      ),
    )
  } else {
    const lean = Math.round(metrics.avgTrunkLean)
    const ok = metrics.avgTrunkLean <= TRUNK_THRESHOLDS.goodMax
    concepts.push(
      concept(
        'tallChest',
        'Tall chest',
        ok ? 'ok' : 'watch',
        ok
          ? `Trunk stayed near ${lean}° from vertical — chest appears tall through this set.`
          : `Trunk averaged ${lean}° from vertical — chest appears to drop forward in this set.`,
        sessionConfidence,
      ),
    )
  }

  if (metrics.avgHipShift === null) {
    concepts.push(
      concept(
        'evenBase',
        'Even base',
        'unavailable',
        UNAVAILABLE_OBSERVATION,
        'Low',
      ),
    )
  } else {
    const ok = metrics.avgHipShift <= HIP_SHIFT_THRESHOLDS.goodMax
    concepts.push(
      concept(
        'evenBase',
        'Even base',
        ok ? 'ok' : 'watch',
        ok
          ? 'Hips appear centered over your base at the bottom in this set.'
          : 'Hips appear shifted to one side at the bottom in this set.',
        sessionConfidence,
      ),
    )
  }

  if (metrics.avgKneeAsymmetry === null) {
    concepts.push(
      concept(
        'evenDrive',
        'Even drive',
        'unavailable',
        UNAVAILABLE_OBSERVATION,
        'Low',
      ),
    )
  } else {
    const diff = Math.round(metrics.avgKneeAsymmetry)
    const ok = metrics.avgKneeAsymmetry <= KNEE_ASYMMETRY_THRESHOLDS.goodMax
    concepts.push(
      concept(
        'evenDrive',
        'Even drive',
        ok ? 'ok' : 'watch',
        ok
          ? 'Left and right knees appear to bend evenly in this set.'
          : `Left and right knee bend differs by about ${diff}° in this set.`,
        sessionConfidence,
      ),
    )
  }

  if (metrics.depthCV === null) {
    concepts.push(
      concept(
        'repeatable',
        'Repeatable',
        'unavailable',
        UNAVAILABLE_OBSERVATION,
        'Low',
      ),
    )
  } else {
    const cv = Math.round(metrics.depthCV)
    const ok = metrics.depthCV <= CONSISTENCY_CV_THRESHOLDS.goodMax
    concepts.push(
      concept(
        'repeatable',
        'Repeatable',
        ok ? 'ok' : 'watch',
        ok
          ? `Depth varied ${cv}% rep to rep — a repeatable pattern in this set.`
          : `Depth varied ${cv}% rep to rep — the pattern appears inconsistent in this set.`,
        sessionConfidence,
      ),
    )
  }

  if (posture) {
    appendPostureDepthConcepts(concepts, posture, sessionConfidence)
  }

  return concepts
}

/** 3D-derived concepts (Phase 2). Omitted entirely when data was unusable. */
function appendPostureDepthConcepts(
  concepts: PostureConcept[],
  posture: PostureSetSummary,
  sessionConfidence: ConfidenceLevel,
): void {
  if (posture.avgHingeRatio !== null) {
    const ratio = posture.avgHingeRatio
    const observation =
      ratio >= HINGE_HIP_LED_MIN
        ? 'You appear to bend more at the hips than the knees in this set — a hip-led pattern.'
        : ratio <= HINGE_KNEE_LED_MAX
          ? 'You appear to bend more at the knees than the hips in this set — a knee-led pattern.'
          : 'Hip and knee bend appear balanced in this set.'
    concepts.push(
      concept(
        'hingeStrategy',
        'Hinge vs squat',
        'info',
        observation,
        capConfidence(sessionConfidence, 'Medium'),
      ),
    )
  }

  if (posture.avgTrunkVariability !== null) {
    const ok = posture.avgTrunkVariability <= TRUNK_DRIFT_WATCH_DEG
    concepts.push(
      concept(
        'spineStability',
        'Stable trunk',
        ok ? 'ok' : 'watch',
        ok
          ? 'Trunk angle appears steady through each rep in this set (trunk-level read only).'
          : 'Trunk angle appears to drift within reps in this set (trunk-level read only).',
        // Markerless video cannot resolve spine segments — always Low.
        'Low',
      ),
    )
  }

  if (posture.avgNormalizedJerk !== null) {
    const ok = posture.avgNormalizedJerk <= SMOOTHNESS_WATCH_NJ
    concepts.push(
      concept(
        'smoothness',
        'Smooth movement',
        ok ? 'ok' : 'watch',
        ok
          ? 'Hip path appears smooth through the reps in this set.'
          : 'Hip path appears to lose momentum mid-rep in this set.',
        capConfidence(sessionConfidence, 'Medium'),
      ),
    )
  }

  if (posture.mostDeviantRep !== null) {
    concepts.push(
      concept(
        'deviation',
        `Rep ${posture.mostDeviantRep} stands out`,
        'info',
        `Rep ${posture.mostDeviantRep} appears to differ most from your own pattern in this set — worth a second look.`,
        sessionConfidence,
      ),
    )
  }
}
