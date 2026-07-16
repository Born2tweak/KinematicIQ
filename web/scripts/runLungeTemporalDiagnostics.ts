import { writeFileSync } from 'node:fs'
import { buildSyntheticInlineLungeFrames } from '../src/protocols/inlineLunge/fixtures'
import { applyPerturbations } from '../src/eval/perturbations'
import { buildLungeTemporalBaseline } from '../src/eval/lungeTemporalDiagnostics'

const source = buildSyntheticInlineLungeFrames({ trials: 2 })
const variants = [
  { id: 'identity', operations: [{ kind: 'identity' } as const] },
  { id: 'dropout-bottom', operations: [{ kind: 'dropout' as const, startFrame: 20, endFrame: 24, landmarkIndices: [23, 24, 25, 26, 27, 28] }] },
  { id: 'jitter-001', operations: [{ kind: 'coordinateJitter' as const, startFrame: 15, endFrame: 50, amplitude: 0.01 }] },
  { id: 'fps-15', operations: [{ kind: 'fpsResample' as const, targetFps: 15 }] },
]
const inputs = []
for (const variant of variants) {
  const transformed = await applyPerturbations(source, variant.operations, { seed: 20260716 })
  inputs.push({ sequenceId: variant.id, sourceSha256: transformed.manifest.sourceSha256, transformationId: variant.id, perturbationVersion: transformed.manifest.version, leadSide: 'left' as const, frames: transformed.frames })
}
const report = buildLungeTemporalBaseline(inputs)
const output = 'eval/benchmark-results/forward-lunge-temporal-diagnostics-v1.json'
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`wrote ${output}: ${report.denominators.sequences} sequences, ${report.denominators.frames} frames`)
