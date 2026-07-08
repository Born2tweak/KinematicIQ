/**
 * Constraint-based coaching library v1 (M52).
 *
 * A small, fixed set of constraints-led cues keyed to finding ids. A
 * constraint cue changes the TASK or ENVIRONMENT for the next set (a box at
 * target depth, a fixed gaze point, a square camera angle, a steady tempo)
 * rather than prescribing an exercise or naming a body part to fix. This is
 * the constraints-led coaching idea from R01/R04 kept inside the claims
 * policy: observation + "try next set", never diagnosis, injury, pathology,
 * or a rehab/exercise program.
 *
 * Design sources: docs/research/01_Foundations (constraints-led
 * recommendations), docs/research/04_Coaching_Intelligence_Engine_Spec.md
 * (cue generation), docs/doctrine/claims-policy.md (allowed language).
 */

/** The constraint a cue manipulates for the next set. */
export type ConstraintCueType = 'environment' | 'task' | 'attention' | 'tempo'

export interface ConstraintCue {
  /** Stable id, e.g. 'constraint.squat.depth'. */
  id: string
  /** The finding id this cue is keyed to. */
  findingId: string
  type: ConstraintCueType
  /** "Try next set" language — a task/environment change, not a prescription. */
  cue: string
}

/**
 * At most one constraint cue per finding id (v1). Keyed to the squat finding
 * ids produced by findings/squatRules.ts. Findings with no safe constraint
 * (or none authored yet) simply map to nothing.
 */
const CONSTRAINTS_BY_FINDING: Record<string, ConstraintCue> = {
  'squat.depth': {
    id: 'constraint.squat.depth',
    findingId: 'squat.depth',
    type: 'task',
    cue: 'Next set, set a box or bench at the depth you are aiming for and lightly touch it each rep.',
  },
  'squat.trunkControl': {
    id: 'constraint.squat.trunkControl',
    findingId: 'squat.trunkControl',
    type: 'attention',
    cue: 'Next set, pick a spot on the wall at eye level and keep your chest facing it as you go down and up.',
  },
  'squat.kneeTracking': {
    id: 'constraint.squat.kneeTracking',
    findingId: 'squat.kneeTracking',
    type: 'environment',
    cue: 'Next set, face the camera straight on with both knees clearly in frame so each side reads cleanly.',
  },
  'squat.symmetry': {
    id: 'constraint.squat.symmetry',
    findingId: 'squat.symmetry',
    type: 'attention',
    cue: 'Next set, set your feet even and press through both feet the same as you stand up.',
  },
  'squat.consistency': {
    id: 'constraint.squat.consistency',
    findingId: 'squat.consistency',
    type: 'tempo',
    cue: 'Next set, hold one tempo every rep — a slow count down, a brief pause, then stand.',
  },
  'squat.tempo': {
    id: 'constraint.squat.tempo',
    findingId: 'squat.tempo',
    type: 'tempo',
    cue: 'Next set, pick one tempo and repeat it — for example two seconds down, a brief pause, drive up.',
  },
}

/** The constraint cue for a finding id, or null when none is authored. */
export function constraintCueForFinding(findingId: string): ConstraintCue | null {
  return CONSTRAINTS_BY_FINDING[findingId] ?? null
}
