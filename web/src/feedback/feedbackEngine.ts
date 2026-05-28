import type {
  CoachingCue,
  ComponentScores,
  ConfidenceLevel,
  ScoringResult,
} from '../session/types'
import type { FeedbackIssueKey } from './feedbackTemplates'
import { FEEDBACK_TEMPLATES } from './feedbackTemplates'

const COMPONENT_ORDER: FeedbackIssueKey[] = [
  'depth',
  'trunkControl',
  'kneeTracking',
  'consistency',
  'symmetry',
]

function lowestComponents(
  components: ComponentScores,
  maxCues: number,
): FeedbackIssueKey[] {
  return [...COMPONENT_ORDER]
    .sort((a, b) => components[a] - components[b])
    .slice(0, maxCues)
}

export function generateFeedback(
  scoring: ScoringResult,
  sessionConfidence: ConfidenceLevel,
  maxCues = 2,
): CoachingCue[] {
  if (sessionConfidence === 'Low') {
    return []
  }

  const keys = lowestComponents(scoring.components, maxCues)
  return keys.map((key) => {
    const template = FEEDBACK_TEMPLATES[key]
    return {
      issue: template.issue,
      observation: template.observation,
      cue: template.cue,
      confidence: sessionConfidence,
      note: template.note,
    }
  })
}

export const INSUFFICIENT_DATA_MESSAGE =
  "We couldn't get a clear enough view to provide specific coaching cues. Try adjusting your distance and lighting, then run another set."

export const NO_REPS_MESSAGE =
  'No squats were detected in this set. Stand in frame, calibrate, then perform full up-and-down reps.'
