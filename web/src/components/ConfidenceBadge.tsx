import type { ConfidenceLevel } from '../session/types'
import { confidenceBadgeClass, confidenceLabel } from './ui/confidenceState'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

/**
 * Confidence chip. Colors come from CSS tokens via `confidenceBadgeClass`
 * (M56 design system) — no inline styles — and the text label carries the
 * meaning so color is never the sole signal.
 */
export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return <span className={confidenceBadgeClass(level)}>{confidenceLabel(level)}</span>
}
