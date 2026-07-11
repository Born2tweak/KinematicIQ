/**
 * Sprint — planned protocol stub (M10).
 *
 * Gait segmentation (continuous strides, no reps, per
 * analysis/movement/types.ts `MovementKind`). No analysis is implemented:
 * `profile` is null and the analyze entry point throws `NotImplementedError`.
 */
import { LANDMARK_INDICES } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'

export const SPRINT_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'sprint',
  label: 'Sprint',
  kind: 'gait',
  status: 'planned',
  phases: ['stance', 'toe-off', 'swing', 'touchdown'],
  requiredLandmarks: [
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.RIGHT_KNEE,
    LANDMARK_INDICES.LEFT_ANKLE,
    LANDMARK_INDICES.RIGHT_ANKLE,
  ],
  capture: {
    inputModes: [],
    cameraView: 'side',
    viewInstruction: 'Capture view is not yet validated for sprint.',
    setupInstructions: ['This protocol remains in research and cannot be started.'],
  },
  metrics: [],
  findingRuleIds: [],
}

export const SPRINT_PROTOCOL: Protocol = {
  definition: SPRINT_PROTOCOL_DEFINITION,
  profile: null,
}
