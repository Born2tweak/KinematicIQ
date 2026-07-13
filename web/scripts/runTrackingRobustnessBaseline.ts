import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deserializeTape } from '../src/eval/poseTape'
import { buildTrackingRobustnessBaseline } from '../src/eval/trackingRobustness'

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TAPE_ROOT = join(WEB_ROOT, '..', 'eval-tapes')
const files = readdirSync(TAPE_ROOT).filter((file) => file.endsWith('.posetape.json')).sort()
if (files.length === 0) throw new Error('No pose tapes found for the robustness baseline.')

const log = console.log
console.log = () => {}
const baseline = buildTrackingRobustnessBaseline(
  files.map((file) => {
    const bytes = readFileSync(join(TAPE_ROOT, file))
    return {
      file,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      tape: deserializeTape(bytes.toString('utf8')),
    }
  }),
)
console.log = log

const output = join(WEB_ROOT, 'eval/benchmark-results/m85-tracking-robustness-baseline-v1.json')
writeFileSync(output, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
console.log(`tracking robustness: ${baseline.corpus.tapeCount} tapes, ${baseline.aggregate.frameCount} frames`)
console.log(`rep parity: ${baseline.aggregate.repParityTapes}/${baseline.corpus.tapeCount}`)
console.log(`report: ${output}`)
