/**
 * Bridge from a neutral benchmark sequence into the existing replay/benchmark
 * layer (M62) — and, deliberately, the boundary where it refuses.
 *
 * A `BenchmarkSequence` is NOT a `PoseTape`: the pose-tape replay path is
 * squat-cyclic and MediaPipe-shaped. This bridge decides, conservatively,
 * whether a given sequence can feed the cyclic squat replay at all, and
 * abstains (with a reason) otherwise — so `PoseTape` never becomes a
 * universal raw-data container and no non-squat trial is silently forced
 * through squat phases (ADR-007). Turning eligibility into an actual replay
 * is a later, gated milestone; this module only draws the line.
 */
import type { CanonicalJoint } from './canonicalSkeleton'
import type { BenchmarkSequence } from './benchmarkSequence'

/** Canonical joints the squat cyclic engine needs to even attempt replay. */
export const SQUAT_REQUIRED_CANONICAL_JOINTS: readonly CanonicalJoint[] = [
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const

export interface BridgeEligibility {
  eligible: boolean
  /** Reasons the sequence is NOT eligible (empty when eligible). */
  reasons: string[]
}

function hasUsableJoint(seq: BenchmarkSequence, joint: CanonicalJoint): boolean {
  // At least one frame must actually observe the joint (not unavailable/missing
  // for the entire sequence).
  return seq.frames.some((f) =>
    f.joints.some(
      (j) => j.joint === joint && (j.state === 'observed' || j.state === 'derived'),
    ),
  )
}

/**
 * Decide whether a sequence can be offered to the cyclic squat replay. This
 * is intentionally strict: only cyclic squat-shaped, sagittally-usable
 * sequences pass. A transition trial (e.g. sit-to-stand) or a sequence
 * missing lower-limb joints abstains rather than being reshaped.
 */
export function bridgeToCyclicSquat(seq: BenchmarkSequence): BridgeEligibility {
  const reasons: string[] = []

  const activity = seq.labels.activity?.toLowerCase()
  if (activity !== undefined && activity !== 'squat' && activity !== 'deep-squat') {
    reasons.push(
      `activity "${seq.labels.activity}" is not squat — non-squat trials are not forced through squat phases.`,
    )
  }

  // Any explicit transition event means this is not a cyclic-rep trial.
  if (seq.labels.events.some((e) => e.type === 'transition')) {
    reasons.push(
      'sequence carries a transition event (e.g. sit-to-stand); the cyclic engine assumes repetitions.',
    )
  }

  for (const joint of SQUAT_REQUIRED_CANONICAL_JOINTS) {
    if (!hasUsableJoint(seq, joint)) {
      reasons.push(`required joint "${joint}" is never observed in this sequence.`)
    }
  }

  return { eligible: reasons.length === 0, reasons }
}

/** One-line human summary of the bridge policy for docs/tooling. */
export function describeBenchmarkBridge(): string {
  return (
    'A benchmark sequence feeds squat cyclic replay only when its activity is ' +
    'squat, it has no transition events, and all sagittal lower-limb joints are ' +
    'observed; otherwise the bridge abstains. It never converts a sequence into ' +
    'a PoseTape as a universal container.'
  )
}
