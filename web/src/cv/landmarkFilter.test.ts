import { describe, expect, it } from 'vitest'
import type { NormalizedLandmark, PoseFrame } from './types'
import {
  butterworthFiltfilt,
  createLiveStreamFilter,
  filterFrameSequence,
  hampelReject,
  interpolateGaps,
  OneEuroFilter,
} from './landmarkFilter'

// Deterministic pseudo-random noise so tests never flake.
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

function argmax(xs: readonly number[]): number {
  let bi = 0
  for (let i = 1; i < xs.length; i++) if (xs[i] > xs[bi]) bi = i
  return bi
}

function makeFrame(index: number, landmarks: NormalizedLandmark[], tMs: number): PoseFrame {
  return {
    timestamp: tMs,
    frameIndex: index,
    landmarks,
    worldLandmarks: landmarks.map((l) => ({ ...l })),
    poseConfidence: 0.9,
  }
}

describe('OneEuroFilter', () => {
  it('returns the first sample unchanged (seed)', () => {
    const f = new OneEuroFilter()
    expect(f.filter(0.42, 0)).toBe(0.42)
  })

  it('reduces high-frequency jitter around a constant', () => {
    const noise = makeNoise(1)
    const f = new OneEuroFilter()
    const raw: number[] = []
    const filtered: number[] = []
    for (let i = 0; i < 120; i++) {
      const x = 0.5 + 0.05 * noise()
      raw.push(x)
      filtered.push(f.filter(x, i / 30)) // 30 fps
    }
    // Ignore the seed transient.
    expect(variance(filtered.slice(10))).toBeLessThan(variance(raw.slice(10)) * 0.6)
  })
})

describe('butterworthFiltfilt', () => {
  it('is zero-phase: preserves the location of a symmetric peak', () => {
    const n = 60
    const center = 30
    const noise = makeNoise(7)
    const sig = Array.from({ length: n }, (_, i) => {
      const bump = Math.exp(-((i - center) ** 2) / (2 * 4 ** 2))
      return bump + 0.02 * noise()
    })
    const out = butterworthFiltfilt(sig, 6, 4, 30)
    // A causal filter would shift the peak later; filtfilt must not.
    expect(Math.abs(argmax(out) - center)).toBeLessThanOrEqual(2)
  })

  it('reduces noise variance while preserving the mean', () => {
    const noise = makeNoise(3)
    const sig = Array.from({ length: 100 }, () => 1 + 0.1 * noise())
    const out = butterworthFiltfilt(sig, 6, 4, 30)
    const mean = (a: readonly number[]) => a.reduce((s, v) => s + v, 0) / a.length
    expect(variance(out)).toBeLessThan(variance(sig) * 0.5)
    expect(mean(out)).toBeCloseTo(mean(sig), 1)
  })

  it('returns short signals unchanged', () => {
    const sig = [1, 2, 3, 4]
    expect(butterworthFiltfilt(sig, 6, 4, 30)).toEqual(sig)
  })

  it('rejects odd order', () => {
    expect(() => butterworthFiltfilt([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 6, 3, 30)).toThrow()
  })
})

describe('interpolateGaps', () => {
  it('linearly fills a small interior gap', () => {
    const out = interpolateGaps([0, NaN, NaN, 3], 10)
    expect(out[1]).toBeCloseTo(1, 6)
    expect(out[2]).toBeCloseTo(2, 6)
  })

  it('leaves gaps larger than maxGap and edge gaps untouched', () => {
    const out = interpolateGaps([NaN, 1, NaN, NaN, NaN, 5], 2)
    expect(Number.isNaN(out[0])).toBe(true) // leading edge
    expect(Number.isNaN(out[2])).toBe(true) // gap of 3 > maxGap 2
  })
})

describe('hampelReject', () => {
  it('replaces an isolated spike with the local median', () => {
    const sig = [1, 1, 1, 9, 1, 1, 1]
    const out = hampelReject(sig, 7, 3)
    expect(out[3]).toBeCloseTo(1, 6)
  })

  it('leaves a clean signal essentially unchanged', () => {
    const sig = [1, 2, 3, 4, 5, 6, 7]
    expect(hampelReject(sig, 7, 3)).toEqual(sig)
  })
})

describe('filterFrameSequence (offline)', () => {
  it('preserves length/metadata and lowers coordinate variance', () => {
    const noise = makeNoise(5)
    const frames: PoseFrame[] = Array.from({ length: 60 }, (_, i) =>
      makeFrame(
        i,
        [{ x: 0.5 + 0.04 * noise(), y: 0.5 + 0.04 * noise(), z: 0, visibility: 0.9 }],
        i * (1000 / 15),
      ),
    )
    const out = filterFrameSequence(frames, { fps: 15 })
    expect(out).toHaveLength(frames.length)
    expect(out[10].timestamp).toBe(frames[10].timestamp)
    expect(out[10].frameIndex).toBe(frames[10].frameIndex)
    expect(out[10].landmarks[0].visibility).toBe(0.9)
    const rawX = frames.map((f) => f.landmarks[0].x)
    const outX = out.map((f) => f.landmarks[0].x)
    expect(variance(outX)).toBeLessThan(variance(rawX))
  })

  it('returns [] for an empty sequence', () => {
    expect(filterFrameSequence([])).toEqual([])
  })
})

describe('createLiveStreamFilter', () => {
  it('preserves frame count and smooths a jittery stream; reset clears state', () => {
    const noise = makeNoise(9)
    const filter = createLiveStreamFilter()
    const rawX: number[] = []
    const outX: number[] = []
    for (let i = 0; i < 90; i++) {
      const x = 0.5 + 0.05 * noise()
      rawX.push(x)
      const f = makeFrame(i, [{ x, y: 0.5, z: 0, visibility: 0.9 }], (i * 1000) / 30)
      outX.push(filter.filter(f).landmarks[0].x)
    }
    expect(variance(outX.slice(10))).toBeLessThan(variance(rawX.slice(10)))
    filter.reset()
    const seeded = filter.filter(makeFrame(0, [{ x: 0.123, y: 0.5, z: 0, visibility: 0.9 }], 0))
    expect(seeded.landmarks[0].x).toBe(0.123) // fresh seed after reset
  })
})
