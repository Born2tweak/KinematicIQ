export type LlmFmsRuleType = 'angle' | 'distance' | 'position'

export interface LlmFmsOntologyRule {
  id: string
  type: LlmFmsRuleType
  name: string
  question: string
  options: string[]
  bodyParts: string[]
}

export interface LlmFmsInlineLungeMovement {
  sourceMovementId: 'm05' | 'm06'
  sourceActionName: string
  leadSide: 'left' | 'right'
  view: 'side'
  rules: LlmFmsOntologyRule[]
}

export interface LlmFmsInlineLungeOntologyReport {
  schemaVersion: 1
  dataset: {
    id: 'llm-fms'
    version: string
    rulesSha256: string
  }
  movements: LlmFmsInlineLungeMovement[]
  boundaries: string[]
}

const RULE_TYPES = new Set<LlmFmsRuleType>(['angle', 'distance', 'position'])

function record(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${where} must be an object.`)
  }
  return value as Record<string, unknown>
}

function text(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${where} must be a non-empty string.`)
  }
  return value
}

function strings(value: unknown, where: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${where} must be a non-empty string array.`)
  }
  return value.map((item, index) => text(item, `${where}[${index}]`))
}

function parseMovement(
  root: Record<string, unknown>,
  sourceMovementId: 'm05' | 'm06',
  leadSide: 'left' | 'right',
): LlmFmsInlineLungeMovement {
  const movement = record(root[sourceMovementId], sourceMovementId)
  const actionName = text(movement.actionName, `${sourceMovementId}.actionName`)
  if (!new RegExp(`^Inline Lunge \\(${leadSide}\\)$`, 'i').test(actionName)) {
    throw new Error(
      `${sourceMovementId} must be Inline Lunge (${leadSide}); found ${actionName}.`,
    )
  }
  const view = text(movement.view, `${sourceMovementId}.view`)
  if (view !== 'side') throw new Error(`${sourceMovementId}.view must be side.`)
  const rawRules = record(movement.rules, `${sourceMovementId}.rules`)
  const rules = Object.entries(rawRules).map(([id, raw]): LlmFmsOntologyRule => {
    const rule = record(raw, `${sourceMovementId}.rules.${id}`)
    const type = text(rule.ruleType, `${sourceMovementId}.rules.${id}.ruleType`)
    if (!RULE_TYPES.has(type as LlmFmsRuleType)) {
      throw new Error(`${sourceMovementId}.rules.${id}.ruleType is unsupported.`)
    }
    return {
      id,
      type: type as LlmFmsRuleType,
      name: text(rule.ruleName, `${sourceMovementId}.rules.${id}.ruleName`),
      question: text(
        rule.ruleQuestion,
        `${sourceMovementId}.rules.${id}.ruleQuestion`,
      ),
      options: strings(rule.ruleOptions, `${sourceMovementId}.rules.${id}.ruleOptions`),
      bodyParts: strings(rule.bodyParts, `${sourceMovementId}.rules.${id}.bodyParts`),
    }
  })
  if (rules.length === 0) throw new Error(`${sourceMovementId}.rules is empty.`)
  return {
    sourceMovementId,
    sourceActionName: actionName,
    leadSide,
    view: 'side',
    rules,
  }
}

/**
 * Extract only the m05/m06 terminology needed for annotation research.
 * Per-sample `score` and `ruleResults` are intentionally not accepted here.
 */
export function buildLlmFmsInlineLungeOntology(input: {
  rawRules: unknown
  version: string
  rulesSha256: string
}): LlmFmsInlineLungeOntologyReport {
  const root = record(input.rawRules, 'LLM-FMS rules')
  return {
    schemaVersion: 1,
    dataset: {
      id: 'llm-fms',
      version: text(input.version, 'version'),
      rulesSha256: text(input.rulesSha256, 'rulesSha256'),
    },
    movements: [
      parseMovement(root, 'm05', 'left'),
      parseMovement(root, 'm06', 'right'),
    ],
    boundaries: [
      'Source movement IDs are namespaced to LLM-FMS and must not be mapped to UI-PRMD by number.',
      'Rules and options are source ontology terms, not KinematicIQ coaching truth.',
      'Aggregate FMS scores and per-keyframe score fields are excluded.',
      'Keyframes cannot establish event timing, complete-trial counts, or joint-angle validity.',
      'Protocol implementation and availability remain separately gated.',
    ],
  }
}
