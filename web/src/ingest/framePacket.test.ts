import { describe, expect, it } from 'vitest'

import {
  FRAME_PACKET_VERSION,
  FramePacketError,
  createFramePacket,
  fromPoseFrame,
  isReadableFramePacket,
  packetGapMs,
  readFramePacket,
} from './framePacket'
import type { PoseFrame } from '../cv/types'

const poseFrame = (overrides: Partial<PoseFrame> = {}): PoseFrame => ({
  timestamp: 1_000,
  frameIndex: 4,
  landmarks: [],
  worldLandmarks: [],
  poseConfidence: 0.9,
  ...overrides,
})

const validInput = () => ({
  timestamp: 1_000,
  rotation: 90 as const,
  source: 'live-camera' as const,
  identity: { frameIndex: 0, captureId: 'cap-1' },
  pose: poseFrame(),
})

describe('FramePacket v1', () => {
  it('stamps the version at construction, not at normalization', () => {
    // The KQ-018 R1 finding: createTape never stamped a version, so ordinary
    // writers emitted untagged data. A packet is versioned the moment it exists.
    expect(createFramePacket(validInput()).packetVersion).toBe(FRAME_PACKET_VERSION)
  })

  it('carries timestamp, rotation, source, identity and quality', () => {
    const quality = {
      frameIndex: 0,
      timestamp: 1_000,
      visibilityCoverage: 0.8,
      criticalCoverage: 0.7,
      missingCritical: ['left_ankle'],
      maxCriticalSpeed: null,
      implausibleJump: false,
    }
    const packet = createFramePacket({ ...validInput(), quality })
    expect(packet.timestamp).toBe(1_000)
    expect(packet.rotation).toBe(90)
    expect(packet.source).toBe('live-camera')
    expect(packet.identity).toEqual({ frameIndex: 0, captureId: 'cap-1' })
    expect(packet.quality).toEqual(quality)
  })

  it('omits quality rather than inventing it', () => {
    // Absence must mean "not measured", never "good".
    expect('quality' in createFramePacket(validInput())).toBe(false)
  })

  it('refuses a non-finite timestamp', () => {
    for (const timestamp of [Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createFramePacket({ ...validInput(), timestamp })).toThrow(
        FramePacketError,
      )
    }
  })

  it('refuses a rotation outside the closed set', () => {
    expect(() =>
      createFramePacket({ ...validInput(), rotation: 45 as never }),
    ).toThrow(/rotation must be one of/)
  })

  it('refuses a negative frame index or a missing capture id', () => {
    expect(() =>
      createFramePacket({
        ...validInput(),
        identity: { frameIndex: -1, captureId: 'cap-1' },
      }),
    ).toThrow(/non-negative frameIndex/)
    expect(() =>
      createFramePacket({
        ...validInput(),
        identity: { frameIndex: 0, captureId: '' },
      }),
    ).toThrow(/captureId/)
  })

  it('accepts a frame with no pose', () => {
    // A dropped detection is legitimate; it must not be an ingestion failure.
    expect(createFramePacket({ ...validInput(), pose: null }).pose).toBeNull()
  })
})

describe('reading stored packets', () => {
  it('round-trips a written packet', () => {
    const packet = createFramePacket(validInput())
    expect(readFramePacket(JSON.parse(JSON.stringify(packet)))).toEqual(packet)
  })

  it('refuses an untagged packet instead of assuming v1', () => {
    // The KQ-018 R2 finding: `schemaVersion ?? 1` guesses. This does not.
    const { packetVersion, ...untagged } = createFramePacket(validInput())
    expect(packetVersion).toBe(1)
    expect(() => readFramePacket(untagged)).toThrow(/missing packetVersion/)
  })

  it('refuses an unknown future version instead of coercing it', () => {
    // The KQ-018 R5 finding: PoseTape had no readable-version gate.
    const future = { ...createFramePacket(validInput()), packetVersion: 99 }
    expect(() => readFramePacket(future)).toThrow(/Unsupported FramePacket version 99/)
  })

  it('refuses non-objects', () => {
    for (const value of [null, undefined, 42, 'packet']) {
      expect(() => readFramePacket(value)).toThrow(FramePacketError)
    }
  })

  it('validates payload while reading, not only while writing', () => {
    // The KQ-018 R4 finding: a v2-tagged tape skipped validation entirely.
    const tampered = { ...createFramePacket(validInput()), rotation: 45 }
    expect(() => readFramePacket(tampered)).toThrow(/rotation must be one of/)
  })

  it('recognizes readable packets without throwing', () => {
    expect(isReadableFramePacket(createFramePacket(validInput()))).toBe(true)
    expect(isReadableFramePacket({ packetVersion: 99 })).toBe(false)
    expect(isReadableFramePacket(null)).toBe(false)
  })
})

describe('legacy adoption', () => {
  it('wraps a PoseFrame and records rotation 0 as an assumption', () => {
    const packet = fromPoseFrame(poseFrame(), {
      source: 'pose-tape',
      captureId: 'tape-7',
    })
    expect(packet.packetVersion).toBe(FRAME_PACKET_VERSION)
    expect(packet.rotation).toBe(0)
    expect(packet.identity).toEqual({ frameIndex: 4, captureId: 'tape-7' })
    expect(packet.pose).toEqual(poseFrame())
  })

  it('carries frame quality through when the legacy frame has it', () => {
    const quality = {
      frameIndex: 4,
      timestamp: 1_000,
      visibilityCoverage: 1,
      criticalCoverage: 1,
      missingCritical: [],
      maxCriticalSpeed: 0.2,
      implausibleJump: false,
    }
    const packet = fromPoseFrame(poseFrame({ quality }), {
      source: 'uploaded-video',
      captureId: 'up-1',
    })
    expect(packet.quality).toEqual(quality)
  })
})

describe('packetGapMs', () => {
  const at = (timestamp: number, captureId = 'cap-1') =>
    createFramePacket({ ...validInput(), timestamp, identity: { frameIndex: 0, captureId } })

  it('measures elapsed time within one capture', () => {
    expect(packetGapMs(at(1_000), at(1_033))).toBe(33)
  })

  it('refuses to measure across captures', () => {
    // Timestamps from different captures are not on a shared clock.
    expect(packetGapMs(at(1_000, 'a'), at(1_033, 'b'))).toBeNull()
  })

  it('refuses to measure backwards', () => {
    expect(packetGapMs(at(1_033), at(1_000))).toBeNull()
  })
})
