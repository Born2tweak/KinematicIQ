/**
 * The ingestion boundary, tested as a boundary rather than as a data class.
 *
 * `framePacket.test.ts` covers one packet at a time. These tests cover the two
 * claims that a single packet cannot support:
 *
 *   1. A *sequence* is one ordered capture, and a sequence that is not gets
 *      refused rather than analyzed into a plausible-looking wrong answer.
 *   2. Every protocol reaches its runtime through that sequence — squat's
 *      cyclic engine and forward lunge's whole-session engine alike.
 *
 * Claim 2 is the one the FramePacket work existed to establish and the one
 * that was previously untrue: the cyclic path took bare `PoseFrame[]`, so the
 * envelope was a lunge-only detail dressed up as an ingestion contract.
 */
import { describe, expect, it } from 'vitest'

import {
  FRAME_PACKET_VERSION,
  FramePacketError,
  assertPacketSequence,
  createFramePacket,
  posesFromPackets,
  readFramePacket,
  sequenceReadability,
  type FramePacket,
} from './framePacket'
import { analyzeCaptureForProtocol, packetsFromFrames } from '../analysis/analyzeProtocol'
import { runVideoAnalysis } from '../analysis/videoAnalyzer'
import { buildCleanSquatPoseTape } from '../camera/fixtures/cleanSquatPoseTape'
import { buildSyntheticInlineLungeFrames } from '../protocols/inlineLunge/fixtures'
import type { PoseFrame } from '../cv/types'

const poseFrame = (frameIndex: number, timestamp: number): PoseFrame => ({
  timestamp,
  frameIndex,
  landmarks: [],
  worldLandmarks: [],
  poseConfidence: 0.9,
})

const packet = (frameIndex: number, timestamp: number, captureId = 'cap-1'): FramePacket =>
  createFramePacket({
    timestamp,
    rotation: 0,
    source: 'uploaded-video',
    identity: { frameIndex, captureId },
    pose: poseFrame(frameIndex, timestamp),
  })

describe('a packet sequence is one ordered capture', () => {
  it('accepts an ordered run from a single capture', () => {
    expect(() => assertPacketSequence([packet(0, 0), packet(1, 40), packet(2, 80)])).not.toThrow()
  })

  it('accepts an empty and a single-packet sequence', () => {
    expect(() => assertPacketSequence([])).not.toThrow()
    expect(() => assertPacketSequence([packet(0, 0)])).not.toThrow()
  })

  it('refuses two captures spliced into one sequence', () => {
    expect(() =>
      assertPacketSequence([packet(0, 0, 'cap-1'), packet(1, 40, 'cap-2')]),
    ).toThrow(/one sequence is one capture/)
  })

  it('refuses a rewound frame index', () => {
    expect(() => assertPacketSequence([packet(5, 0), packet(2, 40)])).toThrow(
      /frameIndex must increase/,
    )
  })

  it('refuses a repeated frame index', () => {
    expect(() => assertPacketSequence([packet(1, 0), packet(1, 40)])).toThrow(
      /frameIndex must increase/,
    )
  })

  it('refuses a rewound clock even when indices advance', () => {
    // The dangerous case: indices look fine, so an index-only check passes and
    // every duration downstream is computed from a negative interval.
    expect(() => assertPacketSequence([packet(0, 100), packet(1, 40)])).toThrow(
      /timestamps must increase/,
    )
  })

  it('refuses two frames stamped at the same instant', () => {
    expect(() => assertPacketSequence([packet(0, 40), packet(1, 40)])).toThrow(
      /timestamps must increase/,
    )
  })

  it('refuses a sequence carrying an unsupported packet version', () => {
    const future = { ...packet(1, 40), packetVersion: 99 } as unknown as FramePacket
    expect(() => assertPacketSequence([packet(0, 0), future])).toThrow(FramePacketError)
    expect(() => assertPacketSequence([packet(0, 0), future])).toThrow(/Unsupported FramePacket/)
  })
})

describe('unreadable frames stay countable instead of vanishing', () => {
  const withGaps: FramePacket[] = [
    packet(0, 0),
    createFramePacket({
      timestamp: 40,
      rotation: 0,
      source: 'uploaded-video',
      identity: { frameIndex: 1, captureId: 'cap-1' },
      pose: null,
    }),
    packet(2, 80),
  ]

  it('drops only the poses, never the sampled count', () => {
    expect(posesFromPackets(withGaps)).toHaveLength(2)
    expect(withGaps).toHaveLength(3)
  })

  it('reports the readable ratio the report needs', () => {
    expect(sequenceReadability(withGaps)).toEqual({ sampled: 3, withPose: 2, ratio: 2 / 3 })
  })

  it('reports 0 rather than NaN for an empty capture', () => {
    expect(sequenceReadability([])).toEqual({ sampled: 0, withPose: 0, ratio: 0 })
  })
})

