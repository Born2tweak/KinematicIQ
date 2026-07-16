import { describe, expect, it } from 'vitest'
import {
  NotImplementedError,
  isAvailable,
  normalizeObservationProtocolId,
  normalizeProtocolId,
  validateProtocolDefinition,
  type ProtocolDefinition,
} from './protocol'

const squatLike: ProtocolDefinition = {
  id: 'squat',
  label: 'Bodyweight squat',
  kind: 'cyclic',
  status: 'available',
  evidence: {
    schemaVersion: 2,
    researchState: 'implemented',
    evidenceRefs: ['test-evidence'],
    datasetProvenance: [],
    cameraAssumptions: { validationState: 'provisional', evidenceRefs: ['test-camera'] },
    validationGates: [{ id: 'test-gate', state: 'passed', evidenceRefs: ['test'] }],
    acceptanceThresholds: { provenance: 'provisional', evidenceRefs: ['test'] },
  },
  phases: ['standing', 'descending', 'bottom', 'ascending'],
  requiredLandmarks: [23, 24, 25, 26, 27, 28],
  capture: {
    inputModes: ['live', 'upload', 'replay'],
    cameraView: 'front',
    viewInstruction: 'Face the camera.',
    setupInstructions: ['Whole body visible.'],
  },
  metrics: [],
  findingRuleIds: [],
  defaultObservationProtocolId: 'front-view-squat-v1',
}

const jumpStub: ProtocolDefinition = {
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
    validationGates: [{ id: 'validation', state: 'pending', evidenceRefs: [] }],
    acceptanceThresholds: { provenance: 'not-defined', evidenceRefs: [] },
  },
  phases: ['countermovement', 'takeoff', 'flight', 'landing'],
  requiredLandmarks: [23, 24, 27, 28],
  capture: {
    inputModes: [],
    cameraView: 'front',
    viewInstruction: 'Not validated.',
    setupInstructions: ['Unavailable.'],
  },
  metrics: [],
  findingRuleIds: [],
}

describe('core/protocol', () => {
  it('normalizes the deprecated lunge identifiers and rejects unknown ids', () => {
    expect(normalizeProtocolId('inlineLunge')).toBe('forwardLungeStrideReturn')
    expect(normalizeProtocolId('forwardLungeStrideReturn')).toBe('forwardLungeStrideReturn')
    expect(normalizeObservationProtocolId('side-view-inline-lunge-v1')).toBe('side-view-forward-lunge-stride-return-v1')
    expect(() => normalizeProtocolId('mystery')).toThrow(/not registered/)
  })
  it('isAvailable reflects lifecycle status', () => {
    expect(isAvailable(squatLike)).toBe(true)
    expect(isAvailable(jumpStub)).toBe(false)
  })

  it('supports all three segmentation kinds in the type', () => {
    const kinds = [squatLike.kind, jumpStub.kind, 'transition', 'gait'] as const
    expect(kinds).toContain('cyclic')
    expect(kinds).toContain('ballistic')
    expect(kinds).toContain('gait')
    expect(kinds).toContain('transition')
  })

  it('NotImplementedError names the offending protocol', () => {
    const err = new NotImplementedError('sprint')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('NotImplementedError')
    expect(err.protocolId).toBe('sprint')
    expect(err.message).toContain('sprint')
  })

  it('accepts internally consistent available and planned metadata', () => {
    expect(validateProtocolDefinition(squatLike)).toBe(squatLike)
    expect(validateProtocolDefinition(jumpStub)).toBe(jumpStub)
  })

  it('rejects an available protocol with research-only evidence', () => {
    expect(() => validateProtocolDefinition({
      ...squatLike,
      evidence: { ...squatLike.evidence, researchState: 'research-only' },
    })).toThrow(/must be implemented/)
  })

  it('rejects an available protocol without threshold provenance', () => {
    expect(() => validateProtocolDefinition({
      ...squatLike,
      evidence: {
        ...squatLike.evidence,
        acceptanceThresholds: { provenance: 'not-defined', evidenceRefs: [] },
      },
    })).toThrow(/threshold provenance/)
  })

  it('rejects planned protocols that expose an input mode', () => {
    expect(() => validateProtocolDefinition({
      ...jumpStub,
      capture: { ...jumpStub.capture, inputModes: ['upload'] },
    })).toThrow(/cannot expose input modes/)
  })
})
