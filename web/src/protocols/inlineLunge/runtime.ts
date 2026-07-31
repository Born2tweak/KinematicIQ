/**
 * Forward-lunge `ProtocolRuntime` (KQ-027).
 *
 * Registering this is what makes the movement runnable: `getProtocolRuntime`
 * resolves it, `deriveEngineeringState` sees a runtime plus a declared input
 * path and promotes the package to `complete`, and the package's derived
 * release state becomes `experimental` — selectable, honestly labelled, and
 * still incapable of claiming accuracy while validation is blocked on
 * RES-CORPUS.
 *
 * This runtime provides `analyzeSession` rather than the cyclic five-stage set.
 * Forward lunge is segmented as discrete transitions by its own state machine,
 * so it has no `segmentFrames` that returns squat reps and no `collectMetrics`
 * over a rep array. Declaring those methods and delegating them to the squat
 * pipeline would produce numbers from the wrong engine; leaving them absent is
 * the accurate statement of what this protocol implements.
 */
import type { ProtocolRuntime, ProtocolSessionInput, ReportMetadata } from '../runtime'
import type { SessionResult } from '../../session/types'
import { FORWARD_LUNGE_PROFILE } from './profile'
import { buildForwardLungeSessionResult, buildForwardLungeSummary } from './session'
import type { InlineLungeSide } from './types'

const LEAD_SIDES: readonly InlineLungeSide[] = ['left', 'right']

const asLeadSide = (value: unknown): InlineLungeSide | undefined =>
  LEAD_SIDES.includes(value as InlineLungeSide) ? (value as InlineLungeSide) : undefined

export const FORWARD_LUNGE_RUNTIME: ProtocolRuntime = {
  protocolId: 'forwardLungeStrideReturn',
  outcomeKinds: ['transition'],
  analyzeSession: (input: ProtocolSessionInput): SessionResult =>
    buildForwardLungeSessionResult({
      packets: input.packets,
      capture: input.capture,
      leadSide: asLeadSide(input.parameters?.leadSide),
      observationProtocolId: input.observationProtocolId,
    }),
  buildReportMetadata: (result): ReportMetadata => ({
    protocolId: 'forwardLungeStrideReturn',
    protocolLabel: FORWARD_LUNGE_PROFILE.label,
    headline: buildForwardLungeSummary(result),
  }),
}
