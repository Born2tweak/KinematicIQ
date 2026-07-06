import { describe, expect, it } from 'vitest'
import {
  NotImplementedError,
  isAvailable,
  type ProtocolDefinition,
} from './protocol'

const squatLike: ProtocolDefinition = {
  id: 'squat',
  label: 'Bodyweight squat',
  kind: 'cyclic',
  status: 'available',
  phases: ['standing', 'descending', 'bottom', 'ascending'],
  requiredLandmarks: [23, 24, 25, 26, 27, 28],
  metrics: [],
  findingRuleIds: [],
  defaultObservationProtocolId: 'front-view-squat-v1',
}

const jumpStub: ProtocolDefinition = {
  id: 'jump',
  label: 'Vertical jump',
  kind: 'ballistic',
  status: 'planned',
  phases: ['countermovement', 'takeoff', 'flight', 'landing'],
  requiredLandmarks: [23, 24, 27, 28],
  metrics: [],
  findingRuleIds: [],
}

describe('core/protocol', () => {
  it('isAvailable reflects lifecycle status', () => {
    expect(isAvailable(squatLike)).toBe(true)
    expect(isAvailable(jumpStub)).toBe(false)
  })

  it('supports all three segmentation kinds in the type', () => {
    const kinds = [squatLike.kind, jumpStub.kind, 'gait'] as const
    expect(kinds).toContain('cyclic')
    expect(kinds).toContain('ballistic')
    expect(kinds).toContain('gait')
  })

  it('NotImplementedError names the offending protocol', () => {
    const err = new NotImplementedError('sprint')
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('NotImplementedError')
    expect(err.protocolId).toBe('sprint')
    expect(err.message).toContain('sprint')
  })
})
