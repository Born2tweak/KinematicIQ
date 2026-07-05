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
import { realRejections } from './repRejectionUi'
import type { SessionResult } from '../session/types'

export function ResultsScreen() {
  const location = useLocation()
  const result = (location.state as { result?: SessionResult } | null)?.result
  const [isAnalyst, toggleAnalyst] = useAnalystMode()
  const sessionTape = getSessionTape()

  const componentExplanations = useMemo(() => {
    if (!result?.scoring) return []
    // Full abstain: an invalid recording renders no metric summary.
    if (result.quality.verdict === 'invalid') return []
    return buildComponentScoreExplanations(result.metrics)
  }, [result])

  const postureConcepts = useMemo(() => {
    if (!result || result.metrics.repCount === 0) return []
    // Full abstain: no posture profile from an untrustworthy recording.
    if (result.quality.verdict === 'invalid') return []
    // Questionable sets never carry High-confidence reads.
    const conceptConfidence =
      result.quality.verdict === 'questionable' &&
      result.sessionConfidence === 'High'
        ? 'Medium'
        : result.sessionConfidence
    return buildPostureConcepts(
      result.metrics,
      conceptConfidence,
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
  const quality = result.quality
  const isInvalidSet = quality.verdict === 'invalid' && !result.noRepsDetected
  const isQuestionableSet = quality.verdict === 'questionable'
  const confidenceMessage = isInvalidSet
    ? null
    : confidenceResultsMessage(sessionConfidence)

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

      {isInvalidSet && (
        <section
          className="results-panel results-abstain"
          aria-label="Why there is no movement report"
        >
          <h2 className="results-panel__heading">
            Why there is no movement report
          </h2>
          <p className="results-panel__intro">
            This app reports only what the camera can vouch for. This recording
            could not support a trustworthy read, so posture reads, metric
            summaries, and coaching are withheld — the rep-by-rep chart and
            diagnostics below stay available for audit.
          </p>
          <ul className="results-abstain__reasons">
            {quality.reasons.map((reason) => (
              <li key={reason.id} className="results-abstain__reason">
                {reason.detail}
              </li>
            ))}
          </ul>
          {quality.captureFixes.length > 0 && (
            <>
              <h3 className="results-panel__heading">
                How to get a trustworthy report next set
              </h3>
              <ul className="results-abstain__reasons">
                {quality.captureFixes.map((fix) => (
                  <li key={fix} className="results-abstain__reason">
                    {fix}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {isQuestionableSet && (
        <section
          className="results-panel results-abstain"
          aria-label="Capture-quality warning"
        >
          <p className="results-alert results-alert--warning" role="status">
            Use this as a capture-quality check, not a movement report. Parts of
            this recording could not be trusted, so only observations are shown —
            no recommendations.
          </p>
          <ul className="results-abstain__reasons">
            {quality.reasons.map((reason) => (
              <li key={reason.id} className="results-abstain__reason">
                {reason.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

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

      {result.insufficientData && !result.noRepsDetected && !isInvalidSet && (
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

      {isAnalyst && sessionTape !== null && (
        <section className="results-panel" aria-label="Pose tape">
          <h2 className="results-panel__heading">Pose tape</h2>
          <p className="results-panel__intro">
            Raw landmark recording of this session — replayable through the eval
            harness, and the capture format for the validation dataset. Stays on
            this device.
          </p>
          <Button variant="secondary" onClick={() => downloadTape(sessionTape)}>
            Save pose tape (JSON)
          </Button>

          {(sessionTape.diagnostics?.rejections.length ?? 0) > 0 &&
            (() => {
              const allRejections = sessionTape.diagnostics!.rejections
              const real = realRejections(allRejections)
              const phantomCount = allRejections.length - real.length
              return (
                <div className="detail-rows">
                  <h3 className="results-panel__heading">
                    Rejected rep candidates ({real.length})
                  </h3>
                  {real.map((rejection, index) => (
                    <div
                      key={`${rejection.startFrameIndex}-${index}`}
                      className="detail-row"
                    >
                      <span className="detail-row__label">
                        {rejection.gate} · frames {rejection.startFrameIndex}–
                        {rejection.endFrameIndex}
                      </span>
                      <span className="detail-row__value">
                        {rejection.reason} · {Math.round(rejection.durationMs)}
                        ms · hip drop {rejection.values.maxHipDrop.toFixed(3)} ·
                        conf {Math.round(rejection.values.avgConfidence * 100)}%
                      </span>
                    </div>
                  ))}
                  {phantomCount > 0 && (
                    <p className="results-panel__intro">
                      {phantomCount} zero-descent candidate
                      {phantomCount === 1 ? '' : 's'} (phase jitter while
                      standing, no hip drop) not shown — retained in the pose
                      tape for audit.
                    </p>
                  )}
                </div>
              )
            })()}
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
