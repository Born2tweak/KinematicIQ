/**
 * Core finding vocabulary (M3).
 *
 * A `Finding` is the unit of meaning: an observation-language statement about
 * the movement, backed by the specific `MetricResult`s that triggered it, at a
 * stated confidence. Findings are what the coaching engine (M7) produces and
 * the report (M8) renders. Cues are derived FROM findings, never the reverse.
 *
 * Design sources: docs/research/04_Coaching_Intelligence_Engine_Spec.md §4–7,§9
 * (evidence-strength framework, metrics→meaning), docs/doctrine/claims-policy.md
 * (allowed/forbidden conclusions), docs/24 §3.10–3.16.
 *
 * `priority` is an ordering hint for display — it is NOT a risk score. There is
 * no injury/risk field anywhere in this type by design.
 *
 * Types-only.
 */
import type { Confidence } from './confidence'

/** Display ordering hint. NOT risk, NOT severity-of-harm — presentation only. */
export type FindingPriority = 'primary' | 'secondary' | 'informational'

/**
 * A reference to the metric evidence behind a finding. Points at a
 * `MetricResult.metricId`; the report resolves it to the full result.
 */
export interface FindingEvidenceRef {
  metricId: string
  /** Short observation-language restatement of what this metric showed. */
  observed: string
}

export interface Finding {
  /** Stable id, e.g. 'squat.posture.trunk-drift'. */
  id: string
  /** The coach question this finding answers (docs/24 §4), when applicable. */
  question?: string
  /**
   * The finding itself, in observation language ("appears/suggests", scoped,
   * self-referenced). Must pass the claims-policy copy checklist.
   */
  statement: string
  /** The metric results that triggered this finding — the evidence chain. */
  evidence: FindingEvidenceRef[]
  confidence: Confidence
  priority: FindingPriority
  /** Optional single actionable cue for next time, keyed to this finding. */
  tryNext?: string
}

/** Order findings for display: primary first, then by confidence descending. */
const PRIORITY_RANK: Record<FindingPriority, number> = {
  primary: 0,
  secondary: 1,
  informational: 2,
}

export function sortFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    if (byPriority !== 0) return byPriority
    return b.confidence.value - a.confidence.value
  })
}
