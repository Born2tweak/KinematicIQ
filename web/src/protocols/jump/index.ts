/**
 * Jump — planned protocol stub (M10).
 *
 * Ballistic segmentation (takeoff/flight/landing — no rep bottom, per
 * analysis/movement/types.ts `MovementKind`). No analysis is implemented:
 * `profile` is null and the analyze entry point throws `NotImplementedError`.
 */
import { LANDMARK_INDICES } from '../../cv/types'
import type { Protocol, ProtocolDefinition } from '../types'

export const JUMP_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'jump',
  label: 'Vertical jump',
  kind: 'ballistic',
  status: 'planned',
  evidence: {
    schemaVersion: 2,
    researchState: 'research-only',
    evidenceRefs: [],
    datasetProvenance: [],
    cameraAssumptions: { validationState: 'unvalidated', evidenceRefs: [] },
    validationGates: [{ id: 'protocol-validation', state: 'pending', evidenceRefs: [] }],
    acceptanceThresholds: { provenance: 'not-defined', evidenceRefs: [] },
  },
  phases: ['standing', 'countermovement', 'takeoff', 'flight', 'landing'],
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
    cameraView: 'front',
    viewInstruction: 'Capture view is not yet validated for vertical jump.',
    setupInstructions: ['This protocol remains in research and cannot be started.'],
  },
  metrics: [],
  findingRuleIds: [],
}

export const JUMP_PROTOCOL: Protocol = {
  definition: JUMP_PROTOCOL_DEFINITION,
  profile: null,
}
