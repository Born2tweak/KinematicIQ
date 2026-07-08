/**
 * Confidence-state design primitive (M56).
 *
 * Single source for how a `ConfidenceLevel` maps to its badge class and label,
 * so every surface that shows a confidence chip (findings, coach questions,
 * camera-confidence panel) renders it identically. Colors live as CSS tokens
 * (`--confidence-high/medium/low` in index.css), not inline styles.
 *
 * Pure + framework-free: unit-testable without a DOM.
 */
import type { ConfidenceLevel } from '../../core/confidence'

/** Class list for the confidence chip at a given level. */
export function confidenceBadgeClass(level: ConfidenceLevel): string {
  return `confidence-badge confidence-badge--${level.toLowerCase()}`
}

/** The chip's text — level plus the word "confidence" (color is never the sole signal). */
export function confidenceLabel(level: ConfidenceLevel): string {
  return `${level} confidence`
}
