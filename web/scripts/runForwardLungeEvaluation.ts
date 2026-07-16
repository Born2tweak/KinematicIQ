import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { evaluateInlineLungeCases } from '../src/eval/forwardLungeEvaluation'
import { buildSyntheticInlineLungeFrames } from '../src/protocols/inlineLunge/fixtures'
import { makeProvenance } from '../src/core/provenance'

const provenance = makeProvenance({ captureSource: 'synthetic', protocolId: 'side-view-forward-lunge-stride-return-v1' })

const report = evaluateInlineLungeCases([
  { sequenceId: 'synthetic-left-3', leadSide: 'left', provenance, frames: buildSyntheticInlineLungeFrames({ leadSide: 'left', trials: 3 }), expectedCompleteTrials: 3, negative: false },
  { sequenceId: 'synthetic-right-3', leadSide: 'right', provenance, frames: buildSyntheticInlineLungeFrames({ leadSide: 'right', trials: 3 }), expectedCompleteTrials: 3, negative: false },
  { sequenceId: 'synthetic-dropout-negative', leadSide: 'left', provenance, frames: buildSyntheticInlineLungeFrames({ unreadableActiveFrames: 4 }), expectedCompleteTrials: 0, negative: true },
])

const outputDirectory = resolve('eval/benchmark-results')
const outputPath = resolve(outputDirectory, 'm109-forward-lunge-stride-return-synthetic-evaluation-v1.json')
mkdirSync(outputDirectory, { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
process.stdout.write(`${JSON.stringify(report.summary)}\n${outputPath}\n`)
