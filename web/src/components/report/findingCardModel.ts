/**
 * Pure view model for FindingCard (M8) — kept separate so it is unit-testable
 * in the existing logic-test style (no DOM).
 */
import type { ConfidenceLevel } from '../../core/confidence'
import type { Finding } from '../../core/finding'
import { REVIEW_STATUS_LABEL } from '../../core/finding'
import { constraintCueForFinding } from '../../coaching/constraintsLibrary'

export interface FindingCardModel {
  statement: string
  confidenceLevel: ConfidenceLevel
  /** Observation-language evidence lines from the metric chain. */
  evidence: string[]
  tryNext: string | null
  /**
   * Rule provenance line (M50), e.g. "internally tested rule · rule.squat.depth".
   * Null when the finding has no provenance or the caller keeps Summary clean.
   */
  provenance: string | null
  /**
   * One constraints-led "try next set" cue (M52), or null. Evidence tier only —
   * the caller opts in; Summary never shows it.
   */
  constraint: string | null
}

export function buildFindingCardModel(
  finding: Finding,
  options: { showProvenance?: boolean; showConstraint?: boolean } = {},
): FindingCardModel {
  const provenance =
    options.showProvenance && finding.provenance
      ? `${REVIEW_STATUS_LABEL[finding.provenance.reviewStatus]} · ${finding.provenance.ruleId}`
      : null
  const constraintCue = options.showConstraint
    ? constraintCueForFinding(finding.id)
    : null
  return {
    statement: finding.statement,
    confidenceLevel: finding.confidence.level,
    evidence: finding.evidence.map((e) => e.observed),
    tryNext: finding.tryNext ?? null,
    provenance,
    constraint: constraintCue?.cue ?? null,
  }
}
