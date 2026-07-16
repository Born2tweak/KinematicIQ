import { writeFileSync } from 'node:fs'
import { buildSyntheticInlineLungeFrames } from '../src/protocols/inlineLunge/fixtures'
import { applyPerturbations, type Perturbation } from '../src/eval/perturbations'

const source = buildSyntheticInlineLungeFrames({ trials: 2 })
const matrix: Array<{ id: string; operations: Perturbation[] }> = [
  { id: 'identity', operations: [{ kind: 'identity' }] },
  { id: 'critical-dropout', operations: [{ kind: 'dropout', startFrame: 18, endFrame: 22, landmarkIndices: [23, 24, 25, 26, 27, 28] }] },
  { id: 'coordinate-jitter', operations: [{ kind: 'coordinateJitter', startFrame: 15, endFrame: 30, amplitude: 0.01 }] },
  { id: 'timestamp-jitter', operations: [{ kind: 'timestampJitter', amplitudeMs: 4 }] },
  { id: 'fps-15', operations: [{ kind: 'fpsResample', targetFps: 15 }] },
]
const rows = []
for (const item of matrix) {
  const result = await applyPerturbations(source, item.operations, { seed: 20260716 })
  rows.push({ id: item.id, frameCount: result.frames.length, manifest: result.manifest })
}
const output = process.argv[2] ?? 'eval/benchmark-results/forward-lunge-perturbation-matrix-v1.json'
writeFileSync(output, `${JSON.stringify({ schemaVersion: 1, protocolId: 'forwardLungeStrideReturn', rows }, null, 2)}\n`)
console.log(`wrote ${output}`)
