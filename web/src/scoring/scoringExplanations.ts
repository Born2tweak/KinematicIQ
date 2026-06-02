import type { ComponentScores, SetMetricsSummary } from '../session/types'
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_THRESHOLDS,
  SCORE_WEIGHTS,
  TRUNK_THRESHOLDS,
} from './scoringConfig'

export type ComponentKey = keyof ComponentScores

export interface ComponentScoreExplanation {
  key: ComponentKey
  label: string
  score: number
  /** Share of total score (e.g. 30). */
  weightPercent: number
  measured: string
  explanation: string
}

const LABELS: Record<ComponentKey, string> = {
  depth: 'Depth',
  trunkControl: 'Trunk control',
  kneeTracking: 'Knee tracking',
  consistency: 'Consistency',
  symmetry: 'Symmetry',
}

function scoreTier(
  value: number,
  excellentMax: number,
  goodMax: number,
  needsWorkMax: number,
): 'strong' | 'moderate' | 'limiting' {
  if (value <= excellentMax) return 'strong'
  if (value <= goodMax) return 'moderate'
  if (value <= needsWorkMax) return 'moderate'
  return 'limiting'
}

function depthExplanation(metrics: SetMetricsSummary, score: number): Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'> {
  const avg = metrics.avgDepth
  const weightPercent = Math.round(SCORE_WEIGHTS.depth * 100)

  if (avg === null) {
    return {
      score,
      measured: 'Bottom knee angle not readable on every rep.',
      explanation:
        'Depth could not be scored reliably. Missing depth data lowers this component and the total score.',
    }
  }

  const tier = scoreTier(
    avg,
    DEPTH_THRESHOLDS.excellentMax,
    DEPTH_THRESHOLDS.goodMax,
    DEPTH_THRESHOLDS.needsWorkMax,
  )
  const measured = `Average bottom knee bend: ${Math.round(avg)}°${
    metrics.minDepth !== null && metrics.maxDepth !== null
      ? ` (range ${Math.round(metrics.minDepth)}°–${Math.round(metrics.maxDepth)}°)`
      : ''
  }.`

  if (tier === 'strong') {
    return {
      score,
      measured,
      explanation: `At or below the ${DEPTH_THRESHOLDS.goodMax}° target, depth counted as a strength (${weightPercent}% of your total).`,
    }
  }
  if (tier === 'limiting') {
    return {
      score,
      measured,
      explanation: `Above ~${DEPTH_THRESHOLDS.goodMax}° reads as shallow from the side camera. That reduced the depth component (${weightPercent}% of total).`,
    }
  }
  return {
    score,
    measured,
    explanation: `Between deep and shallow targets (${DEPTH_THRESHOLDS.excellentMax}°–${DEPTH_THRESHOLDS.needsWorkMax}° band). Moderate depth score (${weightPercent}% of total).`,
  }
}

function trunkExplanation(metrics: SetMetricsSummary, score: number): Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'> {
  const avg = metrics.avgTrunkLean
  const weightPercent = Math.round(SCORE_WEIGHTS.trunkControl * 100)

  if (avg === null) {
    return {
      score,
      measured: 'Trunk angle not visible on every rep.',
      explanation: `Trunk control contributes ${weightPercent}% of the total; missing data held this score down.`,
    }
  }

  const tier = scoreTier(
    avg,
    TRUNK_THRESHOLDS.excellentMax,
    TRUNK_THRESHOLDS.goodMax,
    TRUNK_THRESHOLDS.needsWorkMax,
  )
  const measured = `Average forward lean: ${Math.round(avg)}° from vertical.`

  if (tier === 'strong') {
    return {
      score,
      measured,
      explanation: `Chest stayed relatively upright (≤${TRUNK_THRESHOLDS.excellentMax}° lean target). Strong trunk score (${weightPercent}% of total).`,
    }
  }
  if (tier === 'limiting') {
    return {
      score,
      measured,
      explanation: `Lean above ${TRUNK_THRESHOLDS.goodMax}° pulled trunk control down (${weightPercent}% of total).`,
    }
  }
  return {
    score,
    measured,
    explanation: `Moderate trunk angle for this set (${weightPercent}% of total).`,
  }
}

