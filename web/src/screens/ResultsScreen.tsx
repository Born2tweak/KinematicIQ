import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FeedbackCard } from '../components/FeedbackCard'
import { ScoreDisplay } from '../components/ScoreDisplay'
import { confidenceResultsMessage } from '../feedback/confidenceCalculator'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
} from '../feedback/feedbackEngine'
import { buildResultsSummary } from '../session/buildSessionResult'
import {
  SCORE_FORMULA_SUMMARY,
  buildComponentScoreExplanations,
} from '../scoring/scoringExplanations'
import type { SessionResult } from '../session/types'

export function ResultsScreen() {
  const location = useLocation()
  const result = (location.state as { result?: SessionResult } | null)?.result

  const componentExplanations = useMemo(() => {
    if (!result?.scoring) return []
    return buildComponentScoreExplanations(result.metrics, result.scoring.components)
  }, [result])

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
  const confidenceMessage = confidenceResultsMessage(sessionConfidence)

  return (
    <div className="stack-lg">
      <h1 className="page-title">Squat set analysis</h1>

      <DisclaimerBanner />

      <Card className="result-card">
        <p className="result-card__summary">{summary}</p>

        {scoring && (
          <div className="results-score-block">
            <ScoreDisplay score={scoring.totalScore} band={scoring.band} />
            <p className="score-formula-note">{SCORE_FORMULA_SUMMARY}</p>
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
          <p className="results-alert results-alert--warning">
            {INSUFFICIENT_DATA_MESSAGE}
          </p>
        )}

        {confidenceMessage && (
          <p
            className={
              sessionConfidence === 'Low'
                ? 'results-alert results-alert--warning'
                : 'results-alert results-alert--info'
            }
          >
            {confidenceMessage}
          </p>
        )}

        {scoring && componentExplanations.length > 0 && (
          <section className="component-scores" aria-label="Score breakdown">
            <h2 className="results-section-title results-section-title--inline">
              How your score was built
            </h2>
            <ul className="component-scores__list">
              {componentExplanations.map((item) => (
                <li key={item.key} className="component-score-card">
                  <div className="component-score-card__header">
                    <span className="component-score-card__label">{item.label}</span>
                    <span className="component-score-card__score">
                      {item.score}{' '}
                      <span className="component-score-card__score-max">/ 100</span>
                    </span>
                  </div>
                  <p className="component-score-card__weight">
                    {item.weightPercent}% of total score
                  </p>
                  <dl className="component-score-card__details">
                    <div>
                      <dt>Measured</dt>
                      <dd>{item.measured}</dd>
                    </div>
                    <div>
                      <dt>Why this score</dt>
                      <dd>{item.explanation}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </section>
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
