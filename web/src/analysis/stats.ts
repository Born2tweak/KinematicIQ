/**
 * Small statistics helpers shared across the analysis layer. Kept dependency-free
 * and side-effect-free so any module can import them without cycles.
 */

/** Plain arithmetic mean; null for an empty input. */
export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Population standard deviation; null for fewer than 2 values. */
export function standardDeviation(values: readonly number[]): number | null {
  if (values.length < 2) return null
  const m = values.reduce((sum, v) => sum + v, 0) / values.length
  const variance =
    values.reduce((sum, v) => sum + (v - m) * (v - m), 0) / values.length
  return Math.sqrt(variance)
}

/**
 * Confidence-weighted mean of `[value, weight]` pairs. Pairs with a non-finite
 * value or a non-positive weight are ignored. Returns null when nothing remains.
 * Used to downweight poorly-tracked reps in set-level aggregates.
 */
export function weightedMean(pairs: ReadonlyArray<readonly [number, number]>): number | null {
  const valid = pairs.filter(([v, w]) => Number.isFinite(v) && w > 0)
  if (valid.length === 0) return null
  const weightSum = valid.reduce((s, [, w]) => s + w, 0)
  if (weightSum === 0) return null
  return valid.reduce((s, [v, w]) => s + v * w, 0) / weightSum
}
