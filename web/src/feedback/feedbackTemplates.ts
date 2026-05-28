import type { ComponentScores } from '../session/types'

export type FeedbackIssueKey = keyof ComponentScores

export interface FeedbackTemplate {
  issue: string
  observation: string
  cue: string
  note: string
}

export const FEEDBACK_TEMPLATES: Record<FeedbackIssueKey, FeedbackTemplate> = {
  depth: {
    issue: 'Depth',
    observation: 'Reps looked shallow from the camera view.',
    cue: 'Sit a little deeper — hips below knee height if you can.',
    note: 'From knee bend at the bottom of each rep.',
  },
  trunkControl: {
    issue: 'Trunk control',
    observation: 'Your chest tipped forward on the way up.',
    cue: 'Drive up with your chest tall.',
    note: 'From shoulder-to-hip angle during the set.',
  },
  kneeTracking: {
    issue: 'Knee tracking',
    observation: 'Left and right knees bent unevenly.',
    cue: 'Track both knees over the middle of your feet.',
    note: 'From side-to-side knee angle at the bottom.',
  },
  consistency: {
    issue: 'Consistency',
    observation: 'Depth changed a lot between reps.',
    cue: 'Match the same depth each rep.',
    note: 'Rep-to-rep depth variation in this set.',
  },
  symmetry: {
    issue: 'Symmetry',
    observation: 'Hips shifted off center at the bottom.',
    cue: 'Press evenly through both feet.',
    note: 'Hip position vs. feet at the bottom.',
  },
}
