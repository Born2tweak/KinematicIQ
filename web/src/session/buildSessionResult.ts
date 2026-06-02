import { collectSetMetrics } from '../analysis/metricCollector'
import { calculateSessionConfidence } from '../feedback/confidenceCalculator'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
  generateFeedback,
} from '../feedback/feedbackEngine'
import { scoreSet } from '../scoring/scoringEngine'
import type { RepMetrics } from '../cv/types'
import type { SessionResult } from './types'

export function buildSessionResult(
  reps: RepMetrics[],
  poseConfidenceSamples: number[] = [],
): SessionResult {
  const noRepsDetected = reps.length === 0
  const { score: sessionConfidenceScore, level: sessionConfidence } =
    calculateSessionConfidence(reps, poseConfidenceSamples)

  const metrics = collectSetMetrics(reps, sessionConfidenceScore)

  if (noRepsDetected) {
    return {
      metrics,
      scoring: null,
      feedback: [],
      sessionConfidence,
      sessionConfidenceScore,
      insufficientData: true,
      noRepsDetected: true,
    }
  }

  const scoring = scoreSet(metrics)
  const insufficientData = sessionConfidence === 'Low'
  const feedback = insufficientData
    ? []
    : generateFeedback(scoring, sessionConfidence, metrics)

  return {
    metrics,
    scoring,
    feedback,
    sessionConfidence,
    sessionConfidenceScore,
    insufficientData,
    noRepsDetected: false,
  }
}

export function buildResultsSummary(result: SessionResult): string {
  if (result.noRepsDetected) return NO_REPS_MESSAGE
  if (result.insufficientData) return INSUFFICIENT_DATA_MESSAGE
  if (!result.scoring) return 'Set complete. Review your squat analysis below.'

  const { metrics, scoring, sessionConfidence } = result
  const repLine = `We tracked ${metrics.repCount} bodyweight squat${
    metrics.repCount === 1 ? '' : 's'
  } from your camera view.`

  const depthPart =
    metrics.avgDepth !== null
      ? ` Average depth was about ${Math.round(metrics.avgDepth)}° knee bend`
      : ''

  const scorePart = ` Overall movement quality: ${scoring.totalScore}/100 (${scoring.band}).`

  let summary = `${repLine}${depthPart}.${scorePart}`

  if (sessionConfidence === 'Medium') {
    summary +=
      ' This read is directional — stepping farther back or improving lighting can change what the camera sees.'
  } else if (sessionConfidence === 'Low') {
    summary +=
      ' Camera tracking was limited this set, so treat these numbers as a rough guide only.'
  }

  return summary
}

