import { useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FeedbackCard } from '../components/FeedbackCard'
import { ScoreDisplay } from '../components/ScoreDisplay'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
} from '../feedback/feedbackEngine'
import {
  COMPONENT_SCORE_HINTS,
  buildResultsSummary,
} from '../session/buildSessionResult'
import type { SessionResult } from '../session/types'

const COMPONENT_LABELS = {
  depth: 'Depth',
  trunkControl: 'Trunk control',
  kneeTracking: 'Knee tracking',
  consistency: 'Consistency',
  symmetry: 'Symmetry',
} as const

export function ResultsScreen() {
  const location = useLocation()
  const result = (location.state as { result?: SessionResult } | null)?.result

  if (!result) {
    return (
      <div className="stack-lg">
        <h1 className="page-title">Squat set analysis</h1>
        <Card
          title="No session data"
          subtitle="Complete a set on the camera screen — it will finish automatically when you stand still, or use Finish Now."
        />
        <div className="results-actions">
          <Button to="/camera" variant="primary">
            Start Camera
          </Button>
          <Button to="/" variant="secondary">
            Back Home
          </Button>
        </div>
      </div>
    )
  }

  const summary = buildResultsSummary(result)
  const { metrics, scoring, feedback, sessionConfidence, sessionConfidenceScore } =
    result

  return (
    <div className="stack-lg">
      <h1 className="page-title">Squat set analysis</h1>

      <DisclaimerBanner />

      <Card className="result-card">
        <p className="result-card__summary">{summary}</p>

        {scoring && (
          <div className="results-score-block">
            <ScoreDisplay score={scoring.totalScore} band={scoring.band} />
          </div>
        )}

        <div className="confidence">
          <div className="confidence__header">
            <span className="confidence__label">Observation confidence</span>
            <span className="confidence__value">{sessionConfidenceScore}%</span>
          </div>
          <div className="confidence__bar">
            <div
              className="confidence__fill"
              style={{ width: `${sessionConfidenceScore}%` }}
              role="progressbar"
              aria-valuenow={sessionConfidenceScore}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div style={{ marginTop: 'var(--space-sm)' }}>
            <ConfidenceBadge level={sessionConfidence} />
          </div>
        </div>

        {result.noRepsDetected && (
          <p className="results-alert">{NO_REPS_MESSAGE}</p>
        )}

        {result.insufficientData && !result.noRepsDetected && (
          <p className="results-alert">{INSUFFICIENT_DATA_MESSAGE}</p>
        )}

        {sessionConfidence !== 'High' && scoring && !result.insufficientData && (
          <p className="results-alert results-alert--info">
            Camera angle and distance affect these readings. Use them to spot
            trends in your squat, not as a clinical measure.
          </p>
        )}

        {scoring && (
          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">Reps tracked</span>
              <span className="detail-row__value">{metrics.repCount}</span>
            </div>
            {(Object.keys(COMPONENT_LABELS) as Array<keyof typeof COMPONENT_LABELS>).map(
              (key) => (
                <div key={key} className="detail-row detail-row--stacked">
                  <div className="detail-row__main">
                    <span className="detail-row__label">
                      {COMPONENT_LABELS[key]}
                    </span>
                    <span className="detail-row__value">
                      {scoring.components[key]} / 100
                    </span>
                  </div>
                  <span className="detail-row__hint">
                    {COMPONENT_SCORE_HINTS[key]}
                  </span>
                </div>
              ),
            )}
            {metrics.avgDepth !== null && (
              <div className="detail-row">
                <span className="detail-row__label">Avg depth (knee)</span>
                <span className="detail-row__value">
                  {Math.round(metrics.avgDepth)}°
                </span>
              </div>
            )}
            {metrics.avgTrunkLean !== null && (
              <div className="detail-row">
                <span className="detail-row__label">Avg trunk lean</span>
                <span className="detail-row__value">
                  {Math.round(metrics.avgTrunkLean)}°
                </span>
              </div>
            )}
          </div>
        )}

        {metrics.reps.length > 0 && (
          <div className="detail-rows" style={{ marginTop: 'var(--space-md)' }}>
            <p
              className="detail-row__label"
              style={{ paddingTop: 'var(--space-md)', fontWeight: 600 }}
            >
              Per-rep depth
            </p>
            {metrics.reps.map((rep) => {
              const depth = Math.min(
                rep.minLeftKneeAngle ?? 180,
                rep.minRightKneeAngle ?? 180,
              )
              return (
                <div key={rep.repNumber} className="detail-row">
                  <span className="detail-row__label">Rep {rep.repNumber}</span>
                  <span className="detail-row__value">
                    {Math.round(depth)}° ·{' '}
                    {rep.averageTrunkLean === null
                      ? 'trunk n/a'
                      : `${Math.round(rep.averageTrunkLean)}° trunk`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {feedback.length > 0 && (
        <section className="stack" aria-label="Coaching cues">
          <h2 className="results-section-title">What to work on next</h2>
          {feedback.map((cue) => (
            <FeedbackCard key={cue.issue} cue={cue} />
          ))}
        </section>
      )}

      <div className="results-actions">
        <Button to="/camera" variant="primary">
          Try Again
        </Button>
        <Button to="/" variant="secondary">
          Back Home
        </Button>
      </div>
    </div>
  )
}
