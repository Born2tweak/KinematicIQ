import { describe, expect, it } from 'vitest'
import { MIN_JERK_SAMPLES, normalizedJerk } from './smoothness'

function times(n: number, dtMs = 66): number[] {
  return Array.from({ length: n }, (_, i) => i * dtMs)
}

describe('normalizedJerk', () => {
  it('returns ~0 for constant-velocity motion', () => {
    const n = 20
    const positions = Array.from({ length: n }, (_, i) => ({
      x: 0,
      y: i * 0.02,
      z: 0,
    }))
    const nj = normalizedJerk(positions, times(n))
    expect(nj).not.toBeNull()
    expect(nj!).toBeLessThan(1e-6)
  })

  it('scores oscillating motion as much less smooth than a single sweep', () => {
    const n = 30
    const t = times(n)
    // One smooth half-sine descent...
    const smooth = t.map((_, i) => ({
      x: 0,
      y: 0.4 * Math.sin((Math.PI * i) / (n - 1)),
      z: 0,
    }))
    // ...versus the same sweep with mid-rep stutter. (Not a period-2
    // square wave — central differencing is blind to that alias.)
    const jerky = t.map((_, i) => ({
      x: 0,
      y: 0.4 * Math.sin((Math.PI * i) / (n - 1)) + 0.03 * Math.sin(i * 2.4),
      z: 0,
    }))
    const njSmooth = normalizedJerk(smooth, t)
    const njJerky = normalizedJerk(jerky, t)
    expect(njSmooth).not.toBeNull()
    expect(njJerky).not.toBeNull()
    expect(njJerky!).toBeGreaterThan(njSmooth! * 5)
  })

  it('returns null for short series, bad time order, or no movement', () => {
    const short = Array.from({ length: MIN_JERK_SAMPLES - 1 }, (_, i) => ({
      x: i,
      y: 0,
      z: 0,
    }))
    expect(normalizedJerk(short, times(MIN_JERK_SAMPLES - 1))).toBeNull()

    const n = 12
    const still = Array.from({ length: n }, () => ({ x: 0, y: 0, z: 0 }))
    expect(normalizedJerk(still, times(n))).toBeNull()

    const positions = Array.from({ length: n }, (_, i) => ({ x: i, y: 0, z: 0 }))
    const badTimes = times(n)
    badTimes[5] = badTimes[4]
    expect(normalizedJerk(positions, badTimes)).toBeNull()
  })
})
