import type { Protocol } from './types'
import type { ProtocolRuntime } from './runtime'
import { getProtocolRuntime, hasProtocolRuntime, isRunnableRuntime } from './runtime'
import { listProtocols } from './registry'

export interface ProtocolCompletenessIssue {
  protocolId: Protocol['definition']['id']
  field: string
  message: string
}

/**
 * Lint a protocol against what it claims to be able to do.
 *
 * The trigger is no longer the binary `status` flag. A protocol is held to the
 * full contract when it has a registered runtime, exposes an input mode, or is
 * flagged available — because each of those is a way for a user to reach it.
 * This is where the "you may not expose an input path with nothing behind it"
 * invariant is actually enforced: unlike core/protocol.ts, this module can see
 * the runtime registry.
 */
export function lintProtocolCompleteness(
  protocol: Protocol,
  runtime?: ProtocolRuntime,
): ProtocolCompletenessIssue[] {
  const { definition, profile } = protocol
  const issues: ProtocolCompletenessIssue[] = []
  const add = (field: string, message: string) =>
    issues.push({ protocolId: definition.id, field, message })

  const hasInputPath = definition.capture.inputModes.length > 0
  const reachable = definition.status === 'available' || hasInputPath || runtime !== undefined

  if (!reachable) {
    // Metadata-only stub: defined, listed, and incapable of starting anything.
    if (profile !== null) add('profile', 'unreachable protocol must not have a runtime profile')
    return issues
  }

  if (!runtime) add('runtime', 'reachable protocol requires a registered runtime')
  if (runtime && runtime.protocolId !== definition.id) add('runtime.protocolId', 'runtime id must match definition id')
  if (runtime && !isRunnableRuntime(runtime)) add('runtime.analyzeSession', 'runtime must provide either cyclic segmentation or a whole-session analysis')
  if (!runtime?.outcomeKinds.length) add('runtime.outcomeKinds', 'reachable protocol requires at least one outcome kind')
  if (profile === null) add('profile', 'reachable protocol requires an analysis profile')
  if (profile !== null && (profile.kind === 'transition') !== (definition.kind === 'transition')) {
    add('profile.kind', 'profile segmentation kind must match the definition kind')
  }
  if (definition.requiredLandmarks.length === 0) add('requiredLandmarks', 'reachable protocol requires landmark declarations')
  if (!hasInputPath) add('capture.inputModes', 'reachable protocol requires a capture mode')
  if (!definition.capture.viewInstruction.trim()) add('capture.viewInstruction', 'reachable protocol requires view guidance')
  if (definition.capture.setupInstructions.length === 0) add('capture.setupInstructions', 'reachable protocol requires setup guidance')
  const recoveryStates = ['low-confidence', 'short-gap', 'recovered', 'missing', 'out-of-frame', 'ambiguous-side', 'rejected'] as const
  for (const state of recoveryStates) {
    if (!definition.capture.recoveryInstructions?.[state]?.trim()) {
      add(`capture.recoveryInstructions.${state}`, 'reachable protocol requires recovery guidance')
    }
  }
  for (const parameter of definition.capture.parameters ?? []) {
    if (!parameter.options.some((option) => option.value === parameter.defaultValue)) {
      add(`capture.parameters.${parameter.id}`, 'declared capture parameter default must be one of its options')
    }
  }
  if (definition.metrics.length === 0) add('metrics', 'reachable protocol requires metric declarations')
  if (definition.findingRuleIds.length === 0) add('findingRuleIds', 'reachable protocol requires finding-rule declarations')

  for (const metric of definition.metrics) {
    if (!metric.included) add(`metrics.${metric.id}`, 'active declaration cannot reference an excluded metric')
    if (metric.confidenceBasis.length === 0) add(`metrics.${metric.id}.confidenceBasis`, 'metric requires confidence contributors')
    if (!metric.description.trim()) add(`metrics.${metric.id}.description`, 'metric requires observation-language purpose')
    if (!metric.validationTier) add(`metrics.${metric.id}.validationTier`, 'metric requires a validation tier')
  }

  const evidence = definition.evidence
  if (evidence.evidenceRefs.length === 0) add('evidence.evidenceRefs', 'reachable protocol requires research/evidence references')
  if (!evidence.validationGates.some((gate) => gate.state === 'passed')) add('evidence.validationGates', 'reachable protocol requires a passed validation gate')
  if (evidence.acceptanceThresholds.provenance === 'not-defined') add('evidence.acceptanceThresholds', 'reachable protocol requires threshold provenance')
  if (evidence.acceptanceThresholds.evidenceRefs.length === 0) add('evidence.acceptanceThresholds.evidenceRefs', 'threshold provenance requires evidence references')

  return issues
}

export function assertRegisteredProtocolsComplete(): void {
  const issues = listProtocols().flatMap((protocol) =>
    lintProtocolCompleteness(
      protocol,
      hasProtocolRuntime(protocol.definition.id)
        ? getProtocolRuntime(protocol.definition.id)
        : undefined,
    ),
  )
  if (issues.length > 0) {
    throw new Error(
      `Protocol completeness lint failed:\n${issues.map((issue) => `${issue.protocolId}.${issue.field}: ${issue.message}`).join('\n')}`,
    )
  }
}
