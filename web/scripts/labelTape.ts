/**
 * Ground-truth labeling CLI (M15):
 *   npm run eval:label -- <tape.posetape.json> --reps N [--bottoms i,j,k]
 *     --by <labeler> --method <how> [--notes "..."]
 *
 * Writes the label into meta.truth IN PLACE (frames untouched), with
 * provenance. Protocol: eval-tapes/README.md.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { labelTapeJson } from '../src/eval/labelTape'

const args = process.argv.slice(2)
const file = args[0]

function flag(name: string): string | undefined {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined
}

if (!file || file.startsWith('--')) {
  console.error(
    'usage: npm run eval:label -- <tape.posetape.json> --reps N [--bottoms i,j,k] --by <labeler> --method <how> [--notes "..."]',
  )
  process.exit(1)
}

const reps = flag('reps')
const bottoms = flag('bottoms')
const by = flag('by')
const method = flag('method')
const notes = flag('notes')

if (!by || !method) {
  console.error('--by and --method are required (label provenance)')
  process.exit(1)
}

try {
  const labeled = labelTapeJson(readFileSync(file, 'utf8'), {
    ...(reps !== undefined ? { repCount: Number(reps) } : {}),
    ...(bottoms !== undefined
      ? { bottomFrameIndices: bottoms.split(',').map(Number) }
      : {}),
    labeledBy: by,
    method,
    ...(notes ? { notes } : {}),
  })
  writeFileSync(file, labeled)
  console.log(`labeled: ${file} (reps=${reps ?? 'n/a'}, bottoms=${bottoms ?? 'n/a'})`)
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
}
