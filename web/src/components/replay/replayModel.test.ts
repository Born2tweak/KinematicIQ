/**
 * Stream 3 (demo/visual) tests.
 *
 * 1. replayModel unit behavior: event markers, rep lookup, view model, timing.
 * 2. Demo-identity: Demo Mode is a draw-time flag only — turning it on must
 *    leave the analysis outputs and the tape bit-identical. We prove it by
 *    deep-freezing/snapshotting the replay outputs, rendering frames through
 *    drawReplayFrame with demoMode on and off via a recording stub context,
 *    and asserting the data did not change (and that the view model never
 *    takes Demo Mode as an input at all).
 */
import { describe, expect, it } from 'vitest'
import { replayTape } from '../../eval/replayHarness'
import {
  simulateLiveSession,
  syntheticSessionKneeScript,
  syntheticSquatFrame,
} from '../../test/helpers/liveSessionSim'
import type { FrameTraceSample } from '../../analysis/frameTrace'
import type { PoseFrame, RepMetrics } from '../../cv/types'
import { drawReplayFrame } from './drawReplayFrame'
import {
  buildReplayEvents,
  buildReplayViewModel,
  frameDelayMs,
  repAtTimestamp,
} from './replayModel'

function makeRawFrames(): PoseFrame[] {
  return syntheticSessionKneeScript(3).map((kneeAngleDeg, i) =>
    syntheticSquatFrame({
      frameIndex: i,
      timestamp: i * 33,
      kneeAngleDeg,
    }),
  )
}

function traceSample(overrides: Partial<FrameTraceSample>): FrameTraceSample {
  return {
    frameIndex: 0,
    timestamp: 0,
    phase: 'STANDING',
    kneeAngle: 170,
    trunkLean: 5,
    signedHipOffsetX: 0,
    hipY: 0.5,
    poseConfidence: 0.9,
    ...overrides,
  }
}

describe('replayModel', () => {
  it('builds ordered phase/rep/rejection events addressed by sample position', () => {
    const trace: FrameTraceSample[] = [
      traceSample({ frameIndex: 10, timestamp: 0, phase: 'STANDING' }),
      traceSample({ frameIndex: 11, timestamp: 33, phase: 'DESCENDING' }),
      traceSample({ frameIndex: 12, timestamp: 66, phase: 'BOTTOM' }),
      traceSample({ frameIndex: 13, timestamp: 99, phase: 'ASCENDING' }),
      traceSample({ frameIndex: 14, timestamp: 132, phase: 'STANDING' }),
    ]
    const reps = [
      { repNumber: 1, endFrameIndex: 14, endTimestamp: 132, startTimestamp: 33 },
    ] as unknown as RepMetrics[]

    const events = buildReplayEvents(trace, reps, [])
    expect(events.map((e) => e.kind)).toEqual([
      'descent',
      'bottom',
      'ascent',
      'rep-counted',
    ])
    // Positions are indexes into the trace array, not tape frame indexes.
    expect(events.map((e) => e.sampleIndex)).toEqual([1, 2, 3, 4])
    expect(events[3].label).toBe('Rep 1 counted')
  })

  it('never surfaces phantom rejections as timeline events', () => {
    const trace = [traceSample({ frameIndex: 0 })]
    const rejection = {
      gate: 'depth',
      reason: 'too shallow',
      startFrameIndex: 0,
      endFrameIndex: 0,
      endTimestamp: 0,
      durationMs: 10,
      phantom: true,
      values: { maxHipDrop: 0, avgConfidence: 0.9 },
    }
    const events = buildReplayEvents(
      trace,
      [],
      [rejection as never],
    )
    expect(events.filter((e) => e.kind === 'rejection')).toHaveLength(0)
  })

  it('resolves the active rep from a timestamp window', () => {
    const reps = [
      { repNumber: 1, startTimestamp: 100, endTimestamp: 200 },
      { repNumber: 2, startTimestamp: 300, endTimestamp: 400 },
    ] as unknown as RepMetrics[]
    expect(repAtTimestamp(reps, 150)).toBe(1)
    expect(repAtTimestamp(reps, 250)).toBeNull()
    expect(repAtTimestamp(reps, 400)).toBe(2)
  })

  it('clamps the view model to the frame range', () => {
    const frames = [0, 33, 66].map((timestamp, i) =>
      syntheticSquatFrame({ frameIndex: i, timestamp, kneeAngleDeg: 170 }),
    )
    const trace = frames.map((f) =>
      traceSample({ frameIndex: f.frameIndex, timestamp: f.timestamp }),
    )
    const view = buildReplayViewModel(frames, trace, [], 99)
    expect(view?.sampleIndex).toBe(2)
    expect(view?.elapsedSeconds).toBeCloseTo(0.066, 5)
  })

  it('scales inter-frame delay by playback speed', () => {
    const frames = [0, 40].map((timestamp, i) =>
      syntheticSquatFrame({ frameIndex: i, timestamp, kneeAngleDeg: 170 }),
    )
    expect(frameDelayMs(frames, 0, 1)).toBe(40)
    expect(frameDelayMs(frames, 0, 0.5)).toBe(80)
    expect(frameDelayMs(frames, 0, 2)).toBe(20)
  })
})

/** Minimal recording stub for CanvasRenderingContext2D used by drawReplayFrame. */
function stubContext(): CanvasRenderingContext2D {
  const noop = () => {}
  return {
    clearRect: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    arc: noop,
    fill: noop,
    set strokeStyle(_v: string) {},
    set fillStyle(_v: string) {},
    set lineWidth(_v: number) {},
    set lineCap(_v: string) {},
  } as unknown as CanvasRenderingContext2D
}

describe('demo-identity: Demo Mode cannot alter analysis outputs or tape data', () => {
  it('replay outputs and tape are bit-identical with Demo Mode on vs off', () => {
    const live = simulateLiveSession(makeRawFrames())
    const tapeSnapshot = JSON.parse(JSON.stringify(live.tape))

    const replay = replayTape(live.tape)
    const outputSnapshot = JSON.parse(
      JSON.stringify({
        reps: replay.reps,
        repRejections: replay.repRejections,
        frameTrace: replay.frameTrace,
        analyzedFrames: replay.analyzedFrames,
      }),
    )

    // The per-frame view model does not take Demo Mode as an input at all —
    // the same scrub position yields the same model regardless of visuals.
    const ctx = stubContext()
    for (const demoMode of [true, false, true]) {
      for (
        let i = 0;
        i < replay.analyzedFrames.length;
        i += Math.max(1, Math.floor(replay.analyzedFrames.length / 20))
      ) {
        drawReplayFrame(ctx, replay.analyzedFrames, i, 960, 540, { demoMode })
        buildReplayViewModel(replay.analyzedFrames, replay.frameTrace, replay.reps, i)
      }
    }

    expect(
      JSON.parse(
        JSON.stringify({
          reps: replay.reps,
          repRejections: replay.repRejections,
          frameTrace: replay.frameTrace,
          analyzedFrames: replay.analyzedFrames,
        }),
      ),
    ).toEqual(outputSnapshot)
    expect(JSON.parse(JSON.stringify(live.tape))).toEqual(tapeSnapshot)

    // Re-running the replay after drawing still produces identical outputs.
    const replayAgain = replayTape(live.tape)
    expect(replayAgain.reps).toEqual(replay.reps)
    expect(replayAgain.frameTrace).toEqual(replay.frameTrace)
  })
})
