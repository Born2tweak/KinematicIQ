import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLAIM_POLICY_VERSION,
  REPORT_KIND,
  REPORT_SCHEMA_VERSION,
  buildSessionReport,
  downloadReportFile,
  reportFilename,
  serializeReport,
  type ExportedSessionReport,
} from './sessionReport'
import { renderReportHtml } from './sessionReportHtml'
import { makeConfidence } from '../core/confidence'
import { makeProvenance } from '../core/provenance'
import type { MetricResult } from '../core/metric'
import type { Finding } from '../core/finding'
import type { RepMetrics } from '../cv/types'
import type { SessionResult, SetMetricsSummary } from '../session/types'
import type { SetQualityAssessment } from '../session/setQualityGate'

const NOW = new Date('2026-07-06T12:00:00Z')

function makeRep(repNumber: number, bottomKnee: number | null): RepMetrics {
  return {
    repNumber,
    startFrameIndex: 0,
    bottomFrameIndex: 10,
    endFrameIndex: 20,
    startTimestamp: 0,
    endTimestamp: 2000,
    minLeftKneeAngle: bottomKnee,
    minRightKneeAngle: bottomKnee === null ? null : bottomKnee + 4,
    averageTrunkLean: 28,
    maxTrunkLean: 35,
    hipShiftAtBottom: 0.01,
    shoulderAsymmetryAtBottom: 2,
    kneeAsymmetry: 3,
    confidence: 0.9,
    durationMs: 2000,
  }
}

function makeMetricResult(overrides: Partial<MetricResult> = {}): MetricResult {
  return {
    metricId: 'squat.depth.min-knee-angle',
    label: 'Depth (bottom knee angle)',
    value: 95,
    unit: 'deg',
    side: 'bilateral',
    confidence: makeConfidence(0.85, ['landmark-visibility']),
    provenance: makeProvenance({ captureSource: 'live', tapeId: 'tape-1' }),
    validationTier: 'experimental',
    ...overrides,
  }
}

function makeFinding(): Finding {
  return {
    id: 'squat.posture.trunk-drift',
    statement:
      'The trunk appears to drift forward in the second half of the set.',
    evidence: [
      {
        metricId: 'squat.posture.trunk-lean',
        observed: 'Average trunk lean increased from 25° to 34° across reps.',
      },
    ],
    confidence: makeConfidence(0.8, ['sample-coverage']),
    priority: 'primary',
    tryNext: 'Keep the chest tall through the middle reps.',
  }
}

function validQuality(): SetQualityAssessment {
  return {
    verdict: 'valid',
    reasons: [],
    captureFixes: [],
    untrustedReps: [],
    untrustedRepNumbers: [],
    trustedRepCount: 5,
    phantomCandidateCount: 0,
  }
}

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  const metrics: SetMetricsSummary = {
    repCount: 2,
    reps: [makeRep(1, 92), makeRep(2, 96)],
    excludedRepNumbers: [],
    avgDepth: 94,
    avgTrunkLean: 28,
    depthCV: 3,
    minDepth: 92,
    maxDepth: 96,
    avgHipShift: 0.01,
    avgKneeAsymmetry: 3,
    avgShoulderAsymmetry: 2,
    overallConfidence: 0.9,
  }
  return {
    protocolId: 'squat',
    metrics,
    metricResults: [makeMetricResult()],
    findings: [makeFinding()],
    scoring: null,
    feedback: [],
    sessionConfidence: 'High',
    sessionConfidenceScore: 85,
    insufficientData: false,
    noRepsDetected: false,
    posture: null,
    baseline: null,
    quality: validQuality(),
    ...overrides,
  }
}

function invalidResult(): SessionResult {
  return makeResult({
    findings: [],
    feedback: [],
    metricResults: [],
    quality: {
      verdict: 'invalid',
      reasons: [
        {
          id: 'standing-reps-counted',
          detail: 'Reps were counted while the athlete appeared to be standing.',
        },
      ],
      captureFixes: ['Move the camera back so the full body stays in frame.'],
      untrustedReps: [
        {
          repNumber: 1,
          reason: 'standing-bottom',
          detail:
            'Rep 1 recorded a 176° bottom knee angle — the knees never appeared to bend.',
        },
      ],
      untrustedRepNumbers: [1],
      trustedRepCount: 1,
      phantomCandidateCount: 0,
    },
  })
}

