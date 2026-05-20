interface RepCounterProps {
  repCount: number
  isAnalyzing: boolean
}

/**
 * Displays the current live squat rep count.
 */
export function RepCounter({ repCount, isAnalyzing }: RepCounterProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 12,
        minWidth: '96px',
        padding: '12px 14px',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'rgba(10, 10, 15, 0.78)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)',
      }}
    >
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isAnalyzing ? '#22c55e' : 'var(--color-text-muted)',
        }}
      >
        {isAnalyzing ? 'Live Reps' : 'Rep Count'}
      </div>
      <div
        style={{
          marginTop: '4px',
          fontSize: '2rem',
          lineHeight: 1,
          fontWeight: 800,
          color: 'var(--color-text)',
        }}
      >
        {repCount}
      </div>
    </div>
  )
}
