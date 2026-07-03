/**
 * Movement registry: the pipeline reads its thresholds from the active
 * profile here. Squat is the only registered movement today; hip hinge,
 * jump, and sprint land as new profiles, not new pipelines
 * (docs/strategy/execution-roadmap.md, Phases 4–5).
 */
import { SQUAT_PROFILE } from './profiles/squat'
import type { MovementId, MovementProfile } from './types'

const PROFILES: Partial<Record<MovementId, MovementProfile>> = {
  squat: SQUAT_PROFILE,
}

export function getMovementProfile(id: MovementId): MovementProfile {
  const profile = PROFILES[id]
  if (!profile) {
    throw new Error(`Movement profile not registered: ${id}`)
  }
  return profile
}

/** The movement the app currently analyzes. Movement selection UI is Phase 4. */
export function getActiveProfile(): MovementProfile {
  return SQUAT_PROFILE
}
