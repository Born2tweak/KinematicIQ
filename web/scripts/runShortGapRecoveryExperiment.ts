import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deserializeTape } from '../src/eval/poseTape'
import { runShortGapRecoveryExperiment } from '../src/eval/shortGapRecoveryExperiment'

const webRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const tapeRoot = join(webRoot, '..', 'eval-tapes')
const files = readdirSync(tapeRoot).filter((file) => file.endsWith('.posetape.json')).sort()
const inputs = files.map((file) => {
  const bytes = readFileSync(join(tapeRoot, file))
  return { file, sha256: createHash('sha256').update(bytes).digest('hex'), tape: deserializeTape(bytes.toString('utf8')) }
})
const log = console.log
console.log = () => {}
const report = runShortGapRecoveryExperiment(inputs)
console.log = log
const output = join(webRoot, 'eval/benchmark-results/m87-short-gap-recovery-experiment-v1.json')
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(`short-gap recovery: ${report.decision}; recovered ${report.aggregate.recoveredLandmarks} landmarks`)
console.log(`failed gates: ${report.failedGates.join(', ') || 'none'}`)
console.log(`report: ${output}`)
