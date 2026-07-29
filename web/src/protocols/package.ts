/**
 * Protocol package schema (KQ-026) — validates a movement protocol from
 * identity through release state as one object.
 *
 * The existing `ProtocolStatus` is binary: `available` or `planned`. That
 * cannot express the state forward lunge is actually in — engineering-complete
 * and runnable in the browser, but scientifically unvalidated. Without a third
 * state the only options are to hide working software or to imply validation
 * that does not exist. Both are wrong.
 *
 * A package therefore separates three independent axes that were previously
 * collapsed into one flag:
 *
 *   engineering  - does the code exist and run end to end?
 *   validation   - has it been measured against evidence?
 *   release      - what may a user be told about it?
 *
 * Release state is derived, never declared. A package cannot claim to be
 * released without validation evidence, so no amount of engineering progress
 * can promote a protocol into a scientific claim.
 */

import type { ProtocolId, ProtocolKind } from '../core/protocol'

/** Does the implementation exist and run through the shared runtime? */
export type EngineeringState = 'absent' | 'partial' | 'complete'

/** Has it been measured? `blocked` means the evidence is externally gated. */
export type ValidationState = 'unvalidated' | 'blocked' | 'in-progress' | 'validated'

/**
 * What a user may be told. Derived from the two states above.
 *
 *   unavailable  - cannot be selected
 *   experimental - selectable, labelled experimental, no accuracy claim
 *   released     - selectable and evidence-backed
 */
export type ReleaseState = 'unavailable' | 'experimental' | 'released'

export interface ProtocolPackageIdentity {
  id: ProtocolId
  label: string
  kind: ProtocolKind
  /** Semantic version of this package's behaviour. */
  version: string
}

export interface ProtocolPackageLifecycle {
  engineering: EngineeringState
  validation: ValidationState
  /** Resource ids blocking validation, e.g. RES-CORPUS. */
  blockedBy: string[]
}

export interface ProtocolPackage {
  packageVersion: 1
  identity: ProtocolPackageIdentity
  lifecycle: ProtocolPackageLifecycle
  /** Ordered phase vocabulary; must be non-empty and unique. */
  phases: string[]
  /** Landmark indices required before analysis may run. */
  requiredLandmarks: number[]
  /** Metric ids this package emits. */
  metrics: string[]
  /** Claims permitted at the current release state. */
  allowedClaims: string[]
}

export class ProtocolPackageError extends Error {}

const SEMVER = /^\d+\.\d+\.\d+$/

/**
 * Derive what a user may be told.
 *
 * Deliberately one-way: engineering completeness alone reaches `experimental`
 * and stops there. Only validation evidence reaches `released`, and a blocked
 * validation can never do so however finished the code is.
 */
export function deriveReleaseState(lifecycle: ProtocolPackageLifecycle): ReleaseState {
  if (lifecycle.engineering !== 'complete') return 'unavailable'
  return lifecycle.validation === 'validated' ? 'released' : 'experimental'
}

/** True when the protocol may be selected and run at all. */
export function isSelectable(pkg: ProtocolPackage): boolean {
  return deriveReleaseState(pkg.lifecycle) !== 'unavailable'
}

/**
 * Copy shown next to the protocol. Experimental packages must say so, and must
 * name what is missing rather than implying an oversight.
 */
export function releaseLabel(pkg: ProtocolPackage): string {
  const state = deriveReleaseState(pkg.lifecycle)
  if (state === 'released') return 'Validated'
  if (state === 'unavailable') return 'In development — not yet available'
  const blockers = pkg.lifecycle.blockedBy
  return blockers.length
    ? `Experimental — runs, but accuracy is unvalidated (awaiting ${blockers.join(', ')})`
    : 'Experimental — runs, but accuracy is unvalidated'
}

/**
 * Validate a package from identity through release state.
 *
 * Fails closed: an invalid package is refused rather than partially accepted,
 * because a half-valid protocol would surface to a user as working software.
 */
export function validateProtocolPackage(pkg: ProtocolPackage): ProtocolPackage {
  if (pkg.packageVersion !== 1) {
    throw new ProtocolPackageError(
      `Unsupported protocol package version ${String(pkg.packageVersion)}.`,
    )
  }
  const { identity, lifecycle } = pkg
  if (!identity?.id) throw new ProtocolPackageError('Package requires an identity id.')
  if (!identity.label?.trim()) {
    throw new ProtocolPackageError(`${identity.id}: requires a user-facing label.`)
  }
  if (!SEMVER.test(identity.version ?? '')) {
    throw new ProtocolPackageError(
      `${identity.id}: version must be semantic, got ${String(identity.version)}.`,
    )
  }
  if (!pkg.phases?.length) {
    throw new ProtocolPackageError(`${identity.id}: requires at least one phase.`)
  }
  if (new Set(pkg.phases).size !== pkg.phases.length) {
    throw new ProtocolPackageError(`${identity.id}: phase names must be unique.`)
  }
  if (!pkg.requiredLandmarks?.length) {
    throw new ProtocolPackageError(
      `${identity.id}: requires at least one required landmark.`,
    )
  }
  if (pkg.requiredLandmarks.some((index) => !Number.isInteger(index) || index < 0)) {
    throw new ProtocolPackageError(
      `${identity.id}: landmark indices must be non-negative integers.`,
    )
  }
  if (lifecycle.validation === 'blocked' && !lifecycle.blockedBy.length) {
    throw new ProtocolPackageError(
      `${identity.id}: blocked validation must name the blocking resources.`,
    )
  }
  if (lifecycle.validation !== 'blocked' && lifecycle.blockedBy.length) {
    throw new ProtocolPackageError(
      `${identity.id}: only blocked validation may name blocking resources.`,
    )
  }
  // A complete implementation must still emit something measurable, or its
  // "complete" claim is unfalsifiable.
  if (lifecycle.engineering === 'complete' && !pkg.metrics.length) {
    throw new ProtocolPackageError(
      `${identity.id}: a complete implementation must emit at least one metric.`,
    )
  }
  assertClaimsPermitted(pkg)
  return pkg
}

const ACCURACY_WORDS = [
  'accurate',
  'accuracy',
  'validated',
  'clinical',
  'diagnos',
  'reliable',
  'proven',
]

/**
 * Refuse accuracy language on anything not actually released.
 *
 * This is the guard that keeps engineering availability from leaking into a
 * scientific claim: an experimental package may describe what it computes, but
 * not how right it is.
 */
export function assertClaimsPermitted(pkg: ProtocolPackage): void {
  if (deriveReleaseState(pkg.lifecycle) === 'released') return
  for (const claim of pkg.allowedClaims) {
    const lowered = claim.toLowerCase()
    const offending = ACCURACY_WORDS.find((word) => lowered.includes(word))
    if (offending) {
      throw new ProtocolPackageError(
        `${pkg.identity.id}: claim "${claim}" implies accuracy ("${offending}") but the ` +
          `package is ${deriveReleaseState(pkg.lifecycle)}, not released.`,
      )
    }
  }
}
