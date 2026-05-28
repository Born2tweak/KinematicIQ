import type { ScoreBand } from '../session/types'

export const SCORE_WEIGHTS = {
  depth: 0.3,
  trunkControl: 0.25,
  kneeTracking: 0.2,
  consistency: 0.15,
  symmetry: 0.1,
} as const

/** PRD depth bands (smaller knee angle = deeper squat). */
export const DEPTH_THRESHOLDS = {
  excellentMax: 90,
  goodMax: 110,
  needsWorkMax: 130,
} as const

export const TRUNK_THRESHOLDS = {
  excellentMax: 30,
  goodMax: 45,
  needsWorkMax: 60,
} as const

/** Knee angle asymmetry between sides (degrees). */
export const KNEE_ASYMMETRY_THRESHOLDS = {
  excellentMax: 8,
  goodMax: 15,
  needsWorkMax: 25,
} as const

/** Depth CV across reps (%). */
export const CONSISTENCY_CV_THRESHOLDS = {
  excellentMax: 5,
  goodMax: 10,
  needsWorkMax: 20,
} as const

/** Normalized horizontal hip shift at bottom (0–1 frame width). */
export const HIP_SHIFT_THRESHOLDS = {
  excellentMax: 0.02,
  goodMax: 0.05,
  needsWorkMax: 0.1,
} as const

export function bandFromScore(score: number): ScoreBand {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}
