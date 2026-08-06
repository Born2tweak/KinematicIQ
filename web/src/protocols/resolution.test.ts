import { describe, expect, it } from 'vitest'
import {
  FALLBACK_PROTOCOL_ID,
  isDetected,
  resolveAbstained,
  resolveFallback,
  resolveFromSelection,
  resolveProtocolFromRouteState,
  resolutionDisclosure,
} from './resolution'

describe('protocol resolution', () => {
  it('carries a selection as user-selected with no confidence number', () => {
    const resolution = resolveFromSelection('forwardLungeStrideReturn')
    expect(resolution.protocolId).toBe('forwardLungeStrideReturn')
    expect(resolution.source).toBe('user-selected')
    expect(resolution.abstained).toBe(false)
    // A selection is an assertion, not a measurement.
    expect(resolution.confidence).toBeNull()
  })

  it('resolves route state carrying a protocol as a selection', () => {
    const resolution = resolveProtocolFromRouteState({ protocolId: 'squat' })
    expect(resolution.protocolId).toBe('squat')
    expect(resolution.source).toBe('user-selected')
  })

  // The nav bar links to /camera with no state, so this is a live flow.
  it('marks a stateless arrival as a fallback, not a selection', () => {
    for (const state of [null, undefined, {}]) {
      const resolution = resolveProtocolFromRouteState(state)
      expect(resolution.protocolId).toBe(FALLBACK_PROTOCOL_ID)
      expect(resolution.source).toBe('fallback-default')
      expect(resolution.abstained).toBe(false)
    }
  })

  it('never calls anything detected while no classifier exists', () => {
    expect(isDetected(resolveFromSelection('squat'))).toBe(false)
    expect(isDetected(resolveFallback())).toBe(false)
    // Even a classifier result is not "detected" when it abstained.
    expect(isDetected(resolveAbstained())).toBe(false)
  })

  it('abstention carries no protocol', () => {
    const resolution = resolveAbstained()
    expect(resolution.protocolId).toBeNull()
    expect(resolution.abstained).toBe(true)
  })

  it('discloses an assumed movement and stays quiet about a chosen one', () => {
    expect(resolutionDisclosure(resolveFallback(), 'Bodyweight squat')).toContain(
      "didn't pick a movement",
    )
    expect(
      resolutionDisclosure(resolveFromSelection('squat'), 'Bodyweight squat'),
    ).toBeNull()
  })
})
