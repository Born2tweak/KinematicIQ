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
        subtitle: `Back up until your full body is visible. Missing: ${options.missingJoints.join(', ')}`,
      }
    case 'CALIBRATING':
      return {
        title: 'Hold still, calibrating',
        subtitle: 'Stand upright with arms visible. This only takes a moment.',
      }
    case 'READY':
      return {
        title: 'Start squatting when ready',
        subtitle:
          'Your set begins automatically on the first descent — no button needed.',
      }
    case 'ACTIVE':
      return {
        title: 'Set in progress',
        subtitle: `${options.repCount} rep${options.repCount === 1 ? '' : 's'} so far. Stand still after your last rep to finish automatically.`,
      }
    case 'AUTO_FINISH_PENDING':
      if (options.finishCountdown !== null) {
        return {
          title: `Finishing set in ${options.finishCountdown}…`,
          subtitle: 'Hold your finish position. Squat again to keep going.',
        }
      }
      return {
        title: 'Stand still to finish',
        subtitle:
          'Stay upright to complete the set, or squat again to continue.',
      }
    case 'FINISHED':
      return {
        title: 'Building your report',
        subtitle: 'Analyzing reps, depth, and symmetry from this set…',
      }
    default:
      return {
        title: 'Camera',
        subtitle: '',
      }
  }
}
