import type { RepMetrics } from '../cv/types'
import type { ConfidenceLevel } from '../session/types'

const average = (values: number[]): number | null => {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function levelFromScore(score: number): ConfidenceLevel {
  if (score >= 75) return 'High'
  if (score >= 50) return 'Medium'
  return 'Low'
}

/**
 * Session confidence from rep landmark quality and optional live pose samples (0–1).
 */
export function calculateSessionConfidence(
  reps: RepMetrics[],
  poseConfidenceSamples: number[] = [],
): { score: number; level: ConfidenceLevel } {
  const repConfidences = reps.map((rep) => rep.confidence)
  const sampleValues = [
    ...repConfidences,
    ...poseConfidenceSamples.map((value) => value * 100),
  ]

  if (sampleValues.length === 0) {
    return { score: 0, level: 'Low' }
  }

  const mean = average(sampleValues) ?? 0
  const score = Math.round(Math.min(100, Math.max(0, mean)))
  return { score, level: levelFromScore(score) }
}
