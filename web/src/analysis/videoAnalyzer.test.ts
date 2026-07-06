import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_ANALYSIS_FPS, runVideoAnalysis } from './videoAnalyzer'
import { createLandmark, createLandmarks } from '../test/fixtures/poseFixtures'
import { LANDMARK_INDICES, type PoseFrame } from '../cv/types'

/**
 * Horizontal knee offset (normalized) that yields a target knee angle when the
 * hip and ankle sit on a vertical line 0.13 above/below the knee.
 * cosθ = (d² − h²) / (d² + h²)  ⇒  d = h·√((1 + cosθ)/(1 − cosθ))
 */
function kneeOffsetForAngle(kneeAngle: number, halfSegment = 0.13): number {
  const c = Math.cos((kneeAngle * Math.PI) / 180)
  const ratio = (1 + c) / Math.max(1 - c, 1e-6)
  return halfSegment * Math.sqrt(Math.max(ratio, 0))
}

/** Build a geometry-valid front-view squat frame at a given knee angle + hip height. */
function squatFrame(
  kneeAngle: number,
  hipY: number,
  frameIndex: number,
  timestamp: number,
): PoseFrame {
  const d = kneeOffsetForAngle(kneeAngle)
  const kneeY = hipY + 0.13
  const ankleY = hipY + 0.26
  const vis = 0.95
  const landmarks = createLandmarks({
    [LANDMARK_INDICES.LEFT_SHOULDER]: createLandmark(0.42, hipY - 0.25, vis),
    [LANDMARK_INDICES.RIGHT_SHOULDER]: createLandmark(0.58, hipY - 0.25, vis),
    [LANDMARK_INDICES.LEFT_HIP]: createLandmark(0.44, hipY, vis),
    [LANDMARK_INDICES.RIGHT_HIP]: createLandmark(0.56, hipY, vis),
    [LANDMARK_INDICES.LEFT_KNEE]: createLandmark(0.44 - d, kneeY, vis),
    [LANDMARK_INDICES.RIGHT_KNEE]: createLandmark(0.56 + d, kneeY, vis),
    [LANDMARK_INDICES.LEFT_ANKLE]: createLandmark(0.44, ankleY, vis),
    [LANDMARK_INDICES.RIGHT_ANKLE]: createLandmark(0.56, ankleY, vis),
    [LANDMARK_INDICES.LEFT_FOOT_INDEX]: createLandmark(0.44, ankleY + 0.04, vis),
    [LANDMARK_INDICES.RIGHT_FOOT_INDEX]: createLandmark(0.56, ankleY + 0.04, vis),
  })
  return { frameIndex, timestamp, landmarks, worldLandmarks: [], poseConfidence: 0.9 }
}

interface Keyframe {
  knee: number
  hipY: number
  hold: number
}

/** Stand → descend → bottom → ascend → stand (mirrors fullSquatKeyframes). */
const SQUAT_SCRIPT: Keyframe[] = [
  { knee: 170, hipY: 0.42, hold: 8 },
  { knee: 130, hipY: 0.5, hold: 4 },
  { knee: 95, hipY: 0.58, hold: 5 },
  { knee: 125, hipY: 0.5, hold: 4 },
  { knee: 170, hipY: 0.42, hold: 10 },
]

function expandScript(script: Keyframe[]): Array<{ knee: number; hipY: number }> {
  const out: Array<{ knee: number; hipY: number }> = []
  for (const { knee, hipY, hold } of script) {
    for (let i = 0; i < hold; i++) out.push({ knee, hipY })
  }
  return out
}

