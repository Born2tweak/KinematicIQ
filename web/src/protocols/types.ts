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

export type {
  ProtocolDefinition,
  ProtocolId,
  ProtocolKind,
  ProtocolStatus,
} from '../core/protocol'
export { NotImplementedError, isAvailable } from '../core/protocol'

export interface Protocol {
  definition: ProtocolDefinition
  /**
   * Runtime analysis configuration. Present for `available` protocols;
   * `null` for `planned` stubs (M10) whose analysis is not implemented.
   */
  profile: MovementProfile | null
}
