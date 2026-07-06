/**
 * Protocol registry (M5) — the single source of truth for which movements the
 * platform knows about and which is active. Generalizes
 * `analysis/movement/registry.ts`; that module now delegates here.
 *
 * Squat is the only registered protocol today and the default active one.
 * Planned protocols (M10) register with `status: 'planned'` and no profile.
 */
import type { MovementProfile } from '../analysis/movement/types'
import { NotImplementedError, type ProtocolId } from '../core/protocol'
import { HIP_HINGE_PROTOCOL } from './hipHinge'
import { JUMP_PROTOCOL } from './jump'
import { SPRINT_PROTOCOL } from './sprint'
import { SQUAT_PROTOCOL } from './squat'
import type { Protocol } from './types'

const PROTOCOLS: Partial<Record<ProtocolId, Protocol>> = {
  squat: SQUAT_PROTOCOL,
  hipHinge: HIP_HINGE_PROTOCOL,
  jump: JUMP_PROTOCOL,
  sprint: SPRINT_PROTOCOL,
}

/** The movement the app analyzes by default until selection UI ships (M10). */
const ACTIVE_PROTOCOL_ID: ProtocolId = 'squat'

/** Look up a protocol by id. Throws for unregistered ids. */
export function getProtocol(id: ProtocolId): Protocol {
  const protocol = PROTOCOLS[id]
  if (!protocol) {
    throw new Error(`Protocol not registered: ${id}`)
  }
  return protocol
}

/** All registered protocols, in registration order. */
export function listProtocols(): Protocol[] {
  return Object.values(PROTOCOLS).filter(
    (p): p is Protocol => p !== undefined,
  )
}

/** Registered protocols filtered by lifecycle status. */
export function listProtocolsByStatus(
  status: Protocol['definition']['status'],
): Protocol[] {
  return listProtocols().filter((p) => p.definition.status === status)
}

/** The active protocol (squat default). */
export function getActiveProtocol(): Protocol {
  return getProtocol(ACTIVE_PROTOCOL_ID)
}

/**
 * Analyze entry point: the runtime analysis config for a protocol. Planned
 * stubs (M10) have no profile — this throws `NotImplementedError` so nothing
 * upstream can accidentally run an unvalidated analysis.
 */
export function getProtocolProfile(id: ProtocolId): MovementProfile {
  const { profile, definition } = getProtocol(id)
  if (!profile) {
    throw new NotImplementedError(definition.id)
  }
  return profile
}

/** The active protocol's runtime analysis config (squat today). */
export function getActiveProtocolProfile(): MovementProfile {
  return getProtocolProfile(getActiveProtocol().definition.id)
}

/** Test/M10 seam: register or replace a protocol at runtime. */
export function registerProtocol(protocol: Protocol): void {
  PROTOCOLS[protocol.definition.id] = protocol
}
