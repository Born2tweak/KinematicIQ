import type { LandmarkObservation, LandmarkObservationState } from '../cv/landmarkState'
import type { ProtocolCaptureConfig, ProtocolTrackingState } from '../core/protocol'

const PRIORITY: readonly ProtocolTrackingState[] = [
  'out-of-frame',
  'missing',
  'low-confidence',
  'ambiguous-side',
  'rejected',
  'short-gap',
  'recovered',
]

export interface ProtocolTrackingGuidance {
  instruction: string
  state: ProtocolTrackingState
  /** Analyst-facing evidence only; never presented as an anatomical finding. */
  evidence: {
    affectedLandmarkIndices: number[]
    affectedFrameIndices: number[]
    observationCount: number
  }
}

function isGuidanceState(state: LandmarkObservationState): state is ProtocolTrackingState {
  return state !== 'observed'
}

export function deriveProtocolTrackingGuidance(
  observations: readonly LandmarkObservation[],
  capture: ProtocolCaptureConfig,
): ProtocolTrackingGuidance | null {
  const actionable = observations.filter((item) => isGuidanceState(item.state))
  const state = PRIORITY.find((candidate) => actionable.some((item) => item.state === candidate))
  if (!state) return null
  const instruction = capture.recoveryInstructions?.[state]?.trim()
  if (!instruction) return null
  const matching = actionable.filter((item) => item.state === state)
  return {
    instruction,
    state,
    evidence: {
      affectedLandmarkIndices: [...new Set(matching.map((item) => item.landmarkIndex))].sort((a, b) => a - b),
      affectedFrameIndices: [...new Set(matching.map((item) => item.frameIndex))].sort((a, b) => a - b),
      observationCount: matching.length,
    },
  }
}
