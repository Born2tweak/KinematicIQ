import type { ComponentScores, SetMetricsSummary } from '../session/types'
import {
  CONSISTENCY_CV_THRESHOLDS,
  DEPTH_THRESHOLDS,
  HIP_SHIFT_THRESHOLDS,
  KNEE_ASYMMETRY_THRESHOLDS,
  TRUNK_THRESHOLDS,
} from './scoringConfig'

export type ComponentKey = keyof ComponentScores

/**
 * Per-component evidence surfaced to the user: what the camera measured and
 * what that observation means for the movement. Deliberately no 0–100 score
 * and no weighting — the composite score was removed (ontology §6 #15); these
 * reads survive only as observable evidence.
 */
export interface ComponentScoreExplanation {
  key: ComponentKey
  label: string
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

function tier(
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

type Partial = Omit<ComponentScoreExplanation, 'key' | 'label'>

function depthExplanation(metrics: SetMetricsSummary): Partial {
  const avg = metrics.avgDepth

  if (avg === null) {
    return {
      measured: 'Bottom knee angle not readable on every rep.',
      explanation:
        'Depth could not be read reliably — the camera did not see a clear bottom knee angle each rep.',
    }
  }

  const t = tier(
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

  if (t === 'strong') {
    return {
      measured,
      explanation: `At or below the ${DEPTH_THRESHOLDS.goodMax}° target, your hips sat low through the bottom of each rep.`,
    }
  }
  if (t === 'limiting') {
    return {
      measured,
      explanation: `Above ~${DEPTH_THRESHOLDS.goodMax}° reads as shallow from the side camera — the hips did not travel as far into the squat.`,
    }
  }
  return {
    measured,
    explanation: `Between the deep and shallow targets (${DEPTH_THRESHOLDS.excellentMax}°–${DEPTH_THRESHOLDS.needsWorkMax}° band).`,
  }
}

function trunkExplanation(metrics: SetMetricsSummary): Partial {
  const avg = metrics.avgTrunkLean

  if (avg === null) {
    return {
      measured: 'Trunk angle not visible on every rep.',
      explanation: 'The camera could not read the shoulder-to-hip angle on every rep.',
    }
  }

  const t = tier(
    avg,
    TRUNK_THRESHOLDS.excellentMax,
    TRUNK_THRESHOLDS.goodMax,
    TRUNK_THRESHOLDS.needsWorkMax,
  )
  const measured = `Average forward lean: ${Math.round(avg)}° from vertical.`

  if (t === 'strong') {
    return {
      measured,
      explanation: `Chest stayed relatively upright (≤${TRUNK_THRESHOLDS.excellentMax}° lean target) through the set.`,
    }
  }
  if (t === 'limiting') {
    return {
      measured,
      explanation: `Lean above ${TRUNK_THRESHOLDS.goodMax}° means the chest tipped noticeably toward the floor.`,
    }
  }
  return {
    measured,
    explanation: 'Moderate forward lean for this set.',
  }
}

function kneeExplanation(metrics: SetMetricsSummary): Partial {
  const asym = metrics.avgKneeAsymmetry

  if (asym === null) {
    return {
      measured: 'Left/right knee bend not clear on both sides.',
      explanation: 'Not enough side-by-side data to compare left and right knee bend.',
    }
  }

  const t = tier(
    asym,
    KNEE_ASYMMETRY_THRESHOLDS.excellentMax,
    KNEE_ASYMMETRY_THRESHOLDS.goodMax,
    KNEE_ASYMMETRY_THRESHOLDS.needsWorkMax,
  )
  const measured = `Average left–right knee difference at bottom: ${Math.round(asym)}°.`

  if (t === 'strong') {
    return {
      measured,
      explanation: `Even knee bend (≤${KNEE_ASYMMETRY_THRESHOLDS.excellentMax}° difference) side to side.`,
    }
  }
  if (t === 'limiting') {
    return {
      measured,
      explanation: `Asymmetry above ${KNEE_ASYMMETRY_THRESHOLDS.goodMax}° means one knee bent noticeably more than the other. This reflects uneven bend, not a clinical diagnosis.`,
    }
  }
  return {
    measured,
    explanation: 'Some left–right mismatch in knee bend.',
  }
}

function consistencyExplanation(metrics: SetMetricsSummary): Partial {
  const cv = metrics.depthCV

  if (metrics.repCount < 2) {
    return {
      measured: `Only ${metrics.repCount} rep tracked — variation not compared.`,
      explanation: 'Consistency needs at least two counted reps to compare bottom positions.',
    }
  }

  if (cv === null) {
    return {
      measured: 'Depth variation could not be calculated.',
      explanation: 'Not enough readable depth data to compare reps.',
    }
  }

  const t = tier(
    cv,
    CONSISTENCY_CV_THRESHOLDS.excellentMax,
    CONSISTENCY_CV_THRESHOLDS.goodMax,
    CONSISTENCY_CV_THRESHOLDS.needsWorkMax,
  )
  const measured = `Depth variation across reps: ${cv.toFixed(0)}% (coefficient of variation).`

  if (t === 'strong') {
    return {
      measured,
      explanation: `Very repeatable depth (≤${CONSISTENCY_CV_THRESHOLDS.excellentMax}% spread) rep to rep.`,
    }
  }
  if (t === 'limiting') {
    return {
      measured,
      explanation: `Spread above ${CONSISTENCY_CV_THRESHOLDS.goodMax}% means bottom depth changed a lot between reps.`,
    }
  }
  return {
    measured,
    explanation: 'Normal rep-to-rep variation in depth.',
  }
}

function symmetryExplanation(metrics: SetMetricsSummary): Partial {
  const shift = metrics.avgHipShift

  if (shift === null) {
    return {
      measured: 'Hip position at bottom not clear every rep.',
      explanation: 'The camera could not read hip position at the bottom on every rep.',
    }
  }

  const t = tier(
    shift,
    HIP_SHIFT_THRESHOLDS.excellentMax,
    HIP_SHIFT_THRESHOLDS.goodMax,
    HIP_SHIFT_THRESHOLDS.needsWorkMax,
  )
  const measured = `Hip shift at bottom: ~${(shift * 100).toFixed(0)}% of frame width off center.`

  if (t === 'strong') {
    return {
      measured,
      explanation: `Hips stayed near midline (≤${(HIP_SHIFT_THRESHOLDS.excellentMax * 100).toFixed(0)}% shift) at the bottom.`,
    }
  }
  if (t === 'limiting') {
    return {
      measured,
      explanation: `Lateral hip shift above ${(HIP_SHIFT_THRESHOLDS.goodMax * 100).toFixed(0)}% means the hips drifted toward one side.`,
    }
  }
  return {
    measured,
    explanation: 'Slight off-center hip position at the bottom.',
  }
}

const BUILDERS: Record<ComponentKey, (metrics: SetMetricsSummary) => Partial> = {
  depth: depthExplanation,
  trunkControl: trunkExplanation,
  kneeTracking: kneeExplanation,
  consistency: consistencyExplanation,
  symmetry: symmetryExplanation,
}

export function buildComponentScoreExplanations(
  metrics: SetMetricsSummary,
): ComponentScoreExplanation[] {
  const keys: ComponentKey[] = [
    'depth',
    'trunkControl',
    'kneeTracking',
    'consistency',
    'symmetry',
  ]

  return keys.map((key) => ({
    key,
    label: LABELS[key],
    ...BUILDERS[key](metrics),
  }))
}
