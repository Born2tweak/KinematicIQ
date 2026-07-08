import { describe, expect, it } from 'vitest'
import {
  coachQuestionSections,
  DEFAULT_RESULTS_TAB,
  RESULTS_TABS,
  evidenceMetricResults,
  hasFindings,
  summaryFindings,
} from './resultsTabsModel'
import { buildFindingCardModel } from './findingCardModel'
import { makeConfidence } from '../../core/confidence'
import { makeProvenance } from '../../core/provenance'
import type { Finding } from '../../core/finding'
import type { MetricResult } from '../../core/metric'
import type { SessionResult } from '../../session/types'

function finding(id: string, priority: Finding['priority']): Finding {
  return {
    id,
    statement: `${id} statement`,
    evidence: [{ metricId: `${id}.m`, observed: 'observed line' }],
    confidence: makeConfidence(0.8),
    priority,
    tryNext: 'do the thing',
  }
}

function metricResult(id: string, value: number | null): MetricResult {
  return {
    metricId: id,
    label: id,
    value,
    unit: 'deg',
    side: 'none',
    confidence: makeConfidence(0.8),
    provenance: makeProvenance({ captureSource: 'replay' }),
    validationTier: 'production',
  }
}

function sessionResult(overrides: Partial<SessionResult>): SessionResult {
  return {
    protocolId: 'squat',
    metrics: {} as SessionResult['metrics'],
    metricResults: [],
    findings: [],
    scoring: null,
    feedback: [],
    sessionConfidence: 'High',
    sessionConfidenceScore: 80,
    insufficientData: false,
    noRepsDetected: false,
    posture: null,
    baseline: null,
    quality: {
      verdict: 'valid',
      reasons: [],
      captureFixes: [],
      untrustedReps: [],
      untrustedRepNumbers: [],
      trustedRepCount: 5,
      phantomCandidateCount: 0,
    },
    ...overrides,
  }
}

describe('components/report/resultsTabs', () => {
  it('exposes three tabs with summary default', () => {
    expect(RESULTS_TABS.map((t) => t.id)).toEqual(['summary', 'evidence', 'expert'])
    expect(DEFAULT_RESULTS_TAB).toBe('summary')
  })

  it('every tab carries a non-empty accessible label (M54 a11y)', () => {
    // The tab bar renders one <button role="tab"> per entry; an empty label
    // would produce an unlabeled control for screen-reader users.
    for (const tab of RESULTS_TABS) {
      expect(tab.label.trim().length, `tab ${tab.id} needs a label`).toBeGreaterThan(0)
    }
  })

  it('summaryFindings sorts primary-first and caps count', () => {
    const result = sessionResult({
      findings: [
        finding('b', 'secondary'),
        finding('a', 'primary'),
        finding('c', 'informational'),
        finding('d', 'informational'),
      ],
    })
    const top = summaryFindings(result, 3)
    expect(top).toHaveLength(3)
    expect(top[0].id).toBe('a')
  })

  it('evidenceMetricResults drops abstained (null) values', () => {
    const result = sessionResult({
      metricResults: [metricResult('x', 90), metricResult('y', null)],
    })
    expect(evidenceMetricResults(result).map((m) => m.metricId)).toEqual(['x'])
  })

  it('hasFindings reflects the finding list (abstain ⇒ false)', () => {
    expect(hasFindings(sessionResult({ findings: [] }))).toBe(false)
    expect(hasFindings(sessionResult({ findings: [finding('a', 'primary')] }))).toBe(
      true,
    )
  })
})

describe('components/report/findingCardModel', () => {
  it('maps a finding to its display model', () => {
    const model = buildFindingCardModel(finding('squat.depth', 'primary'))
    expect(model.statement).toBe('squat.depth statement')
    expect(model.confidenceLevel).toBe('High')
    expect(model.evidence).toEqual(['observed line'])
    expect(model.tryNext).toBe('do the thing')
  })

  it('handles a finding with no tryNext', () => {
    const f = finding('x', 'secondary')
    delete f.tryNext
    expect(buildFindingCardModel(f).tryNext).toBeNull()
  })
})

describe('coach-question sections (M24)', () => {
  it('groups findings under fixed questions and abstains explicitly elsewhere', () => {
    const result = sessionResult({
      findings: [
        finding('squat.depth', 'primary'),
        finding('squat.symmetry', 'secondary'),
      ].map((f, i) => ({
        ...f,
        question: i === 0 ? 'movement-completion' : 'load-symmetry',
      })),
    })
    const sections = coachQuestionSections(result)
    expect(sections.map((s) => s.questionId)).toEqual([
      'movement-completion',
      'posture-organization',
      'load-symmetry',
    ])
    for (const section of sections) {
      if (section.findings.length === 0) {
        expect(section.abstainLine.length).toBeGreaterThan(0)
      }
      for (const finding of section.findings) {
        expect(finding.question).toBe(section.questionId)
      }
    }
    // Every finding lands in exactly one section.
    const placed = sections.reduce((n, s) => n + s.findings.length, 0)
    expect(placed).toBe(result.findings.length)
  })
})
