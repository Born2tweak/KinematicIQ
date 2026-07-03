import type {
  CoachingCue,
  ConfidenceLevel,
  ScoringResult,
  SetMetricsSummary,
} from '../session/types'
import {
  buildBiomechanicalCue,
  lowestComponents,
} from './feedbackReasoning'

export function generateFeedback(
  scoring: ScoringResult,
  sessionConfidence: ConfidenceLevel,
  metrics: SetMetricsSummary,
  maxCues = 2,
): CoachingCue[] {
  if (sessionConfidence === 'Low') {
    return []
  }

  const keys = lowestComponents(scoring.components, maxCues)
  return keys.map((key) => {
    const cue = buildBiomechanicalCue(key, metrics, sessionConfidence)
    return {
      issue: cue.issue,
      observed: cue.observed,
      whyItMatters: cue.whyItMatters,
      tryNext: cue.tryNext,
      confidence: cue.confidence,
      confidenceNote: cue.confidenceNote,
    }
  })
}

export const INSUFFICIENT_DATA_MESSAGE =
  'Tracking was too weak for coaching tips. Scores below are directional only — improve lighting, step back for a full-body view, and try again.'

export const NO_REPS_MESSAGE =
  'No full reps were counted. Get calibrated on camera, then do clear down-and-up reps with a pause at the bottom.'
