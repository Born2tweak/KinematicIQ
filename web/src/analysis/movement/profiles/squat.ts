/**
 * Bodyweight squat — the reference MovementProfile. All thresholds are
 * the exact values the pipeline shipped with before profiles existed
 * (behavior-preserving: existing tests must stay green).
 */
import { SQUAT_AUTO_FINISH_CONFIG } from '../../autoFinish'
import { SQUAT_AUTO_START_CONFIG } from '../../autoStart'
import { SQUAT_PHASE_CONFIG } from '../../phaseDetector'
import { SQUAT_REP_GATES } from '../../repCounter'
import { SQUAT_ACTIVATION_CONFIG } from '../../setActivation'
import { SQUAT_SCORING_CONFIG } from '../../../scoring/scoringConfig'
import { generateFeedback } from '../../../feedback/feedbackEngine'
import type { MovementProfile } from '../types'

export const SQUAT_PROFILE: MovementProfile = {
  id: 'squat',
  label: 'Bodyweight squat',
  kind: 'cyclic',
  phase: SQUAT_PHASE_CONFIG,
  repGates: SQUAT_REP_GATES,
  autoStart: SQUAT_AUTO_START_CONFIG,
  autoFinish: SQUAT_AUTO_FINISH_CONFIG,
  activation: SQUAT_ACTIVATION_CONFIG,
  scoring: SQUAT_SCORING_CONFIG,
  concepts: [
    'workingDepth',
    'tallChest',
    'evenBase',
    'evenDrive',
    'repeatable',
    'hingeStrategy',
    'spineStability',
    'smoothness',
    'deviation',
  ],
  buildFeedback: generateFeedback,
}
