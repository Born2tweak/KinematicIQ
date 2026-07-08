/**
 * Domain context model v1 (M55).
 *
 * Optional, local, NON-MEDICAL context the user can attach to a set so future
 * interpretation can be scoped by what they were actually doing (goal, load,
 * environment). It is captured as free text, stored locally with the session,
 * and in v1 is used ONLY for display/provenance — it never changes a finding,
 * a metric, a confidence, or a verdict.
 *
 * Safety by construction (docs/doctrine/claims-policy.md forbids medical use):
 * - The shape has no pain score, injury history, medication, readiness, or any
 *   structured clinical field. `discomfortNote` is a FREE-TEXT NOTE the user
 *   keeps for themselves — the app stores it verbatim and interprets nothing.
 * - `parseAssessmentContext` copies only the known text fields, so any extra
 *   keys (including forbidden medical ones) are dropped at the boundary.
 *
 * Design sources: docs/research/01_Foundations (context precedes
 * interpretation), docs/research/07_Domain_Intelligence (domain profiles),
 * docs/doctrine/claims-policy.md.
 *
 * Types + pure helpers only; importing this changes no analysis behavior.
 */

/** Bump when the stored context shape changes; readers check before trusting. */
export const ASSESSMENT_CONTEXT_SCHEMA_VERSION = 1

/** Max length for any single context field — a guardrail, not a UI rule. */
export const ASSESSMENT_CONTEXT_MAX_FIELD_LENGTH = 500

/**
 * The complete set of allowed context fields (all optional free text). This is
 * the ONLY place fields are enumerated; `parseAssessmentContext` copies exactly
 * these, so the model cannot silently grow a clinical field.
 */
export const ASSESSMENT_CONTEXT_TEXT_FIELDS = [
  'goal', // what the user was working on, e.g. "practice depth"
  'load', // equipment/load descriptor, e.g. "bodyweight", "empty bar"
  'environment', // setup, e.g. "home, phone on the floor"
  'note', // any free note for the user's own records
  'discomfortNote', // self-reported, NOTE ONLY — never interpreted
] as const

export type AssessmentContextField = (typeof ASSESSMENT_CONTEXT_TEXT_FIELDS)[number]

export interface AssessmentContext {
  schemaVersion: number
  goal?: string
  load?: string
  environment?: string
  note?: string
  /**
   * Free-text note if something felt off. Stored verbatim for the user's own
   * records; the app NEVER interprets it, scores it, or produces advice from
   * it (claims-policy: no medical use).
   */
  discomfortNote?: string
}

/** UI copy explaining context is interpretive scope, not a medical assessment. */
export const ASSESSMENT_CONTEXT_DISCLAIMER =
  'Context helps describe what the camera saw — it is not a medical assessment, and nothing here is advice.'

/** UI helper copy for the discomfort-note field — keeps it a personal note. */
export const DISCOMFORT_NOTE_HELP =
  'If something felt off, note it for your own records. This app does not interpret it or offer advice.'

function cleanField(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed.length === 0) return undefined
  return trimmed.slice(0, ASSESSMENT_CONTEXT_MAX_FIELD_LENGTH)
}

/**
 * Build a context from a partial, keeping only non-empty known fields. Returns
 * a context stamped with the current schema version (may hold only the version
 * if nothing was provided — see `hasAnyContext`).
 */
export function makeAssessmentContext(
  partial: Partial<Record<AssessmentContextField, string>> = {},
): AssessmentContext {
  const ctx: AssessmentContext = { schemaVersion: ASSESSMENT_CONTEXT_SCHEMA_VERSION }
  for (const field of ASSESSMENT_CONTEXT_TEXT_FIELDS) {
    const cleaned = cleanField(partial[field])
    if (cleaned !== undefined) ctx[field] = cleaned
  }
  return ctx
}

/** True when the user actually supplied any context field. */
export function hasAnyContext(ctx: AssessmentContext | null | undefined): boolean {
  if (!ctx) return false
  return ASSESSMENT_CONTEXT_TEXT_FIELDS.some((field) => cleanField(ctx[field]) !== undefined)
}

/**
 * Validate untrusted data (parsed JSON, stored records) into an
 * `AssessmentContext`. Copies ONLY the known text fields — unknown keys,
 * including any forbidden medical fields, are dropped here. Returns null when
 * the input is not an object or carries no usable field.
 */
export function parseAssessmentContext(raw: unknown): AssessmentContext | null {
  if (typeof raw !== 'object' || raw === null) return null
  const source = raw as Record<string, unknown>
  const ctx = makeAssessmentContext(
    Object.fromEntries(
      ASSESSMENT_CONTEXT_TEXT_FIELDS.map((field) => [field, source[field]]),
    ) as Partial<Record<AssessmentContextField, string>>,
  )
  return hasAnyContext(ctx) ? ctx : null
}

/** Stable JSON for storage/export (schema-versioned). */
export function serializeAssessmentContext(ctx: AssessmentContext): string {
  return JSON.stringify(ctx)
}
