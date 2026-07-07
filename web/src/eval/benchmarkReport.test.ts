import { describe, expect, it } from 'vitest'
import {
  buildBenchmarkReport,
  buildBenchmarkSummary,
  formatBenchmarkMarkdown,
} from './benchmarkReport'
import type { TapeEvalOutcome, TapeEvalRow } from './batchEval'

function makeRow(overrides: Partial<TapeEvalRow> & { file: string }): TapeEvalRow {
  return {
    label: null,
    source: 'upload',
    fps: 30,
    frames: 300,
    applied: { filtering: 'raw', entry: 'cold' },
    repCount: 3,
    bottomFrames: [50, 150, 250],
    rejectionCount: 0,
    verdict: 'valid',
    qualityReasons: [],
    trustedRepCount: 3,
    untrustedRepNumbers: [],
    phantomCandidateCount: 0,
    sessionConfidence: 'High',
    sessionConfidenceScore: 85,
    avgDepth: 95,
    findingIds: [],
    truth: null,
    landmarkQuality: {
      frameCount: 300,
      meanVisibilityCoverage: 0.95,
      meanCriticalCoverage: 0.95,
      framesMissingCritical: 0,
      implausibleJumpFrames: 0,
      mostMissedLandmarks: [],
    },
    ...overrides,
  }
}

function labeled(
  file: string,
  repCountError: number,
  bottomFrameMAE: number | null = 1,
): TapeEvalRow {
  return makeRow({
    file,
    truth: { truthRepCount: 3, repCountError, bottomFrameMAE },
  })
}

describe('buildBenchmarkSummary', () => {
  it('summarizes counts, rates, MAE, and verdicts from synthetic outcomes', () => {
    const outcomes: TapeEvalOutcome[] = [
      labeled('a.posetape.json', 0, 1),
      labeled('b.posetape.json', 2, 3),
      makeRow({ file: 'c.posetape.json', verdict: 'questionable' }),
      { file: 'broken.posetape.json', error: 'bad json' },
    ]
    const summary = buildBenchmarkSummary(outcomes)
    expect(summary.tapeCount).toBe(4)
    expect(summary.errorCount).toBe(1)
    expect(summary.errorFiles).toEqual(['broken.posetape.json'])
    expect(summary.labeledCount).toBe(2)
    expect(summary.exactRepCount).toBe(1)
    expect(summary.exactRepRate).toBe(0.5)
    expect(summary.meanBottomFrameMAE).toBe(2)
    expect(summary.verdictCounts).toEqual({ valid: 2, questionable: 1 })
  })

  it('handles an all-error batch without crashing', () => {
    const summary = buildBenchmarkSummary([
      { file: 'x.posetape.json', error: 'nope' },
    ])
    expect(summary.errorCount).toBe(1)
    expect(summary.exactRepRate).toBeNull()
    expect(summary.meanBottomFrameMAE).toBeNull()
  })
})

describe('buildBenchmarkReport — baseline comparison', () => {
  const baseline: TapeEvalOutcome[] = [
    labeled('a.posetape.json', 0, 1),
    labeled('b.posetape.json', 0, 1),
  ]

  it('flags a rep-count regression and fails acceptance', () => {
    const current: TapeEvalOutcome[] = [
      labeled('a.posetape.json', 0, 1),
      labeled('b.posetape.json', 1, 1), // was exact, now off by one
    ]
    const report = buildBenchmarkReport(current, baseline)
    expect(report.regressions).toEqual([
      {
        file: 'b.posetape.json',
        detail: 'rep count was exact at baseline, now off by 1',
      },
    ])
    expect(report.acceptance.exactRepRateHeld).toBe(false)
    expect(report.acceptance.acceptable).toBe(false)
  })

  it('flags verdict changes per tape', () => {
    const current: TapeEvalOutcome[] = [
      labeled('a.posetape.json', 0, 1),
      makeRow({
        file: 'b.posetape.json',
        verdict: 'invalid',
        truth: { truthRepCount: 3, repCountError: 0, bottomFrameMAE: 1 },
      }),
    ]
    const report = buildBenchmarkReport(current, baseline)
    expect(report.regressions).toContainEqual({
      file: 'b.posetape.json',
      detail: 'verdict changed valid → invalid',
    })
  })

  it('flags new errors and fails the no-new-errors gate', () => {
    const current: TapeEvalOutcome[] = [
      labeled('a.posetape.json', 0, 1),
      { file: 'b.posetape.json', error: 'replay exploded' },
    ]
    const report = buildBenchmarkReport(current, baseline)
    expect(report.acceptance.noNewErrors).toBe(false)
    expect(report.acceptance.acceptable).toBe(false)
  })

  it('passes acceptance when nothing regressed (MAE within tolerance)', () => {
    const current: TapeEvalOutcome[] = [
      labeled('a.posetape.json', 0, 2.5), // within +2 of baseline mean 1
      labeled('b.posetape.json', 0, 1),
    ]
    const report = buildBenchmarkReport(current, baseline)
    expect(report.regressions).toEqual([])
    expect(report.acceptance.acceptable).toBe(true)
  })

  it('returns null acceptance without a baseline', () => {
    const report = buildBenchmarkReport([labeled('a.posetape.json', 0)])
    expect(report.acceptance.acceptable).toBeNull()
    expect(report.baseline).toBeNull()
  })
})

describe('formatBenchmarkMarkdown', () => {
  it('renders summary, gates, and per-tape regressions', () => {
    const report = buildBenchmarkReport(
      [labeled('a.posetape.json', 1, 1)],
      [labeled('a.posetape.json', 0, 1)],
    )
    const markdown = formatBenchmarkMarkdown(report)
    expect(markdown).toContain('## Benchmark report')
    expect(markdown).toContain('exact rep count: 0/1 (0%)')
    expect(markdown).toContain('**Acceptable: NO**')
    expect(markdown).toContain(
      'a.posetape.json: rep count was exact at baseline, now off by 1',
    )
  })
})
