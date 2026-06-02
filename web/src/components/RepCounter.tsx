interface RepCounterProps {
  repCount: number
  isAnalyzing: boolean
}

export function RepCounter({ repCount, isAnalyzing }: RepCounterProps) {
  return (
    <div
      className={`rep-counter${isAnalyzing ? ' rep-counter--live' : ''}`}
      aria-live="polite"
      aria-label={`${repCount} reps counted`}
    >
      <span className="rep-counter__label">{isAnalyzing ? 'Live reps' : 'Reps'}</span>
      <span className="rep-counter__value">{repCount}</span>
    </div>
  )
}
