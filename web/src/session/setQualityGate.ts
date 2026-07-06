/**
 * Results Quality Gate — report-level classification of a finished set as
 * valid / questionable / invalid, from evidence the pipeline already produced.
 *
 * This is verdict-or-abstain applied to the report itself (product thesis,
 * ontology P2): the app prefers "we cannot trust this recording" over fake
 * coaching. Driven by findings #5/#6/#8 (docs/validation/session-log.md):
 * reps counted while standing (175–178° bottoms), extreme-flexion tracking
 * artifacts (13–20° bottoms), and reps counted with no knee data at all.
 *
 * IMPORTANT: this module never touches the rep-counting gates (findings #5/#6
 * stay open pending labeled data). It only classifies and excludes at the
 * REPORT level, with disclosure — the counted reps and the pose tape are
 * preserved untouched for audit.
 */
import type { RepMetrics } from '../cv/types'
import type { RepRejection } from '../analysis/repCounter'

export type SetQualityVerdict = 'valid' | 'questionable' | 'invalid'

export type RepTrustReasonId =
  | 'no-knee-data'
  | 'standing-bottom'
  | 'impossible-flexion'

/** A counted rep whose primary data cannot support any read. */
export interface UntrustedRep {
  repNumber: number
  reason: RepTrustReasonId
  /** Coach-readable explanation (observation language only). */
  detail: string
}

export type SetQualityReasonId =
  | 'no-reps'
  | 'standing-reps-counted'
  | 'impossible-flexion-reps'
  | 'knee-less-reps'
  | 'too-few-trusted-reps'
  | 'small-sample'
  | 'artifact-heavy-set'
  | 'phantom-candidate-churn'

export interface SetQualityReason {
  id: SetQualityReasonId
  detail: string
}

export interface SetQualityAssessment {
  verdict: SetQualityVerdict
  /** Why the set was downgraded; empty for a valid set. */
  reasons: SetQualityReason[]
  /** Concrete capture changes that would unlock a trustworthy report. */
  captureFixes: string[]
  /** Reps whose bottom readings cannot support any read. */
  untrustedReps: UntrustedRep[]
  untrustedRepNumbers: number[]
  /** Counted reps remaining after untrusted reps are set aside. */
  trustedRepCount: number
  /** Zero-descent phase-jitter candidates in the rejection ledger. */
  phantomCandidateCount: number
}

// ── Report-level trust thresholds ───────────────────────────────────
// These classify already-counted reps for reporting; they are NOT rep
// gates and deliberately sit far outside any plausible squat so they
// only catch physically impossible reads.

/** Bottom knee angle above this = the athlete never bent the knees (standing). */
export const STANDING_BOTTOM_KNEE_MIN = 170

/** Bottom knee angle below this = tracking artifact (near-impossible flexion). */
export const IMPOSSIBLE_FLEXION_KNEE_MAX = 30

/** Fewer trustworthy reps than this and set-level patterns are meaningless. */
export const MIN_TRUSTED_REPS = 3

/** Untrusted fraction at or above this marks the whole recording untrustworthy. */
export const UNTRUSTED_FRACTION_INVALID = 0.3

/**
 * Phantom candidates at or above this suggest sustained tracking churn.
 * Set above the 15 phantoms observed on a clean 9-rep session (session a)
 * so ordinary jitter never downgrades a good recording.
 */
export const PHANTOM_CHURN_QUESTIONABLE = 30

/** Bottom-of-rep knee angle: min of left/right, matching the report metric. */
function repBottomKnee(rep: RepMetrics): number | null {
  const knees = [rep.minLeftKneeAngle, rep.minRightKneeAngle].filter(
    (value): value is number => value !== null,
  )
  return knees.length === 0 ? null : Math.min(...knees)
}

function classifyRep(rep: RepMetrics): UntrustedRep | null {
  const bottom = repBottomKnee(rep)
  if (bottom === null) {
    return {
      repNumber: rep.repNumber,
      reason: 'no-knee-data',
      detail: `Rep ${rep.repNumber} was counted without a single knee-angle reading.`,
    }
  }
  if (bottom >= STANDING_BOTTOM_KNEE_MIN) {
    return {
      repNumber: rep.repNumber,
      reason: 'standing-bottom',
      detail: `Rep ${rep.repNumber} recorded a ${Math.round(bottom)}° bottom knee angle — the knees never appeared to bend.`,
    }
  }
  if (bottom <= IMPOSSIBLE_FLEXION_KNEE_MAX) {
    return {
      repNumber: rep.repNumber,
      reason: 'impossible-flexion',
      detail: `Rep ${rep.repNumber} recorded a ${Math.round(bottom)}° bottom knee angle — deeper than a body can fold; a tracking artifact.`,
    }
  }
  return null
}

const CAPTURE_FIX_LIBRARY: Record<RepTrustReasonId | 'phantom', string> = {
  'standing-bottom':
    'Stand still between reps and keep each rep a clear down-and-up — extra movement while standing can register as reps.',
  'impossible-flexion':
    'Step back so your whole body, including your feet, stays in frame for the entire set — clipped frames distort the tracked skeleton.',
  'no-knee-data':
    'Keep both knees visible for the whole set — avoid walking toward the camera mid-set.',
  phantom:
    'Record in steady, even lighting and keep the camera fixed — flickering tracking creates false movement.',
}

