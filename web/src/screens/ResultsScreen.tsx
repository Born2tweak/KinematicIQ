import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { buildPostureConcepts } from '../analysis/posture/postureConcepts'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FeedbackCard } from '../components/FeedbackCard'
import { PostureProfile } from '../components/PostureProfile'
import { RepTimeline } from '../components/RepTimeline'
import { confidenceResultsMessage } from '../feedback/confidenceCalculator'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
} from '../feedback/feedbackEngine'
import { downloadTape } from '../eval/downloadTape'
import { getSessionTape } from '../eval/tapeStore'
import { useAnalystMode } from '../hooks/useAnalystMode'
import { buildResultsSummary } from '../session/buildSessionResult'
import { buildComponentScoreExplanations } from '../scoring/scoringExplanations'
import type { SessionResult } from '../session/types'

export function ResultsScreen() {
  const location = useLocation()
  const result = (location.state as { result?: SessionResult } | null)?.result
  const [isAnalyst, toggleAnalyst] = useAnalystMode()

  const componentExplanations = useMemo(() => {
    if (!result?.scoring) return []
    return buildComponentScoreExplanations(result.metrics)
  }, [result])

  const postureConcepts = useMemo(() => {
    if (!result || result.metrics.repCount === 0) return []
    return buildPostureConcepts(
      result.metrics,
      result.sessionConfidence,
      result.posture,
    )
  }, [result])

  if (!result) {
    return (
      <div className="results-page stack-lg">
        <h1 className="page-title">Your set</h1>
        <Card
          title="No session yet"
          subtitle="Record a set on the camera page. It finishes when you stand still, or tap Finish Now."
        />
        <div className="results-actions">
          <Button to="/camera" variant="primary">
            Open camera
          </Button>
          <Button to="/" variant="secondary">
            Home
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
    <div className="results-page stack-lg">
      <header className="results-page__header report-header">
        <div className="report-header__titles">
          <p className="landing-eyebrow">Movement report</p>
          <h1 className="page-title">Your set</h1>
        </div>
        <button
          type="button"
          className={`hud-tool${isAnalyst ? ' hud-tool--on' : ''}`}
          onClick={toggleAnalyst}
          aria-pressed={isAnalyst}
          title="Analyst mode reveals joint angles and per-rep detail"
        >
          {isAnalyst ? 'Analyst · on' : 'Analyst'}
        </button>
      </header>
      <DisclaimerBanner />

      <section className="results-lead-card" aria-label="Set summary">
        <p className="results-lead">{summary}</p>
      </section>

      {postureConcepts.length > 0 && (
        <section className="report-hero" aria-label="Posture profile">
          <div className="report-hero__concepts report-section">
            <h2 className="report-section__title">Posture profile</h2>
            <PostureProfile concepts={postureConcepts} />
          </div>
          <aside className="report-hero__score report-section">
            <h2 className="report-section__title">Camera confidence</h2>
            <div className="report-hero__confidence confidence">
              <div className="confidence__header">
                <span className="confidence__label">Camera confidence</span>
                <span className="confidence__value">{sessionConfidenceScore}%</span>
              </div>
              <div className="confidence__bar">
                <div
                  className={`confidence__fill confidence__fill--${sessionConfidence.toLowerCase()}`}
                  style={{ width: `${sessionConfidenceScore}%` }}
                  role="progressbar"
                  aria-valuenow={sessionConfidenceScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <ConfidenceBadge level={sessionConfidence} />
            </div>
          </aside>
        </section>
      )}

      {result.noRepsDetected && (
        <p className="results-alert" role="alert">
          {NO_REPS_MESSAGE}
        </p>
      )}

      {result.insufficientData && !result.noRepsDetected && (
        <p className="results-alert results-alert--warning" role="alert">
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
          role="status"
        >
          {confidenceMessage}
        </p>
      )}

      {scoring && componentExplanations.length > 0 && (
        <section className="results-panel" aria-label="What the camera measured">
          <div className="component-scores">
            <h2 className="results-panel__heading">What the camera measured</h2>
            <p className="results-panel__intro">
              Observable reads from this set, area by area — evidence, not a grade.
            </p>
            <ul className="component-scores__list">
              {componentExplanations.map((item) => (
                <li key={item.key} className="component-score-card">
                  <div className="component-score-card__header">
                    <span className="component-score-card__label">{item.label}</span>
                  </div>
                  <p className="component-score-card__measured">{item.measured}</p>
                  {isAnalyst && (
                    <dl className="component-score-card__details">
                      <div>
                        <dt>What it means</dt>
                        <dd>{item.explanation}</dd>
                      </div>
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {feedback.length > 0 && (
        <section className="results-coaching" aria-label="Coaching">
          <h2 className="results-section-title">What to try next</h2>
          <p className="results-coaching__intro">
            Based on the weakest areas in this set — not medical advice.
          </p>
          <div className="results-coaching__list stack">
            {feedback.map((cue) => (
              <FeedbackCard key={cue.issue} cue={cue} />
            ))}
          </div>
        </section>
      )}

      {metrics.reps.length > 0 && (
        <Card
          className="results-reps-card"
          title="Rep-by-rep"
          subtitle={
            isAnalyst
              ? 'Bottom-of-rep knee angle and average trunk lean per rep'
              : 'How your depth compared across the set'
          }
        >
          <RepTimeline
            reps={metrics.reps}
            showAngles={isAnalyst}
            deviantRep={result.posture?.mostDeviantRep ?? null}
          />
          {isAnalyst && (
            <div className="detail-rows">
              {metrics.reps.map((rep) => {
                const depth = Math.min(
                  rep.minLeftKneeAngle ?? 180,
                  rep.minRightKneeAngle ?? 180,
                )
                return (
                  <div key={rep.repNumber} className="detail-row">
                    <span className="detail-row__label">Rep {rep.repNumber}</span>
                    <span className="detail-row__value">
                      {Math.round(depth)}° depth
                      {rep.averageTrunkLean === null
                        ? ''
                        : ` · ${Math.round(rep.averageTrunkLean)}° trunk`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {isAnalyst && getSessionTape() !== null && (
        <section className="results-panel" aria-label="Pose tape">
          <h2 className="results-panel__heading">Pose tape</h2>
          <p className="results-panel__intro">
            Raw landmark recording of this session — replayable through the eval
            harness, and the capture format for the validation dataset. Stays on
            this device.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              const tape = getSessionTape()
              if (tape) downloadTape(tape)
            }}
          >
            Save pose tape (JSON)
          </Button>
        </section>
      )}

      <div className="results-actions">
        <Button to="/camera" variant="primary">
          Record another set
        </Button>
        <Button to="/" variant="secondary">
          Home
        </Button>
      </div>
    </div>
  )
}
