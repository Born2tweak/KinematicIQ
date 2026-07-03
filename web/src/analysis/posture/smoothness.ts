/**
 * Movement smoothness via dimensionless normalized jerk of a 3D
 * trajectory (hip center / center-of-mass proxy) over one rep.
 *
 * Lower = smoother. The classic dimensionless form:
 *   NJ = sqrt( 1/2 · ∫ ‖jerk‖² dt · D⁵ / L² )
 * where D is duration and L is path length — so the number is
 * comparable across rep durations and movement amplitudes.
 *
 * Observation-tier metric (see docs/strategy/validation-strategy.md):
 * used for within-athlete, within-set comparison only. Never a force,
 * power, or efficiency *measurement* claim.
 */
import type { Vector3Like } from '../../cv/pose3d'

/** Minimum samples for a meaningful third derivative. */
export const MIN_JERK_SAMPLES = 8

function sub(a: Vector3Like, b: Vector3Like): Vector3Like {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function norm(v: Vector3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

function scale(v: Vector3Like, s: number): Vector3Like {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

/** Central-difference derivative of a vector series over (possibly uneven) timestamps. */
function derivative(
  values: readonly Vector3Like[],
  timesSec: readonly number[],
): Vector3Like[] {
  const out: Vector3Like[] = []
  for (let i = 1; i < values.length - 1; i++) {
    const dt = timesSec[i + 1] - timesSec[i - 1]
    if (dt <= 0) return []
    out.push(scale(sub(values[i + 1], values[i - 1]), 1 / dt))
  }
  return out
}

/**
 * Dimensionless normalized jerk of a trajectory. Returns null when the
 * series is too short, time is non-monotonic, or the path length is
 * effectively zero (no movement to assess).
 */
export function normalizedJerk(
  positions: readonly Vector3Like[],
  timestampsMs: readonly number[],
): number | null {
  const n = positions.length
  if (n < MIN_JERK_SAMPLES || timestampsMs.length !== n) return null

  const t = timestampsMs.map((ms) => ms / 1000)
  for (let i = 1; i < n; i++) {
    if (t[i] <= t[i - 1]) return null
  }

  const duration = t[n - 1] - t[0]
  if (duration <= 0) return null

  let pathLength = 0
  for (let i = 1; i < n; i++) {
    pathLength += norm(sub(positions[i], positions[i - 1]))
  }
  if (pathLength < 1e-6) return null

  // velocity → acceleration → jerk (each central difference shortens the series)
  const velocity = derivative(positions, t)
  const accel = derivative(velocity, t.slice(1, n - 1))
  const jerk = derivative(accel, t.slice(2, n - 2))
  if (jerk.length === 0) return null

  const jerkTimes = t.slice(3, n - 3)
  let integral = 0
  for (let i = 0; i < jerk.length; i++) {
    const dt =
      i === 0
        ? jerkTimes.length > 1
          ? jerkTimes[1] - jerkTimes[0]
          : duration / n
        : jerkTimes[i] - jerkTimes[i - 1]
    const j = norm(jerk[i])
    integral += j * j * Math.max(dt, 0)
  }

  return Math.sqrt(
    (0.5 * integral * Math.pow(duration, 5)) / (pathLength * pathLength),
  )
}
