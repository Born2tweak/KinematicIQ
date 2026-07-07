/**
 * Claims-policy forbidden terms (M38).
 *
 * The phrase list and exception rules for the automated copy audit
 * (claimsCopyAudit.test.ts). Source of truth for WHAT is forbidden:
 * docs/doctrine/claims-policy.md ("Forbidden conclusions"). This module only
 * encodes the scannable subset — it is a guardrail against unsafe language
 * entering user-facing copy, NOT a full legal or clinical review.
 */

export interface ForbiddenPhrase {
  /** Lower-case substring to flag. */
  phrase: string
  /** Which claims-policy prohibition it protects. */
  policy: string
}

/**
 * Phrases that must never appear in user-facing copy as affirmative claims.
 * Substring-matched case-insensitively; stems (e.g. 'diagnos') deliberately
 * catch inflections (diagnose/diagnosis/diagnostic claims in copy).
 */
export const FORBIDDEN_PHRASES: ForbiddenPhrase[] = [
  { phrase: 'injury risk', policy: 'no injury risk/prediction' },
  { phrase: 'risk of injury', policy: 'no injury risk/prediction' },
  // 'diagnosis/diagnose' but NOT 'diagnostics' — the tape diagnostics
  // ledger is engineering vocabulary, not a clinical claim.
  { phrase: 'diagnosis', policy: 'no diagnosis/pathology' },
  { phrase: 'diagnose', policy: 'no diagnosis/pathology' },
  { phrase: 'diagnosed', policy: 'no diagnosis/pathology' },
  { phrase: 'patholog', policy: 'no diagnosis/pathology' },
  { phrase: 'abnormal', policy: 'no normative "abnormal" labels' },
  { phrase: 'dysfunction', policy: 'no dysfunction labels' },
  { phrase: 'damaged', policy: 'no tissue/joint-health states' },
  { phrase: 'torque', policy: 'no kinetics from video' },
  { phrase: 'joint load', policy: 'no kinetics from video' },
  { phrase: 'force measured', policy: 'no kinetics from video' },
  { phrase: 'muscle activation', policy: 'no muscle activation claims' },
  { phrase: 'weak glutes', policy: 'no anatomical cause attribution' },
  { phrase: 'readiness to play', policy: 'no readiness/return-to-play' },
  { phrase: 'return to play', policy: 'no readiness/return-to-play' },
  { phrase: 'return-to-play', policy: 'no readiness/return-to-play' },
]

/**
 * A line containing a forbidden phrase is ALLOWED when it also matches one
 * of these: copy is permitted to name a forbidden concept strictly to say it
 * is NOT measured, NOT claimed, or policy-forbidden (e.g. the metric-registry
 * exclusion reasons, "not medical advice", "never diagnosis" framings).
 */
export const NEGATION_CONTEXT_PATTERNS: RegExp[] = [
  /\bnot\b/i, // "not defensible", "not measured", "not diagnosis", "not medical"
  /\bnever\b/i,
  /\bno\s/i, // "no injury risk", "no diagnosis"
  /forbid/i, // "claims-policy forbids it"
  /\bwithout\b/i,
  /\bavoid/i,
]

/**
 * File-specific documented exceptions: places allowed to mention a forbidden
 * concept outside a same-line negation. Keep this list SHORT and justified —
 * every entry is a hole in the guardrail. Paths are matched as substrings of
 * the forward-slash relative path under web/src.
 */
export const DOCUMENTED_EXCEPTIONS: Array<{
  pathIncludes: string
  phrase: string
  reason: string
}> = [
  {
    pathIncludes: 'metrics/squatMetrics.ts',
    phrase: 'joint load',
    reason:
      'SQUAT_EXCLUDED_METRICS catalog entry (included: false): the label/' +
      'description name the excluded concept and the exclusionReason states ' +
      'it is not defensible — kept for the record per R03 §12, never rendered ' +
      'as an affirmative claim.',
  },
]
