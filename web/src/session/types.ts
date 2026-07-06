import type { RepMetrics } from '../cv/types'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'
import type { MetricResult } from '../core/metric'
import type { Finding } from '../core/finding'
import type { ProtocolId } from '../core/protocol'
import type { SetQualityAssessment } from './setQualityGate'

export interface SetMetricsSummary {
  repCount: number
  reps: RepMetrics[]
  /**
   * Reps flagged as within-set outliers and left out of the aggregate
   * metrics below (avg/min/max depth, CV, asymmetry, trunk lean). Always
   * disclosed in coach-facing copy; empty when nothing was excluded.
   */
  excludedRepNumbers: number[]
  avgDepth: number | null
  avgTrunkLean: number | null
  depthCV: number | null
  minDepth: number | null
  maxDepth: number | null
  avgHipShift: number | null
  avgKneeAsymmetry: number | null
  avgShoulderAsymmetry: number | null
  overallConfidence: number
  // ── Tempo & phase timing (M18, MD03 minimum set). Optional: sessions
  // stored before M18 lack them and the tempo metrics abstain.
  /** Average full-rep duration across included reps (ms). */
  avgRepDurationMs?: number | null
  /** CV (%) of rep duration — tempo repeatability across the set. */
  repDurationCV?: number | null
  /** Average descent (start → deepest point) duration (ms). */
  avgDescentMs?: number | null
  /** Average ascent (deepest point → completion) duration (ms). */
  avgAscentMs?: number | null
  /** Set cadence in reps per minute (first rep start → last rep end). */
  cadenceRepsPerMin?: number | null
  // ── ROM proxies beyond the knee (M19, MD03 minimum set). Optional:
  // sessions stored before M19 lack them and the metrics abstain.
  /** Average deepest hip-flexion proxy angle across included reps (deg). */
  avgMinHipAngle?: number | null
  /** Average deepest ankle-dorsiflexion proxy angle across included reps (deg). */
  avgMinAnkleAngle?: number | null
}

export interface ComponentScores {
  depth: number
  trunkControl: number
  kneeTracking: number
  consistency: number
  symmetry: number
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

export interface CoachingCue {
  issue: string
  /** What the camera measured in this set. */
  observed: string
  /** Biomechanical context — coaching only, not medical advice. */
  whyItMatters: string
  /** One actionable cue for the next set. */
  tryNext: string
  confidence: ConfidenceLevel
  /** Shown when camera confidence is medium (or low if cues are ever shown). */
  confidenceNote: string | null
}

/**
 * Seam for future longitudinal comparison against the athlete's own
 * history. Always null today — within-set deviation lives in
 * `posture.mostDeviantRep`. No backend, no persistence.
 */
export interface SessionBaseline {
  scope: 'longitudinal'
}

export interface SessionResult {
  /** Which protocol produced this result. Squat is protocol #1 (M5). */
  protocolId: ProtocolId
  metrics: SetMetricsSummary
  /**
   * Keyed metric results (M6) carrying confidence + provenance + validation
   * tier. Emitted alongside the legacy `metrics` summary (dual-write until the
   * report reads these directly in M8). Empty when no reps.
   */
  metricResults: MetricResult[]
  /**
   * Rule-based findings (M7): observation-language statements with evidence
   * chains + confidence. Coaching cues are derived from these. Empty on
   * abstain (invalid set or low confidence).
   */
  findings: Finding[]
  /**
   * Per-component evidence inputs (depth, trunk, knee tracking, consistency,
   * symmetry). These survive as evidence for future verdicts — there is no
   * composite 0–100 total or band (ontology §6 #15). Null when no reps.
   */
  scoring: ComponentScores | null
  feedback: CoachingCue[]
  sessionConfidence: ConfidenceLevel
  sessionConfidenceScore: number
  insufficientData: boolean
  noRepsDetected: boolean
  /** 3D posture reads (hinge ratio, trunk stability, smoothness); null when unavailable. */
  posture: PostureSetSummary | null
  /** Future longitudinal baseline comparison — always null today. */
  baseline: SessionBaseline | null
  /**
   * Report-level quality classification (valid / questionable / invalid).
   * Invalid sets FULLY ABSTAIN from the movement report: no posture profile,
   * no metric summary, no coaching — only reasons, capture fixes, and
   * diagnostics. See session/setQualityGate.ts.
   */
  quality: SetQualityAssessment
}