describe('runVideoAnalysis', () => {
  it('samples the timeline at the requested fps with strictly increasing timestamps', async () => {
    const seek = vi.fn(async () => {})
    const timestamps: number[] = []
    const detect = vi.fn((timestampMs: number) => {
      timestamps.push(timestampMs)
      return null
    })

    const result = await runVideoAnalysis({
      durationSeconds: 1,
      fps: 10,
      seek,
      detect,
    })

    // 0.0 … 1.0 inclusive at 0.1s steps → 11 frames.
    expect(result.framesAnalyzed).toBe(11)
    expect(seek).toHaveBeenCalledTimes(11)
    expect(seek).toHaveBeenLastCalledWith(1)
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1])
    }
  })

  it('defaults to 15 fps and reports progress reaching 1', async () => {
    const progress: number[] = []
    const result = await runVideoAnalysis({
      durationSeconds: 2,
      seek: async () => {},
      detect: () => null,
      onProgress: (f) => progress.push(f),
    })

    expect(result.framesAnalyzed).toBe(2 * DEFAULT_ANALYSIS_FPS + 1)
    expect(progress[progress.length - 1]).toBe(1)
  })

  it('offsets timestamps by timestampBaseMs to stay monotonic across sessions', async () => {
    const seen: number[] = []
    await runVideoAnalysis({
      durationSeconds: 0.2,
      fps: 5,
      timestampBaseMs: 100_000,
      seek: async () => {},
      detect: (ts) => {
        seen.push(ts)
        return null
      },
    })
    expect(seen[0]).toBeGreaterThanOrEqual(100_000)
  })

  it('skips frames with no detected pose without counting them', async () => {
    const result = await runVideoAnalysis({
      durationSeconds: 0.4,
      fps: 5,
      seek: async () => {},
      detect: (_ts, frameIndex) =>
        frameIndex % 2 === 0 ? squatFrame(170, 0.42, frameIndex, _ts) : null,
    })
    expect(result.framesAnalyzed).toBeGreaterThan(result.framesWithPose)
    expect(result.poseConfidenceSamples).toHaveLength(result.framesWithPose)
  })

  it('throws AbortError when the signal is aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      runVideoAnalysis({
        durationSeconds: 1,
        seek: async () => {},
        detect: () => null,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('counts a rep end-to-end through the real pose pipeline', async () => {
    const frames = expandScript(SQUAT_SCRIPT)
    const fps = DEFAULT_ANALYSIS_FPS
    const result = await runVideoAnalysis({
      durationSeconds: (frames.length - 1) / fps,
      fps,
      seek: async () => {},
      detect: (timestampMs, frameIndex) => {
        const spec = frames[Math.min(frameIndex, frames.length - 1)]
        return squatFrame(spec.knee, spec.hipY, frameIndex, timestampMs)
      },
    })

    expect(result.framesWithPose).toBe(frames.length)
    expect(result.reps.length).toBeGreaterThanOrEqual(1)
    expect(result.poseConfidenceSamples.length).toBe(frames.length)
  })

  it('emits per-frame landmark quality without altering rep results (M26)', async () => {
    const frames = expandScript(SQUAT_SCRIPT)
    const fps = DEFAULT_ANALYSIS_FPS
    const run = () =>
      runVideoAnalysis({
        durationSeconds: (frames.length - 1) / fps,
        fps,
        seek: async () => {},
        detect: (timestampMs, frameIndex) => {
          const spec = frames[Math.min(frameIndex, frames.length - 1)]
          return squatFrame(spec.knee, spec.hipY, frameIndex, timestampMs)
        },
        filterLandmarks: false,
      })
    const result = await run()

    // One quality entry per analyzed frame, aligned with the pipeline.
    expect(result.landmarkQuality).toHaveLength(result.framesWithPose)
    expect(result.landmarkQuality[0].maxCriticalSpeed).toBeNull()
    // Fully-visible synthetic frames: all critical landmarks tracked, and a
    // clean squat script never trips the plausibility flag.
    expect(
      result.landmarkQuality.every((q) => q.criticalCoverage === 1),
    ).toBe(true)
    expect(
      result.landmarkQuality.every((q) => !q.implausibleJump),
    ).toBe(true)
    // Inputs are never mutated: the raw substrate stays quality-free.
    expect(result.rawFrames.every((f) => f.quality === undefined)).toBe(true)
    // Rep results are identical to a pipeline run before quality existed.
    expect(result.reps.length).toBeGreaterThanOrEqual(1)
    const rerun = await run()
    expect(rerun.reps).toEqual(result.reps)
  })

  it('emits a frame trace aligned with rep frame indices', async () => {
    const frames = expandScript(SQUAT_SCRIPT)
    const fps = DEFAULT_ANALYSIS_FPS
    const result = await runVideoAnalysis({
      durationSeconds: (frames.length - 1) / fps,
      fps,
      seek: async () => {},
      detect: (timestampMs, frameIndex) => {
        const spec = frames[Math.min(frameIndex, frames.length - 1)]
        return squatFrame(spec.knee, spec.hipY, frameIndex, timestampMs)
      },
    })

    // One trace sample per detected frame, in frame order.
    expect(result.frameTrace.length).toBe(result.framesWithPose)
    const traceIndices = new Set(result.frameTrace.map((s) => s.frameIndex))

    // Every rep's bottom frame resolves to a trace sample (evidence lookups
    // key on frameIndex, so this alignment is load-bearing).
    for (const rep of result.reps) {
      expect(traceIndices.has(rep.bottomFrameIndex)).toBe(true)
    }

    // The trace observed the full phase cycle and carries per-frame signals.
    const phases = new Set(result.frameTrace.map((s) => s.phase))
    expect(phases.has('DESCENDING')).toBe(true)
    expect(phases.has('BOTTOM')).toBe(true)
    const bottom = result.frameTrace.find(
      (s) => s.frameIndex === result.reps[0].bottomFrameIndex,
    )
    expect(bottom?.kneeAngle).not.toBeNull()
    expect(bottom?.signedHipOffsetX).not.toBeNull()
    expect(bottom?.hipY).not.toBeNull()
  })

  it('filters landmarks by default, smoothing jitter relative to the raw path', async () => {
    const frames = expandScript(SQUAT_SCRIPT)
    const fps = DEFAULT_ANALYSIS_FPS
    // Deterministic high-frequency hip jitter on top of the clean script.
    const jitter = (i: number) => 0.004 * Math.sin(i * 2.7)
    const deps = {
      durationSeconds: (frames.length - 1) / fps,
      fps,
      seek: async () => {},
      detect: (timestampMs: number, frameIndex: number) => {
        const spec = frames[Math.min(frameIndex, frames.length - 1)]
        return squatFrame(spec.knee, spec.hipY + jitter(frameIndex), frameIndex, timestampMs)
      },
    }

    const filtered = await runVideoAnalysis(deps)
    const raw = await runVideoAnalysis({ ...deps, filterLandmarks: false })

    // Second-difference roughness of the hip-Y trace: lower = smoother.
    const roughness = (trace: typeof raw.frameTrace) => {
      const ys = trace
        .map((s) => s.hipY)
        .filter((y): y is number => y !== null)
      let sum = 0
      for (let i = 2; i < ys.length; i++) {
        sum += Math.abs(ys[i] - 2 * ys[i - 1] + ys[i - 2])
      }
      return sum
    }

    expect(roughness(filtered.frameTrace)).toBeLessThan(roughness(raw.frameTrace))
  })
})
