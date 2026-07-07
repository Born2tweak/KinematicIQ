/**
 * Batch tape eval CLI (M12, benchmark report M45):
 * `npm run eval:tapes [-- <dir> [<report.json>] [--baseline <prev-report.json>]]`
 *
 * Replays every `.posetape.json` in <dir> (default: <repo>/eval-tapes) through
 * the production pipeline, prints a one-line verdict per tape plus a benchmark
 * summary with acceptance gates, and writes the full JSON report next to the
 * tapes (or to the given path). Pass `--baseline` with a previous
 * batch-eval-report.json to get per-tape regression detection and PASS/FAIL
 * acceptance flags for filter/model/rep-gate changes.
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateTapes,
  formatBatchReport,
  isEvalError,
  type TapeEvalOutcome,
} from '../src/eval/batchEval'
import {
  buildBenchmarkReport,
  formatBenchmarkMarkdown,
} from '../src/eval/benchmarkReport'

// Positional args stay as before (backward-compatible); --baseline is new.
const args = process.argv.slice(2)
const baselineFlag = args.indexOf('--baseline')
let baselinePath: string | null = null
if (baselineFlag !== -1) {
  baselinePath = args[baselineFlag + 1] ?? null
  args.splice(baselineFlag, baselinePath === null ? 1 : 2)
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tapeDir = resolve(args[0] ?? join(repoRoot, 'eval-tapes'))
const reportPath = resolve(args[1] ?? join(tapeDir, 'batch-eval-report.json'))

if (!existsSync(tapeDir)) {
  console.error(`tape directory not found: ${tapeDir}`)
  process.exit(1)
}

const files = readdirSync(tapeDir)
  .filter((f) => f.endsWith('.posetape.json'))
  .sort()

if (files.length === 0) {
  console.error(`no .posetape.json files in ${tapeDir}`)
  process.exit(1)
}

// The rep counter narrates every frame via console.log; silence it while
// replaying so the terminal shows only the report.
const log = console.log
console.log = () => {}
const outcomes = evaluateTapes(
  files.map((file) => ({
    file,
    json: readFileSync(join(tapeDir, file), 'utf8'),
  })),
)
console.log = log

writeFileSync(reportPath, JSON.stringify(outcomes, null, 2))
console.log(formatBatchReport(outcomes))
console.log(`report: ${reportPath}`)

// Benchmark summary + acceptance gates (M45). Baseline is optional; without
// one the gates print as "no baseline" rather than a fake PASS.
let baselineOutcomes: TapeEvalOutcome[] | null = null
if (baselinePath !== null) {
  const resolved = resolve(baselinePath)
  if (!existsSync(resolved)) {
    console.error(`baseline report not found: ${resolved}`)
    process.exit(1)
  }
  baselineOutcomes = JSON.parse(readFileSync(resolved, 'utf8')) as TapeEvalOutcome[]
}
const benchmark = buildBenchmarkReport(outcomes, baselineOutcomes)
const benchmarkPath = join(dirname(reportPath), 'benchmark-report.json')
writeFileSync(benchmarkPath, JSON.stringify(benchmark, null, 2))
console.log('')
console.log(formatBenchmarkMarkdown(benchmark))
console.log(`benchmark: ${benchmarkPath}`)

const failedAcceptance = benchmark.acceptance.acceptable === false
process.exit(outcomes.some(isEvalError) || failedAcceptance ? 1 : 0)
