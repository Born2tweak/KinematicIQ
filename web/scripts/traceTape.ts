// Ad-hoc diagnostic: dump per-frame phase/knee/hip around given frames.
import { readFileSync } from 'node:fs'
import { deserializeTape } from '../src/eval/poseTape'
import { replayTape } from '../src/eval/replayHarness'

const [file, fromArg, toArg] = process.argv.slice(2)
const from = Number(fromArg ?? 0)
const to = Number(toArg ?? from + 60)

const log = console.log
console.log = () => {}
const tape = deserializeTape(readFileSync(file, 'utf8'))
const replay = replayTape(tape)
console.log = log

for (const s of replay.frameTrace) {
  if (s.frameIndex >= from && s.frameIndex <= to) {
    log(JSON.stringify(s))
  }
}
log(`reps at: ${replay.reps.map((r) => `#${r.repNumber}@${r.bottomFrameIndex}`).join(' ')}`)
for (const r of replay.repRejections) {
  log(`REJ ${r.reason} frames ${r.startFrameIndex}-${r.endFrameIndex} minL=${r.values.minLeftKneeAngle?.toFixed(0)} minR=${r.values.minRightKneeAngle?.toFixed(0)} hipDrop=${r.values.maxHipDrop.toFixed(3)} reached=${r.values.reachedBottom}`)
}