describe('stored packets are refused rather than guessed at', () => {
  it('refuses an untagged packet instead of assuming v1', () => {
    const untagged = { ...packet(0, 0) } as Partial<FramePacket>
    delete untagged.packetVersion
    expect(() => readFramePacket(untagged)).toThrow(/untagged frames are not assumed to be v1/)
  })

  it('refuses a future version instead of misreading it as v1', () => {
    expect(() => readFramePacket({ ...packet(0, 0), packetVersion: 2 })).toThrow(
      /Unsupported FramePacket version 2/,
    )
  })

  it('refuses a packet missing its capture identity', () => {
    const { identity: _identity, ...rest } = packet(0, 0)
    expect(() => readFramePacket(rest)).toThrow(FramePacketError)
  })

  it('refuses a non-object', () => {
    expect(() => readFramePacket(null)).toThrow(/must be an object/)
    expect(() => readFramePacket('packet')).toThrow(/must be an object/)
  })
})

describe('the uploaded-video path stamps packets at the source', () => {
  const frames = buildCleanSquatPoseTape().frames

  const analyzeTenFrames = (options: { dropEveryOther?: boolean } = {}) =>
    runVideoAnalysis({
      durationSeconds: 9 / 15,
      fps: 15,
      source: 'uploaded-video',
      captureId: 'cap-upload-1',
      rotation: 90,
      seek: async () => {},
      detect: (timestampMs, frameIndex) =>
        options.dropEveryOther && frameIndex % 2 === 1
          ? null
          : { ...frames[frameIndex % frames.length], timestamp: timestampMs, frameIndex },
    })

  it('emits one packet per sampled frame, not per detected frame', async () => {
    const result = await analyzeTenFrames({ dropEveryOther: true })
    expect(result.packets).toHaveLength(result.framesAnalyzed)
    expect(result.packets.length).toBeGreaterThan(result.framesWithPose)
    expect(sequenceReadability(result.packets).withPose).toBe(result.framesWithPose)
  })

  it('carries version, provenance, rotation and capture id onto every packet', async () => {
    const result = await analyzeTenFrames()
    expect(result.packets.length).toBeGreaterThan(0)
    for (const emitted of result.packets) {
      expect(emitted.packetVersion).toBe(FRAME_PACKET_VERSION)
      expect(emitted.source).toBe('uploaded-video')
      expect(emitted.rotation).toBe(90)
      expect(emitted.identity.captureId).toBe('cap-upload-1')
    }
  })

  it('produces a sequence that satisfies the boundary it will be read through', async () => {
    const result = await analyzeTenFrames({ dropEveryOther: true })
    expect(() => assertPacketSequence(result.packets)).not.toThrow()
    expect(result.packets.map((emitted) => emitted.identity.frameIndex)).toEqual(
      result.packets.map((_, index) => index),
    )
  })
})

describe('every protocol reaches its runtime through the same boundary', () => {
  it('runs squat through a packet sequence', () => {
    const { segmentation, result } = analyzeCaptureForProtocol(
      'squat',
      packetsFromFrames(buildCleanSquatPoseTape().frames, {
        source: 'fixture-video',
        captureId: 'cap-squat',
      }),
    )
    expect(result.protocolId).toBe('squat')
    expect(segmentation?.reps.length).toBeGreaterThan(0)
  })

  it('runs forward lunge through a packet sequence', () => {
    const { segmentation, result } = analyzeCaptureForProtocol(
      'forwardLungeStrideReturn',
      packetsFromFrames(buildSyntheticInlineLungeFrames({ trials: 3 }), {
        source: 'fixture-video',
        captureId: 'cap-lunge',
      }),
      { parameters: { leadSide: 'left' } },
    )
    expect(result.protocolId).toBe('forwardLungeStrideReturn')
    expect(segmentation).toBeNull()
    expect(result.metrics.repCount).toBe(3)
  })

  it('refuses a spliced sequence on the squat path too, not just the lunge path', () => {
    const squat = packetsFromFrames(buildCleanSquatPoseTape().frames.slice(0, 20), {
      source: 'fixture-video',
      captureId: 'cap-a',
    })
    const other = packetsFromFrames(buildCleanSquatPoseTape().frames.slice(20, 40), {
      source: 'fixture-video',
      captureId: 'cap-b',
    })
    expect(() => analyzeCaptureForProtocol('squat', [...squat, ...other])).toThrow(
      FramePacketError,
    )
  })

  it('turns a broken lunge sequence into an abstaining report, not a throw', () => {
    // The whole-session runtime owns its own failure copy, so a boundary
    // violation must surface to the athlete as "could not be read" rather than
    // as an unhandled error.
    const good = packetsFromFrames(buildSyntheticInlineLungeFrames({ trials: 3 }), {
      source: 'fixture-video',
      captureId: 'cap-lunge',
    })
    const broken = [...good.slice(0, 10), ...good.slice(0, 10)]
    const { result } = analyzeCaptureForProtocol('forwardLungeStrideReturn', broken, {
      parameters: { leadSide: 'left' },
    })
    expect(result.quality.verdict).toBe('invalid')
    expect(result.metricResults).toEqual([])
    expect(result.quality.reasons[0].detail).toMatch(/could not be read as a frame sequence/)
  })
})
