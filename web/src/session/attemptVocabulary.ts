/**
 * What one unit of a movement is called, per protocol kind.
 *
 * Shared result copy was written when squat was the only protocol, so it says
 * "reps" everywhere. A forward-lunge report inherited that and told athletes
 * about "the trusted reps" for a movement that counts trials — the same class
 * of defect as the squat posture concepts and the "pause at the bottom" cue,
 * and the same reason: shared copy that assumes a cyclic movement.
 *
 * The noun comes from `ProtocolKind` rather than from a per-protocol string so
 * a new protocol cannot forget to set it. A kind with no obvious noun falls
 * back to "attempts", which is vague but never wrong — unlike "reps", which is
 * both specific and false for anything that is not cyclic.
 */
import type { ProtocolKind } from '../core/protocol'

export interface AttemptNoun {
  singular: string
  plural: string
}

const NOUNS: Record<ProtocolKind, AttemptNoun> = {
  cyclic: { singular: 'rep', plural: 'reps' },
  transition: { singular: 'trial', plural: 'trials' },
  // A jump and a sprint are neither reps nor trials in the athlete's language,
  // and inventing a term for a protocol that does not run yet would just be a
  // guess to unpick later.
  ballistic: { singular: 'attempt', plural: 'attempts' },
  gait: { singular: 'attempt', plural: 'attempts' },
}

const FALLBACK: AttemptNoun = { singular: 'attempt', plural: 'attempts' }

/** The noun for one completed unit of this kind of movement. */
export function attemptNoun(kind: ProtocolKind | undefined): AttemptNoun {
  return kind ? (NOUNS[kind] ?? FALLBACK) : FALLBACK
}
