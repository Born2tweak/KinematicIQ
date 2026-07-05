import type { RepMetrics } from '../cv/types'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'

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
  metrics: SetMetricsSummary
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
}
