import { describe, expect, it } from 'vitest'
import { createLandmark, createLandmarks } from '../test/fixtures/poseFixtures'
import { LANDMARK_INDICES, type PoseFrame } from '../cv/types'
import { createTape, serializeTape } from './poseTape'
import {
  evaluateTape,
  evaluateTapes,
  formatBatchReport,
  isEvalError,
} from './batchEval'

const FPS = 15
const FRAME_MS = 1000 / FPS

/** Horizontal knee offset that yields a target knee angle (mirrors replayHarness.test). */
function kneeOffsetForAngle(kneeAngle: number, halfSegment = 0.13): number {
  const c = Math.cos((kneeAngle * Math.PI) / 180)
  const ratio = (1 + c) / Math.max(1 - c, 1e-6)
  return halfSegment * Math.sqrt(Math.max(ratio, 0))
}

function squatFrame(
  kneeAngle: number,
  hipY: number,
  frameIndex: number,
): PoseFrame {
  const d = kneeOffsetForAngle(kneeAngle)
  const kneeY = hipY + 0.13
  const ankleY = hipY + 0.26
  const lm = (x: number, y: number) => createLandmark(x, y, 0.95)
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
  return {
    frameIndex,
    timestamp: frameIndex * FRAME_MS,
    landmarks,
    worldLandmarks: [],
    poseConfidence: 0.9,
  }
}

const ONE_REP = [
  { knee: 170, hipY: 0.42, hold: 8 },
  { knee: 130, hipY: 0.5, hold: 4 },
  { knee: 95, hipY: 0.58, hold: 5 },
  { knee: 125, hipY: 0.5, hold: 4 },
  { knee: 170, hipY: 0.42, hold: 10 },
]

function buildTape(reps: number, truthReps?: number) {
  const frames: PoseFrame[] = []
  let i = 0
  for (let r = 0; r < reps; r++) {
    for (const kf of ONE_REP) {
      for (let h = 0; h < kf.hold; h++) {
        frames.push(squatFrame(kf.knee, kf.hipY, i))
        i++
      }
    }
  }
  return createTape(frames, {
    fps: FPS,
    label: `${reps}-rep clean squat`,
    source: 'upload',
    ...(truthReps !== undefined ? { truth: { repCount: truthReps } } : {}),
  })
}

describe('batch tape eval (M12)', () => {
  it('evaluates a clean multi-rep tape to a full report row', () => {
    const row = evaluateTape(buildTape(4), 'clean.posetape.json')
    expect(row.repCount).toBe(4)
    expect(row.verdict).toBe('valid')
    expect(row.trustedRepCount).toBe(4)
    expect(row.qualityReasons).toEqual([])
    expect(row.bottomFrames).toHaveLength(4)
    expect(row.truth).toBeNull()
  })

  it('compares against ground truth when the tape carries meta.truth', () => {
    const row = evaluateTape(buildTape(3, 3), 'labeled.posetape.json')
    expect(row.truth).not.toBeNull()
    expect(row.truth?.truthRepCount).toBe(3)
    expect(row.truth?.repCountError).toBe(0)
  })

  it('captures malformed tapes as errors without aborting the batch', () => {
    const outcomes = evaluateTapes([
      { file: 'good.posetape.json', json: serializeTape(buildTape(3)) },
      { file: 'bad.posetape.json', json: '{"nope":true}' },
    ])
    expect(outcomes).toHaveLength(2)
    expect(isEvalError(outcomes[0])).toBe(false)
    expect(isEvalError(outcomes[1])).toBe(true)
  })

  it('formats a one-line-per-tape report with an error tally', () => {
    const outcomes = evaluateTapes([
      { file: 'good.posetape.json', json: serializeTape(buildTape(3, 3)) },
      { file: 'bad.posetape.json', json: 'not json' },
    ])
    const report = formatBatchReport(outcomes)
    expect(report).toContain('good.posetape.json: reps=3 verdict=')
    expect(report).toContain('truthReps=3 (Δ0)')
    expect(report).toContain('bad.posetape.json: ERROR')
    expect(report).toContain('2 tapes, 1 error')
  })
})
