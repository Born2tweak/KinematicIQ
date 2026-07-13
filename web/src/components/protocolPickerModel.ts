import { isAvailable, type ProtocolDefinition } from '../core/protocol'

export interface ProtocolPickerGroups {
  available: ProtocolDefinition[]
  research: ProtocolDefinition[]
}

export function groupProtocolDefinitions(definitions: readonly ProtocolDefinition[]): ProtocolPickerGroups {
  return definitions.reduce<ProtocolPickerGroups>((groups, definition) => {
    groups[isAvailable(definition) ? 'available' : 'research'].push(definition)
    return groups
  }, { available: [], research: [] })
}
