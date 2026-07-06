/**
 * Core confidence vocabulary (M3).
 *
 * The shared, movement-agnostic representation of "how much should this be
 * trusted." Reconciles the numeric confidence the pipeline computes with the
 * three-level chip the UI already renders (`ConfidenceLevel` in
 * session/types.ts — structurally identical string union kept here so `core/`
 * has no dependency on the session layer).
 *
 * Design sources: docs/research/03_Metric_Engine_Spec.md (confidence model),
 * docs/research/08_Software_Architecture_and_Engineering_Specification.md §5
 * (`Confidence`), docs/doctrine/claims-policy.md (confidence gates conclusions,
 * never strengthens them).
 *
 * Types-only + pure helpers: importing this module changes no runtime behavior
 * anywhere else.
 */

/** The user-facing confidence chip. Matches session/types.ts `ConfidenceLevel`. */
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'

/**
 * Why a confidence value is what it is. Machine-readable reason codes so the
 * UI and validation harness can explain a number without free-text parsing.
 */
export type ConfidenceBasis =
  | 'landmark-visibility'
  | 'protocol-compliance'
  | 'sample-coverage'
  | 'internal-agreement'
  | 'temporal-stability'
  | 'validation-prior'

export interface Confidence {
  /** Bounded [0, 1]. Heuristic, not a calibrated probability (claims-policy). */
  value: number
  /** Derived chip; keep in sync with `value` via `confidenceLevel`. */
  level: ConfidenceLevel
  /** Machine-readable contributors to this value. */
  basis: ConfidenceBasis[]
  /** Optional spread/uncertainty estimate in the same units as `value`. */
  uncertainty?: number
}

/** Thresholds for the three-level chip. Tuned to existing UI expectations. */
export const CONFIDENCE_HIGH_MIN = 0.75
export const CONFIDENCE_MEDIUM_MIN = 0.5

/** Clamp any number into the valid confidence range [0, 1]. */
export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

/** Map a numeric confidence to the three-level chip. */
export function confidenceLevel(value: number): ConfidenceLevel {
  const v = clampConfidence(value)
  if (v >= CONFIDENCE_HIGH_MIN) return 'High'
  if (v >= CONFIDENCE_MEDIUM_MIN) return 'Medium'
  return 'Low'
}

/** Construct a `Confidence` with the chip derived from the value. */
export function makeConfidence(
  value: number,
  basis: ConfidenceBasis[] = [],
  uncertainty?: number,
): Confidence {
  const clamped = clampConfidence(value)
  const confidence: Confidence = {
    value: clamped,
    level: confidenceLevel(clamped),
    basis,
  }
  if (uncertainty !== undefined) confidence.uncertainty = uncertainty
  return confidence
}

/**
 * Combine independent confidence contributors multiplicatively (the CV spec's
 * `C_pose * C_task * ...` model). Empty input = zero confidence, never 1 —
 * absence of evidence is not confidence. Union of bases is preserved.
 */
export function combineConfidence(parts: readonly Confidence[]): Confidence {
  if (parts.length === 0) return makeConfidence(0, [])
  const product = parts.reduce((acc, p) => acc * clampConfidence(p.value), 1)
  const basis = [...new Set(parts.flatMap((p) => p.basis))]
  return makeConfidence(product, basis)
}
