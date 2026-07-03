import type { RepMetrics } from '../cv/types'
import type { PostureSetSummary } from '../analysis/posture/postureCollector'

export interface SetMetricsSummary {
  repCount: number
  reps: RepMetrics[]
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

export type ScoreBand = 'Excellent' | 'Good' | 'Needs Work' | 'Poor'

export interface ScoringResult {
  totalScore: number
  band: ScoreBand
  components: ComponentScores
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
  scoring: ScoringResult | null
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
