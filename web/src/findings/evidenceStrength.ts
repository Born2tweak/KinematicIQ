/**
 * Evidence-strength ranking (M23) — MD04 §2/§4.5, design-review decision
 * "delete score entirely".
 *
 * Findings and cues are ordered by how far each observation exceeds its
 * documented "good" threshold (scoring/scoringConfig.ts), normalized by the
 * threshold band — NOT by internal 0–100 component scores. Strength 0 means
 * the read sat inside the good range or was unreadable; an implausible
 * knee-asymmetry read (M14 camera-view artifact) is deliberately floored so
 * a capture artifact never outranks genuine movement evidence.
 */
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_IMPLAUSIBLE,
  KNEE_ASYMMETRY_THRESHOLDS,
  TRUNK_THRESHOLDS,
} from '../scoring/scoringConfig'
import type { SetMetricsSummary } from '../session/types'
import type { FeedbackIssueKey } from '../feedback/feedbackTemplates'

/** Strength assigned to an implausible (view-artifact) asymmetry read. */
const IMPLAUSIBLE_READ_STRENGTH = 0.05

/** Canonical order for deterministic tie-breaks. */
const CANONICAL_ORDER: FeedbackIssueKey[] = [
  'depth',
  'trunkControl',
  'kneeTracking',
  'consistency',
  'symmetry',
]

/** Exceedance of `value` past `goodMax`, normalized by the good→needsWork band. */
function exceedance(
  value: number | null | undefined,
  goodMax: number,
  needsWorkMax: number,
): number {
  if (value === null || value === undefined) return 0
  const band = needsWorkMax - goodMax
  if (band <= 0) return 0
  return Math.max(0, (value - goodMax) / band)
}

export type EvidenceStrengths = Record<FeedbackIssueKey, number>

/** Per-issue evidence strength for this set (0 = nothing exceeds "good"). */
export function computeEvidenceStrengths(
  metrics: SetMetricsSummary,
): EvidenceStrengths {
  const asym = metrics.avgKneeAsymmetry
  const kneeTracking =
    asym !== null && asym >= KNEE_ASYMMETRY_IMPLAUSIBLE
      ? IMPLAUSIBLE_READ_STRENGTH
      : exceedance(
          asym,
          KNEE_ASYMMETRY_THRESHOLDS.goodMax,
          KNEE_ASYMMETRY_THRESHOLDS.needsWorkMax,
        )

  return {
    depth: exceedance(
      metrics.avgDepth,
      DEPTH_THRESHOLDS.goodMax,
      DEPTH_THRESHOLDS.needsWorkMax,
    ),
    trunkControl: exceedance(
      metrics.avgTrunkLean,
      TRUNK_THRESHOLDS.goodMax,
      TRUNK_THRESHOLDS.needsWorkMax,
    ),
    kneeTracking,
    consistency:
      metrics.repCount >= 2
        ? exceedance(
            metrics.depthCV,
            CONSISTENCY_CV_THRESHOLDS.goodMax,
            CONSISTENCY_CV_THRESHOLDS.needsWorkMax,
          )
        : 0,
    symmetry: exceedance(
      metrics.avgHipShift,
      HIP_SHIFT_THRESHOLDS.goodMax,
      HIP_SHIFT_THRESHOLDS.needsWorkMax,
    ),
  }
}

/**
 * Issues ordered by evidence strength (strongest first), canonical order as
 * the tie-break so output is deterministic. Always returns `maxCues` keys —
 * cue COUNT is unchanged from the score-based ranking; only the ORDER now
 * follows the evidence.
 */
export function rankIssuesByEvidence(
  metrics: SetMetricsSummary,
  maxCues: number,
): FeedbackIssueKey[] {
  const strengths = computeEvidenceStrengths(metrics)
  return [...CANONICAL_ORDER]
    .sort((a, b) => strengths[b] - strengths[a])
    .slice(0, maxCues)
}
