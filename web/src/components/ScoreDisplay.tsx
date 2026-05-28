import type { ScoreBand } from '../session/types'

interface ScoreDisplayProps {
  score: number
  band: ScoreBand
}

const BAND_COLORS: Record<ScoreBand, string> = {
  Excellent: '#22c55e',
  Good: '#6366f1',
  'Needs Work': '#facc15',
  Poor: '#ef4444',
}

export function ScoreDisplay({ score, band }: ScoreDisplayProps) {
  const color = BAND_COLORS[band]
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="score-display">
      <svg
        className="score-display__ring"
        viewBox="0 0 128 128"
        role="img"
        aria-label={`Movement score ${score} out of 100, ${band}`}
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="score-display__center">
        <span className="score-display__value">{score}</span>
        <span className="score-display__band" style={{ color }}>
          {band}
        </span>
      </div>
    </div>
  )
}
