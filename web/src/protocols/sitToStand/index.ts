import { LANDMARK_INDICES } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'

/** Research-only M72 registration. No segmentation, thresholds, metrics, or coaching. */
export const SIT_TO_STAND_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'sitToStand',
  label: 'Sit to stand',
  kind: 'transition',
  status: 'planned',
  phases: ['seated', 'rising', 'standing', 'lowering'],
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
  capture: {
    inputModes: [],
    cameraView: 'side',
    viewInstruction: 'Place the camera side-on so the chair, hips, knees, ankles, and full standing position remain visible.',
    setupInstructions: [
      'Use a stable chair against a wall and keep the camera still.',
      'Do not start this research protocol in the product; capture and threshold validation are incomplete.',
    ],
  },
  metrics: [],
  findingRuleIds: [],
}

export const SIT_TO_STAND_PROTOCOL: Protocol = {
  definition: SIT_TO_STAND_PROTOCOL_DEFINITION,
  profile: null,
}

