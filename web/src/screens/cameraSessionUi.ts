import type { AutoStartPhase } from '../analysis/autoStart'
import type { CaptureGuidance } from '../cv/captureGuidance'
import type { CaptureReadinessState } from '../cv/captureReadiness'

export type CameraSessionPhase =
  | AutoStartPhase
  | 'AUTO_FINISH_PENDING'
  | 'FINISHED'

export interface SessionStatusCopy {
  title: string
  subtitle: string
}

export function getSessionStatusCopy(
  phase: CameraSessionPhase,
  options: {
    repCount: number
    finishCountdown: number | null
    missingJoints: string[]
    /** Live positioning guidance — drives the WAITING copy dynamically. */
    guidance?: CaptureGuidance | null
    /** Scored capture readiness — refines the WAITING subtitle when present. */
    readinessState?: CaptureReadinessState | null
    /** First hard-failing protocol geometry fix (M25) — capture-scoped copy. */
    geometryFix?: string | null
  },
): SessionStatusCopy {
  switch (phase) {
    case 'WAITING': {
      if (options.guidance) {
        const subtitle =
          options.readinessState === 'marginal'
            ? (options.geometryFix ??
              'Almost there — one small adjustment and you’re set.')
            : (options.guidance.detail ?? '')
        return {
          title: options.guidance.instruction,
          subtitle,
        }
      }
      return {
        title: 'Step into frame',
        subtitle:
          'Position the camera at hip height, 3–4 m away, with your whole body in frame.',
      }
    }
    case 'CALIBRATING':
      return {
        title: 'Hold still, calibrating',
        subtitle: 'Stand tall with arms relaxed at your sides for a few seconds.',
      }
    case 'READY':
      return {
        title: 'Start your set when ready',
        subtitle: 'Your set starts on the first descent — no button to press.',
      }
    case 'ACTIVE':
      return {
        title: 'Set in progress',
        subtitle:
          options.repCount === 0
            ? 'Perform full reps. When you’re done, stand still to finish.'
            : `${options.repCount} rep${options.repCount === 1 ? '' : 's'} counted. Stand still after your last rep to finish.`,
      }
    case 'AUTO_FINISH_PENDING':
      if (options.finishCountdown !== null) {
        return {
          title: `Finishing in ${options.finishCountdown}…`,
          subtitle: 'Hold your finish position, or squat again to keep the set going.',
        }
      }
      return {
        title: 'Stand still to finish',
        subtitle: 'Stay upright to complete the set, or move into another rep to continue.',
      }
    case 'FINISHED':
      return {
        title: 'Building your report',
        subtitle: 'Pulling together depth, control, and rep-by-rep details…',
      }
    default:
      return {
        title: 'Camera',
        subtitle: '',
      }
  }
}
