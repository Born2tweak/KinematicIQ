import type { RepMetrics } from '../cv/types'
import type { ConfidenceLevel } from '../session/types'
import { SESSION_CONFIDENCE_THRESHOLDS } from '../scoring/scoringConfig'

const average = (values: number[]): number | null => {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function levelFromScore(score: number): ConfidenceLevel {
  if (score >= SESSION_CONFIDENCE_THRESHOLDS.highMin) return 'High'
  if (score >= SESSION_CONFIDENCE_THRESHOLDS.mediumMin) return 'Medium'
  return 'Low'
}

/**
 * Session confidence from rep landmark quality and optional live pose samples (0–1).
 * Drives whether coaching cues are shown and how strongly results are framed.
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

export function confidenceResultsMessage(level: ConfidenceLevel): string | null {
  if (level === 'High') return null
  if (level === 'Medium') {
    return 'Observation confidence is moderate. Scores reflect what the camera could see — use them to compare sets, not as exact measurements.'
  }
  return 'Observation confidence is low. Component scores are shown for reference, but coaching cues are hidden until tracking improves (lighting, distance, full body in frame).'
}
