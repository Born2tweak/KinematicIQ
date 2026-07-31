/**
 * FramePacket v1 (KQ-019) — the single ingestion envelope every frame source
 * produces, whatever it is: live webcam, uploaded video, fixture, or pose tape.
 *
 * The KQ-018 audit found that `PoseTape.schemaVersion` is optional, so an
 * untagged tape is ambiguous between "pre-versioning" and "current writer", and
 * normalization resolves it by guessing (`?? 1`). FramePacket does not repeat
 * that: `packetVersion` is required and closed, it is stamped at construction
 * rather than at normalization, and an unknown version is refused instead of
 * being coerced to the oldest known shape.
 *
 * A packet carries only what the ingestion layer can vouch for at capture time:
 * when the frame happened, how the image was oriented, where it came from, how
 * to identify it, and how much of the body the tracker could see. It asserts
 * nothing about biomechanics.
 */

import type { LandmarkQualityFrame, PoseFrame } from '../cv/types'

/** Closed set of packet versions this build can read. Extend deliberately. */
export const FRAME_PACKET_VERSIONS = [1] as const
export type FramePacketVersion = (typeof FRAME_PACKET_VERSIONS)[number]

/** Current writer version. New packets are always stamped with this. */
export const FRAME_PACKET_VERSION: FramePacketVersion = 1

/**
 * Where the frame came from. This is provenance, not a quality judgement —
 * a fixture frame is not "worse" than a live one, it is differently sourced,
 * and downstream code must be able to tell them apart when reporting evidence.
 */
export type FrameSourceKind =
  | 'live-camera'
  | 'uploaded-video'
  | 'fixture-video'
  | 'pose-tape'

/**
 * Clockwise display rotation in degrees applied to reach upright.
 * Phones record rotated video; landmark geometry is only comparable once the
 * rotation that produced it is known.
 */
export const FRAME_ROTATIONS = [0, 90, 180, 270] as const
export type FrameRotation = (typeof FRAME_ROTATIONS)[number]

export interface FrameIdentity {
  /** Monotonic index within its capture, starting at 0. */
  frameIndex: number
  /** Stable id for the capture this frame belongs to. */
  captureId: string
}

export interface FramePacket {
  /** Required and closed. Never optional — see the KQ-018 R1/R2 findings. */
  packetVersion: FramePacketVersion
  /** Capture time in ms on the producer's clock. */
  timestamp: number
  rotation: FrameRotation
  source: FrameSourceKind
  identity: FrameIdentity
  /** The tracked pose, if the model produced one for this frame. */
  pose: PoseFrame | null
  /**
   * Landmark quality when the producer computed it. Absence means "not
   * measured", never "good" — consumers must not infer quality from silence.
   */
  quality?: LandmarkQualityFrame
}

export class FramePacketError extends Error {}

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * Build a v1 packet, stamping the version at construction.
 *
 * Validation is deliberately strict at the boundary: a packet that cannot be
 * trusted must fail here, where the producer is still on the stack, rather than
 * surfacing as an unexplained gap in a report much later.
 */
export function createFramePacket(input: {
  timestamp: number
  rotation: FrameRotation
  source: FrameSourceKind
  identity: FrameIdentity
  pose: PoseFrame | null
  quality?: LandmarkQualityFrame
}): FramePacket {
  if (!isFiniteNumber(input.timestamp)) {
    throw new FramePacketError('FramePacket requires a finite timestamp.')
  }
  if (!FRAME_ROTATIONS.includes(input.rotation)) {
    throw new FramePacketError(
      `FramePacket rotation must be one of ${FRAME_ROTATIONS.join(', ')}.`,
    )
  }
  if (!isFiniteNumber(input.identity?.frameIndex) || input.identity.frameIndex < 0) {
    throw new FramePacketError('FramePacket requires a non-negative frameIndex.')
  }
  if (!input.identity?.captureId) {
    throw new FramePacketError('FramePacket requires a captureId.')
  }
  const packet: FramePacket = {
    packetVersion: FRAME_PACKET_VERSION,
    timestamp: input.timestamp,
    rotation: input.rotation,
    source: input.source,
    identity: { ...input.identity },
    pose: input.pose,
  }
  return input.quality ? { ...packet, quality: input.quality } : packet
}

/** True when `value` is a packet this build can read. */
export function isReadableFramePacket(value: unknown): value is FramePacket {
  const candidate = value as Partial<FramePacket> | null
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      FRAME_PACKET_VERSIONS.includes(candidate.packetVersion as FramePacketVersion),
  )
}

/**
 * Accept a packet from storage or refuse it.
 *
 * Unlike the legacy tape reader this never defaults a missing version. An
 * absent or unknown `packetVersion` is an error, so a future v2 packet cannot
 * be silently misread as v1 by an older build.
 */
