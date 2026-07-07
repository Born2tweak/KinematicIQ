import { collectSetMetrics } from '../analysis/metricCollector'
import {
  collectPostureMetrics,
  findMostDeviantRep,
} from '../analysis/posture/postureCollector'
import type { PostureFrameSample } from '../analysis/posture/postureFrame'
import type { RepRejection } from '../analysis/repCounter'
import { calculateSessionConfidence } from '../feedback/confidenceCalculator'
import {
  INSUFFICIENT_DATA_MESSAGE,
  NO_REPS_MESSAGE,
} from '../feedback/feedbackEngine'
import { deriveCoaching } from '../findings/engine'
import { computeComponentScores } from '../scoring/scoringEngine'
import type { RepMetrics } from '../cv/types'
import { getActiveProtocol, getProtocol } from '../protocols/registry'
import type { ProtocolId } from '../core/protocol'
import { makeProvenance } from '../core/provenance'
import { buildSquatMetricResults } from '../metrics/squatMetrics'
import { buildPostureMetricResults } from '../metrics/postureMetrics'
import { deriveRootCauses } from '../findings/rootCauses'
import type { MetricResult } from '../core/metric'
import { assessSetQuality } from './setQualityGate'
import type { SessionResult } from './types'

/**
 * Exclude a flagged outlier rep from set aggregates only when enough reps
 * remain for the averages to still describe a pattern (≥3 after exclusion).
 */
const MIN_REPS_FOR_OUTLIER_EXCLUSION = 4

/** Full-abstain headline when the recording cannot support a report. */
export const UNTRUSTWORTHY_REPORT_MESSAGE =
  'We could not produce a trustworthy squat report from this recording.'

/** Framing line for questionable sets — observations only, no coaching. */
export const QUESTIONABLE_REPORT_MESSAGE =
  'Use this as a capture-quality check, not a movement report.'

export function buildSessionResult(
  reps: RepMetrics[],
  poseConfidenceSamples: number[] = [],
  postureSamples: PostureFrameSample[] = [],
  repRejections: RepRejection[] = [],
  protocolId: ProtocolId = getActiveProtocol().definition.id,
): SessionResult {
  const noRepsDetected = reps.length === 0
  const { score: sessionConfidenceScore, level: sessionConfidence } =
    calculateSessionConfidence(reps, poseConfidenceSamples)

  // ── Report-level quality gate (session/setQualityGate.ts) ─────────
  // Classifies the set from already-produced evidence; never re-tunes
  // rep gates. Untrusted reps (impossible or missing bottom readings)
  // are excluded from every aggregate below, always with disclosure.
  const quality = assessSetQuality(reps, repRejections)
  const untrustedSet = new Set(quality.untrustedRepNumbers)
  const trustedReps = reps.filter((rep) => !untrustedSet.has(rep.repNumber))

  const deviantRep =
    trustedReps.length >= MIN_REPS_FOR_OUTLIER_EXCLUSION
      ? findMostDeviantRep(trustedReps)
      : null
  const excludedRepNumbers = new Set<number>(quality.untrustedRepNumbers)
  if (deviantRep !== null) {
    excludedRepNumbers.add(deviantRep)
  }

  const metrics = collectSetMetrics(
    reps,
    sessionConfidenceScore,
    excludedRepNumbers,
  )

  // 3D posture reads derive from trusted reps only — an impossible
  // bottom must never drive hinge/trunk/smoothness averages.
  const posture = noRepsDetected
    ? null
    : collectPostureMetrics(trustedReps, postureSamples)

  // Keyed MetricResult[] (M6): dual-written alongside the legacy summary.
  // Only squat has metric definitions today; other protocols emit none.
  // Posture proxies (M21) ride along whenever the 3D stream was usable.
  // Provenance follows the SELECTED protocol, not the active default —
  // an explicit id must never be silently overridden (M43).
  const provenance = makeProvenance({
    captureSource: 'live',
    protocolId: getProtocol(protocolId).definition.defaultObservationProtocolId,
  })
  const metricResults: MetricResult[] =
    noRepsDetected || protocolId !== 'squat'
      ? []
      : [
          ...buildSquatMetricResults(metrics, provenance),
          ...buildPostureMetricResults(posture, provenance),
        ]

  if (noRepsDetected) {
    return {
      protocolId,
      metrics,
      metricResults,
      findings: [],
      scoring: null,
      feedback: [],
      sessionConfidence,
      sessionConfidenceScore,
      insufficientData: true,
      noRepsDetected: true,
      posture: null,
      baseline: null,
      quality,
    }
  }

  const scoring = computeComponentScores(metrics)
  const insufficientData = sessionConfidence === 'Low'
  // Coaching only renders for a valid set: questionable = observations
  // only, invalid = full abstain (verdict-or-abstain, ontology P2). Findings
  // and cues are derived together so the copy stays consistent (M7).
  const coaching =
    insufficientData || quality.verdict !== 'valid'
      ? { findings: [], cues: [] }
      : deriveCoaching({
          protocolId,
          components: scoring,
          sessionConfidence,
          metrics,
          metricResults,
          quality,
        })

  // Root-cause candidates (M22) explain only findings that were surfaced —
  // an abstaining set gets no cards by construction.
  const rootCauses = deriveRootCauses(coaching.findings, metrics, metricResults)

  return {
    protocolId,
    metrics,
    metricResults,
    findings: coaching.findings,
    rootCauses,
    scoring,
    feedback: coaching.cues,
    sessionConfidence,
    sessionConfidenceScore,
    insufficientData,
    noRepsDetected: false,
    posture,
    baseline: null,
    quality,
  }
}

export function buildResultsSummary(result: SessionResult): string {
  if (result.noRepsDetected) return NO_REPS_MESSAGE
  if (result.quality.verdict === 'invalid') return UNTRUSTWORTHY_REPORT_MESSAGE
  if (result.insufficientData) return INSUFFICIENT_DATA_MESSAGE
  if (!result.scoring) return 'Set complete — your breakdown is below.'

  const { metrics, sessionConfidence, quality } = result
  const repLine = `${metrics.repCount} rep${metrics.repCount === 1 ? '' : 's'} from this camera view`

  const depthPart =
    metrics.avgDepth !== null
      ? ` · avg depth ~${Math.round(metrics.avgDepth)}° knee bend`
      : ''

  const untrustedSet = new Set(quality.untrustedRepNumbers)
  const deviantExcluded = metrics.excludedRepNumbers.filter(
    (repNumber) => !untrustedSet.has(repNumber),
  )

  let exclusionPart = ''
  if (quality.untrustedRepNumbers.length > 0) {
    const list = quality.untrustedRepNumbers.join(', ')
    exclusionPart += ` Rep${quality.untrustedRepNumbers.length === 1 ? '' : 's'} ${list} carried readings the camera cannot trust and ${quality.untrustedRepNumbers.length === 1 ? 'is' : 'are'} left out of the averages.`
  }
  if (deviantExcluded.length > 0) {
    exclusionPart += ` Rep ${deviantExcluded.join(', ')} differed most from your set pattern and is left out of the averages.`
  }

  let summary = `${repLine}${depthPart}.${exclusionPart}`

  if (sessionConfidence === 'Medium') {
    summary += ' Good enough to compare sets — brighter light or a bit more distance can sharpen the read.'
  } else if (sessionConfidence === 'Low') {
    summary += ' Low camera confidence — use as a rough guide, not a precise grade.'
  }

  return summary
}
