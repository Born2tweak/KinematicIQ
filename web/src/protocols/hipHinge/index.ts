/**
 * Hip hinge — planned protocol stub (M10).
 *
 * Real metadata (cyclic segmentation like the squat, per
 * analysis/movement/types.ts), no analysis: `profile` is null and the analyze
 * entry point (registry `getProtocolProfile`) throws `NotImplementedError`.
 * Nothing here is validated — the UI must present it as "in development".
 */
import { LANDMARK_INDICES } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'

export const HIP_HINGE_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'hipHinge',
  label: 'Hip hinge',
  kind: 'cyclic',
  status: 'planned',
  phases: ['standing', 'descending', 'bottom', 'ascending'],
  requiredLandmarks: [
    LANDMARK_INDICES.LEFT_SHOULDER,
    LANDMARK_INDICES.RIGHT_SHOULDER,
    LANDMARK_INDICES.LEFT_HIP,
    LANDMARK_INDICES.RIGHT_HIP,
    LANDMARK_INDICES.LEFT_KNEE,
    LANDMARK_INDICES.RIGHT_KNEE,
    LANDMARK_INDICES.LEFT_ANKLE,
    LANDMARK_INDICES.RIGHT_ANKLE,
  ],
  metrics: [],
  findingRuleIds: [],
}

export const HIP_HINGE_PROTOCOL: Protocol = {
  definition: HIP_HINGE_PROTOCOL_DEFINITION,
  profile: null,
}
