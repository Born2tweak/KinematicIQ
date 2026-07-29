import { describe, expect, it } from 'vitest'

import { SQUAT_PROTOCOL } from './squat'
import { INLINE_LUNGE_PROTOCOL } from './inlineLunge'
import { buildProtocolPackage, deriveEngineeringState } from './packageRegistry'
import { deriveReleaseState, releaseLabel } from './package'

describe('engineering state is derived from the definition, not declared', () => {
  it('is complete only with both a runtime and an input path', () => {
    const definition = SQUAT_PROTOCOL.definition
    expect(deriveEngineeringState(definition, true)).toBe('complete')
  })

  it('is partial when the analysis exists but no session can start', () => {
    // Forward lunge has a working research seam but profile: null and no
    // inputModes, so it cannot run a session. Claiming 'complete' would be
    // false however finished the segmenter and metrics are.
    const definition = INLINE_LUNGE_PROTOCOL.definition
    expect(definition.capture.inputModes).toHaveLength(0)
    expect(INLINE_LUNGE_PROTOCOL.profile).toBeNull()
    expect(deriveEngineeringState(definition, false)).toBe('absent')
    expect(deriveEngineeringState(definition, true)).toBe('partial')
  })
})

describe('shipped protocol packages', () => {
  it('reports squat as experimental, not validated', () => {
    // Squat runs end to end, but no corpus exists, so its accuracy has never
    // been measured. Experimental is the honest reading of that.
    const pkg = buildProtocolPackage(SQUAT_PROTOCOL.definition, {
      hasRuntime: true,
      version: '1.0.0',
    })
    expect(deriveReleaseState(pkg.lifecycle)).toBe('experimental')
    expect(releaseLabel(pkg)).toContain('awaiting RES-CORPUS')
    expect(pkg.metrics.length).toBeGreaterThan(0)
  })

  it('keeps forward lunge unavailable until it has an input path', () => {
    const pkg = buildProtocolPackage(INLINE_LUNGE_PROTOCOL.definition, {
      hasRuntime: true,
      version: '0.1.0',
    })
    expect(pkg.lifecycle.engineering).toBe('partial')
    expect(deriveReleaseState(pkg.lifecycle)).toBe('unavailable')
  })

  it('blocks every shipped protocol on RES-CORPUS', () => {
    for (const protocol of [SQUAT_PROTOCOL, INLINE_LUNGE_PROTOCOL]) {
      const pkg = buildProtocolPackage(protocol.definition, {
        hasRuntime: true,
        version: '1.0.0',
      })
      expect(pkg.lifecycle.validation).toBe('blocked')
      expect(pkg.lifecycle.blockedBy).toEqual(['RES-CORPUS'])
      expect(deriveReleaseState(pkg.lifecycle)).not.toBe('released')
    }
  })

  it('carries the definition phases and landmarks into the package', () => {
    const pkg = buildProtocolPackage(INLINE_LUNGE_PROTOCOL.definition, {
      hasRuntime: true,
      version: '0.1.0',
    })
    expect(pkg.phases).toEqual([
      'standing',
      'stepping',
      'descending',
      'bottom',
      'ascending',
      'returning',
    ])
    expect(pkg.requiredLandmarks.length).toBeGreaterThan(0)
  })
})
