import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react'
import { buildPostureConcepts } from '../analysis/posture/postureConcepts'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { FeedbackCard } from '../components/FeedbackCard'
import { PostureProfile } from '../components/PostureProfile'
import { RepTimeline } from '../components/RepTimeline'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
} from '../feedback/feedbackEngine'
import { downloadTape } from '../eval/downloadTape'
import { getSessionTape } from '../eval/tapeStore'
import { buildComponentScoreExplanations } from '../scoring/scoringExplanations'
import { FindingCard } from '../components/report/FindingCard'
import { REVIEW_STATUS_LABEL } from '../core/finding'
import { ResultsTabs } from '../components/report/ResultsTabs'
import {
  DEFAULT_RESULTS_TAB,
  evidenceMetricResults,
  coachQuestionSections,
  summaryFindings,
  type ResultsTabId,
} from '../components/report/resultsTabsModel'
import { primaryMetrics } from '../components/report/primaryMetrics'
import { CaptureQualityPanel } from '../components/report/CaptureQualityPanel'
import { realRejections } from './repRejectionUi'
import { getProtocol } from '../protocols/registry'
import { getSessionStore } from '../storage/sessionStore'
import {
  buildSessionReport,
  downloadReportFile,
  reportFilename,
  serializeReport,
} from '../export/sessionReport'
import { renderReportHtml } from '../export/sessionReportHtml'
import { buildMetricCsv, metricCsvFilename } from '../export/metricCsv'
import { computeBaseline } from '../session/baseline'
import { reviewSetQuality } from '../session/qualityReview'
import type { SessionBaseline } from '../session/types'
import { buildResultsNarrative } from '../components/report/resultsNarrative'
import { useResultsSession } from './useResultsSession'

const MovementPlayer = lazy(() =>
  import('../components/replay/MovementPlayer').then((m) => ({
    default: m.MovementPlayer,
  })),
)

