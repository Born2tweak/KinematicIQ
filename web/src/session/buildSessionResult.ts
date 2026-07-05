import { collectSetMetrics } from '../analysis/metricCollector'
import {
  collectPostureMetrics,
  findMostDeviantRep,
} from '../analysis/posture/postureCollector'
import type { PostureFrameSample } from '../analysis/posture/postureFrame'
import { calculateSessionConfidence } from '../feedback/confidenceCalculator'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
  generateFeedback,
} from '../feedback/feedbackEngine'
import { computeComponentScores } from '../scoring/scoringEngine'
import type { RepMetrics } from '../cv/types'
import type { SessionResult } from './types'

/**
 * Exclude a flagged outlier rep from set aggregates only when enough reps
 * remain for the averages to still describe a pattern (≥3 after exclusion).
 */
const MIN_REPS_FOR_OUTLIER_EXCLUSION = 4

export function buildSessionResult(
  reps: RepMetrics[],
  poseConfidenceSamples: number[] = [],
  postureSamples: PostureFrameSample[] = [],
): SessionResult {
  const noRepsDetected = reps.length === 0
  const { score: sessionConfidenceScore, level: sessionConfidence } =
    calculateSessionConfidence(reps, poseConfidenceSamples)

  const deviantRep =
    reps.length >= MIN_REPS_FOR_OUTLIER_EXCLUSION
      ? findMostDeviantRep(reps)
      : null
  const excludedRepNumbers = new Set(
    deviantRep === null ? [] : [deviantRep],
  )

  const metrics = collectSetMetrics(
    reps,
    sessionConfidenceScore,
    excludedRepNumbers,
  )

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

  const scoring = computeComponentScores(metrics)
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

  const { metrics, sessionConfidence } = result
  const repLine = `${metrics.repCount} rep${metrics.repCount === 1 ? '' : 's'} from this camera view`

  const depthPart =
    metrics.avgDepth !== null
      ? ` · avg depth ~${Math.round(metrics.avgDepth)}° knee bend`
      : ''

  const exclusionPart =
    metrics.excludedRepNumbers.length > 0
      ? ` Rep ${metrics.excludedRepNumbers.join(', ')} differed most from your set pattern and is left out of the averages.`
      : ''

  let summary = `${repLine}${depthPart}.${exclusionPart}`

  if (sessionConfidence === 'Medium') {
    summary += ' Good enough to compare sets — brighter light or a bit more distance can sharpen the read.'
  } else if (sessionConfidence === 'Low') {
    summary += ' Low camera confidence — use as a rough guide, not a precise grade.'
  }

  return summary
}

