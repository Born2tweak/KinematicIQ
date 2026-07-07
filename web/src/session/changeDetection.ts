/**
 * MDC-aware change detection (M32) — conservative interpretation of
 * baseline deltas that respects measurement noise.
 *
 * A raw delta is not a change claim. Real minimal-detectable-change (MDC)
 * values require a test-retest reliability study (docs/research/05 SEM/MDC,
 * "Is a change real?"); none exists yet. Until it does, every threshold here
 * is a HEURISTIC — deliberately conservative, marked `basis: 'heuristic'`,
 * and surfaced in copy as provisional. Classification only ever weakens a
 * claim ("possible change", "within noise"), never strengthens one
 * (claims-policy; M32 acceptance: no progress score, no certainty language).
 *
 * Pure and dependency-free.
 */
import type { ConfidenceLevel } from '../core/confidence'

export type ChangeClassification =
  | 'within-noise'
  | 'possible-change'
  | 'insufficient-history'

export interface ChangeAssessment {
  classification: ChangeClassification
  /**
   * Heuristic noise threshold the |delta| was compared against, in the
   * metric's own unit. Null when no threshold is established for the metric.
   */
  threshold: number | null
  /** Always 'heuristic' until a validation study estimates real SEM/MDC. */
  basis: 'heuristic'
  /** Hedged, observation-language line for the UI. */
  copy: string
}

/** Same-protocol saved sessions required before change language may render. */
export const MIN_TREND_SESSIONS = 3

/**
 * Provisional per-metric noise thresholds (heuristic MDC stand-ins), in each
 * metric's display unit. Chosen conservatively — roughly 2–4× the plausible
 * session-to-session measurement noise of a front-view single-RGB read — so
 * "possible change" under-triggers rather than over-triggers. These are NOT
 * validated MDC values; replace via `eval/reliability.ts` and
 * `docs/validation/RELIABILITY_STUDY_TEMPLATE.md`, then document any change in
 * the metric validation status board (M48).
 */
export const HEURISTIC_CHANGE_THRESHOLDS: Readonly<Record<string, number>> = {
  'squat.depth.min-knee-angle': 8, // deg
  'squat.depth.cv': 5, // percentage points
  'squat.trunk.avg-lean': 6, // deg — experimental 2D read, extra slack
  'squat.symmetry.hip-shift': 0.15, // normalized ratio
  'squat.symmetry.knee-asymmetry': 5, // deg
  'squat.symmetry.shoulder-asymmetry': 0.05, // normalized
  'squat.tempo.rep-duration': 0.6, // s
  'squat.tempo.descent': 0.4, // s
  'squat.tempo.ascent': 0.4, // s
  'squat.tempo.cadence': 6, // reps/min
  'squat.rom.hip-flexion': 10, // deg — 2D proxy
  'squat.rom.ankle-dorsiflexion': 12, // deg — noisy foot landmarks
  'squat.path.hip-path-length': 0.1, // normalized units
  'squat.path.peak-hip-speed': 0.3, // normalized units/s
}

const PROVISIONAL_NOTE =
  'Noise thresholds are provisional heuristics, not validated reliability data.'

/** Look up the heuristic noise threshold for a metric id, if one exists. */
export function changeThreshold(metricId: string): number | null {
  return HEURISTIC_CHANGE_THRESHOLDS[metricId] ?? null
}

/**
 * Classify one baseline delta. Conservative by construction:
 * - fewer than {@link MIN_TREND_SESSIONS} baseline sessions, low camera
 *   confidence, or no established threshold → `insufficient-history`
 *   (nothing defensible to say);
 * - |delta| under the threshold → `within-noise`;
 * - otherwise → `possible-change`, always with hedged copy.
 */
export function classifyMetricChange(
  metricId: string,
  /** current − baseline, in the metric's display unit. */
  delta: number,
  context: {
    /** Same-protocol sessions the baseline was built from. */
    sessionCount: number
    /** Session confidence of the CURRENT set being compared. */
    currentConfidence: ConfidenceLevel
  },
): ChangeAssessment {
  const threshold = changeThreshold(metricId)

  if (context.sessionCount < MIN_TREND_SESSIONS) {
    return {
      classification: 'insufficient-history',
      threshold,
      basis: 'heuristic',
      copy: `Not enough saved sessions to judge change (${context.sessionCount} of ${MIN_TREND_SESSIONS} needed).`,
    }
  }
  if (context.currentConfidence === 'Low') {
    return {
      classification: 'insufficient-history',
      threshold,
      basis: 'heuristic',
      copy: 'Camera confidence in this set is too low to compare against your baseline.',
    }
  }
  if (threshold === null) {
    return {
      classification: 'insufficient-history',
      threshold: null,
      basis: 'heuristic',
      copy: 'No noise threshold is established for this read yet, so no change language is offered.',
    }
  }

  if (Math.abs(delta) < threshold) {
    return {
      classification: 'within-noise',
      threshold,
      basis: 'heuristic',
      copy: `Within the range we would expect from measurement noise (±${threshold}). ${PROVISIONAL_NOTE}`,
    }
  }

  return {
    classification: 'possible-change',
    threshold,
    basis: 'heuristic',
    copy: `Larger than the heuristic noise threshold (±${threshold}) — a possible change, not a confirmed one. ${PROVISIONAL_NOTE}`,
  }
}
