/**
 * Benchmark report generator (M45).
 *
 * Turns batch-eval outcomes into a repeatable acceptance report for
 * protocol/filter/rep-gate changes (R05 benchmark protocol + continuous QA,
 * R06 model-change discipline): summary rates, optional baseline deltas,
 * per-tape regressions (never only aggregates — the roadmap risk is a
 * summary that hides per-tape failures), and explicit acceptance flags.
 *
 * Pure functions only; file I/O stays in scripts/evalTapes.ts. Analysis
 * behavior is untouched — this reads outcomes, it never produces them.
 */
import {
  isEvalError,
  type TapeEvalOutcome,
  type TapeEvalRow,
} from './batchEval'

export interface BenchmarkSummary {
  tapeCount: number
  errorCount: number
  errorFiles: string[]
  /** Tapes carrying meta.truth labels. */
  labeledCount: number
  /** Labeled tapes whose predicted rep count matched exactly. */
  exactRepCount: number
  /** exactRepCount / labeledCount; null when nothing is labeled. */
  exactRepRate: number | null
  /** Mean of per-tape bottom-frame MAE across labeled tapes that have one. */
  meanBottomFrameMAE: number | null
  /** Report verdict distribution (valid/questionable/invalid). */
  verdictCounts: Record<string, number>
}

/** One per-tape difference against the baseline, in plain language. */
export interface TapeRegression {
  file: string
  detail: string
}

export interface AcceptanceFlags {
  /** Exact rep-count rate did not drop below baseline. Null: no baseline. */
  exactRepRateHeld: boolean | null
  /** Mean bottom-frame MAE within tolerance of baseline. Null: no baseline. */
  bottomMAEHeld: boolean | null
  /** No tape newly errors that evaluated cleanly at baseline. */
  noNewErrors: boolean | null
  /** All of the above (a change is acceptable only when every gate holds). */
  acceptable: boolean | null
}

export interface BenchmarkReport {
  summary: BenchmarkSummary
  baseline: BenchmarkSummary | null
  regressions: TapeRegression[]
  acceptance: AcceptanceFlags
}

/** Bottom-frame MAE may drift this many frames before the gate fails. */
export const BOTTOM_MAE_TOLERANCE_FRAMES = 2

function rows(outcomes: readonly TapeEvalOutcome[]): TapeEvalRow[] {
  return outcomes.filter((o): o is TapeEvalRow => !isEvalError(o))
}

export function buildBenchmarkSummary(
  outcomes: readonly TapeEvalOutcome[],
): BenchmarkSummary {
  const evaluated = rows(outcomes)
  const errorFiles = outcomes.filter(isEvalError).map((o) => o.file)
  const labeled = evaluated.filter(
    (row) => row.truth !== null && row.truth.truthRepCount !== null,
  )
  const exact = labeled.filter((row) => row.truth!.repCountError === 0)
  const maes = labeled
    .map((row) => row.truth!.bottomFrameMAE)
    .filter((mae): mae is number => mae !== null)
  const verdictCounts: Record<string, number> = {}
  for (const row of evaluated) {
    verdictCounts[row.verdict] = (verdictCounts[row.verdict] ?? 0) + 1
  }
  return {
    tapeCount: outcomes.length,
    errorCount: errorFiles.length,
    errorFiles,
    labeledCount: labeled.length,
    exactRepCount: exact.length,
    exactRepRate: labeled.length === 0 ? null : exact.length / labeled.length,
    meanBottomFrameMAE:
      maes.length === 0
        ? null
        : maes.reduce((sum, mae) => sum + mae, 0) / maes.length,
    verdictCounts,
  }
}

/** Per-tape baseline comparison — regressions listed by file, never hidden. */
function findRegressions(
  current: readonly TapeEvalOutcome[],
  baseline: readonly TapeEvalOutcome[],
): TapeRegression[] {
  const regressions: TapeRegression[] = []
  const baseByFile = new Map(baseline.map((o) => [o.file, o]))

  for (const outcome of current) {
    const base = baseByFile.get(outcome.file)
    if (!base) continue // new tape — informational, not a regression

    if (isEvalError(outcome) && !isEvalError(base)) {
      regressions.push({
        file: outcome.file,
        detail: `newly errors: ${outcome.error}`,
      })
      continue
    }
    if (isEvalError(outcome) || isEvalError(base)) continue

    const curErr = outcome.truth?.repCountError
    const baseErr = base.truth?.repCountError
    if (baseErr === 0 && curErr !== undefined && curErr !== null && curErr !== 0) {
      regressions.push({
        file: outcome.file,
        detail: `rep count was exact at baseline, now off by ${curErr}`,
      })
    }
    if (outcome.verdict !== base.verdict) {
      regressions.push({
        file: outcome.file,
        detail: `verdict changed ${base.verdict} → ${outcome.verdict}`,
      })
    }
  }
  return regressions
}

