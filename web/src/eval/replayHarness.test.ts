import { describe, expect, it } from 'vitest'
import { createLandmark, createLandmarks } from '../test/fixtures/poseFixtures'
import { LANDMARK_INDICES, type PoseFrame } from '../cv/types'
import { createTape, deserializeTape, serializeTape } from './poseTape'
import { compareVariants, formatComparison, type Variant } from './replayHarness'
import { landmarkJitter } from './metrics'

const FPS = 15
const FRAME_MS = 1000 / FPS
const NOISE_AMP = 0.004

function makeNoise(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return (s / 0xffffffff) * 2 - 1
  }
}

/** Horizontal knee offset that yields a target knee angle (mirrors videoAnalyzer.test). */
function kneeOffsetForAngle(kneeAngle: number, halfSegment = 0.13): number {
  const c = Math.cos((kneeAngle * Math.PI) / 180)
  const ratio = (1 + c) / Math.max(1 - c, 1e-6)
  return halfSegment * Math.sqrt(Math.max(ratio, 0))
}

/** Geometry-valid front-view squat frame with per-landmark high-frequency noise. */
function noisySquatFrame(
  kneeAngle: number,
  hipY: number,
  frameIndex: number,
  timestamp: number,
  noise: () => number,
): PoseFrame {
  const d = kneeOffsetForAngle(kneeAngle)
  const kneeY = hipY + 0.13
  const ankleY = hipY + 0.26
  const vis = 0.95
  const n = (): number => noise() * NOISE_AMP
  const lm = (x: number, y: number) => createLandmark(x + n(), y + n(), vis)
  const landmarks = createLandmarks({
    [LANDMARK_INDICES.LEFT_SHOULDER]: lm(0.42, hipY - 0.25),
    [LANDMARK_INDICES.RIGHT_SHOULDER]: lm(0.58, hipY - 0.25),
    [LANDMARK_INDICES.LEFT_HIP]: lm(0.44, hipY),
    [LANDMARK_INDICES.RIGHT_HIP]: lm(0.56, hipY),
    [LANDMARK_INDICES.LEFT_KNEE]: lm(0.44 - d, kneeY),
    [LANDMARK_INDICES.RIGHT_KNEE]: lm(0.56 + d, kneeY),
    [LANDMARK_INDICES.LEFT_ANKLE]: lm(0.44, ankleY),
    [LANDMARK_INDICES.RIGHT_ANKLE]: lm(0.56, ankleY),
    [LANDMARK_INDICES.LEFT_FOOT_INDEX]: lm(0.44, ankleY + 0.04),
    [LANDMARK_INDICES.RIGHT_FOOT_INDEX]: lm(0.56, ankleY + 0.04),
  })
  return { frameIndex, timestamp, landmarks, worldLandmarks: [], poseConfidence: 0.9 }
}

interface Keyframe {
  knee: number
  hipY: number
  hold: number
}

const ONE_REP: Keyframe[] = [
  { knee: 170, hipY: 0.42, hold: 8 },
  { knee: 130, hipY: 0.5, hold: 4 },
  { knee: 95, hipY: 0.58, hold: 5 },
  { knee: 125, hipY: 0.5, hold: 4 },
  { knee: 170, hipY: 0.42, hold: 10 },
]

function buildNoisyTape(reps: number, seed: number) {
  const noise = makeNoise(seed)
  const frames: PoseFrame[] = []
  const keyframes = Array.from({ length: reps }, () => ONE_REP).flat()
  let i = 0
  for (const kf of keyframes) {
    for (let h = 0; h < kf.hold; h++) {
      frames.push(noisySquatFrame(kf.knee, kf.hipY, i, i * FRAME_MS, noise))
      i++
    }
  }
  return createTape(frames, { fps: FPS, label: `${reps}-rep noisy squat`, truth: { repCount: reps } })
}

function byVariant(results: ReturnType<typeof compareVariants>, v: Variant) {
  const r = results.find((x) => x.variant === v)
  if (!r) throw new Error(`missing variant ${v}`)
  return r
}

describe('replay harness', () => {
  it('counts the reps and both filters lower hip jitter without changing rep count', () => {
    const tape = buildNoisyTape(2, 42)
    const results = compareVariants(tape)
    const raw = byVariant(results, 'raw')
    const oneEuro = byVariant(results, 'oneEuro')
    const butter = byVariant(results, 'butterworth')

    // Raw pipeline recovers the ground-truth rep count on a moderately noisy tape.
    expect(raw.repCount).toBe(tape.meta.truth?.repCount)

    // Filtering must not drop or invent reps (bias unchanged)...
    expect(oneEuro.repCount).toBe(raw.repCount)
    expect(butter.repCount).toBe(raw.repCount)

    // ...while measurably reducing jitter (variance down). This is the M19 gate.
    // Measured on ankle-X, a near-static coordinate, so the metric isolates
    // noise rather than the real (deliberate) hip descent/ascent.
    const ankleXJitter = (r: (typeof results)[number]): number =>
      landmarkJitter(r.frames, LANDMARK_INDICES.LEFT_ANKLE, 'x')
    expect(ankleXJitter(oneEuro)).toBeLessThan(ankleXJitter(raw))
    expect(ankleXJitter(butter)).toBeLessThan(ankleXJitter(raw))

    // Sanity: the comparison report renders.
    expect(formatComparison(tape, results)).toContain('variant')
  })

  it('round-trips a tape through serialize/deserialize', () => {
    const tape = buildNoisyTape(1, 7)
    const restored = deserializeTape(serializeTape(tape))
    expect(restored.frames).toHaveLength(tape.frames.length)
    expect(restored.meta.fps).toBe(FPS)
    // Replaying the restored tape yields the same rep count.
    const before = byVariant(compareVariants(tape, ['raw']), 'raw').repCount
    const after = byVariant(compareVariants(restored, ['raw']), 'raw').repCount
    expect(after).toBe(before)
  })

  it('rejects malformed tape JSON', () => {
    expect(() => deserializeTape('{"frames":[]}')).toThrow()
  })
})
