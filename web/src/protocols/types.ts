/**
 * Protocol engine types (M5).
 *
 * A `Protocol` binds the movement-agnostic `ProtocolDefinition` (core/protocol,
 * the metadata + contract) to its runtime analysis config — the existing
 * `MovementProfile` (thresholds, phase/rep configs, feedback builder). Squat is
 * protocol #1; planned protocols (M10) carry a definition with `profile: null`
 * and throw when analyzed.
 *
 * This layer generalizes `analysis/movement/` without forking the pipeline: the
 * profile it wraps is exactly what the analysis modules already consume.
 */
import type { MovementProfile } from '../analysis/movement/types'
import type { ProtocolDefinition } from '../core/protocol'
import type { TransitionProtocolProfile } from './inlineLunge/profile'

export type {
  ProtocolDefinition,
  ProtocolId,
  ProtocolKind,
  ProtocolStatus,
  ProtocolEvidenceMetadataV2,
} from '../core/protocol'
export { NotImplementedError, isAvailable, validateProtocolDefinition } from '../core/protocol'

/**
 * A protocol's runtime analysis configuration.
 *
 * Two shapes exist because two segmentation engines exist. `MovementProfile`
 * configures the shared cyclic rep engine; `TransitionProtocolProfile`
 * configures a protocol whose unit of observation is a discrete transition.
 * They are discriminated by `kind` — a `MovementProfile` is never 'transition'.
 */
export type ProtocolAnalysisProfile = MovementProfile | TransitionProtocolProfile

export interface Protocol {
  definition: ProtocolDefinition
  /**
   * Runtime analysis configuration, or `null` for a protocol with no
   * implemented analysis at all (M10 stubs).
   *
   * Kept for compatibility alongside the M39 `ProtocolRuntime` contract
   * (`./runtime.ts`) — the pluggable runtime that will supersede direct
   * profile consumption once call sites migrate (M43).
   */
  profile: ProtocolAnalysisProfile | null
}

/** True when this profile drives the shared cyclic rep engine. */
export function isCyclicMovementProfile(
  profile: ProtocolAnalysisProfile | null,
): profile is MovementProfile {
  return profile !== null && profile.kind !== 'transition'
}

export type { TransitionProtocolProfile } from './inlineLunge/profile'
export type { ProtocolRuntime, ReportMetadata } from './runtime'
export type {
  ProtocolTrialKind,
  ProtocolTrialOutcome,
  ProtocolTrialOutcomeSetV1,
} from './outcome'
export { validateProtocolTrialOutcomeSet } from './outcome'
