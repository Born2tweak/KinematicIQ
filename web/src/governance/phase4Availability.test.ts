import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getProtocol, getProtocolProfile } from '../protocols/registry'
import { getProtocolRuntime } from '../protocols/runtime'
import { buildProtocolPackage } from '../protocols/packageRegistry'
import { deriveReleaseState } from '../protocols/package'

const decision = readFileSync('../docs/adr/ADR-016-forward-lunge-remains-unavailable.md', 'utf8')
const supersession = readFileSync(
  '../docs/adr/ADR-017-forward-lunge-experimental-availability.md',
  'utf8',
)

describe('Phase 4 availability decision', () => {
  it('records every hard downstream gate as blocked and the default unavailable decision', () => {
    for (const gate of ['G-PILOT', 'G-RATER', 'G-EXPERIMENT', 'G-FREEZE', 'G-LOCK', 'G-ANGLE', 'G-REL', 'G-CLAIMS', 'G-AVAIL']) expect(decision).toContain(gate)
    expect(decision).toContain('remain unavailable')
    expect(decision).toContain('No gate is waived')
  })

  it('is superseded only on the availability clause, with every gate still blocked', () => {
    expect(supersession).toContain('ADR-016')
    expect(supersession).toContain('availability clause')
    // The supersession must restate, not quietly drop, each blocked gate.
    for (const gate of ['G-PILOT', 'G-RATER', 'G-EXPERIMENT', 'G-FREEZE', 'G-LOCK', 'G-ANGLE', 'G-REL', 'G-CLAIMS', 'G-AVAIL']) expect(supersession).toContain(gate)
    expect(supersession).toContain('closes none of')
  })
})

describe('forward lunge availability surface matches ADR-017', () => {
  const { definition, profile } = getProtocol('forwardLungeStrideReturn')

  it('is runnable and experimental, never available or released', () => {
    // `status` tracks scientific validation and stays planned.
    expect(definition.status).toBe('planned')
    expect(definition.capture.inputModes).toEqual(['upload', 'replay'])
    expect(profile?.kind).toBe('transition')
    expect(getProtocolRuntime('forwardLungeStrideReturn').analyzeSession).toBeTypeOf('function')

    const pkg = buildProtocolPackage(definition, { hasRuntime: true, version: '0.1.0' })
    expect(pkg.lifecycle.engineering).toBe('complete')
    expect(pkg.lifecycle.validation).toBe('blocked')
    expect(pkg.lifecycle.blockedBy).toEqual(['RES-CORPUS'])
    expect(deriveReleaseState(pkg.lifecycle)).toBe('experimental')
    expect(pkg.allowedClaims).toEqual([])
  })

  it('exposes no live-camera path and no cyclic profile', () => {
    expect(definition.capture.inputModes).not.toContain('live')
    expect(() => getProtocolProfile('forwardLungeStrideReturn')).toThrow(
      /no cyclic movement profile/,
    )
  })

  it('rolls back to unavailable the moment the runtime is unregistered', () => {
    // ADR-017's stated rollback: no migration, no flag to flip.
    const pkg = buildProtocolPackage(definition, { hasRuntime: false, version: '0.1.0' })
    expect(deriveReleaseState(pkg.lifecycle)).toBe('unavailable')
  })

  it('emits experimental-tier metrics only', () => {
    expect(definition.metrics.length).toBeGreaterThan(0)
    for (const metric of definition.metrics) {
      expect(metric.validationTier).toBe('experimental')
    }
  })
})
