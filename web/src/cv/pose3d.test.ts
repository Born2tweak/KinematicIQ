import { describe, expect, it } from 'vitest'
import type { WorldLandmark } from './types'
import {
  createWorldLandmarkSmoother,
  hipCenter,
  jointArcPoints,
  worldToThree,
} from './pose3d'

function makeNoise(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s / 0xffffffff) * 2 - 1 // [-1, 1)
  }
}

function variance(xs: readonly number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length
  return xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length
}

function makeWorldLandmarks(overrides: Partial<Record<number, WorldLandmark>> = {}): WorldLandmark[] {
  const base: WorldLandmark[] = Array.from({ length: 33 }, () => ({
    x: 0,
    y: 0,
    z: 0,
    visibility: 0.9,
  }))
  for (const [i, lm] of Object.entries(overrides)) {
    base[Number(i)] = lm as WorldLandmark
  }
  return base
}

describe('worldToThree', () => {
  it('flips Y and Z, leaves X unchanged when not mirrored', () => {
    const out = worldToThree({ x: 0.1, y: 0.2, z: 0.3 })
    expect(out.x).toBeCloseTo(0.1, 9)
    expect(out.y).toBeCloseTo(-0.2, 9)
    expect(out.z).toBeCloseTo(-0.3, 9)
  })

  it('also flips X when mirrored', () => {
    const out = worldToThree({ x: 0.1, y: 0.2, z: 0.3 }, { mirror: true })
    expect(out.x).toBeCloseTo(-0.1, 9)
    expect(out.y).toBeCloseTo(-0.2, 9)
    expect(out.z).toBeCloseTo(-0.3, 9)
  })

  it('maps the origin to the origin', () => {
    const out = worldToThree({ x: 0, y: 0, z: 0 })
    expect(out.x).toBe(0)
    expect(out.y === 0 || Object.is(out.y, -0)).toBe(true)
    expect(out.z === 0 || Object.is(out.z, -0)).toBe(true)
  })
})

describe('hipCenter', () => {
  it('returns the midpoint of landmarks 23 and 24', () => {
    const worldLandmarks = makeWorldLandmarks({
      23: { x: -0.1, y: 0.5, z: 0.02, visibility: 1 },
      24: { x: 0.1, y: 0.3, z: 0.04, visibility: 1 },
    })
    const c = hipCenter(worldLandmarks)
    expect(c.x).toBeCloseTo(0, 9)
    expect(c.y).toBeCloseTo(0.4, 9)
    expect(c.z).toBeCloseTo(0.03, 9)
  })

  it('ignores landmarks other than 23/24', () => {
    const worldLandmarks = makeWorldLandmarks({
      0: { x: 999, y: 999, z: 999, visibility: 1 },
      23: { x: 1, y: 1, z: 1, visibility: 1 },
      24: { x: 3, y: 3, z: 3, visibility: 1 },
    })
    expect(hipCenter(worldLandmarks)).toEqual({ x: 2, y: 2, z: 2 })
  })
})

