import { describe, expect, it } from 'vitest'
import {
  constraintCueForFinding,
  type ConstraintCueType,
} from './constraintsLibrary'
import {
  FORBIDDEN_PHRASES,
  NEGATION_CONTEXT_PATTERNS,
} from '../test/claimsForbiddenTerms'

const SQUAT_FINDING_IDS = [
  'squat.depth',
  'squat.trunkControl',
  'squat.kneeTracking',
  'squat.symmetry',
  'squat.consistency',
  'squat.tempo',
]

const VALID_TYPES: ConstraintCueType[] = [
  'environment',
  'task',
  'attention',
  'tempo',
]

describe('constraintsLibrary (M52)', () => {
  it('maps each squat finding to at most one constraint cue', () => {
    for (const id of SQUAT_FINDING_IDS) {
      const cue = constraintCueForFinding(id)
      expect(cue, `expected a cue for ${id}`).not.toBeNull()
      expect(cue!.findingId).toBe(id)
      expect(VALID_TYPES).toContain(cue!.type)
      expect(cue!.cue.length).toBeGreaterThan(0)
    }
  })

  it('returns null for an unknown finding id (zero or more, never invented)', () => {
    expect(constraintCueForFinding('squat.unknown')).toBeNull()
    expect(constraintCueForFinding('')).toBeNull()
  })

  it('every cue uses "try next set" framing, not a prescription', () => {
    for (const id of SQUAT_FINDING_IDS) {
      const cue = constraintCueForFinding(id)!
      expect(cue.cue.toLowerCase()).toContain('next set')
    }
  })

  it('no cue contains forbidden claim language (claims policy)', () => {
    for (const id of SQUAT_FINDING_IDS) {
      const line = constraintCueForFinding(id)!.cue
      const lower = line.toLowerCase()
      for (const { phrase } of FORBIDDEN_PHRASES) {
        if (!lower.includes(phrase)) continue
        const negated = NEGATION_CONTEXT_PATTERNS.some((p) => p.test(line))
        expect(negated, `cue for ${id} claims "${phrase}": ${line}`).toBe(true)
      }
    }
  })
})
