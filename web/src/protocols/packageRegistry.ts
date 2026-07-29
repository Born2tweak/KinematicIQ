/**
 * Protocol packages for the shipped protocols (KQ-027).
 *
 * This is where the KQ-026 schema meets the real definitions. The states below
 * are assessed against what the code can actually do today, not against what we
 * would like the roadmap to say:
 *
 *   engineering: 'complete' requires a runnable input path AND a runtime that
 *   produces metrics. A protocol with `profile: null` or no `inputModes` cannot
 *   start a session, so it is 'partial' however finished its analysis seam is.
 *
 *   validation: every protocol is 'blocked' on RES-CORPUS. No frozen corpus
 *   exists, so nothing here has measured accuracy.
 *
 * That combination is deliberate. It means squat surfaces as Experimental
 * rather than as a bare "Available", which is the honest reading: it runs
 * end to end, and its accuracy has never been measured against reference data.
 */

import type { ProtocolDefinition } from '../core/protocol'
import {
  type EngineeringState,
  type ProtocolPackage,
  type ValidationState,
  validateProtocolPackage,
} from './package'

/** Every protocol is corpus-blocked until KQ-016/KQ-017 freeze real recordings. */
const CORPUS_BLOCKED: { validation: ValidationState; blockedBy: string[] } = {
  validation: 'blocked',
  blockedBy: ['RES-CORPUS'],
}

/**
 * Engineering state derived from the definition itself rather than declared,
 * so a protocol cannot claim to be runnable while lacking an input path.
 */
export function deriveEngineeringState(
  definition: ProtocolDefinition,
  hasRuntime: boolean,
): EngineeringState {
  const hasInputPath = (definition.capture?.inputModes?.length ?? 0) > 0
  if (!hasRuntime && !hasInputPath) return 'absent'
  return hasRuntime && hasInputPath ? 'complete' : 'partial'
}

export function buildProtocolPackage(
  definition: ProtocolDefinition,
  options: { hasRuntime: boolean; version: string },
): ProtocolPackage {
  const engineering = deriveEngineeringState(definition, options.hasRuntime)
  return validateProtocolPackage({
    packageVersion: 1,
    identity: {
      id: definition.id,
      label: definition.label,
      kind: definition.kind,
      version: options.version,
    },
    lifecycle: { engineering, ...CORPUS_BLOCKED },
    phases: [...definition.phases],
    requiredLandmarks: [...definition.requiredLandmarks],
    metrics: definition.metrics.map((metric) => metric.id),
    // Descriptive only. The claim gate refuses accuracy language while
    // validation is blocked, so this list cannot drift into a claim.
    allowedClaims: [],
  })
}
