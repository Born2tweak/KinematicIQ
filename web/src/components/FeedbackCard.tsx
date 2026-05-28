import type { CoachingCue } from '../session/types'
import { ConfidenceBadge } from './ConfidenceBadge'

interface FeedbackCardProps {
  cue: CoachingCue
}

export function FeedbackCard({ cue }: FeedbackCardProps) {
  return (
    <article className="feedback-card">
      <div className="feedback-card__header">
        <h3 className="feedback-card__issue">{cue.issue}</h3>
        <ConfidenceBadge level={cue.confidence} />
      </div>
      <p className="feedback-card__observation">{cue.observation}</p>
      <p className="feedback-card__cue">{cue.cue}</p>
      <p className="feedback-card__note">{cue.note}</p>
    </article>
  )
}
