/**
 * Aggregates per-frame 3D posture samples into per-rep and per-set
 * posture metrics: hinge-vs-squat strategy, trunk stability through the
 * rep, and movement smoothness. Also flags the rep that deviates most
 * from the athlete's own within-set pattern (2D-only, so it works even
 * when 3D is unavailable — 2D remains the floor).
 */
import type { RepMetrics } from '../../cv/types'
import { average, standardDeviation } from '../stats'
import type { PostureFrameSample } from './postureFrame'
import { normalizedJerk } from './smoothness'

/** Minimum 3D samples inside a rep window for a usable read. */
export const MIN_SAMPLES_PER_REP = 5

/** Minimum mean sample confidence for a usable 3D read. */
export const MIN_REP_SAMPLE_CONFIDENCE = 0.5

/** |z| this large marks a rep as deviating from the set's own pattern. */
export const DEVIATION_Z_THRESHOLD = 1.5

/**
 * Spread below which a feature is treated as uniform and scores nothing.
 *
 * A z-score is scale-free, so a set whose spread is pure numerical noise
 * still produces large z-scores — nine reps agreeing on bottom knee angle
 * to five decimal places were being ranked against each other and one was
 * reported to the athlete as differing most. These floors are expressed in
 * each feature's own units, because "is this spread meaningful?" is a
 * measurement question, not a statistical one.
 */
/** Bottom knee-angle spread inside camera estimation noise (degrees). */
export const MIN_MEANINGFUL_DEPTH_SD_DEG = 1

/** Rep-duration spread below ~1.5 frames at 30 fps is unresolvable (ms). */
export const MIN_MEANINGFUL_DURATION_SD_MS = 50

/** Which per-rep feature drove a deviation flag. */
export type DeviationBasis = 'depth' | 'duration'

/**
 * How a deviation flag is described to the athlete. Single source of truth:
 * the flag is rendered on the Results summary, the rep-by-rep chart and the
 * posture concepts, and those three must not drift into making different
 * claims about the same rep.
 */
export function deviationPhrase(basis: DeviationBasis | null): string {
  return basis === 'duration'
    ? 'took a noticeably different amount of time'
    : 'reached a noticeably different depth'
}

export interface RepDeviation {
  repNumber: number
  /**
   * The feature the flag came from. Carried to the UI because the
   * rep-by-rep chart plots depth only: highlighting a bar for a *timing*
   * outlier, with no way to tell which, is not a claim the athlete can
   * check against what is on screen.
   */
  basis: DeviationBasis
}

export interface RepPostureMetrics {
  repNumber: number
  /** hipFlexion : kneeFlexion at the deepest sample. >1 = hip-led, <1 = knee-led. */
  hingeRatio: number | null
  /** Std dev of 3D trunk angle across the rep (degrees). Trunk-level only. */
  trunkVariability: number | null
  /** Dimensionless normalized jerk of the hip trajectory (lower = smoother). */
  normalizedJerk: number | null
  /** Mean forward-head proxy angle across the rep (deg; M21). */
  forwardHeadAngle: number | null
  /** Mean shoulder-elevation ratio across the rep (M21; lower = shrugged). */
  shoulderElevationRatio: number | null
  /** Mean 3D sample confidence in [0, 1]; 0 when no usable samples. */
  sampleConfidence: number
}

export interface PostureSetSummary {
  repPosture: RepPostureMetrics[]
  avgHingeRatio: number | null
  avgTrunkVariability: number | null
  avgNormalizedJerk: number | null
  /** Set-average forward-head proxy angle (deg; M21). */
  avgForwardHeadAngle: number | null
  /** Set-average shoulder-elevation ratio (M21). */
  avgShoulderElevationRatio: number | null
  /**
   * Rep number deviating most from this set's own pattern (depth +
   * duration z-scores), or null when the set is too small/uniform.
   * Within-set only — longitudinal baselines are future scope.
   */
  mostDeviantRep: number | null
  /** Which feature drove `mostDeviantRep`; null when nothing is flagged. */
  mostDeviantRepBasis: DeviationBasis | null
  /** Fraction of reps with a usable 3D read, in [0, 1]. */
  sampleCoverage: number
}

function repDepth(rep: RepMetrics): number | null {
  const candidates = [rep.minLeftKneeAngle, rep.minRightKneeAngle].filter(
    (v): v is number => v !== null,
  )
  return candidates.length === 0 ? null : Math.min(...candidates)
}

