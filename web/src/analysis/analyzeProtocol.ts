/**
 * Protocol-aware analysis entry point (M43).
 *
 * One high-level API for live, upload, and replay callers: pick an available
 * protocol, run its runtime's segmentation, and assemble the session result
 * under the SELECTED protocol id (R08 data flow; R11 protocol workflow).
 *
 * Safety: planned protocols throw `NotImplementedError` before any frame is
 * touched (`getProtocolRuntime`) — an unvalidated analysis cannot be reached
 * through this API. Squat remains the default everywhere a caller does not
 * pass an explicit id.
 */
import { getCyclicProtocolRuntime, getProtocolRuntime } from '../protocols/runtime'
import type { ProtocolSessionParameters, SegmentationOutput } from '../protocols/runtime'
import type { SessionResult } from '../session/types'
import type { ProtocolId } from '../core/protocol'
import type { CaptureContext } from '../core/provenance'
import {
  assertPacketSequence,
  fromPoseFrame,
  posesFromPackets,
  type FramePacket,
  type FrameSourceKind,
} from '../ingest/framePacket'
import type { PoseFrame } from '../cv/types'
import type { PipelineInitialState } from './videoAnalyzer'

export interface AnalyzeProtocolOptions {
  /** Seeded FSM entry state (mid-descent activation / tape replay parity). */
  initial?: PipelineInitialState
  /** Real capture source + filtering, so exported provenance is never faked. */
  capture?: CaptureContext
  /** Capture parameters the athlete declared (e.g. forward-lunge lead side). */
  parameters?: ProtocolSessionParameters
  /** Observation protocol the recording claims, when it carries one. */
  observationProtocolId?: string
}

export interface ProtocolAnalysis {
  /**
   * Per-frame streams + reps from the cyclic segmentation stage. Null for a
   * protocol that owns its own whole-session analysis — its trials live in the
   * result's metric evidence, not in a rep array.
   */
  segmentation: SegmentationOutput | null
  /** Assembled session result; `result.protocolId` equals the selected id. */
  result: SessionResult
}

/**
 * Wrap a bare frame list as a packet sequence.
 *
 * For sources that never went through `runVideoAnalysis` — a stored pose tape,
 * a test fixture — the frames exist before any packet does. Rotation is 0
 * because a legacy frame records none; that is a stated assumption, and it is
 * stated here rather than silently inside each consumer.
 */
export function packetsFromFrames(
  frames: readonly PoseFrame[],
  options: { source: FrameSourceKind; captureId: string },
): FramePacket[] {
  return frames.map((frame) => fromPoseFrame(frame, options))
}

/**
 * Analyze one capture under the selected protocol. Throws
 * `NotImplementedError` for planned protocols and a registry error for
 * unknown ids — callers surface honest "not yet validated" copy instead of
 * a fake report.
 *
 * Both runtime shapes enter through the same packet sequence. That is the
 * point of the signature: the cyclic path used to receive raw `PoseFrame[]`
 * while only the whole-session path saw an envelope, so "every source goes
 * through ingestion" was true of one protocol and not the other.
 */
export function analyzeCaptureForProtocol(
  protocolId: ProtocolId,
  packets: readonly FramePacket[],
  options: AnalyzeProtocolOptions = {},
): ProtocolAnalysis {
  // Resolves the runtime (and refuses unimplemented protocols) before any
  // frame is touched, whichever path runs below.
  const runtime = getProtocolRuntime(protocolId)
  if (runtime.analyzeSession) {
    return {
      segmentation: null,
      result: runtime.analyzeSession({
        packets,
        capture: options.capture ?? { captureSource: 'live', filterVariant: 'raw' },
        parameters: options.parameters,
        observationProtocolId: options.observationProtocolId,
      }),
    }
  }
  // The cyclic engine reads poses, not packets — but it reads them from a
  // sequence that has been checked as one ordered capture, exactly like the
  // whole-session path does.
  assertPacketSequence(packets)
  const frames = posesFromPackets(packets)
  const cyclic = getCyclicProtocolRuntime(protocolId)
  const segmentation = cyclic.segmentFrames(frames, options.initial)
  const result = cyclic.buildSessionResult({
    reps: segmentation.reps,
    poseConfidenceSamples: segmentation.poseConfidenceSamples,
    postureSamples: segmentation.postureSamples,
    repRejections: segmentation.repRejections,
    capture: options.capture,
  })
  return { segmentation, result }
}
