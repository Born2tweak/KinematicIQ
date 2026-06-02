import type { CameraSessionPhase } from '../screens/cameraSessionUi'

interface SessionStatusCardProps {
  phase: CameraSessionPhase
  title: string
  subtitle: string
  calibrationProgress?: number
  missingJoints?: string[]
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
}: SessionStatusCardProps) {
  const tone = statusTone(phase)

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
          You&apos;re calibrated — squat when you&apos;re ready
        </p>
      )}

      {phase === 'ACTIVE' && (
        <p className="session-status__hint session-status__hint--ok">
          Reps count automatically on each full squat
        </p>
      )}

      {phase === 'AUTO_FINISH_PENDING' && (
        <p className="session-status__hint">
          Stay standing to wrap up, or squat again to keep going
        </p>
      )}
    </div>
  )
}
