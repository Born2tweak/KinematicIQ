/**
 * Pure view model for FindingCard (M8) — kept separate so it is unit-testable
 * in the existing logic-test style (no DOM).
 */
import type { ConfidenceLevel } from '../../core/confidence'
import type { Finding } from '../../core/finding'

export interface FindingCardModel {
  statement: string
  confidenceLevel: ConfidenceLevel
  /** Observation-language evidence lines from the metric chain. */
  evidence: string[]
  tryNext: string | null
}

export function buildFindingCardModel(finding: Finding): FindingCardModel {
  return {
    statement: finding.statement,
    confidenceLevel: finding.confidence.level,
    evidence: finding.evidence.map((e) => e.observed),
    tryNext: finding.tryNext ?? null,
  }
}
