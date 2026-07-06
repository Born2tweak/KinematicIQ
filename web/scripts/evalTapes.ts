/**
 * Batch tape eval CLI (M12): `npm run eval:tapes [-- <dir> [<report.json>]]`
 *
 * Replays every `.posetape.json` in <dir> (default: <repo>/eval-tapes) through
 * the production pipeline, prints a one-line verdict per tape, and writes the
 * full JSON report next to the tapes (or to the given path).
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  evaluateTapes,
  formatBatchReport,
  isEvalError,
} from '../src/eval/batchEval'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const tapeDir = resolve(process.argv[2] ?? join(repoRoot, 'eval-tapes'))
const reportPath = resolve(
  process.argv[3] ?? join(tapeDir, 'batch-eval-report.json'),
)

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
process.exit(outcomes.some(isEvalError) ? 1 : 0)
