import type {
  CoachingCue,
  ComponentScores,
  ConfidenceLevel,
  SetMetricsSummary,
} from '../session/types'
import { deriveSquatCoaching } from '../findings/squatRules'

/**
 * Coaching cues for the squat. Cues are now DERIVED FROM findings (M7): the
 * same `deriveSquatCoaching` pass produces the findings and their cues together,
 * so the rendered copy is byte-identical to the previous per-component path.
 */
export function generateFeedback(
  components: ComponentScores,
  sessionConfidence: ConfidenceLevel,
  metrics: SetMetricsSummary,
  maxCues = 2,
): CoachingCue[] {
  return deriveSquatCoaching(components, sessionConfidence, metrics, [], maxCues)
    .cues
}

export const INSUFFICIENT_DATA_MESSAGE =
  'Tracking was too weak for coaching tips. The reads below are directional only — improve lighting, step back for a full-body view, and try again.'

export const NO_REPS_MESSAGE =
  'No full reps were counted. Get calibrated on camera, then do clear down-and-up reps with a pause at the bottom.'
