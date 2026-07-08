import { describe, expect, it } from 'vitest'
import {
  ASSESSMENT_CONTEXT_MAX_FIELD_LENGTH,
  ASSESSMENT_CONTEXT_SCHEMA_VERSION,
  ASSESSMENT_CONTEXT_TEXT_FIELDS,
  DISCOMFORT_NOTE_HELP,
  ASSESSMENT_CONTEXT_DISCLAIMER,
  hasAnyContext,
  makeAssessmentContext,
  parseAssessmentContext,
  serializeAssessmentContext,
} from './context'
import {
  FORBIDDEN_PHRASES,
  NEGATION_CONTEXT_PATTERNS,
} from '../test/claimsForbiddenTerms'

describe('domain/context (M55)', () => {
  it('builds a schema-versioned context from known fields only', () => {
    const ctx = makeAssessmentContext({
      goal: 'practice depth',
      load: 'bodyweight',
      environment: 'home, phone on floor',
    })
    expect(ctx.schemaVersion).toBe(ASSESSMENT_CONTEXT_SCHEMA_VERSION)
    expect(ctx.goal).toBe('practice depth')
    expect(ctx.load).toBe('bodyweight')
    expect(ctx.environment).toBe('home, phone on floor')
  })

  it('trims and drops empty fields', () => {
    const ctx = makeAssessmentContext({ goal: '   ', note: '  keep me  ' })
    expect(ctx.goal).toBeUndefined()
    expect(ctx.note).toBe('keep me')
    expect(hasAnyContext(ctx)).toBe(true)
  })

  it('reports no-context when nothing usable was supplied', () => {
    expect(hasAnyContext(makeAssessmentContext({}))).toBe(false)
    expect(hasAnyContext(null)).toBe(false)
  })

  it('serializes and round-trips through parse', () => {
    const ctx = makeAssessmentContext({
      goal: 'depth',
      discomfortNote: 'left knee felt tight',
    })
    const parsed = parseAssessmentContext(JSON.parse(serializeAssessmentContext(ctx)))
    expect(parsed).toEqual(ctx)
  })

  it('drops unknown and forbidden medical fields at the boundary', () => {
    const parsed = parseAssessmentContext({
      goal: 'depth',
      painLevel: 8,
      injuryHistory: 'ACL tear',
      diagnosis: 'patellar tendinopathy',
      readiness: 'not ready',
      medication: 'ibuprofen',
    })
    expect(parsed).not.toBeNull()
    // Only the known field survives; nothing clinical is retained.
    expect(Object.keys(parsed!).sort()).toEqual(['goal', 'schemaVersion'])
    for (const key of ['painLevel', 'injuryHistory', 'diagnosis', 'readiness', 'medication']) {
      expect(parsed).not.toHaveProperty(key)
    }
  })

  it('the allowed field set contains no structured clinical field', () => {
    const fields = ASSESSMENT_CONTEXT_TEXT_FIELDS as readonly string[]
    for (const forbidden of ['pain', 'painLevel', 'injury', 'diagnosis', 'readiness', 'medication', 'symptom']) {
      expect(fields).not.toContain(forbidden)
    }
  })

  it('returns null for non-object input', () => {
    expect(parseAssessmentContext(null)).toBeNull()
    expect(parseAssessmentContext('discomfort')).toBeNull()
    expect(parseAssessmentContext(42)).toBeNull()
  })

  it('caps any field at the max length (guardrail against abuse)', () => {
    const long = 'x'.repeat(ASSESSMENT_CONTEXT_MAX_FIELD_LENGTH + 100)
    const ctx = makeAssessmentContext({ note: long })
    expect(ctx.note!.length).toBe(ASSESSMENT_CONTEXT_MAX_FIELD_LENGTH)
  })

  it('context copy carries no forbidden claim language (claims policy)', () => {
    for (const line of [ASSESSMENT_CONTEXT_DISCLAIMER, DISCOMFORT_NOTE_HELP]) {
      const lower = line.toLowerCase()
      for (const { phrase } of FORBIDDEN_PHRASES) {
        if (!lower.includes(phrase)) continue
        const negated = NEGATION_CONTEXT_PATTERNS.some((p) => p.test(line))
        expect(negated, `copy claims "${phrase}": ${line}`).toBe(true)
      }
    }
  })
})
