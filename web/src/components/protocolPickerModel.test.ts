import { describe, expect, it } from 'vitest'
import { listProtocols } from '../protocols/registry'
import { groupProtocolDefinitions } from './protocolPickerModel'

const groups = () =>
  groupProtocolDefinitions(listProtocols().map((protocol) => protocol.definition))

describe('protocol picker information architecture', () => {
  it('separates runnable and research-only definitions', () => {
    const result = groups()
    expect(result.experimental.map(({ definition }) => definition.id)).toEqual([
      'squat',
      'forwardLungeStrideReturn',
    ])
    expect(result.research).toHaveLength(4)
    expect(
      result.research.every(({ definition }) => definition.capture.inputModes.length === 0),
    ).toBe(true)
  })

  it('routes each movement to a surface its declared input modes support', () => {
    const byId = new Map(
      [...groups().experimental, ...groups().released].map((entry) => [
        entry.definition.id,
        entry,
      ]),
    )
    // Squat declares a live path, so the camera surface is reachable.
    expect(byId.get('squat')?.route).toBe('/camera')
    // Forward lunge has no live cyclic runtime; sending it to the camera would
    // crash on a runtime that does not exist.
    expect(byId.get('forwardLungeStrideReturn')?.route).toBe('/upload')
  })

  it('reports nothing as released while RES-CORPUS is unresolved', () => {
    // No frozen corpus exists, so no protocol has measured accuracy. A
    // released card would be an unsupported claim.
    expect(groups().released).toHaveLength(0)
  })

  it('labels every runnable movement experimental rather than plainly available', () => {
    for (const entry of groups().experimental) {
      expect(entry.statusLabel).toBe(
        'Experimental — results have not yet been benchmarked',
      )
      // Internal program vocabulary must never reach the athlete interface.
      expect(entry.statusLabel).not.toMatch(/RES-|KQ-\d/)
    }
  })

  it('never shows accuracy language on a research card', () => {
    for (const { statusLabel } of groups().research) {
      expect(statusLabel).not.toMatch(/accurate|validated accuracy|clinical|proven/i)
    }
  })
})
