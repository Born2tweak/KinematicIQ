import { isAvailable, type ProtocolDefinition } from '../core/protocol'
import { buildProtocolPackage } from '../protocols/packageRegistry'
import { deriveReleaseState, releaseLabel } from '../protocols/package'

export interface ProtocolPickerEntry {
  definition: ProtocolDefinition
  /** Honest status copy derived from the protocol package, never declared. */
  statusLabel: string
}

export interface ProtocolPickerGroups {
  /** Selectable and evidence-backed. Empty until a corpus exists. */
  released: ProtocolPickerEntry[]
  /** Selectable, runs end to end, accuracy unmeasured. */
  experimental: ProtocolPickerEntry[]
  /** Cannot start an analysis. */
  research: ProtocolPickerEntry[]
}

/**
 * Group protocols by their derived release state rather than by the binary
 * `status` flag.
 *
 * The flag could only say available or planned, so squat rendered as a bare
 * "Available" even though its accuracy has never been measured against
 * reference data. Deriving from the package keeps the card honest: a protocol
 * that runs but is corpus-blocked reads as experimental, and only validation
 * evidence can produce a released card.
 */
export function groupProtocolDefinitions(
  definitions: readonly ProtocolDefinition[],
): ProtocolPickerGroups {
  return definitions.reduce<ProtocolPickerGroups>(
    (groups, definition) => {
      // `isAvailable` still decides whether a runtime exists at all; the
      // package decides what the user is told about it.
      const pkg = buildProtocolPackage(definition, {
        hasRuntime: isAvailable(definition),
        version: '1.0.0',
      })
      const entry: ProtocolPickerEntry = {
        definition,
        statusLabel: releaseLabel(pkg),
      }
      const state = deriveReleaseState(pkg.lifecycle)
      if (state === 'released') groups.released.push(entry)
      else if (state === 'experimental') groups.experimental.push(entry)
      else groups.research.push(entry)
      return groups
    },
    { released: [], experimental: [], research: [] },
  )
}
