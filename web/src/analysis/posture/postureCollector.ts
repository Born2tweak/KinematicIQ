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

export interface RepPostureMetrics {
  repNumber: number
  /** hipFlexion : kneeFlexion at the deepest sample. >1 = hip-led, <1 = knee-led. */
  hingeRatio: number | null
  /** Std dev of 3D trunk angle across the rep (degrees). Trunk-level only. */
  trunkVariability: number | null
  /** Dimensionless normalized jerk of the hip trajectory (lower = smoother). */
  normalizedJerk: number | null
  /** Mean 3D sample confidence in [0, 1]; 0 when no usable samples. */
  sampleConfidence: number
}

export interface PostureSetSummary {
  repPosture: RepPostureMetrics[]
  avgHingeRatio: number | null
  avgTrunkVariability: number | null
  avgNormalizedJerk: number | null
  /**
   * Rep number deviating most from this set's own pattern (depth +
   * duration z-scores), or null when the set is too small/uniform.
   * Within-set only — longitudinal baselines are future scope.
   */
  mostDeviantRep: number | null
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
function deviationScores(reps: readonly RepMetrics[]): Map<number, number> {
  const scores = new Map<number, number>()
  if (reps.length < 3) return scores

  const features: Array<(rep: RepMetrics) => number | null> = [
    (rep) => repDepth(rep),
    (rep) => rep.durationMs,
  ]

  for (const feature of features) {
    const values = reps.map(feature)
    const present = values.filter((v): v is number => v !== null)
    if (present.length < 3) continue
    const m = average(present)
    const sd = standardDeviation(present)
    if (m === null || sd === null || sd < 1e-9) continue
    reps.forEach((rep, i) => {
      const v = values[i]
      if (v === null) return
      const z = Math.abs((v - m) / sd)
      scores.set(rep.repNumber, Math.max(scores.get(rep.repNumber) ?? 0, z))
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
): number | null {
  const scores = deviationScores(reps)
  let mostDeviantRep: number | null = null
  let maxZ = 0
  for (const [repNumber, z] of scores) {
    if (z >= DEVIATION_Z_THRESHOLD && z > maxZ) {
      maxZ = z
      mostDeviantRep = repNumber
    }
  }
  return mostDeviantRep
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

  const mostDeviantRep = findMostDeviantRep(reps)

  return {
    repPosture,
    avgHingeRatio: averageOf(usable.map((r) => r.hingeRatio)),
    avgTrunkVariability: averageOf(usable.map((r) => r.trunkVariability)),
    avgNormalizedJerk: averageOf(usable.map((r) => r.normalizedJerk)),
    mostDeviantRep,
    sampleCoverage: reps.length === 0 ? 0 : usable.length / reps.length,
  }
}
