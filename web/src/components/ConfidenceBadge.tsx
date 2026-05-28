import type { ConfidenceLevel } from '../session/types'

interface ConfidenceBadgeProps {
  level: ConfidenceLevel
}

const STYLES: Record<ConfidenceLevel, { bg: string; color: string }> = {
  High: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' },
  Medium: { bg: 'rgba(250, 204, 21, 0.15)', color: '#facc15' },
  Low: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const style = STYLES[level]
  return (
    <span
      className="confidence-badge"
      style={{ background: style.bg, color: style.color }}
    >
      {level} confidence
    </span>
  )
}
