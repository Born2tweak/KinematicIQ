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
import type { PoseFrame } from '../cv/types'
import type { PipelineInitialState } from './videoAnalyzer'

export interface AnalyzeProtocolOptions {
  /** Seeded FSM entry state (mid-descent activation / tape replay parity). */
  initial?: PipelineInitialState
  /** Real capture source + filtering, so exported provenance is never faked. */
  capture?: CaptureContext
  /** Capture parameters the athlete declared (e.g. forward-lunge lead side). */
  parameters?: ProtocolSessionParameters
  /** Stable capture id carried into the ingestion envelope. */
  captureId?: string
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
 * Analyze an ordered frame sequence under the selected protocol. Throws
 * `NotImplementedError` for planned protocols and a registry error for
 * unknown ids — callers surface honest "not yet validated" copy instead of
 * a fake report.
 */
export function analyzeFramesForProtocol(
  protocolId: ProtocolId,
  frames: readonly PoseFrame[],
  options: AnalyzeProtocolOptions = {},
): ProtocolAnalysis {
  // Resolves the runtime (and refuses unimplemented protocols) before any
  // frame is touched, whichever path runs below.
  const runtime = getProtocolRuntime(protocolId)
  if (runtime.analyzeSession) {
    return {
      segmentation: null,
      result: runtime.analyzeSession({
        frames,
        capture: options.capture ?? { captureSource: 'live', filterVariant: 'raw' },
        parameters: options.parameters,
        captureId: options.captureId,
        observationProtocolId: options.observationProtocolId,
      }),
    }
  }
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
