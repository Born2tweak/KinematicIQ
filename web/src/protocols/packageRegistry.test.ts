import { describe, expect, it } from 'vitest'

import { SQUAT_PROTOCOL } from './squat'
import { INLINE_LUNGE_PROTOCOL } from './inlineLunge'
import { buildProtocolPackage, deriveEngineeringState } from './packageRegistry'
import { deriveReleaseState, releaseDetail, releaseLabel } from './package'

describe('engineering state is derived from the definition, not declared', () => {
  it('is complete only with both a runtime and an input path', () => {
    const definition = SQUAT_PROTOCOL.definition
    expect(deriveEngineeringState(definition, true)).toBe('complete')
  })

  it('is partial when an input path exists but no runtime backs it', () => {
    // The rule that matters is unchanged: an input path without an
    // implementation behind it can never read as complete.
    const definition = INLINE_LUNGE_PROTOCOL.definition
    expect(definition.capture.inputModes.length).toBeGreaterThan(0)
    expect(deriveEngineeringState(definition, false)).toBe('partial')
  })

  it('is partial when a runtime exists but no session can start', () => {
    const definition = {
      ...INLINE_LUNGE_PROTOCOL.definition,
      capture: { ...INLINE_LUNGE_PROTOCOL.definition.capture, inputModes: [] },
    }
    expect(deriveEngineeringState(definition, true)).toBe('partial')
    expect(deriveEngineeringState(definition, false)).toBe('absent')
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
    expect(releaseLabel(pkg)).toBe('Experimental — results have not yet been benchmarked')
    // The blocking resource stays in developer detail, not the card.
    expect(releaseDetail(pkg)).toContain('RES-CORPUS')
    expect(pkg.metrics.length).toBeGreaterThan(0)
  })

  it('promotes forward lunge to experimental — never past it — once it runs', () => {
    // It now has a registered runtime and a declared upload path, so the
    // derived engineering state is complete. Validation is still blocked on
    // RES-CORPUS, so the release state stops at experimental: selectable,
    // labelled, and incapable of carrying an accuracy claim.
    const pkg = buildProtocolPackage(INLINE_LUNGE_PROTOCOL.definition, {
      hasRuntime: true,
      version: '0.1.0',
    })
    expect(pkg.lifecycle.engineering).toBe('complete')
    expect(deriveReleaseState(pkg.lifecycle)).toBe('experimental')
    expect(releaseLabel(pkg)).toBe('Experimental — results have not yet been benchmarked')
    expect(pkg.allowedClaims).toEqual([])
  })

  it('drops forward lunge back to unavailable the moment its runtime is gone', () => {
    const pkg = buildProtocolPackage(INLINE_LUNGE_PROTOCOL.definition, {
      hasRuntime: false,
      version: '0.1.0',
    })
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
