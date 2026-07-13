import type { Protocol } from './types'
import type { ProtocolRuntime } from './runtime'
import { getProtocolRuntime } from './runtime'
import { listProtocols } from './registry'

export interface ProtocolCompletenessIssue {
  protocolId: Protocol['definition']['id']
  field: string
  message: string
}

export function lintProtocolCompleteness(
  protocol: Protocol,
  runtime?: ProtocolRuntime,
): ProtocolCompletenessIssue[] {
  const { definition, profile } = protocol
  const issues: ProtocolCompletenessIssue[] = []
  const add = (field: string, message: string) =>
    issues.push({ protocolId: definition.id, field, message })

  if (definition.status === 'planned') {
    if (profile !== null) add('profile', 'planned protocol must not have a runtime profile')
    if (definition.capture.inputModes.length > 0) add('capture.inputModes', 'planned protocol must not expose capture modes')
    return issues
  }

  if (profile === null) add('profile', 'available protocol requires an analysis profile')
  if (!runtime) add('runtime', 'available protocol requires a registered runtime')
  if (runtime && runtime.protocolId !== definition.id) add('runtime.protocolId', 'runtime id must match definition id')
  if (!runtime?.outcomeKinds.length) add('runtime.outcomeKinds', 'available protocol requires at least one outcome kind')
  if (definition.requiredLandmarks.length === 0) add('requiredLandmarks', 'available protocol requires landmark declarations')
  if (definition.capture.inputModes.length === 0) add('capture.inputModes', 'available protocol requires a capture mode')
  if (!definition.capture.viewInstruction.trim()) add('capture.viewInstruction', 'available protocol requires view guidance')
  if (definition.capture.setupInstructions.length === 0) add('capture.setupInstructions', 'available protocol requires setup guidance')
  const recoveryStates = ['low-confidence', 'short-gap', 'recovered', 'missing', 'out-of-frame', 'ambiguous-side', 'rejected'] as const
  for (const state of recoveryStates) {
    if (!definition.capture.recoveryInstructions?.[state]?.trim()) {
      add(`capture.recoveryInstructions.${state}`, 'available protocol requires recovery guidance')
    }
  }
  if (definition.metrics.length === 0) add('metrics', 'available protocol requires metric declarations')
  if (definition.findingRuleIds.length === 0) add('findingRuleIds', 'available protocol requires finding-rule declarations')

  for (const metric of definition.metrics) {
    if (!metric.included) add(`metrics.${metric.id}`, 'active declaration cannot reference an excluded metric')
    if (metric.confidenceBasis.length === 0) add(`metrics.${metric.id}.confidenceBasis`, 'metric requires confidence contributors')
    if (!metric.description.trim()) add(`metrics.${metric.id}.description`, 'metric requires observation-language purpose')
    if (!metric.validationTier) add(`metrics.${metric.id}.validationTier`, 'metric requires a validation tier')
  }

  const evidence = definition.evidence
  if (evidence.evidenceRefs.length === 0) add('evidence.evidenceRefs', 'available protocol requires research/evidence references')
  if (!evidence.validationGates.some((gate) => gate.state === 'passed')) add('evidence.validationGates', 'available protocol requires a passed validation gate')
  if (evidence.acceptanceThresholds.provenance === 'not-defined') add('evidence.acceptanceThresholds', 'available protocol requires threshold provenance')
  if (evidence.acceptanceThresholds.evidenceRefs.length === 0) add('evidence.acceptanceThresholds.evidenceRefs', 'threshold provenance requires evidence references')

  return issues
}

export function assertRegisteredProtocolsComplete(): void {
  const issues = listProtocols().flatMap((protocol) =>
    lintProtocolCompleteness(
      protocol,
      protocol.definition.status === 'available'
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
