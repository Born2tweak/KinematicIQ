import type { ComponentScores, ScoringResult, SetMetricsSummary } from '../session/types'
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_THRESHOLDS,
  SCORE_WEIGHTS,
  TRUNK_THRESHOLDS,
  bandFromScore,
} from './scoringConfig'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/** Lower measured value is better (depth angle, trunk lean, CV, asymmetry). */
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

function scoreDepth(avgDepth: number | null): number {
  if (avgDepth === null) return 0
  return scoreLowerIsBetter(
    avgDepth,
    DEPTH_THRESHOLDS.excellentMax,
    DEPTH_THRESHOLDS.goodMax,
    DEPTH_THRESHOLDS.needsWorkMax,
  )
}

function scoreTrunk(avgTrunkLean: number | null): number {
  if (avgTrunkLean === null) return 0
  return scoreLowerIsBetter(
    avgTrunkLean,
    TRUNK_THRESHOLDS.excellentMax,
    TRUNK_THRESHOLDS.goodMax,
    TRUNK_THRESHOLDS.needsWorkMax,
  )
}

function scoreKneeTracking(avgKneeAsymmetry: number | null): number {
  if (avgKneeAsymmetry === null) return 50
  return scoreLowerIsBetter(
    avgKneeAsymmetry,
    KNEE_ASYMMETRY_THRESHOLDS.excellentMax,
    KNEE_ASYMMETRY_THRESHOLDS.goodMax,
    KNEE_ASYMMETRY_THRESHOLDS.needsWorkMax,
  )
}

function scoreConsistency(depthCV: number | null, repCount: number): number {
  if (repCount < 2) return 70
  if (depthCV === null) return 50
  return scoreLowerIsBetter(
    depthCV,
    CONSISTENCY_CV_THRESHOLDS.excellentMax,
    CONSISTENCY_CV_THRESHOLDS.goodMax,
    CONSISTENCY_CV_THRESHOLDS.needsWorkMax,
  )
}

function scoreSymmetry(avgHipShift: number | null): number {
  if (avgHipShift === null) return 50
  return scoreLowerIsBetter(
    avgHipShift,
    HIP_SHIFT_THRESHOLDS.excellentMax,
    HIP_SHIFT_THRESHOLDS.goodMax,
    HIP_SHIFT_THRESHOLDS.needsWorkMax,
  )
}

export function computeComponentScores(metrics: SetMetricsSummary): ComponentScores {
  return {
    depth: scoreDepth(metrics.avgDepth),
    trunkControl: scoreTrunk(metrics.avgTrunkLean),
    kneeTracking: scoreKneeTracking(metrics.avgKneeAsymmetry),
    consistency: scoreConsistency(metrics.depthCV, metrics.repCount),
    symmetry: scoreSymmetry(metrics.avgHipShift),
  }
}

export function scoreSet(metrics: SetMetricsSummary): ScoringResult {
  const components = computeComponentScores(metrics)
  const totalScore = Math.round(
    components.depth * SCORE_WEIGHTS.depth +
      components.trunkControl * SCORE_WEIGHTS.trunkControl +
      components.kneeTracking * SCORE_WEIGHTS.kneeTracking +
      components.consistency * SCORE_WEIGHTS.consistency +
      components.symmetry * SCORE_WEIGHTS.symmetry,
  )

  return {
    totalScore: clamp(totalScore, 0, 100),
    band: bandFromScore(totalScore),
    components,
  }
}
