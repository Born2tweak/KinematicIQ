import { describe, expect, it } from 'vitest'
import { SQUAT_PROFILE } from '../analysis/movement/profiles/squat'
import { NotImplementedError } from '../core/protocol'
import {
  getActiveProtocol,
  getActiveProtocolProfile,
  getProtocol,
  getProtocolProfile,
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

  it('lists registered protocols and filters by status', () => {
    const all = listProtocols()
    expect(all.map((p) => p.definition.id)).toEqual([
      'squat',
      'forwardLungeStrideReturn',
      'sitToStand',
      'hipHinge',
      'jump',
      'sprint',
    ])
    expect(listProtocolsByStatus('available').map((p) => p.definition.id)).toEqual([
      'squat',
    ])
    expect(listProtocolsByStatus('planned').map((p) => p.definition.id)).toEqual([
      'forwardLungeStrideReturn',
      'sitToStand',
      'hipHinge',
      'jump',
      'sprint',
    ])
  })

  it('planned stubs carry real metadata but no analysis profile', () => {
    expect(getProtocol('hipHinge').definition.kind).toBe('cyclic')
    expect(getProtocol('jump').definition.kind).toBe('ballistic')
    expect(getProtocol('sprint').definition.kind).toBe('gait')
    expect(getProtocol('sitToStand').definition.kind).toBe('transition')
    for (const id of ['forwardLungeStrideReturn', 'hipHinge', 'jump', 'sprint', 'sitToStand'] as const) {
      expect(getProtocol(id).profile).toBeNull()
      expect(getProtocol(id).definition.phases.length).toBeGreaterThan(0)
      expect(getProtocol(id).definition.requiredLandmarks.length).toBeGreaterThan(0)
    }
  })

  it('reads the legacy lunge alias without registering a second protocol', () => {
    expect(getProtocol('inlineLunge')).toBe(getProtocol('forwardLungeStrideReturn'))
    expect(listProtocols().filter((item) => item.definition.id === 'forwardLungeStrideReturn')).toHaveLength(1)
  })

  it('analyze entry point throws NotImplementedError for planned stubs', () => {
    expect(() => getProtocolProfile('jump')).toThrow(NotImplementedError)
    expect(() => getProtocolProfile('forwardLungeStrideReturn')).toThrow(NotImplementedError)
    expect(() => getProtocolProfile('sprint')).toThrow(/not yet implemented/)
    // Squat path untouched.
    expect(getProtocolProfile('squat')).toBe(SQUAT_PROFILE)
  })

  it('squat definition requires the lower-body landmarks', () => {
    const { requiredLandmarks } = getProtocol('squat').definition
    // Hips, knees, ankles, shoulders — 8 landmarks.
    expect(requiredLandmarks).toHaveLength(8)
  })
})
