import type { RepMetrics } from '../cv/types'
import type { SetMetricsSummary } from '../session/types'
import { summarizeSetAsymmetry } from './asymmetryDetector'
import { weightedMean } from './stats'

const repDepth = (rep: RepMetrics): number | null => {
  const angles = [rep.minLeftKneeAngle, rep.minRightKneeAngle].filter(
    (value): value is number => value !== null,
  )
  if (angles.length === 0) return null
  return Math.min(...angles)
}

const average = (values: number[]): number | null => {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const standardDeviation = (values: number[]): number | null => {
  if (values.length < 2) return null
  const mean = average(values)
  if (mean === null) return null
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

/** Coefficient of variation as a percentage (std dev / mean × 100). */
export const depthCoefficientOfVariation = (depths: number[]): number | null => {
  if (depths.length < 2) return null
  const mean = average(depths)
  const stdDev = standardDeviation(depths)
  if (mean === null || stdDev === null || mean === 0) return null
  return (stdDev / mean) * 100
}

export function collectSetMetrics(
  reps: RepMetrics[],
  sessionConfidenceScore: number,
  excludedRepNumbers: ReadonlySet<number> = new Set(),
): SetMetricsSummary {
  // Outlier reps (e.g. a setup artifact flagged as deviating from the set's
  // own pattern) still count as reps but are excluded from the aggregate
  // metrics — always with disclosure via `excludedRepNumbers` in the summary.
  const included = reps.filter((rep) => !excludedRepNumbers.has(rep.repNumber))

  const depths = included
    .map(repDepth)
    .filter((value): value is number => value !== null)

  // Confidence-weighted set aggregates: reps tracked with lower pose confidence
  // contribute less to the summary metrics (noisier, less trustworthy).
  const depthPairs: Array<[number, number]> = []
  const trunkPairs: Array<[number, number]> = []
  for (const rep of included) {
    const depth = repDepth(rep)
    if (depth !== null) depthPairs.push([depth, rep.confidence])
    if (rep.averageTrunkLean !== null) trunkPairs.push([rep.averageTrunkLean, rep.confidence])
  }

  const asymmetry = summarizeSetAsymmetry(included)

  // ── Tempo & phase timing (M18) — timestamps only, no new observations.
  const durations = included.map((rep) => rep.durationMs)
  const descents = included
    .map((rep) =>
      rep.bottomTimestamp === undefined
        ? null
        : rep.bottomTimestamp - rep.startTimestamp,
    )
    .filter((v): v is number => v !== null && v >= 0)
  const ascents = included
    .map((rep) =>
      rep.bottomTimestamp === undefined
        ? null
        : rep.endTimestamp - rep.bottomTimestamp,
    )
    .filter((v): v is number => v !== null && v >= 0)
  // ── ROM proxies beyond the knee (M19) — abstain when unreadable.
  const hipMins = included
    .map((rep) => rep.minHipAngle)
    .filter((v): v is number => v !== null && v !== undefined)
  const ankleMins = included
    .map((rep) => rep.minAnkleAngle)
    .filter((v): v is number => v !== null && v !== undefined)

  // ── Path & speed proxies (M20) — filtered-trajectory reads only.
  const pathLengths = included
    .map((rep) => rep.hipPathLength)
    .filter((v): v is number => v !== null && v !== undefined)
  const peakSpeeds = included
    .map((rep) => rep.peakHipSpeed)
    .filter((v): v is number => v !== null && v !== undefined)

  const spanMs =
    included.length >= 2
      ? included[included.length - 1].endTimestamp - included[0].startTimestamp
      : 0

  return {
    repCount: reps.length,
    reps,
    excludedRepNumbers: reps
      .filter((rep) => excludedRepNumbers.has(rep.repNumber))
      .map((rep) => rep.repNumber),
    avgDepth: weightedMean(depthPairs),
    avgTrunkLean: weightedMean(trunkPairs),
    depthCV: depthCoefficientOfVariation(depths),
    minDepth: depths.length === 0 ? null : Math.min(...depths),
    maxDepth: depths.length === 0 ? null : Math.max(...depths),
    avgHipShift: asymmetry.avgHipShift,
    avgKneeAsymmetry: asymmetry.avgKneeAsymmetry,
    avgShoulderAsymmetry: asymmetry.avgShoulderAsymmetry,
    overallConfidence: sessionConfidenceScore,
    avgRepDurationMs: average(durations),
    repDurationCV: depthCoefficientOfVariation(durations),
    avgDescentMs: average(descents),
    avgAscentMs: average(ascents),
    cadenceRepsPerMin:
      spanMs > 0 ? (included.length / spanMs) * 60_000 : null,
    avgMinHipAngle: average(hipMins),
    avgMinAnkleAngle: average(ankleMins),
    avgHipPathLength: average(pathLengths),
    avgPeakHipSpeed: average(peakSpeeds),
  }
}
