import { describe, expect, it } from 'vitest'
import { listProtocols } from '../protocols/registry'
import { groupProtocolDefinitions } from './protocolPickerModel'

describe('protocol picker information architecture', () => {
  it('separates runnable and research-only definitions', () => {
    const groups = groupProtocolDefinitions(listProtocols().map((protocol) => protocol.definition))
    expect(groups.available.map((item) => item.id)).toEqual(['squat'])
    expect(groups.research).toHaveLength(4)
    expect(groups.research.every((item) => item.status === 'planned')).toBe(true)
  })
})
