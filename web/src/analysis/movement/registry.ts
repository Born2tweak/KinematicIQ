/**
 * Movement registry — thin compatibility shim over the protocol engine
 * (protocols/registry.ts, M5). The pipeline reads its thresholds from the
 * active protocol's `MovementProfile`; squat is the only registered movement
 * today. New movements land as protocols, not new pipelines
 * (docs/strategy/execution-roadmap.md, Phases 4–5).
 *
 * Kept as a stable import surface for existing call sites; the source of truth
 * is now `protocols/registry.ts`.
 */
import {
  getActiveProtocolProfile,
  getProtocolProfile,
} from '../../protocols/registry'
import type { MovementId, MovementProfile } from './types'

/**
 * `getProtocolProfile` already refuses a non-cyclic profile, so a transition
 * protocol cannot reach the cyclic pipeline through this shim.
 */
export function getMovementProfile(id: MovementId): MovementProfile {
  try {
    return getProtocolProfile(id)
  } catch {
    throw new Error(`Movement profile not registered: ${id}`)
  }
}

/** The movement the app currently analyzes. Movement selection UI is Phase 4. */
export function getActiveProfile(): MovementProfile {
  return getActiveProtocolProfile()
}
