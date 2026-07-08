/**
 * Quality review model (M51) — the explicit accept/retake step between
 * analysis and the movement report.
 *
 * Pure mapping from the set quality gate's `SetQualityAssessment` to a
 * review decision the UI can act on: show the report, recommend a retake,
 * or block the report entirely (verdict-or-abstain, claims-policy). The
 * model never weakens the invalid full abstain and never discards data —
 * inspection of the recording's diagnostics stays available in every state
 * so analysts can audit what happened ("inspect anyway").
 *
 * Design sources: docs/research/11_Product_Experience_Bible.md (quality
 * review and recovery paths), docs/research/05 (verdict-or-abstain).
 */
import type { SetQualityAssessment } from './setQualityGate'

export type QualityReviewDecision =
  | 'show-results' // valid capture — full movement report
  | 'recommend-retake' // questionable — observations only, suggest re-record
  | 'block-report' // invalid — full abstain; audit view only

export interface QualityReview {
  decision: QualityReviewDecision
  /** One-line, observation-language state of the recording. */
  headline: string
  /** Concrete capture changes that would unlock a trustworthy report. */
  retakeGuidance: string[]
  /** True when re-recording is the recommended next step. */
  retakeRecommended: boolean
  /**
   * Observation/audit view (rep chart, diagnostics, pose tape) stays
   * reachable. Always true by design — abstaining from claims never means
   * hiding the evidence.
   */
  allowInspection: boolean
}

/** Map a finished set's quality assessment to the review-step decision. */
export function reviewSetQuality(quality: SetQualityAssessment): QualityReview {
  if (quality.verdict === 'valid') {
    return {
      decision: 'show-results',
      headline: 'This recording supports a movement report.',
      retakeGuidance: [],
      retakeRecommended: false,
      allowInspection: true,
    }
  }

  if (quality.verdict === 'questionable') {
    return {
      decision: 'recommend-retake',
      headline:
        'Parts of this recording could not be trusted — a retake would give a clearer report. Observations from the trusted reps are still shown.',
      retakeGuidance: [...quality.captureFixes],
      retakeRecommended: true,
      allowInspection: true,
    }
  }

  return {
    decision: 'block-report',
    headline:
      'This recording could not support a trustworthy movement report, so the report is withheld. The diagnostics stay available for inspection.',
    retakeGuidance: [...quality.captureFixes],
    retakeRecommended: true,
    allowInspection: true,
  }
}