function pluralReps(repNumbers: readonly number[]): string {
  const list = repNumbers.join(', ')
  return repNumbers.length === 1 ? `Rep ${list}` : `Reps ${list}`
}

/**
 * Classify a finished set from evidence the pipeline already produced.
 * Pure and deterministic; safe to run in the report builder.
 */
export function assessSetQuality(
  reps: readonly RepMetrics[],
  rejections: readonly RepRejection[] = [],
): SetQualityAssessment {
  const phantomCandidateCount = rejections.filter((r) => r.phantom).length

  if (reps.length === 0) {
    return {
      verdict: 'invalid',
      reasons: [
        { id: 'no-reps', detail: 'No full reps were counted in this recording.' },
      ],
      captureFixes: [
        'Get your whole body in frame, hold still to calibrate, then do clear down-and-up reps with a pause at the bottom.',
      ],
      untrustedReps: [],
      untrustedRepNumbers: [],
      trustedRepCount: 0,
      phantomCandidateCount,
    }
  }

  const untrustedReps = reps
    .map(classifyRep)
    .filter((flag): flag is UntrustedRep => flag !== null)
  const untrustedRepNumbers = untrustedReps.map((flag) => flag.repNumber)
  const trustedRepCount = reps.length - untrustedReps.length
  const untrustedFraction = untrustedReps.length / reps.length

  const reasons: SetQualityReason[] = []
  const fixes = new Set<string>()

  const byReason = (reason: RepTrustReasonId): number[] =>
    untrustedReps.filter((flag) => flag.reason === reason).map((f) => f.repNumber)

  const standing = byReason('standing-bottom')
  if (standing.length > 0) {
    reasons.push({
      id: 'standing-reps-counted',
      detail: `${pluralReps(standing)} recorded bottom knee angles above ${STANDING_BOTTOM_KNEE_MIN}° — counted while standing, with no visible knee bend.`,
    })
    fixes.add(CAPTURE_FIX_LIBRARY['standing-bottom'])
  }

  const flexion = byReason('impossible-flexion')
  if (flexion.length > 0) {
    reasons.push({
      id: 'impossible-flexion-reps',
      detail: `${pluralReps(flexion)} recorded bottom knee angles below ${IMPOSSIBLE_FLEXION_KNEE_MAX}° — tracking artifacts, not movement the camera can vouch for.`,
    })
    fixes.add(CAPTURE_FIX_LIBRARY['impossible-flexion'])
  }

  const kneeless = byReason('no-knee-data')
  if (kneeless.length > 0) {
    reasons.push({
      id: 'knee-less-reps',
      detail: `${pluralReps(kneeless)} counted without any knee-angle reading at all.`,
    })
    fixes.add(CAPTURE_FIX_LIBRARY['no-knee-data'])
  }

  if (phantomCandidateCount >= PHANTOM_CHURN_QUESTIONABLE) {
    reasons.push({
      id: 'phantom-candidate-churn',
      detail: `${phantomCandidateCount} zero-descent candidates hit the diagnostics ledger — sustained tracking churn during this recording.`,
    })
    fixes.add(CAPTURE_FIX_LIBRARY.phantom)
  }

  let verdict: SetQualityVerdict = reasons.length > 0 ? 'questionable' : 'valid'

  if (trustedRepCount < MIN_TRUSTED_REPS) {
    // A short set is only untrustworthy when it is short BECAUSE the
    // recording produced artifacts. A clean 1–2-rep clip (2026-07-06 batch
    // eval: 5 of 9 upload tapes) earns per-rep observations — the gate
    // abstains from SET-PATTERN claims, not from the reps themselves.
    if (trustedRepCount > 0 && reasons.length === 0) {
      reasons.push({
        id: 'small-sample',
        detail: `Only ${trustedRepCount} rep${trustedRepCount === 1 ? '' : 's'} in this recording — enough for per-rep reads, too few to describe a set-level pattern.`,
      })
      fixes.add(
        'Record at least 3 reps in one continuous set for a set-level movement report.',
      )
      verdict = 'questionable'
    } else {
      reasons.push({
        id: 'too-few-trusted-reps',
        detail: `Only ${trustedRepCount} rep${trustedRepCount === 1 ? '' : 's'} carried readings the camera can trust — too few to describe a movement pattern.`,
      })
      verdict = 'invalid'
    }
  } else if (untrustedFraction >= UNTRUSTED_FRACTION_INVALID) {
    reasons.push({
      id: 'artifact-heavy-set',
      detail: `${untrustedReps.length} of ${reps.length} counted reps carried readings the camera cannot trust — too much of this recording is artifact to report on the rest.`,
    })
    verdict = 'invalid'
  }

  return {
    verdict,
    reasons,
    captureFixes: [...fixes],
    untrustedReps,
    untrustedRepNumbers,
    trustedRepCount,
    phantomCandidateCount,
  }
}
