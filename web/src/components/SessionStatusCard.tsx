import type { CameraSessionPhase } from '../screens/cameraSessionUi'

interface SessionStatusCardProps {
  phase: CameraSessionPhase
  title: string
  subtitle: string
  calibrationProgress?: number
  missingJoints?: string[]
  /** Coach-facing rep rejection notice (normal mode only). */
  repFeedback?: string | null
  /** Render as a floating HUD pill for the full-bleed camera stage. */
  compact?: boolean
}

function chipTone(phase: CameraSessionPhase): string {
  switch (phase) {
    case 'WAITING':
      return 'warn'
    case 'CALIBRATING':
      return 'live'
    case 'READY':
      return 'ok'
    case 'ACTIVE':
      return 'live'
    case 'AUTO_FINISH_PENDING':
      return 'warn'
    case 'FINISHED':
      return 'ok'
    default:
      return 'ok'
  }
}

function statusTone(phase: CameraSessionPhase): string {
  switch (phase) {
    case 'WAITING':
      return 'waiting'
    case 'CALIBRATING':
      return 'calibrating'
    case 'READY':
      return 'ready'
    case 'ACTIVE':
    case 'AUTO_FINISH_PENDING':
      return 'active'
    case 'FINISHED':
      return 'finished'
    default:
      return 'neutral'
  }
}

export function SessionStatusCard({
  phase,
  title,
  subtitle,
  calibrationProgress = 0,
  missingJoints = [],
  repFeedback = null,
  compact = false,
}: SessionStatusCardProps) {
  const tone = statusTone(phase)

  if (compact) {
    return (
      <div className="hud-status" role="status" aria-live="polite">
        <div className={`hud-chip hud-chip--${chipTone(phase)}`}>
          <span className="hud-chip__dot" aria-hidden />
          <span>{title}</span>
        </div>
        {subtitle && <p className="hud-status__subtitle">{subtitle}</p>}
        {phase === 'ACTIVE' && repFeedback && (
          <p className="hud-status__rep-feedback" role="status">
            {repFeedback}
          </p>
        )}
        {phase === 'WAITING' && missingJoints.length > 0 && (
          <p className="hud-status__hint">
            Still need in frame: {missingJoints.join(', ')}
          </p>
        )}
        {phase === 'CALIBRATING' && (
          <div
            className="hud-status__progress-track"
            role="progressbar"
            aria-valuenow={calibrationProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="hud-status__progress-fill"
              style={{ width: `${calibrationProgress}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`session-status session-status--${tone}`} role="status" aria-live="polite">
      <p className="session-status__eyebrow">Session status</p>
      <h2 className="session-status__title">{title}</h2>
      <p className="session-status__subtitle">{subtitle}</p>

      {phase === 'WAITING' && missingJoints.length > 0 && (
        <p className="session-status__hint session-status__hint--warn">
          Still need in frame: {missingJoints.join(', ')}
        </p>
      )}

      {phase === 'CALIBRATING' && (
        <div className="session-status__progress">
          <div className="session-status__progress-track">
            <div
              className="session-status__progress-fill"
              style={{ width: `${calibrationProgress}%` }}
            />
          </div>
          <p className="session-status__hint">{calibrationProgress}% — hold still</p>
        </div>
      )}

      {phase === 'READY' && (
        <p className="session-status__hint session-status__hint--ok">
          You&apos;re calibrated — start when you&apos;re ready
        </p>
      )}

      {phase === 'ACTIVE' && (
        <p className="session-status__hint session-status__hint--ok">
          Reps count automatically on each full rep
        </p>
      )}

      {phase === 'AUTO_FINISH_PENDING' && (
        <p className="session-status__hint">
          Stay standing to wrap up, or keep moving to continue the set
        </p>
      )}
    </div>
  )
}