/** Max |z| across available per-rep features (depth, duration). */
function deviationScores(
  reps: readonly RepMetrics[],
): Map<number, { z: number; basis: DeviationBasis }> {
  const scores = new Map<number, { z: number; basis: DeviationBasis }>()
  if (reps.length < 3) return scores

  const features: Array<{
    basis: DeviationBasis
    read: (rep: RepMetrics) => number | null
    minMeaningfulSd: number
  }> = [
    {
      basis: 'depth',
      read: (rep) => repDepth(rep),
      minMeaningfulSd: MIN_MEANINGFUL_DEPTH_SD_DEG,
    },
    {
      basis: 'duration',
      read: (rep) => rep.durationMs,
      minMeaningfulSd: MIN_MEANINGFUL_DURATION_SD_MS,
    },
  ]

  for (const feature of features) {
    const values = reps.map(feature.read)
    const present = values.filter((v): v is number => v !== null)
    if (present.length < 3) continue
    const m = average(present)
    const sd = standardDeviation(present)
    if (m === null || sd === null || sd < feature.minMeaningfulSd) continue
    reps.forEach((rep, i) => {
      const v = values[i]
      if (v === null) return
      const z = Math.abs((v - m) / sd)
      const previous = scores.get(rep.repNumber)
      if (previous === undefined || z > previous.z) {
        scores.set(rep.repNumber, { z, basis: feature.basis })
      }
    })
  }
  return scores
}

/**
 * Rep deviating most from this set's own pattern (depth + duration
 * z-scores), or null when the set is too small/uniform. Exported so set
 * aggregation can exclude the outlier from headline metrics (with
 * disclosure) — flagging a rep as an artifact and then averaging it in
 * anyway is inconsistent.
 */
export function findMostDeviantRep(
  reps: readonly RepMetrics[],
): RepDeviation | null {
  const scores = deviationScores(reps)
  let deviation: RepDeviation | null = null
  let maxZ = 0
  for (const [repNumber, { z, basis }] of scores) {
    if (z >= DEVIATION_Z_THRESHOLD && z > maxZ) {
      maxZ = z
      deviation = { repNumber, basis }
    }
  }
  return deviation
}

function analyzeRep(
  rep: RepMetrics,
  samples: readonly PostureFrameSample[],
): RepPostureMetrics {
  const inWindow = samples.filter(
    (s) => s.timestamp >= rep.startTimestamp && s.timestamp <= rep.endTimestamp,
  )

  const empty: RepPostureMetrics = {
    repNumber: rep.repNumber,
    hingeRatio: null,
    trunkVariability: null,
    normalizedJerk: null,
    forwardHeadAngle: null,
    shoulderElevationRatio: null,
    sampleConfidence: 0,
  }

  if (inWindow.length < MIN_SAMPLES_PER_REP) return empty

  const confidence = average(inWindow.map((s) => s.confidence)) ?? 0
  if (confidence < MIN_REP_SAMPLE_CONFIDENCE) return empty

  // Deepest sample = greatest knee flexion.
  const deepest = inWindow.reduce((a, b) =>
    b.kneeFlexion > a.kneeFlexion ? b : a,
  )
  const hingeRatio =
    deepest.kneeFlexion > 5
      ? deepest.hipFlexion / deepest.kneeFlexion
      : null

  const trunkVariability = standardDeviation(
    inWindow.map((s) => s.trunkAngle),
  )

  const jerk = normalizedJerk(
    inWindow.map((s) => s.hipCenter),
    inWindow.map((s) => s.timestamp),
  )

  return {
    repNumber: rep.repNumber,
    hingeRatio,
    trunkVariability,
    normalizedJerk: jerk,
    forwardHeadAngle: averageOf(
      inWindow.map((s) => s.forwardHeadAngle ?? null),
    ),
    shoulderElevationRatio: averageOf(
      inWindow.map((s) => s.shoulderElevationRatio ?? null),
    ),
    sampleConfidence: confidence,
  }
}

function averageOf(
  values: Array<number | null>,
): number | null {
  const present = values.filter((v): v is number => v !== null)
  return average(present)
}

export function collectPostureMetrics(
  reps: readonly RepMetrics[],
  samples: readonly PostureFrameSample[],
): PostureSetSummary {
  const repPosture = reps.map((rep) => analyzeRep(rep, samples))

  const usable = repPosture.filter(
    (r) => r.sampleConfidence >= MIN_REP_SAMPLE_CONFIDENCE,
  )

  const deviation = findMostDeviantRep(reps)

  return {
    repPosture,
    avgHingeRatio: averageOf(usable.map((r) => r.hingeRatio)),
    avgTrunkVariability: averageOf(usable.map((r) => r.trunkVariability)),
    avgNormalizedJerk: averageOf(usable.map((r) => r.normalizedJerk)),
    avgForwardHeadAngle: averageOf(usable.map((r) => r.forwardHeadAngle)),
    avgShoulderElevationRatio: averageOf(
      usable.map((r) => r.shoulderElevationRatio),
    ),
    mostDeviantRep: deviation?.repNumber ?? null,
    mostDeviantRepBasis: deviation?.basis ?? null,
    sampleCoverage: reps.length === 0 ? 0 : usable.length / reps.length,
  }
}