export function readFramePacket(value: unknown): FramePacket {
  const candidate = value as Partial<FramePacket> | null
  if (!candidate || typeof candidate !== 'object') {
    throw new FramePacketError('FramePacket must be an object.')
  }
  if (candidate.packetVersion === undefined) {
    throw new FramePacketError(
      'FramePacket is missing packetVersion; untagged frames are not assumed to be v1.',
    )
  }
  if (!FRAME_PACKET_VERSIONS.includes(candidate.packetVersion as FramePacketVersion)) {
    throw new FramePacketError(
      `Unsupported FramePacket version ${String(candidate.packetVersion)}; ` +
        `this build reads ${FRAME_PACKET_VERSIONS.join(', ')}.`,
    )
  }
  return createFramePacket({
    timestamp: candidate.timestamp as number,
    rotation: candidate.rotation as FrameRotation,
    source: candidate.source as FrameSourceKind,
    identity: candidate.identity as FrameIdentity,
    pose: (candidate.pose ?? null) as PoseFrame | null,
    quality: candidate.quality,
  })
}

/**
 * Wrap a legacy `PoseFrame` as a packet.
 *
 * Used while the ingestion spine is adopted incrementally: existing sources
 * still emit `PoseFrame`, and this adapts them without changing their
 * behaviour. Rotation defaults to 0 because legacy frames carry no rotation —
 * that is a recorded assumption, not a measurement.
 */
export function fromPoseFrame(
  frame: PoseFrame,
  options: { source: FrameSourceKind; captureId: string; rotation?: FrameRotation },
): FramePacket {
  return createFramePacket({
    timestamp: frame.timestamp,
    rotation: options.rotation ?? 0,
    source: options.source,
    identity: { frameIndex: frame.frameIndex, captureId: options.captureId },
    pose: frame,
    quality: frame.quality,
  })
}

/** Elapsed ms between two packets, or null when they are not comparable. */
export function packetGapMs(previous: FramePacket, next: FramePacket): number | null {
  if (previous.identity.captureId !== next.identity.captureId) return null
  const gap = next.timestamp - previous.timestamp
  return gap >= 0 ? gap : null
}

/**
 * Check that an ordered run of packets is one coherent capture.
 *
 * A single well-formed packet says nothing about the sequence it belongs to:
 * frames can still arrive out of order, carry a rewound clock, or splice two
 * captures together, and every one of those silently corrupts a phase
 * segmentation that reads time. `createFramePacket` cannot see any of it
 * because it only ever holds one frame. This is the sequence-level half of the
 * same boundary, and it is deliberately strict for the same reason: refuse here,
 * while the producer is still on the stack.
 *
 * Timestamps must be strictly increasing rather than merely non-decreasing —
 * two frames at the same instant make a duration undefined, and the capture
 * loop already guarantees strict monotonicity.
 */
export function assertPacketSequence(
  packets: readonly FramePacket[],
): asserts packets is readonly FramePacket[] {
  let previous: FramePacket | null = null
  for (const packet of packets) {
    if (!FRAME_PACKET_VERSIONS.includes(packet.packetVersion)) {
      throw new FramePacketError(
        `Unsupported FramePacket version ${String(packet.packetVersion)} in sequence.`,
      )
    }
    if (previous) {
      if (packet.identity.captureId !== previous.identity.captureId) {
        throw new FramePacketError(
          `FramePacket sequence mixes captures "${previous.identity.captureId}" and ` +
            `"${packet.identity.captureId}"; one sequence is one capture.`,
        )
      }
      if (packet.identity.frameIndex <= previous.identity.frameIndex) {
        throw new FramePacketError(
          `FramePacket frameIndex must increase: ${previous.identity.frameIndex} ` +
            `was followed by ${packet.identity.frameIndex}.`,
        )
      }
      if (packet.timestamp <= previous.timestamp) {
        throw new FramePacketError(
          `FramePacket timestamps must increase: ${previous.timestamp}ms ` +
            `was followed by ${packet.timestamp}ms.`,
        )
      }
    }
    previous = packet
  }
}

/**
 * The poses a sequence actually carries, in order.
 *
 * Packets with `pose: null` are frames the ingestion layer sampled but the
 * tracker could not read. They are dropped here rather than earlier so the
 * sampled-vs-readable ratio stays measurable from the packet list itself —
 * see {@link sequenceReadability}.
 */
export function posesFromPackets(packets: readonly FramePacket[]): PoseFrame[] {
  return packets.flatMap((packet) => (packet.pose ? [packet.pose] : []))
}

/** How much of a sampled sequence the tracker could actually read. */
export function sequenceReadability(packets: readonly FramePacket[]): {
  sampled: number
  withPose: number
  /** Fraction in [0, 1]; 0 for an empty sequence, never NaN. */
  ratio: number
} {
  const sampled = packets.length
  const withPose = packets.reduce((count, packet) => count + (packet.pose ? 1 : 0), 0)
  return { sampled, withPose, ratio: sampled === 0 ? 0 : withPose / sampled }
}
