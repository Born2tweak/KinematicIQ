import type { ProtocolDefinition } from '../core/protocol'
import { buildProtocolPackage } from '../protocols/packageRegistry'
import { hasProtocolRuntime } from '../protocols/runtime'
import { deriveReleaseState, releaseLabel } from '../protocols/package'

export interface ProtocolPickerEntry {
  definition: ProtocolDefinition
  /** Honest status copy derived from the protocol package, never declared. */
  statusLabel: string
  /**
   * Where selecting this movement goes. Derived from its declared input modes,
   * so a protocol without a live path never routes to the camera surface.
   */
  route: '/camera' | '/upload'
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
      // Whether an implementation exists is answered by the runtime registry,
      // not by the legacy `status` flag — that flag conflates "implemented"
      // with "validated", which is the conflation the package schema splits.
      // The package then decides what the user is told about it.
      const pkg = buildProtocolPackage(definition, {
        hasRuntime: hasProtocolRuntime(definition.id),
        version: '1.0.0',
      })
      const entry: ProtocolPickerEntry = {
        definition,
        statusLabel: releaseLabel(pkg),
        route: definition.capture.inputModes.includes('live') ? '/camera' : '/upload',
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
