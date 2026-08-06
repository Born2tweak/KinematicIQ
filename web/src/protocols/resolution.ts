/**
 * Protocol resolution seam.
 *
 * KinematicIQ is meant to be one universal movement engine: observe the
 * movement, then decide which protocol applies. No classifier exists yet,
 * and this module deliberately does not pretend otherwise — it exists so
 * that "which movement is this?" has exactly one answer-shaped type, and so
 * that a classifier can later be plugged in behind it without every screen
 * growing its own opinion.
 *
 * The defect this replaces: both capture screens read `protocolId` out of
 * router state and silently fell back to `'squat'`. That fallback fires in a
 * real flow — the nav bar links to /camera with no state — so someone
 * arriving there was recording "a squat" without ever having said so, and
 * nothing on screen distinguished that from a movement they had chosen.
 *
 * Rule this module exists to enforce: never present a protocol as *detected*
 * unless a classifier actually produced it. See ADR-018's sibling discussion
 * and the universal-engine decision.
 */
import type { ProtocolId } from '../core/protocol'

/** Where a protocol assignment came from. */
export type ProtocolResolutionSource =
  /** The athlete picked this movement before capture. */
  | 'user-selected'
  /** A classifier observed the movement and produced this. None exists yet. */
  | 'classifier'
  /** Nothing selected anything; the engine fell back. Must be disclosed. */
  | 'fallback-default'

export interface ProtocolResolution {
  /**
   * The protocol to analyze under, or null when nothing can responsibly be
   * assigned. Null is a legitimate outcome — "unclassified movement" — not
   * an error state to paper over with a default.
   */
  protocolId: ProtocolId | null
  /**
   * Classifier confidence in [0, 1], or null when no classifier was
   * involved. A user's selection is an assertion, not a measurement, so it
   * carries null rather than 1 — reporting user intent as high confidence
   * would be the same category error the deviation flag made.
   */
  confidence: number | null
  source: ProtocolResolutionSource
  /** True when no protocol could be assigned. */
  abstained: boolean
}

/**
 * The protocol used when nothing was selected. Keeping capture working for
 * a bare /camera visit is worth a default; presenting that default as
 * though the athlete chose it is not.
 */
export const FALLBACK_PROTOCOL_ID: ProtocolId = 'squat'

/** The athlete chose this movement in the picker. */
export function resolveFromSelection(
  protocolId: ProtocolId,
): ProtocolResolution {
  return {
    protocolId,
    confidence: null,
    source: 'user-selected',
    abstained: false,
  }
}

/** Nothing selected a movement; disclose the fallback rather than hide it. */
export function resolveFallback(): ProtocolResolution {
  return {
    protocolId: FALLBACK_PROTOCOL_ID,
    confidence: null,
    source: 'fallback-default',
    abstained: false,
  }
}

/** Nothing could be assigned. Reserved for a real classifier's abstention. */
export function resolveAbstained(): ProtocolResolution {
  return {
    protocolId: null,
    confidence: null,
    source: 'classifier',
    abstained: true,
  }
}

/**
 * Resolve from a capture screen's router state. This is the only resolver
 * wired today, because selection is the only signal that actually exists.
 */
export function resolveProtocolFromRouteState(
  state: unknown,
): ProtocolResolution {
  const selected = (state as { protocolId?: ProtocolId } | null)?.protocolId
  return selected === undefined
    ? resolveFallback()
    : resolveFromSelection(selected)
}

/**
 * Whether the UI may describe this protocol as detected. Always false until
 * a classifier exists; wired so that adding one is the only change needed.
 */
export function isDetected(resolution: ProtocolResolution): boolean {
  return resolution.source === 'classifier' && !resolution.abstained
}

/**
 * Disclosure line for a resolution, or null when nothing needs saying.
 * A chosen movement needs no explanation; an assumed one does.
 */
export function resolutionDisclosure(
  resolution: ProtocolResolution,
  protocolName: string,
): string | null {
  if (resolution.source !== 'fallback-default') return null
  return `Analyzing as ${protocolName} — you didn't pick a movement, so this is the default. Choose a different one from Home if that's not what you're doing.`
}