function buildAcceptance(
  summary: BenchmarkSummary,
  baseline: BenchmarkSummary | null,
  regressions: readonly TapeRegression[],
): AcceptanceFlags {
  if (baseline === null) {
    return {
      exactRepRateHeld: null,
      bottomMAEHeld: null,
      noNewErrors: null,
      acceptable: null,
    }
  }
  const exactRepRateHeld =
    baseline.exactRepRate === null ||
    (summary.exactRepRate !== null &&
      summary.exactRepRate >= baseline.exactRepRate)
  const bottomMAEHeld =
    baseline.meanBottomFrameMAE === null ||
    (summary.meanBottomFrameMAE !== null &&
      summary.meanBottomFrameMAE <=
        baseline.meanBottomFrameMAE + BOTTOM_MAE_TOLERANCE_FRAMES)
  const noNewErrors = !regressions.some((r) => r.detail.startsWith('newly errors'))
  return {
    exactRepRateHeld,
    bottomMAEHeld,
    noNewErrors,
    acceptable: exactRepRateHeld && bottomMAEHeld && noNewErrors,
  }
}

export function buildBenchmarkReport(
  current: readonly TapeEvalOutcome[],
  baseline: readonly TapeEvalOutcome[] | null = null,
): BenchmarkReport {
  const summary = buildBenchmarkSummary(current)
  const baselineSummary = baseline === null ? null : buildBenchmarkSummary(baseline)
  const regressions = baseline === null ? [] : findRegressions(current, baseline)
  return {
    summary,
    baseline: baselineSummary,
    regressions,
    acceptance: buildAcceptance(summary, baselineSummary, regressions),
  }
}

function pct(rate: number | null): string {
  return rate === null ? 'n/a' : `${Math.round(rate * 100)}%`
}

function flag(value: boolean | null): string {
  return value === null ? '— (no baseline)' : value ? 'PASS' : 'FAIL'
}

/** Concise markdown for terminals and progress notes. */
export function formatBenchmarkMarkdown(report: BenchmarkReport): string {
  const { summary, baseline, regressions, acceptance } = report
  const lines: string[] = [
    '## Benchmark report',
    '',
    `- Tapes: ${summary.tapeCount} (${summary.errorCount} error${summary.errorCount === 1 ? '' : 's'})`,
    `- Labeled: ${summary.labeledCount} · exact rep count: ${summary.exactRepCount}/${summary.labeledCount} (${pct(summary.exactRepRate)})` +
      (baseline ? ` — baseline ${pct(baseline.exactRepRate)}` : ''),
    `- Bottom-frame MAE: ${summary.meanBottomFrameMAE === null ? 'n/a' : summary.meanBottomFrameMAE.toFixed(1)}` +
      (baseline && baseline.meanBottomFrameMAE !== null
        ? ` — baseline ${baseline.meanBottomFrameMAE.toFixed(1)} (tolerance ±${BOTTOM_MAE_TOLERANCE_FRAMES})`
        : ''),
    `- Verdicts: ${
      Object.entries(summary.verdictCounts)
        .map(([verdict, count]) => `${verdict}=${count}`)
        .join(' ') || 'none'
    }`,
  ]
  if (summary.errorFiles.length > 0) {
    lines.push(`- Errors: ${summary.errorFiles.join(', ')}`)
  }
  lines.push('', '### Acceptance gates (filter/model/rep-gate changes)', '')
  lines.push(`- Exact rep-count rate held: ${flag(acceptance.exactRepRateHeld)}`)
  lines.push(`- Bottom-frame MAE held: ${flag(acceptance.bottomMAEHeld)}`)
  lines.push(`- No new errors: ${flag(acceptance.noNewErrors)}`)
  lines.push(
    `- **Acceptable: ${acceptance.acceptable === null ? 'no baseline given — compare before merging behavior changes' : acceptance.acceptable ? 'YES' : 'NO'}**`,
  )
  if (regressions.length > 0) {
    lines.push('', '### Per-tape regressions', '')
    for (const regression of regressions) {
      lines.push(`- ${regression.file}: ${regression.detail}`)
    }
  }
  return lines.join('\n')
}
