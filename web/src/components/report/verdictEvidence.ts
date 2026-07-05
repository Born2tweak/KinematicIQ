/**
 * Evidence backing each verdict card in the report (Stream: demo/visual).
 *
 * Pure presentation-layer derivation: every value here is read from the
 * SessionResult the analysis already produced — reps analyzed, reps excluded
 * and why, the reads a concept derived from, and per-dimension confidence.
 * Nothing feeds back into analysis, and no new claims are introduced: the
 * dimensions decompose the existing session-confidence inputs, they do not
 * invent new measurements.
 */
import type { PostureConcept, PostureConceptId } from '../../analysis/posture/postureConcepts'
import type { SessionResult } from '../../session/types'

export interface ExcludedRepEvidence {
  repNumber: number
  why: string
}

export interface ConfidenceDimension {
  id: 'visibility' | 'tracking' | 'protocol'
  label: string
  /** 0–100, derived from existing analysis outputs only. */
  score: number
  /** What this dimension is measuring, in observation language. */
  basis: string
}

export interface VerdictEvidence {
  /** Reps that fed this concept's aggregate (after exclusions). */
  repsAnalyzed: number
  repsCounted: number
  excludedReps: ExcludedRepEvidence[]
  /** The concrete reads the concept was derived from. */
  derivedFrom: string[]
  dimensions: ConfidenceDimension[]
}

const clampPercent = (value: number): number =>
  Math.round(Math.min(100, Math.max(0, value)))

/** Reads each concept derives from — evidence copy, observation language only. */
const CONCEPT_SOURCES: Record<PostureConceptId, string[]> = {
  workingDepth: ['Bottom-of-rep knee angle (min of left/right) per included rep'],
  tallChest: ['Average trunk-lean angle from vertical per included rep'],
  evenBase: ['Lateral hip offset relative to the ankles at the bottom of each included rep'],
  evenDrive: ['Left vs right bottom knee angle difference per included rep'],
  repeatable: ['Rep-to-rep variation (CV) of bottom knee angle across included reps'],
  hingeStrategy: ['Hip-bend vs knee-bend ratio from the 3D pose stream (on-device estimate)'],
  spineStability: ['Within-rep trunk-angle drift from the 3D pose stream (trunk-level read only)'],
  smoothness: ['Hip-path smoothness (normalized jerk) from the 3D pose stream — expert-review tier, not validated'],
  deviation: ['Per-rep deviation from the set\u2019s own average pattern'],
}

/**
 * Per-dimension confidence decomposition. Presentation-only: each dimension
 * restates evidence the pipeline already computed —
 * - visibility: the landmark-visibility confidence already aggregated per rep
 * - tracking: how many counted reps carried complete reads (both knees + trunk)
 * - protocol: how much of the recording the quality gate could trust
 */
export function buildConfidenceDimensions(result: SessionResult): ConfidenceDimension[] {
  const reps = result.metrics.reps
  const repCount = reps.length

  const visibility = clampPercent(result.metrics.overallConfidence)

  const completeReps = reps.filter(
    (rep) =>
      rep.minLeftKneeAngle !== null &&
      rep.minRightKneeAngle !== null &&
      rep.averageTrunkLean !== null,
  ).length
  const tracking = repCount === 0 ? 0 : clampPercent((completeReps / repCount) * 100)

  const trustedFraction =
    repCount === 0 ? 0 : result.quality.trustedRepCount / repCount
  const phantomPenalty = Math.min(30, result.quality.phantomCandidateCount)
  const protocol = clampPercent(trustedFraction * 100 - phantomPenalty)

  return [
    {
      id: 'visibility',
      label: 'Landmark visibility',
      score: visibility,
      basis: 'How clearly the camera saw the joints it read (per-rep landmark confidence).',
    },
    {
      id: 'tracking',
      label: 'Tracking completeness',
      score: tracking,
      basis: `${completeReps} of ${repCount} counted reps carried complete knee and trunk reads.`,
    },
    {
      id: 'protocol',
      label: 'Recording quality',
      score: protocol,
      basis: `${result.quality.trustedRepCount} of ${repCount} reps passed the trust checks${
        result.quality.phantomCandidateCount > 0
          ? `; ${result.quality.phantomCandidateCount} phantom candidates logged`
          : ''
      }.`,
    },
  ]
}

/** Excluded reps with coach-readable reasons (quality gate + within-set outlier). */
export function buildExcludedReps(result: SessionResult): ExcludedRepEvidence[] {
  const excluded: ExcludedRepEvidence[] = result.quality.untrustedReps.map(
    (rep) => ({ repNumber: rep.repNumber, why: rep.detail }),
  )
  const untrusted = new Set(result.quality.untrustedRepNumbers)
  for (const repNumber of result.metrics.excludedRepNumbers) {
    if (untrusted.has(repNumber)) continue
    excluded.push({
      repNumber,
      why: `Rep ${repNumber} deviated most from the set's own pattern and is left out of the averages.`,
    })
  }
  return excluded.sort((a, b) => a.repNumber - b.repNumber)
}

/** Full evidence bundle for one verdict card. */
export function buildVerdictEvidence(
  concept: PostureConcept,
  result: SessionResult,
): VerdictEvidence {
  const excludedReps = buildExcludedReps(result)
  const repsCounted = result.metrics.reps.length
  return {
    repsCounted,
    repsAnalyzed: Math.max(0, repsCounted - excludedReps.length),
    excludedReps,
    derivedFrom: CONCEPT_SOURCES[concept.id] ?? [],
    dimensions: buildConfidenceDimensions(result),
  }
}
