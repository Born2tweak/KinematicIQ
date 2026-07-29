import { describe, expect, it } from 'vitest'
import { listProtocols } from '../protocols/registry'
import { groupProtocolDefinitions } from './protocolPickerModel'

const groups = () =>
  groupProtocolDefinitions(listProtocols().map((protocol) => protocol.definition))

describe('protocol picker information architecture', () => {
  it('separates runnable and research-only definitions', () => {
    const result = groups()
    expect(result.experimental.map(({ definition }) => definition.id)).toEqual(['squat'])
    expect(result.research).toHaveLength(5)
    expect(
      result.research.every(({ definition }) => definition.status === 'planned'),
    ).toBe(true)
    const inlineLunge = result.research.find(
      ({ definition }) => definition.id === 'forwardLungeStrideReturn',
    )
    expect(inlineLunge?.definition.capture.inputModes).toEqual([])
    expect(inlineLunge?.definition.capture.viewInstruction).toMatch(/Research protocol/)
  })

  it('reports nothing as released while RES-CORPUS is unresolved', () => {
    // No frozen corpus exists, so no protocol has measured accuracy. A
    // released card would be an unsupported claim.
    expect(groups().released).toHaveLength(0)
  })

  it('labels the runnable squat experimental rather than plainly available', () => {
    const [squat] = groups().experimental
    expect(squat.statusLabel).toBe(
      'Experimental — runs, but accuracy is unvalidated (awaiting RES-CORPUS)',
    )
  })

  it('never shows accuracy language on a research card', () => {
    for (const { statusLabel } of groups().research) {
      expect(statusLabel).not.toMatch(/accurate|validated accuracy|clinical|proven/i)
    }
  })
})