describe('jointArcPoints', () => {
  it('produces segments + 1 points, all at `radius` from b, for a 90 degree case', () => {
    const b = { x: 0, y: 0, z: 0 }
    const a = { x: 1, y: 0, z: 0 } // direction from b: +x
    const c = { x: 0, y: 1, z: 0 } // direction from b: +y
    const radius = 2
    const segments = 8
    const pts = jointArcPoints(a, b, c, radius, segments)

    expect(pts).toHaveLength(segments + 1)
    for (const p of pts) {
      const d = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2)
      expect(d).toBeCloseTo(radius, 6)
    }

    // First point should be along +x (toward a) at distance radius.
    expect(pts[0].x).toBeCloseTo(radius, 6)
    expect(pts[0].y).toBeCloseTo(0, 6)

    // Last point should be along +y (toward c) at distance radius.
    expect(pts[pts.length - 1].x).toBeCloseTo(0, 6)
    expect(pts[pts.length - 1].y).toBeCloseTo(radius, 6)
  })

  it('sweeps monotonically (angle increases each step) for a 90 degree case', () => {
    const b = { x: 0, y: 0, z: 0 }
    const a = { x: 1, y: 0, z: 0 }
    const c = { x: 0, y: 1, z: 0 }
    const pts = jointArcPoints(a, b, c, 1, 12)

    const angles = pts.map((p) => Math.atan2(p.y, p.x))
    for (let i = 1; i < angles.length; i++) {
      expect(angles[i]).toBeGreaterThan(angles[i - 1] - 1e-9)
    }
  })

  it('handles a near-180 degree case without backtracking', () => {
    const b = { x: 0, y: 0, z: 0 }
    const a = { x: 1, y: 0, z: 0 }
    const c = { x: -1, y: 0.001, z: 0 } // almost opposite, slight tilt to define a plane
    const pts = jointArcPoints(a, b, c, 1, 10)

    expect(pts.length).toBeGreaterThan(0)
    for (const p of pts) {
      const d = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2)
      expect(d).toBeCloseTo(1, 6)
      expect(Number.isFinite(p.x)).toBe(true)
      expect(Number.isFinite(p.y)).toBe(true)
      expect(Number.isFinite(p.z)).toBe(true)
    }
  })

  it('returns [] for parallel rays (degenerate case) without NaN', () => {
    const b = { x: 0, y: 0, z: 0 }
    const a = { x: 1, y: 0, z: 0 }
    const c = { x: 2, y: 0, z: 0 } // same direction as a
    const pts = jointArcPoints(a, b, c, 1, 10)
    expect(pts).toEqual([])
  })

  it('returns [] for exactly antiparallel rays (degenerate case) without NaN', () => {
    const b = { x: 0, y: 0, z: 0 }
    const a = { x: 1, y: 0, z: 0 }
    const c = { x: -1, y: 0, z: 0 }
    const pts = jointArcPoints(a, b, c, 1, 10)
    expect(pts).toEqual([])
  })
})

describe('createWorldLandmarkSmoother', () => {
  it('reduces variance of a jittery constant signal', () => {
    const noise = makeNoise(4)
    const smoother = createWorldLandmarkSmoother()
    const rawX: number[] = []
    const outX: number[] = []
    for (let i = 0; i < 90; i++) {
      const x = 0.5 + 0.05 * noise()
      rawX.push(x)
      const wl = makeWorldLandmarks({ 0: { x, y: 0, z: 0, visibility: 0.9 } })
      const smoothed = smoother.smooth(wl, (i * 1000) / 30)
      outX.push(smoothed[0].x)
    }
    expect(variance(outX.slice(10))).toBeLessThan(variance(rawX.slice(10)) * 0.6)
  })

  it('does not egregiously lag a slow ramp', () => {
    const smoother = createWorldLandmarkSmoother()
    let lastY = 0
    for (let i = 0; i < 60; i++) {
      const y = i * 0.01 // slow, smooth ramp
      const wl = makeWorldLandmarks({ 0: { x: 0, y, z: 0, visibility: 0.9 } })
      const smoothed = smoother.smooth(wl, (i * 1000) / 30)
      lastY = smoothed[0].y
    }
    expect(lastY).toBeGreaterThan(0.5) // should track close to 0.59, not flatten near 0
  })

  it('passes visibility through unfiltered', () => {
    const smoother = createWorldLandmarkSmoother()
    const wl = makeWorldLandmarks({ 5: { x: 0.1, y: 0.2, z: 0.3, visibility: 0.42 } })
    const smoothed = smoother.smooth(wl, 0)
    expect(smoothed[5].visibility).toBe(0.42)
  })

  it('reset clears state so the next sample seeds fresh', () => {
    const smoother = createWorldLandmarkSmoother()
    for (let i = 0; i < 30; i++) {
      const wl = makeWorldLandmarks({ 0: { x: 0.9, y: 0, z: 0, visibility: 0.9 } })
      smoother.smooth(wl, (i * 1000) / 30)
    }
    smoother.reset()
    const wl = makeWorldLandmarks({ 0: { x: 0.123, y: 0, z: 0, visibility: 0.9 } })
    const smoothed = smoother.smooth(wl, 0)
    expect(smoothed[0].x).toBe(0.123) // fresh seed, not continuous with prior 0.9 stream
  })
})
