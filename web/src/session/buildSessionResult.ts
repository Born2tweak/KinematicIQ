import { collectSetMetrics } from '../analysis/metricCollector'
import { collectPostureMetrics } from '../analysis/posture/postureCollector'
import type { PostureFrameSample } from '../analysis/posture/postureFrame'
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
  postureSamples: PostureFrameSample[] = [],
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
      posture: null,
      baseline: null,
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
    posture: collectPostureMetrics(reps, postureSamples),
    baseline: null,
  }
}

export function buildResultsSummary(result: SessionResult): string {
  if (result.noRepsDetected) return NO_REPS_MESSAGE
  if (result.insufficientData) return INSUFFICIENT_DATA_MESSAGE
  if (!result.scoring) return 'Set complete — your breakdown is below.'

  const { metrics, scoring, sessionConfidence } = result
  const repLine = `${metrics.repCount} rep${metrics.repCount === 1 ? '' : 's'} from this camera view`

  const depthPart =
    metrics.avgDepth !== null
      ? ` · avg depth ~${Math.round(metrics.avgDepth)}° knee bend`
      : ''

  const scorePart = ` · movement score ${scoring.totalScore}/100 (${scoring.band})`

  let summary = `${repLine}${depthPart}${scorePart}.`

  if (sessionConfidence === 'Medium') {
    summary += ' Good enough to compare sets — brighter light or a bit more distance can sharpen the read.'
  } else if (sessionConfidence === 'Low') {
    summary += ' Low camera confidence — use as a rough guide, not a precise grade.'
  }

  return summary
}

