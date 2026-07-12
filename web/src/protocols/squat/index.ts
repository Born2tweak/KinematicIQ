/**
 * Squat — protocol #1 (M5).
 *
 * Wraps the existing `SQUAT_PROFILE` (analysis/movement/profiles/squat.ts) in a
 * `Protocol`: the same runtime analysis config, plus a movement-agnostic
 * `ProtocolDefinition` (core/protocol) that the new registry lists. Behavior is
 * a strict no-op for squat — the profile object is passed through unchanged.
 *
 * Metrics and finding rules are populated in M6/M7; they start empty here.
 */
import { SQUAT_PROFILE } from '../../analysis/movement/profiles/squat'
import { LANDMARK_INDICES } from '../../cv/types'
import type { ProtocolDefinition } from '../../core/protocol'
import type { Protocol } from '../types'

export const SQUAT_PROTOCOL_DEFINITION: ProtocolDefinition = {
  id: 'squat',
  label: SQUAT_PROFILE.label,
  kind: SQUAT_PROFILE.kind,
  status: 'available',
  evidence: {
    schemaVersion: 2,
    researchState: 'implemented',
    evidenceRefs: ['docs/implementation/progress/M43-protocol-aware-entry-point.md'],
    datasetProvenance: [],
    cameraAssumptions: {
      validationState: 'provisional',
      evidenceRefs: ['docs/implementation/progress/M25-capture-readiness-v2.md'],
    },
    validationGates: [{
      id: 'squat-runtime-regression',
      state: 'passed',
      evidenceRefs: ['web/src/protocols/runtime.test.ts'],
    }],
    acceptanceThresholds: {
      provenance: 'provisional',
      evidenceRefs: ['docs/doctrine/deferred-scope.md'],
    },
  },
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
  capture: {
    inputModes: ['live', 'upload', 'replay'],
    cameraView: 'front',
    viewInstruction: 'Face the camera square-on with your whole body in frame.',
    setupInstructions: [
      'Place the camera near hip height, about 3–4 m away.',
      'Keep your head, hands, hips, knees, ankles, and feet visible.',
      'Use even lighting and keep the camera still for the full set.',
    ],
  },
  metrics: [],
  findingRuleIds: [],
  defaultObservationProtocolId: 'front-view-squat-v1',
}

export const SQUAT_PROTOCOL: Protocol = {
  definition: SQUAT_PROTOCOL_DEFINITION,
  profile: SQUAT_PROFILE,
}
