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
  "We couldn't get a clear enough view to provide specific coaching cues. Try adjusting your distance and lighting, then run another set."

export const NO_REPS_MESSAGE =
  'No squats were detected in this set. Stand in frame, calibrate, then perform full up-and-down reps.'
