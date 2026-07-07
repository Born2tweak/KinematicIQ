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
import { getProtocolRuntime } from '../protocols/runtime'
import type { SegmentationOutput } from '../protocols/runtime'
import { buildSessionResult } from '../session/buildSessionResult'
import type { SessionResult } from '../session/types'
import type { ProtocolId } from '../core/protocol'
import type { PoseFrame } from '../cv/types'
import type { PipelineInitialState } from './videoAnalyzer'

export interface AnalyzeProtocolOptions {
  /** Seeded FSM entry state (mid-descent activation / tape replay parity). */
  initial?: PipelineInitialState
}

export interface ProtocolAnalysis {
  /** Per-frame streams + reps from the protocol's segmentation stage. */
  segmentation: SegmentationOutput
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
  const runtime = getProtocolRuntime(protocolId)
  const segmentation = runtime.segmentFrames(frames, options.initial)
  const result = buildSessionResult(
    segmentation.reps,
    segmentation.poseConfidenceSamples,
    segmentation.postureSamples,
    segmentation.repRejections,
    protocolId,
  )
  return { segmentation, result }
}
