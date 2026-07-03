/**
 * MovementProfile: a movement is configuration, not a forked codebase.
 * Each profile bundles the thresholds and copy for one movement and
 * selects which segmentation engine interprets the frame stream.
 * Design: docs/strategy/movement-expansion.md.
 */
import type { AutoFinishConfig } from '../autoFinish'
import type { AutoStartConfig } from '../autoStart'
import type { PostureConceptId } from '../posture/postureConcepts'
import type { CyclicPhaseConfig } from '../phaseDetector'
import type { RepGateConfig } from '../repCounter'
import type { ActivationConfig } from '../setActivation'
import type { MovementScoringConfig } from '../../scoring/scoringConfig'
import type {
  CoachingCue,
  ConfidenceLevel,
  ScoringResult,
  SetMetricsSummary,
} from '../../session/types'

export type MovementId = 'squat' | 'hipHinge' | 'jump' | 'sprint'

/**
 * Segmentation engine kind — movements break the rep-cycle assumption
 * differently:
 * - cyclic: reps with a clear bottom (squat, hip hinge) → phase/rep FSM
 * - ballistic: flight + landing, no bottom (jump) → takeoff/landing detection
 * - gait: continuous, no reps (sprint) → stride segmentation
 */
export type MovementKind = 'cyclic' | 'ballistic' | 'gait'

/** Builds the movement's coaching cues from its scored set. */
export type FeedbackBuilder = (
  scoring: ScoringResult,
  sessionConfidence: ConfidenceLevel,
  metrics: SetMetricsSummary,
) => CoachingCue[]

export interface MovementProfile {
  id: MovementId
  /** User-facing movement name ("Bodyweight squat"). */
  label: string
  kind: MovementKind
  /** Cyclic-engine phase FSM thresholds (cyclic movements only). */
  phase: CyclicPhaseConfig
  /** Rep validation gates (cyclic movements only). */
  repGates: RepGateConfig
  autoStart: AutoStartConfig
  autoFinish: AutoFinishConfig
  activation: ActivationConfig
  scoring: MovementScoringConfig
  /** Posture concepts this movement prioritizes, in display order. */
  concepts: PostureConceptId[]
  /** Movement-specific coaching copy. */
  buildFeedback: FeedbackBuilder
}
