import type { RepMetrics } from '../cv/types'

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
  observation: string
  cue: string
  confidence: ConfidenceLevel
  note: string
}

export interface SessionResult {
  metrics: SetMetricsSummary
  scoring: ScoringResult | null
  feedback: CoachingCue[]
  sessionConfidence: ConfidenceLevel
  sessionConfidenceScore: number
  insufficientData: boolean
  noRepsDetected: boolean
}
