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
      <dl className="feedback-card__sections">
        <div className="feedback-card__section">
          <dt className="feedback-card__label">What we saw</dt>
          <dd className="feedback-card__text">{cue.observed}</dd>
        </div>
        <div className="feedback-card__section">
          <dt className="feedback-card__label">Why it matters</dt>
          <dd className="feedback-card__text">{cue.whyItMatters}</dd>
        </div>
        <div className="feedback-card__section feedback-card__section--cue">
          <dt className="feedback-card__label">Try next</dt>
          <dd className="feedback-card__text feedback-card__text--cue">{cue.tryNext}</dd>
        </div>
      </dl>
      {cue.confidenceNote && (
        <p className="feedback-card__confidence-note">{cue.confidenceNote}</p>
      )}
    </article>
  )
}
