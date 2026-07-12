import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseDatasetRegistry } from '../src/eval/datasetRegistry'
import { buildLlmFmsInlineLungeOntology } from '../src/eval/datasets/llmFmsOntology'

const WEB_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const registry = parseDatasetRegistry(
  JSON.parse(readFileSync(join(WEB_ROOT, 'eval/datasets/registry.json'), 'utf8')),
)
const entry = registry.entries.find((candidate) => candidate.id === 'llm-fms')
const rulesChecksum = entry?.checksums?.find(
  (checksum) => checksum.algorithm === 'sha256' && checksum.covers === 'FMSRules.json',
)
if (!entry || entry.approvalStatus !== 'approved' || !rulesChecksum) {
  throw new Error('LLM-FMS rules are not approved with an immutable SHA-256 checksum.')
}

const rulesPath = join(WEB_ROOT, 'eval', entry.localPathConvention, 'FMSRules.json')
const bytes = readFileSync(rulesPath)
const actualSha256 = createHash('sha256').update(bytes).digest('hex')
if (actualSha256 !== rulesChecksum.value) {
  throw new Error(
    `FMSRules.json checksum mismatch: expected ${rulesChecksum.value}, found ${actualSha256}.`,
  )
}

const report = buildLlmFmsInlineLungeOntology({
  rawRules: JSON.parse(bytes.toString('utf8')),
  version: entry.version,
  rulesSha256: actualSha256,
})
const output = join(
  WEB_ROOT,
  'eval/benchmark-results/m78-llm-fms-inline-lunge-ontology-v1.json',
)
mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(
  `LLM-FMS ontology: ${report.movements.length} movements, ${report.movements.reduce((sum, movement) => sum + movement.rules.length, 0)} rules`,
)
console.log(`report: ${output}`)