function kneeExplanation(metrics: SetMetricsSummary, score: number): Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'> {
  const asym = metrics.avgKneeAsymmetry
  const weightPercent = Math.round(SCORE_WEIGHTS.kneeTracking * 100)

  if (asym === null) {
    return {
      score,
      measured: 'Left/right knee bend not clear on both sides.',
      explanation: `Neutral knee-tracking score applied (${weightPercent}% weight) — not enough side-by-side data.`,
    }
  }

  const tier = scoreTier(
    asym,
    KNEE_ASYMMETRY_THRESHOLDS.excellentMax,
    KNEE_ASYMMETRY_THRESHOLDS.goodMax,
    KNEE_ASYMMETRY_THRESHOLDS.needsWorkMax,
  )
  const measured = `Average left–right knee difference at bottom: ${Math.round(asym)}°.`

  if (tier === 'strong') {
    return {
      score,
      measured,
      explanation: `Even knee bend (≤${KNEE_ASYMMETRY_THRESHOLDS.excellentMax}° difference). Helped the total via ${weightPercent}% weighting.`,
    }
  }
  if (tier === 'limiting') {
    return {
      score,
      measured,
      explanation: `Asymmetry above ${KNEE_ASYMMETRY_THRESHOLDS.goodMax}° lowered knee tracking (${weightPercent}% of total). This reflects uneven bend, not a clinical diagnosis.`,
    }
  }
  return {
    score,
    measured,
    explanation: `Some left–right mismatch (${weightPercent}% of total).`,
  }
}

function consistencyExplanation(metrics: SetMetricsSummary, score: number): Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'> {
  const cv = metrics.depthCV
  const weightPercent = Math.round(SCORE_WEIGHTS.consistency * 100)

  if (metrics.repCount < 2) {
    return {
      score,
      measured: `Only ${metrics.repCount} rep tracked — variation not scored.`,
      explanation: `Consistency uses a neutral default until at least two reps are counted (${weightPercent}% weight).`,
    }
  }

  if (cv === null) {
    return {
      score,
      measured: 'Depth variation could not be calculated.',
      explanation: `Neutral consistency score (${weightPercent}% of total).`,
    }
  }

  const tier = scoreTier(
    cv,
    CONSISTENCY_CV_THRESHOLDS.excellentMax,
    CONSISTENCY_CV_THRESHOLDS.goodMax,
    CONSISTENCY_CV_THRESHOLDS.needsWorkMax,
  )
  const measured = `Depth variation across reps: ${cv.toFixed(0)}% (coefficient of variation).`

  if (tier === 'strong') {
    return {
      score,
      measured,
      explanation: `Very repeatable depth (≤${CONSISTENCY_CV_THRESHOLDS.excellentMax}% spread). ${weightPercent}% of total.`,
    }
  }
  if (tier === 'limiting') {
    return {
      score,
      measured,
      explanation: `Spread above ${CONSISTENCY_CV_THRESHOLDS.goodMax}% reduced consistency (${weightPercent}% of total).`,
    }
  }
  return {
    score,
    measured,
    explanation: `Normal rep-to-rep variation (${weightPercent}% of total).`,
  }
}

function symmetryExplanation(metrics: SetMetricsSummary, score: number): Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'> {
  const shift = metrics.avgHipShift
  const weightPercent = Math.round(SCORE_WEIGHTS.symmetry * 100)

  if (shift === null) {
    return {
      score,
      measured: 'Hip position at bottom not clear every rep.',
      explanation: `Neutral symmetry score (${weightPercent}% weight).`,
    }
  }

  const tier = scoreTier(
    shift,
    HIP_SHIFT_THRESHOLDS.excellentMax,
    HIP_SHIFT_THRESHOLDS.goodMax,
    HIP_SHIFT_THRESHOLDS.needsWorkMax,
  )
  const measured = `Hip shift at bottom: ~${(shift * 100).toFixed(0)}% of frame width off center.`

  if (tier === 'strong') {
    return {
      score,
      measured,
      explanation: `Hips stayed near midline (≤${(HIP_SHIFT_THRESHOLDS.excellentMax * 100).toFixed(0)}% shift). ${weightPercent}% of total.`,
    }
  }
  if (tier === 'limiting') {
    return {
      score,
      measured,
      explanation: `Lateral hip shift above ${(HIP_SHIFT_THRESHOLDS.goodMax * 100).toFixed(0)}% lowered symmetry (${weightPercent}% of total).`,
    }
  }
  return {
    score,
    measured,
    explanation: `Slight off-center pattern (${weightPercent}% of total).`,
  }
}

const BUILDERS: Record<
  ComponentKey,
  (metrics: SetMetricsSummary, score: number) => Omit<ComponentScoreExplanation, 'key' | 'label' | 'weightPercent'>
> = {
  depth: depthExplanation,
  trunkControl: trunkExplanation,
  kneeTracking: kneeExplanation,
  consistency: consistencyExplanation,
  symmetry: symmetryExplanation,
}

export function buildComponentScoreExplanations(
  metrics: SetMetricsSummary,
  components: ComponentScores,
): ComponentScoreExplanation[] {
  const keys: ComponentKey[] = [
    'depth',
    'trunkControl',
    'kneeTracking',
    'consistency',
    'symmetry',
  ]

  return keys.map((key) => {
    const partial = BUILDERS[key](metrics, components[key])
    return {
      key,
      label: LABELS[key],
      weightPercent: Math.round(SCORE_WEIGHTS[key] * 100),
      ...partial,
    }
  })
}

export const SCORE_FORMULA_SUMMARY =
  'Weighted from depth (30%), trunk (25%), knees (20%), consistency (15%), and symmetry (10%).'