describe('buildSessionReport schema', () => {
  it('exports a versioned, self-describing report for a valid session', () => {
    const report = buildSessionReport(makeResult(), { now: NOW })
    expect(report.kind).toBe(REPORT_KIND)
    expect(report.schemaVersion).toBe(REPORT_SCHEMA_VERSION)
    expect(report.claimPolicyVersion).toBe(CLAIM_POLICY_VERSION)
    expect(report.generatedAt).toBe('2026-07-06T12:00:00.000Z')
    expect(report.protocolId).toBe('squat')
    expect(report.movement).not.toBeNull()
    expect(report.movement!.metricResults).toHaveLength(1)
    expect(report.movement!.findings).toHaveLength(1)
    expect(report.repAudit).toEqual([
      { repNumber: 1, bottomKneeAngleDeg: 92, avgTrunkLeanDeg: 28 },
      { repNumber: 2, bottomKneeAngleDeg: 96, avgTrunkLeanDeg: 28 },
    ])
  })

  it('takes provenance from the metric results when present', () => {
    const report = buildSessionReport(makeResult(), { now: NOW })
    expect(report.provenance.tapeId).toBe('tape-1')
  })

  it('falls back to live-capture provenance when no metric results exist', () => {
    const report = buildSessionReport(
      makeResult({ metricResults: [] }),
      { now: NOW },
    )
    expect(report.provenance.captureSource).toBe('live')
  })

  it('keeps the questionable verdict and reasons on the export', () => {
    const result = makeResult({
      quality: {
        ...validQuality(),
        verdict: 'questionable',
        reasons: [{ id: 'small-sample', detail: 'Only 3 trustworthy reps.' }],
      },
    })
    const report = buildSessionReport(result, { now: NOW })
    expect(report.quality.verdict).toBe('questionable')
    expect(report.quality.reasons).toHaveLength(1)
    // Questionable sets still carry their observations, exactly as rendered.
    expect(report.movement).not.toBeNull()
  })

  it('fully abstains on an invalid session: movement is null, audit stays', () => {
    const report = buildSessionReport(invalidResult(), { now: NOW })
    expect(report.movement).toBeNull()
    expect(report.quality.verdict).toBe('invalid')
    expect(report.quality.captureFixes).toHaveLength(1)
    // The rep audit survives for audit purposes — aggregates do not.
    expect(report.repAudit).toHaveLength(2)
  })

  it('serializes to stable JSON that round-trips', () => {
    const report = buildSessionReport(makeResult(), { now: NOW })
    const json = serializeReport(report)
    expect(serializeReport(report)).toBe(json)
    const parsed = JSON.parse(json) as ExportedSessionReport
    expect(parsed.kind).toBe(REPORT_KIND)
    expect(parsed.schemaVersion).toBe(REPORT_SCHEMA_VERSION)
    expect(parsed.movement?.metricResults[0]?.value).toBe(95)
  })
})

describe('report HTML copy policy', () => {
  const htmlFor = (result: SessionResult) =>
    renderReportHtml(buildSessionReport(result, { now: NOW })).toLowerCase()

  it.each([
    ['valid', makeResult()],
    ['invalid', invalidResult()],
  ])('never uses forbidden clinical language (%s session)', (_label, result) => {
    const html = htmlFor(result)
    for (const forbidden of ['diagnos', 'injur', 'patholog', 'dysfunction', 'risk']) {
      expect(html, `must not contain "${forbidden}"`).not.toContain(forbidden)
    }
  })

  it('carries the disclaimer and the validation tier note', () => {
    const html = renderReportHtml(buildSessionReport(makeResult(), { now: NOW }))
    expect(html).toContain('not medical advice')
    expect(html).toContain('Validation tiers')
    expect(html).toContain('experimental')
  })

  it('is fully self-contained: no scripts, no external requests', () => {
    const html = htmlFor(makeResult())
    expect(html).not.toContain('<script')
    expect(html).not.toContain('http://')
    expect(html).not.toContain('https://')
    expect(html).not.toContain('src=')
    expect(html).not.toContain('<link')
  })

  it('renders the abstain state for an invalid recording', () => {
    const html = renderReportHtml(buildSessionReport(invalidResult(), { now: NOW }))
    expect(html).toContain('Why there is no movement report')
    expect(html).toContain('capture fixes')
    // No metric table or findings section on a fully abstained report.
    expect(html).not.toContain('Measured metrics')
    expect(html).not.toContain('What stood out')
  })

  it('escapes dynamic text so content cannot inject markup', () => {
    const result = makeResult({
      findings: [
        {
          ...makeFinding(),
          statement: 'Contains <b>markup</b> & "quotes"',
        },
      ],
    })
    const html = renderReportHtml(buildSessionReport(result, { now: NOW }))
    expect(html).not.toContain('<b>markup</b>')
    expect(html).toContain('&lt;b&gt;markup&lt;/b&gt; &amp; &quot;quotes&quot;')
  })
})

describe('reportFilename', () => {
  it('names files by protocol and generation date', () => {
    const report = buildSessionReport(makeResult(), { now: NOW })
    expect(reportFilename(report, 'json')).toBe(
      'kinematiciq-report-squat-2026-07-06.json',
    )
    expect(reportFilename(report, 'html')).toBe(
      'kinematiciq-report-squat-2026-07-06.html',
    )
  })
})

describe('downloadReportFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates and revokes an object URL and clicks a download anchor', () => {
    const createObjectURL = vi.fn(() => 'blob:report')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})

    downloadReportFile('{"a":1}', 'report.json', 'application/json')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(click).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:report')
    // The anchor must not linger in the document after the download.
    expect(document.querySelector('a[download]')).toBeNull()
    vi.unstubAllGlobals()
  })
})
