import type { ComponentScores, SetMetricsSummary } from '../session/types'
import {
  SQUAT_SCORING_CONFIG,
  type BandThresholds,
  type MovementScoringConfig,
} from './scoringConfig'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Piecewise scoring for metrics where lower raw values are better.
 *
 * - At or below excellentMax → 100
 * - excellentMax–goodMax → 100 down to 80 (linear)
 * - goodMax–needsWorkMax → 80 down to 50 (linear)
 * - Above needsWorkMax → 50 minus penalty (floor 0)
 */
function scoreLowerIsBetter(
  value: number,
  excellentMax: number,
  goodMax: number,
  needsWorkMax: number,
): number {
  if (value <= excellentMax) return 100
  if (value <= goodMax) {
    const t = (value - excellentMax) / (goodMax - excellentMax)
    return Math.round(100 - t * 20)
  }
  if (value <= needsWorkMax) {
    const t = (value - goodMax) / (needsWorkMax - goodMax)
    return Math.round(80 - t * 30)
  }
  const excess = value - needsWorkMax
  return clamp(Math.round(50 - excess * 2), 0, 49)
}

function scoreBanded(value: number, bands: BandThresholds): number {
  return scoreLowerIsBetter(
    value,
    bands.excellentMax,
    bands.goodMax,
    bands.needsWorkMax,
  )
}

function scoreDepth(avgDepth: number | null, cfg: MovementScoringConfig): number {
  if (avgDepth === null) return 0
  return scoreBanded(avgDepth, cfg.depth)
}

function scoreTrunk(avgTrunkLean: number | null, cfg: MovementScoringConfig): number {
  if (avgTrunkLean === null) return 0
  return scoreBanded(avgTrunkLean, cfg.trunk)
}

function scoreKneeTracking(
  avgKneeAsymmetry: number | null,
  cfg: MovementScoringConfig,
): number {
  if (avgKneeAsymmetry === null) return cfg.missingMetricNeutralScore
  return scoreBanded(avgKneeAsymmetry, cfg.kneeAsymmetry)
}

function scoreConsistency(
  depthCV: number | null,
  repCount: number,
  cfg: MovementScoringConfig,
): number {
  if (repCount < 2) return cfg.singleRepConsistencyScore
  if (depthCV === null) return cfg.missingMetricNeutralScore
  return scoreBanded(depthCV, cfg.consistencyCV)
}

function scoreSymmetry(
  avgHipShift: number | null,
  cfg: MovementScoringConfig,
): number {
  if (avgHipShift === null) return cfg.missingMetricNeutralScore
  return scoreBanded(avgHipShift, cfg.hipShift)
}

/**
 * Per-component scores (0–100 each) kept as evidence inputs for future
 * verdicts. There is deliberately no composite aggregation: the ontology
 * (§6 principle 15) forbids a composite score within a pattern, so no
 * weighted total or band is produced anywhere.
 */
export function computeComponentScores(
  metrics: SetMetricsSummary,
  cfg: MovementScoringConfig = SQUAT_SCORING_CONFIG,
): ComponentScores {
  return {
    depth: scoreDepth(metrics.avgDepth, cfg),
    trunkControl: scoreTrunk(metrics.avgTrunkLean, cfg),
    kneeTracking: scoreKneeTracking(metrics.avgKneeAsymmetry, cfg),
    consistency: scoreConsistency(metrics.depthCV, metrics.repCount, cfg),
    symmetry: scoreSymmetry(metrics.avgHipShift, cfg),
  }
}
