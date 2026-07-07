/**
 * Local session report export (M33).
 *
 * Builds a self-contained, shareable audit artifact from a finished
 * `SessionResult`: a versioned JSON document and a network-free HTML page.
 * Local-only by design — nothing here uploads, phones home, or embeds remote
 * assets (docs/research/08 artifact strategy; docs/doctrine/deferred-scope.md
 * defers all backend persistence and sharing).
 *
 * The export mirrors the rendered report exactly, including abstention: an
 * invalid recording exports `movement: null` plus the quality reasons and
 * capture fixes — never a movement read the screen itself refused to show
 * (claims-policy: full abstain on invalid capture). Raw pose frames are NOT
 * included; the pose tape has its own separate export (eval/downloadTape.ts).
 */
import type { MetricResult } from '../core/metric'
import type { Finding } from '../core/finding'
import type { ProtocolId } from '../core/protocol'
import { makeProvenance, type Provenance } from '../core/provenance'
import type { SetQualityAssessment } from '../session/setQualityGate'
import type { RootCauseCard } from '../findings/rootCauses'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'
import type {
  CoachingCue,
  ConfidenceLevel,
  SessionBaseline,
  SessionResult,
  SetMetricsSummary,
} from '../session/types'

/** Bump when the exported shape changes; readers must check before trusting. */
export const REPORT_SCHEMA_VERSION = 1

/** Discriminator so a stray JSON file can be recognized as one of ours. */
export const REPORT_KIND = 'kinematiciq.session-report' as const

/**
 * Which revision of docs/doctrine/claims-policy.md the exported copy was
 * written against. Bump when the doctrine doc materially changes.
 */
export const CLAIM_POLICY_VERSION = 'claims-policy-v1'

/**
 * App/build identifier stamped into every report. Matches web/package.json;
 * update together (no build-time injection exists yet — see M46 version
 * registry for the planned single source).
 */
export const APP_VERSION = 'kinematiq-web@0.1.0'

/** Same copy as components/DisclaimerBanner.tsx — reports carry it verbatim. */
export const REPORT_DISCLAIMER =
  'Movement observations only — not medical advice. Observations reflect what ' +
  'the camera could see in this set and may vary with setup and lighting.'

/** How validation tiers gate language (claims-policy) — shipped in every report. */
export const VALIDATION_TIER_NOTE =
  'Validation tiers: experimental = internal estimate only; production = ' +
  'coaching cue backed by internal benchmarks; research/clinical tiers are ' +
  'not claimed by this app.'

/**
 * The movement report proper — present only when the recording earned one.
 * Invalid sets fully abstain: this whole block is null and only quality
 * reasons, capture fixes, and the rep audit remain.
 */
export interface ExportedMovementReport {
  /** Legacy aggregate summary (per-rep metrics, averages, CVs). */
  metrics: SetMetricsSummary
  /** Keyed metric results with confidence, provenance, validation tier. */
  metricResults: MetricResult[]
  /** Observation-language findings with their evidence chains. */
  findings: Finding[]
  /** Coaching cues derived from the findings. */
  feedback: CoachingCue[]
  /** 3D posture reads; null when unavailable. */
  posture: PostureSetSummary | null
  /** Comparison against the athlete's own saved history; null without history. */
  baseline: SessionBaseline | null
  /** Possible-contributor cards — plausibility language, never diagnosis. */
  rootCauses: RootCauseCard[]
}

/** One rep's audit row — kept even on invalid sets (aggregates are not). */
export interface ExportedRepAudit {
  repNumber: number
  /** Bottom-of-rep knee angle (min of sides), degrees; null when unreadable. */
  bottomKneeAngleDeg: number | null
  /** Average trunk lean across the rep, degrees; null when unreadable. */
  avgTrunkLeanDeg: number | null
}

export interface ExportedSessionReport {
  kind: typeof REPORT_KIND
  schemaVersion: number
  appVersion: string
  claimPolicyVersion: string
  /** ISO-8601 time the report artifact was generated (not the capture time). */
  generatedAt: string
  disclaimer: string
  validationTierNote: string
  protocolId: ProtocolId
  /** Capture + processing lineage (model, filter, capture source, ...). */
  provenance: Provenance
  /** Report-level verdict with reasons, fixes, and untrusted reps. */
  quality: SetQualityAssessment
  sessionConfidence: ConfidenceLevel
  sessionConfidenceScore: number
  insufficientData: boolean
  noRepsDetected: boolean
  /** Per-rep audit rows; survive even when the movement report abstains. */
  repAudit: ExportedRepAudit[]
  /** Null when the set fully abstained (invalid recording). */
  movement: ExportedMovementReport | null
}

export interface BuildReportOptions {
  /** Generation time; defaults to now. Injectable for stable tests. */
  now?: Date
  /** Baseline computed by the caller (ResultsScreen owns it); default null. */
  baseline?: SessionBaseline | null
  appVersion?: string
}

function repAuditRows(result: SessionResult): ExportedRepAudit[] {
  return result.metrics.reps.map((rep) => {
    const knees = [rep.minLeftKneeAngle, rep.minRightKneeAngle].filter(
      (value): value is number => value !== null,
    )
    return {
      repNumber: rep.repNumber,
      bottomKneeAngleDeg: knees.length === 0 ? null : Math.min(...knees),
      avgTrunkLeanDeg: rep.averageTrunkLean,
    }
  })
}

/**
 * Snapshot a finished session into the exportable report shape. Pure; the
 * download side effects live in the helpers below.
 */
export function buildSessionReport(
  result: SessionResult,
  options: BuildReportOptions = {},
): ExportedSessionReport {
  const provenance =
    result.metricResults[0]?.provenance ??
    makeProvenance({ captureSource: 'live' })
  const abstained = result.quality.verdict === 'invalid'
  return {
    kind: REPORT_KIND,
    schemaVersion: REPORT_SCHEMA_VERSION,
    appVersion: options.appVersion ?? APP_VERSION,
    claimPolicyVersion: CLAIM_POLICY_VERSION,
    generatedAt: (options.now ?? new Date()).toISOString(),
    disclaimer: REPORT_DISCLAIMER,
    validationTierNote: VALIDATION_TIER_NOTE,
    protocolId: result.protocolId,
    provenance,
    quality: result.quality,
    sessionConfidence: result.sessionConfidence,
    sessionConfidenceScore: result.sessionConfidenceScore,
    insufficientData: result.insufficientData,
    noRepsDetected: result.noRepsDetected,
    repAudit: repAuditRows(result),
    movement: abstained
      ? null
      : {
          metrics: result.metrics,
          metricResults: result.metricResults,
          findings: result.findings,
          feedback: result.feedback,
          posture: result.posture,
          baseline: options.baseline ?? null,
          rootCauses: result.rootCauses ?? [],
        },
  }
}

/** Stable, human-diffable JSON (2-space indent, insertion-ordered keys). */
export function serializeReport(report: ExportedSessionReport): string {
  return JSON.stringify(report, null, 2)
}

/** `kinematiciq-report-<protocol>-<yyyy-mm-dd>.<ext>` */
export function reportFilename(
  report: ExportedSessionReport,
  extension: 'json' | 'html',
): string {
  const stamp = report.generatedAt.slice(0, 10)
  return `kinematiciq-report-${report.protocolId}-${stamp}.${extension}`
}

/** Trigger a client-side download. DOM-only; no upload occurs. */
export function downloadReportFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadReportJson(report: ExportedSessionReport): void {
  downloadReportFile(
    serializeReport(report),
    reportFilename(report, 'json'),
    'application/json',
  )
}
