import type { AutoStartPhase } from '../analysis/autoStart'

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
  },
): SessionStatusCopy {
  switch (phase) {
    case 'WAITING':
      return {
        title: 'Step into frame',
        subtitle:
          'Back up until head, shoulders, hips, knees, and feet are visible side-on.',
      }
    case 'CALIBRATING':
      return {
        title: 'Hold still, calibrating',
        subtitle: 'Stand tall with arms relaxed at your sides for a few seconds.',
      }
    case 'READY':
      return {
        title: 'Start squatting when ready',
        subtitle: 'Your set starts on the first descent — no button to press.',
      }
    case 'ACTIVE':
      return {
        title: 'Set in progress',
        subtitle:
          options.repCount === 0
            ? 'Perform full squats. When you’re done, stand still to finish.'
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
        subtitle: 'Stay upright to complete the set, or move into another squat to continue.',
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
