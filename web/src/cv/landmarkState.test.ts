import { describe, expect, it } from 'vitest'
import { classifyLandmarkObservation, landmarkMetricEligibility } from './landmarkState'

const visible = { x: 0.5, y: 0.5, z: 0, visibility: 0.9 }
const input = (raw = visible) => ({ frameIndex: 1, landmarkIndex: 23, raw })

describe('landmark observation state', () => {
  it('classifies deterministic direct failure states without changing raw data', () => {
    expect(classifyLandmarkObservation(input()).state).toBe('observed')
    expect(classifyLandmarkObservation(input({ ...visible, visibility: 0.2 })).state).toBe('low-confidence')
    expect(classifyLandmarkObservation(input({ ...visible, x: 1.2 })).state).toBe('out-of-frame')
    expect(classifyLandmarkObservation({ ...input(null as never), raw: null }).state).toBe('missing')
    expect(classifyLandmarkObservation({ ...input(), ambiguousSide: true }).state).toBe('ambiguous-side')
    expect(classifyLandmarkObservation({ ...input(), rejectedReason: 'teleport' }).state).toBe('rejected')
  })

  it('represents a short gap without inventing a coordinate', () => {
    const state = classifyLandmarkObservation({ ...input(null as never), raw: null, shortGap: true })
    expect(state.state).toBe('short-gap')
    expect(state.raw).toBeNull()
    expect(state.recovered).toBeNull()
  })

  it('retains raw and distinguishes recovered from directly observed eligibility', () => {
    const recovered = classifyLandmarkObservation({ ...input(null as never), raw: null, recovered: visible })
    expect(recovered.state).toBe('recovered')
    expect(recovered.raw).toBeNull()
    expect(landmarkMetricEligibility(recovered)).toEqual({ eligible: true, evidence: 'recovered' })
    expect(landmarkMetricEligibility(classifyLandmarkObservation(input()))).toEqual({ eligible: true, evidence: 'direct' })
  })
})
