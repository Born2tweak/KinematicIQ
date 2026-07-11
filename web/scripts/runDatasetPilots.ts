import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDatasetRegistry } from '../src/eval/datasetRegistry'
import {
  buildUiPrmdPilotBaseline,
  parseUiPrmdTrials,
} from '../src/eval/datasets/uiPrmdReduced'

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = parseDatasetRegistry(
  JSON.parse(readFileSync(join(WEB_ROOT, 'eval/datasets/registry.json'), 'utf8')),
)
const entry = registry.entries.find((candidate) => candidate.id === 'ui-prmd')
if (!entry || entry.approvalStatus !== 'approved' || !entry.checksums) {
  throw new Error('UI-PRMD is not approved with immutable artifact checksums.')
}
const root = join(WEB_ROOT, 'eval', entry.localPathConvention, 'reduced-deep-squat')
const artifacts: Record<string, string> = {}
for (const checksum of entry.checksums) {
  const bytes = readFileSync(join(root, checksum.covers))
  const actual = createHash(checksum.algorithm).update(bytes).digest('hex')
  if (actual !== checksum.value) {
    throw new Error(`${checksum.covers} checksum mismatch: expected ${checksum.value}, found ${actual}.`)
  }
  artifacts[checksum.covers] = actual
}
const demonstrated = parseUiPrmdTrials(
  readFileSync(join(root, 'Data_Correct.csv'), 'utf8'),
  readFileSync(join(root, 'Labels_Correct.csv'), 'utf8'),
  'demonstrated',
)
const nonOptimal = parseUiPrmdTrials(
  readFileSync(join(root, 'Data_Incorrect.csv'), 'utf8'),
  readFileSync(join(root, 'Labels_Incorrect.csv'), 'utf8'),
  'non-optimal',
)
const baseline = buildUiPrmdPilotBaseline({
  demonstrated,
  nonOptimal,
  version: entry.version,
  sourceCommit: '838d3a46b04467610fa07f07827bccc8f2e6cec1',
  acquiredArtifacts: artifacts,
})
const output = join(WEB_ROOT, 'eval/benchmark-results/m63-ui-prmd-reduced-baseline-v1.json')
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8')
console.log(`UI-PRMD pilot: ${baseline.cohort.trialsPerClass} trials/class, ${baseline.waveform.pairedSampleCount} paired samples`)
console.log(`report: ${output}`)

