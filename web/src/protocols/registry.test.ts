import { describe, expect, it } from 'vitest'
import { SQUAT_PROFILE } from '../analysis/movement/profiles/squat'
import {
  getActiveProtocol,
  getActiveProtocolProfile,
  getProtocol,
  listProtocols,
  listProtocolsByStatus,
} from './registry'

describe('protocols/registry', () => {
  it('resolves squat as an available cyclic protocol', () => {
    const squat = getProtocol('squat')
    expect(squat.definition.id).toBe('squat')
    expect(squat.definition.kind).toBe('cyclic')
    expect(squat.definition.status).toBe('available')
    expect(squat.profile).toBe(SQUAT_PROFILE)
  })

  it('exposes squat as the active protocol and profile', () => {
    expect(getActiveProtocol().definition.id).toBe('squat')
    expect(getActiveProtocolProfile()).toBe(SQUAT_PROFILE)
  })

  it('throws for unregistered protocols', () => {
    expect(() => getProtocol('sprint')).toThrow(/not registered/)
  })

  it('lists registered protocols and filters by status', () => {
    const all = listProtocols()
    expect(all.map((p) => p.definition.id)).toContain('squat')
    expect(listProtocolsByStatus('available').map((p) => p.definition.id)).toEqual([
      'squat',
    ])
    expect(listProtocolsByStatus('planned')).toEqual([])
  })

  it('squat definition requires the lower-body landmarks', () => {
    const { requiredLandmarks } = getProtocol('squat').definition
    // Hips, knees, ankles, shoulders — 8 landmarks.
    expect(requiredLandmarks).toHaveLength(8)
  })
})