export function ResultsScreen() {
  const session = useResultsSession()
  const result = session.status === 'ready' ? session.result : undefined
  // Capture artifacts belonging to THIS session, restored on reload (P3).
  const sessionMedia = session.status === 'ready' ? session.media : null
  const [activeTab, setActiveTab] = useState<ResultsTabId>(DEFAULT_RESULTS_TAB)
  // Expert tab reveals the analyst layer (folds in the former analyst toggle).
  const isAnalyst = activeTab === 'expert'
  // Prefer the session's own persisted tape; fall back to the in-memory
  // hand-off for the tick before persistence settles.
  const sessionTape =
    (session.status === 'ready' ? session.tape : null) ?? getSessionTape()

  // Linked views: the replay timeline reports which rep it is inside so the
  // rep chart can highlight it. Presentation state only.
  const [replayRep, setReplayRep] = useState<number | null>(null)
  const [requestedReplayRep, setRequestedReplayRep] = useState<number | null>(null)
  const handleActiveRepChange = useCallback((repNumber: number | null) => {
    setReplayRep((current) => (current === repNumber ? current : repNumber))
  }, [])

  // Personal baseline (M31): compared against the athlete's own saved
  // history, computed locally; null until enough sessions exist.
  const [baseline, setBaseline] = useState<SessionBaseline | null>(null)
  useEffect(() => {
    if (!result) return
    let cancelled = false
    getSessionStore()
      .list()
      .then((history) => {
        if (!cancelled) setBaseline(computeBaseline(history, result))
      })
      .catch(() => {
        /* no history available — baseline stays null */
      })
    return () => {
      cancelled = true
    }
  }, [result])

  // Report export (M33): local-only audit artifact — HTML for reading,
  // JSON for tooling. Includes the abstain state exactly as rendered; pose
  // frames stay in the separate pose-tape export.
  const handleExportReport = useCallback(
    (format: 'html' | 'json') => {
      if (!result) return
      const report = buildSessionReport(result, { baseline })
      if (format === 'json') {
        downloadReportFile(
          serializeReport(report),
          reportFilename(report, 'json'),
          'application/json',
        )
      } else {
        downloadReportFile(
          renderReportHtml(report),
          reportFilename(report, 'html'),
          'text/html',
        )
      }
    },
    [result, baseline],
  )

  // Evidence CSV export (M53): Expert-only, local download of the metric
  // table with provenance. Uses ALL metric results so abstained (null) reads
  // export with a not_readable flag rather than being dropped.
  const handleExportCsv = useCallback(() => {
    if (!result) return
    const csv = buildMetricCsv(result.metricResults)
    const protocolId = result.metricResults[0]?.provenance.protocolId
    const isoDate = result.metricResults[0]?.provenance.recordedAt
      ? result.metricResults[0].provenance.recordedAt!
      : new Date().toISOString()
    downloadReportFile(
      csv,
      metricCsvFilename(protocolId, isoDate),
      'text/csv',
    )
  }, [result])

  const componentExplanations = useMemo(() => {
    if (!result?.scoring) return []
    // Full abstain: an invalid recording renders no metric summary.
    if (result.quality.verdict === 'invalid') return []
    return buildComponentScoreExplanations(result.metrics)
  }, [result])

  const postureConcepts = useMemo(() => {
    if (!result || result.metrics.repCount === 0) return []
    // The posture profile reads a 3D posture summary. A protocol that produces
    // none must not render five squat concepts as "not enough data" — that
    // reads as a failed measurement rather than a measurement never attempted.
    if (result.posture === null) return []
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

  // The rail: three to five readable metrics, above the fold, one per concept.
  const railMetrics = useMemo(
    () => (result ? primaryMetrics(result) : []),
    [result],
  )

  if (session.status === 'loading') {
    return (
      <div className="results-page">
        <p className="results-panel__intro" role="status">
          Opening this session…
        </p>
      </div>
    )
  }

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
          <Button to="/history" variant="secondary">
            Session history
          </Button>
        </div>
      </div>
    )
  }

  const narrative = buildResultsNarrative(result)
  // Send "record again" back to a surface this protocol can actually use: a
  // movement with no live path must not land on the camera screen.
  const protocolDefinition = getProtocol(result.protocolId).definition
  const isTransitionProtocol = protocolDefinition.kind === 'transition'
  const recordAgain = {
    to: protocolDefinition.capture.inputModes.includes('live') ? '/camera' : '/upload',
    state: { protocolId: result.protocolId },
    label: protocolDefinition.capture.inputModes.includes('live')
      ? 'Record another set'
      : 'Analyze another recording',
  }
  const { metrics, scoring, feedback, sessionConfidence, sessionConfidenceScore } =
    result
  const quality = result.quality
  const isInvalidSet = quality.verdict === 'invalid' && !result.noRepsDetected
  const isQuestionableSet = quality.verdict === 'questionable'

  const showSummary = activeTab === 'summary'
  const showEvidence = activeTab === 'evidence'
  const showExpert = activeTab === 'expert'
  // Quality review step (M51): explicit accept/retake recovery path derived
  // from the quality gate — never weakens the invalid full abstain below.
  // The kind carries the movement's vocabulary: squat counts reps, forward
  // lunge counts trials, and this banner used to say "reps" for both.
  const qualityReview = reviewSetQuality(quality, protocolDefinition.kind)
  const topFindings = summaryFindings(result)
  const primaryFinding = topFindings[0] ?? null
  const coachQuestions = coachQuestionSections(result)
  const metricResults = evidenceMetricResults(result)
  const attemptNoun = isTransitionProtocol ? 'trial' : 'rep'
  const storedLocally = session.status === 'ready' && session.stored

  return (
    <div className="results-page">
      {/* Compact session header: what was analyzed, when, and how much of it
          the tracker could vouch for — one band, never a hero block. */}
      <header className="results-bar">
        <div className="results-bar__identity">
          <h1 className="results-bar__title">{protocolDefinition.label}</h1>
          <p className="results-bar__meta">
            {metrics.repCount} observed {attemptNoun}
            {metrics.repCount === 1 ? '' : 's'}
            {' · '}
            {quality.trustedRepCount} trusted
            {' · '}
            <span className="results-bar__release">
              {protocolDefinition.kind === 'transition' ? 'Transition' : 'Cyclic'}{' '}
              movement
            </span>
          </p>
        </div>
        <div className="results-bar__status">
          <div className="results-bar__confidence">
            <span className="results-bar__confidence-label">Tracking confidence</span>
            <span className="results-bar__confidence-value">
              {sessionConfidence} ({sessionConfidenceScore}%)
            </span>
            <div className="confidence__bar">
              <div
                className={`confidence__fill confidence__fill--${sessionConfidence.toLowerCase()}`}
                style={{ width: `${sessionConfidenceScore}%` }}
                role="progressbar"
                aria-valuenow={sessionConfidenceScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Tracking confidence"
              />
            </div>
          </div>
          <ResultsTabs active={activeTab} onChange={setActiveTab} />
        </div>
      </header>

      {/* Landmark visibility is not movement validity. This distinction is
          load-bearing and stays adjacent to the number itself. */}
      <p className="results-bar__caveat">
        {narrative.cameraConfidence}
      </p>

      {showSummary && (
        <div className="results-grid">
          <div className="results-grid__main">
            <section className="results-verdict" aria-label="Set summary">
              <h2 className="results-verdict__headline">{narrative.headline}</h2>
              <p className="results-verdict__observed">{narrative.observed}</p>
            </section>

            {qualityReview.retakeRecommended && (
              <section
                className="results-panel quality-review"
                aria-label="Capture quality review"
              >
                <p className="results-alert results-alert--warning" role="status">
                  {qualityReview.headline}
                </p>
                {/* Fixes for a full-invalid set are already itemized in the
                    "Why there is no movement report" block below — don't
                    duplicate them here; the panel's job is the retake CTA. */}
                {qualityReview.retakeGuidance.length > 0 && !isInvalidSet && (
                  <ul className="quality-review__guidance">
                    {qualityReview.retakeGuidance.map((fix) => (
                      <li key={fix} className="quality-review__fix">
                        {fix}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="results-actions">
                  <Button
                    to={recordAgain.to}
                    state={recordAgain.state}
                    variant="primary"
                  >
                    {recordAgain.label}
                  </Button>
                </div>
              </section>
            )}

            {isInvalidSet && (
              <section
                className="results-panel results-abstain"
                aria-label="Why there is no movement report"
              >
                <h2 className="results-panel__heading">
                  Why there is no movement report
                </h2>
                <p className="results-panel__intro">
                  This app reports only what the camera can vouch for. This
                  recording could not support a trustworthy read, so posture
                  reads, metric summaries, and coaching are withheld — the
                  rep-by-rep chart and diagnostics stay available for audit.
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
                  Use this as a capture-quality check, not a movement report.
                  Parts of this recording could not be trusted, so only
                  observations are shown — no recommendations.
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

            {/* NO_REPS_MESSAGE and INSUFFICIENT_DATA_MESSAGE are squat copy —
                they talk about reps, calibration, and pausing at the bottom. A
                protocol with a different unit of observation gets its own
                recovery guidance from the quality gate instead. */}
            {result.noRepsDetected && (
              <p className="results-alert" role="alert">
                {isTransitionProtocol
                  ? (quality.captureFixes[0] ??
                    protocolDefinition.capture.viewInstruction)
                  : NO_REPS_MESSAGE}
              </p>
            )}

            {result.insufficientData &&
              !result.noRepsDetected &&
              !isInvalidSet && (
                <p className="results-alert results-alert--warning" role="alert">
                  {isTransitionProtocol
                    ? 'Too little of this recording was readable to interpret. The measured evidence stays below; no observation is drawn from it.'
                    : INSUFFICIENT_DATA_MESSAGE}
                </p>
              )}

            {/* The movement visualization sits above the fold, not behind the
                analyst tab. P3 replaces this with the mini/expandable
                source-video + 3D split player. */}
            {sessionTape !== null && (
              <section className="results-player" aria-label="Movement player">
                <Suspense fallback={<div className="results-player__placeholder" />}>
                  <MovementPlayer
                    tape={sessionTape}
                    videoBlob={sessionMedia}
                    onActiveRepChange={handleActiveRepChange}
                    requestedRepNumber={requestedReplayRep}
                  />
                </Suspense>
              </section>
            )}

            {metrics.reps.length > 0 && (
              <Card
                className="results-reps-card"
                title="Rep-by-rep"
                subtitle="How your depth compared across the set"
              >
                <RepTimeline
                  reps={metrics.reps}
                  showAngles={false}
                  deviantRep={result.posture?.mostDeviantRep ?? null}
                  activeRep={replayRep}
                  onSelectRep={
                    sessionTape === null ? undefined : setRequestedReplayRep
                  }
                />
              </Card>
            )}
          </div>

          <aside className="results-grid__rail" aria-label="Primary metrics">
            {railMetrics.length > 0 && (
              <section className="metric-rail">
                <h2 className="metric-rail__heading">Primary metrics</h2>
                <ul className="metric-rail__list">
                  {railMetrics.map((metric) => (
                    <li key={metric.metricId} className="metric-tile">
                      <span className="metric-tile__label">
                        {metric.label}
                        {metric.sided && (
                          <span className="metric-tile__qualifier"> (one side)</span>
                        )}
                      </span>
                      <span className="metric-tile__value">{metric.display}</span>
                      <span className="metric-tile__foot">
                        <ConfidenceBadge level={metric.confidence} />
                        <span className="metric-tile__tier">
                          {metric.validationTier}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* One prioritized observation and one cue. When no finding rule
                fired — including every abstained set — the narrative still
                carries a reason and a recovery action, so this slot reports
                that rather than disappearing and leaving the athlete with no
                next step. */}
            <section className="results-focus" aria-label="Primary observation">
              <h2 className="results-focus__heading">
                {primaryFinding ? 'What stood out' : 'What this set shows'}
              </h2>
              <p className="results-focus__statement">
                {primaryFinding ? primaryFinding.statement : narrative.why}
              </p>
              <div className="results-focus__cue">
                <span className="results-focus__cue-label">
                  {primaryFinding?.tryNext ? 'Try next set' : 'Next'}
                </span>
                <p className="results-focus__cue-text">
                  {primaryFinding?.tryNext ?? narrative.next}
                </p>
              </div>
            </section>

            {/* An abstained set publishes no coaching. Say so where the cue
                would otherwise sit, instead of letting silence imply "fine". */}
            {isInvalidSet && (
              <p className="results-focus__withheld">
                Coaching is withheld for this recording.
              </p>
            )}

            {topFindings.length > 1 && (
              <section className="results-secondary" aria-label="Other observations">
                <h2 className="results-focus__heading">Also observed</h2>
                <div className="stack">
                  {topFindings.slice(1).map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))}
                </div>
              </section>
            )}

            {/* Experimental limitation: visible, never dominant. */}
            <details className="results-disclosure">
              <summary className="results-disclosure__summary">
                Validation status and limits
              </summary>
              <div className="results-disclosure__body">
                <p>{narrative.validation}</p>
                <p>
                  Movement observations only — not medical advice. Use as a
                  practice-quality check.
                </p>
              </div>
            </details>

            <div className="results-actions results-actions--rail">
              <Button to={recordAgain.to} state={recordAgain.state} variant="primary">
                {recordAgain.label}
              </Button>
            </div>
          </aside>
        </div>
      )}

      {showEvidence && (
        <div className="results-stack">
          {quality.verdict === 'valid' && !result.insufficientData && (
            <section className="results-panel" aria-label="Coach questions">
              <h2 className="results-panel__heading">The coach questions</h2>
              <p className="results-panel__intro">
                The report organized by what a coach would ask. A quiet section
                means those reads stayed inside the expected range — silence is
                deliberate, not missing data.
              </p>
              {coachQuestions.map((section) => (
                <div key={section.questionId} className="coach-question">
                  <h3 className="coach-question__title">{section.title}</h3>
                  <p className="coach-question__asks">{section.asks}</p>
                  {section.findings.length > 0 ? (
                    <div className="coach-question__findings stack">
                      {section.findings.map((finding) => (
                        <FindingCard
                          key={finding.id}
                          finding={finding}
                          showProvenance
                          showConstraint
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="coach-question__abstain">{section.abstainLine}</p>
                  )}
                </div>
              ))}
            </section>
          )}

          {quality.verdict === 'valid' && baseline !== null && (
            <section className="results-panel" aria-label="Compared to your baseline">
              <h2 className="results-panel__heading">Compared to your baseline</h2>
              <p className="results-panel__intro">
                Your own saved sessions ({baseline.sessionCount} of this
                movement), not anyone else&apos;s numbers. Each difference is
                compared against a provisional noise threshold — heuristic, not
                validated reliability data — so &ldquo;possible change&rdquo; is
                the strongest language offered.
              </p>
              <ul className="baseline__list">
                {baseline.deltas.map((d) => (
                  <li key={d.metricId} className="baseline-row">
                    <span className="baseline-row__label">{d.label}</span>
                    <span className="baseline-row__values">
                      {Math.round(d.baselineValue * 100) / 100}
                      {' → '}
                      {Math.round(d.currentValue * 100) / 100}
                      {d.unit === 'deg' ? '°' : d.unit === 'percent' ? '%' : ''}
                      <span className="baseline-row__delta">
                        {' '}({d.delta >= 0 ? '+' : ''}
                        {Math.round(d.delta * 100) / 100})
                      </span>
                      {d.change && (
                        <span
                          className={`baseline-row__change baseline-row__change--${d.change.classification}`}
                          title={d.change.copy}
                        >
                          {d.change.classification === 'within-noise'
                            ? 'within noise'
                            : d.change.classification === 'possible-change'
                              ? 'possible change'
                              : 'not judged'}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {postureConcepts.length > 0 && (
            <section className="report-section" aria-label="Posture profile">
              <h2 className="report-section__title">Posture profile</h2>
              <PostureProfile concepts={postureConcepts} result={result} />
            </section>
          )}

          {metricResults.length > 0 && (
            <section className="results-panel" aria-label="Measured metrics">
              <h2 className="results-panel__heading">Measured metrics</h2>
              <p className="results-panel__intro">
                Keyed reads from this set, each with its camera confidence and
                validation tier — observations, not a grade.
              </p>
              <ul className="metric-results__list">
                {metricResults.map((metric) => (
                  <li key={metric.metricId} className="metric-result-row">
                    <div className="metric-result-row__head">
                      <span className="metric-result-row__label">{metric.label}</span>
                      <ConfidenceBadge level={metric.confidence.level} />
                    </div>
                    <span className="metric-result-row__value">
                      {metric.value === null
                        ? 'not readable'
                        : `${Math.round(metric.value * 100) / 100}${metric.unit === 'deg' ? '°' : metric.unit === 'percent' ? '%' : ` ${metric.unit}`}`}
                      <span className="metric-result-row__tier">
                        {' '}
                        · {metric.validationTier}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
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
        </div>
      )}

      {(showEvidence || showExpert) && scoring && componentExplanations.length > 0 && (
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

      {showExpert && (
        <div className="results-stack">
          {(result.rootCauses?.length ?? 0) > 0 && (
            <section className="results-panel" aria-label="Possible contributors">
              <h2 className="results-panel__heading">Possible contributors</h2>
              <p className="results-panel__intro">
                Candidate explanations for this set&apos;s findings —
                plausibility, not diagnosis. Each includes a way to check it
                yourself.
              </p>
              <ul className="root-cause__list stack">
                {result.rootCauses!.map((card) => (
                  <li key={card.id} className="root-cause-card">
                    <h3 className="root-cause-card__title">{card.title}</h3>
                    <p className="root-cause-card__because">{card.plausibleBecause}</p>
                    <p className="root-cause-card__check">
                      <strong>Check it yourself:</strong> {card.selfCheck}
                    </p>
                    <p className="root-cause-card__framing">{card.framing}</p>
                    {card.provenance && (
                      <p className="finding-card__provenance">
                        {REVIEW_STATUS_LABEL[card.provenance.reviewStatus]} ·{' '}
                        {card.provenance.ruleId}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {metrics.reps.length > 0 && (
            <Card
              className="results-reps-card"
              title="Rep-by-rep"
              subtitle="Bottom-of-rep knee angle and average trunk lean per rep"
            >
              <RepTimeline
                reps={metrics.reps}
                showAngles
                deviantRep={result.posture?.mostDeviantRep ?? null}
                activeRep={replayRep}
                onSelectRep={sessionTape === null ? undefined : setRequestedReplayRep}
              />
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
            </Card>
          )}

          {sessionTape !== null && (
            <section className="results-panel" aria-label="Pose tape">
              <h2 className="results-panel__heading">Pose tape</h2>
              <p className="results-panel__intro">
                Raw landmark recording of this session — replayable through the
                eval harness, and the capture format for the validation dataset.
                Stays on this device.
              </p>
              <Button variant="secondary" onClick={() => downloadTape(sessionTape)}>
                Save pose tape (JSON)
              </Button>

              <CaptureQualityPanel frames={sessionTape.frames} />

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
                            {rejection.reason} ·{' '}
                            {Math.round(rejection.durationMs)}
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
        </div>
      )}

      <footer className="results-footer">
        <DisclaimerBanner />
        <div className="results-actions">
          <Button variant="secondary" onClick={() => handleExportReport('html')}>
            Export report HTML
          </Button>
          <Button variant="secondary" onClick={() => handleExportReport('json')}>
            Export report JSON
          </Button>
          {showExpert && result.metricResults.length > 0 && (
            <Button variant="secondary" onClick={handleExportCsv}>
              Export metrics CSV
            </Button>
          )}
          <Button to="/history" variant="secondary">
            Session history
          </Button>
        </div>
        {/* Automatic local persistence (ADR-018). Stated quietly, and only
            ever as what actually happened on this device. */}
        <p className="results-storage" role="status">
          {storedLocally
            ? 'Stored on this device. Nothing is uploaded — delete it any time from History.'
            : 'Not stored on this device — this browser refused the local write, so this report will be gone when you leave the page.'}
        </p>
      </footer>
    </div>
  )
}
