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

export type PostureConceptStatus = 'ok' | 'watch' | 'unavailable'

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
 * Derive the posture profile from an existing set summary.
 * Boundaries reuse the scoring thresholds ("good" band = ok) so the
 * chips and the numeric score never disagree.
 */
export function buildPostureConcepts(
  metrics: SetMetricsSummary,
  sessionConfidence: ConfidenceLevel,
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

  return concepts
}
