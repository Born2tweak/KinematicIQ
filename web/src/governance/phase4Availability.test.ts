import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NotImplementedError } from '../core/protocol'
import { getProtocol, getProtocolProfile } from '../protocols/registry'
import { getProtocolRuntime } from '../protocols/runtime'

describe('Phase 4 availability decision', () => {
  const decision = readFileSync('../docs/adr/ADR-016-forward-lunge-remains-unavailable.md', 'utf8')
  it('records every hard downstream gate as blocked and the default unavailable decision', () => {
    for (const gate of ['G-PILOT', 'G-RATER', 'G-EXPERIMENT', 'G-FREEZE', 'G-LOCK', 'G-ANGLE', 'G-REL', 'G-CLAIMS', 'G-AVAIL']) expect(decision).toContain(gate)
    expect(decision).toContain('remain unavailable')
    expect(decision).toContain('No gate is waived')
  })
  it('changes no protocol availability surface', () => {
    const protocol = getProtocol('forwardLungeStrideReturn')
    expect(protocol.definition.status).toBe('planned')
    expect(protocol.definition.capture.inputModes).toEqual([])
    expect(protocol.profile).toBeNull()
    expect(() => getProtocolProfile('forwardLungeStrideReturn')).toThrow(NotImplementedError)
    expect(() => getProtocolRuntime('forwardLungeStrideReturn')).toThrow(NotImplementedError)
  })
})
