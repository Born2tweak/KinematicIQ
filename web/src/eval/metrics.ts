/**
 * Benchmark metrics for the replay harness (M18). Kept deliberately simple and
 * dependency-free so the harness can run headless in CI.
 *
 * Reports **variance separately from bias**: filtering should lower jitter/CV
 * (variance) without shifting rep count or bottom-frame timing (bias).
 */
import type { PoseFrame, RepMetrics } from '../cv/types'

export function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}

export function variance(xs: readonly number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length
}

/** Per-rep depth = deepest (min) knee angle across the two sides. */
export function repDepths(reps: readonly RepMetrics[]): number[] {
  return reps
    .map((r) => {
      const knees = [r.minLeftKneeAngle, r.minRightKneeAngle].filter(
        (v): v is number => v !== null,
      )
      return knees.length ? Math.min(...knees) : NaN
    })
    .filter((v) => Number.isFinite(v))
}

/** Coefficient of variation of per-rep depth (%). Null with < 2 reps. */
export function depthCV(reps: readonly RepMetrics[]): number | null {
  const d = repDepths(reps)
  if (d.length < 2) return null
  const m = mean(d)
  if (m === 0) return null
  return (Math.sqrt(variance(d)) / m) * 100
}

/**
 * Jitter proxy for a landmark axis over the tape: the mean absolute discrete
 * acceleration `|x[i+1] − 2·x[i] + x[i-1]|`. High-frequency noise dominates this
 * term, so a smoother (filtered) signal yields a lower value. Lower = better.
 */
export function landmarkJitter(
  frames: readonly PoseFrame[],
  landmarkIndex: number,
  axis: 'x' | 'y' | 'z' = 'y',
): number {
  const sig = frames
    .map((f) => f.landmarks[landmarkIndex]?.[axis] ?? NaN)
    .filter((v) => Number.isFinite(v))
  if (sig.length < 3) return 0
  let acc = 0
  for (let i = 1; i < sig.length - 1; i++) {
    acc += Math.abs(sig[i + 1] - 2 * sig[i] + sig[i - 1])
  }
  return acc / (sig.length - 2)
}

export function bottomFrames(reps: readonly RepMetrics[]): number[] {
  return reps.map((r) => r.bottomFrameIndex)
}

/** Mean absolute error between predicted and truth series (paired by index). */
export function meanAbsError(pred: readonly number[], truth: readonly number[]): number {
  const n = Math.min(pred.length, truth.length)
  if (n === 0) return NaN
  let s = 0
  for (let i = 0; i < n; i++) s += Math.abs(pred[i] - truth[i])
  return s / n
}
