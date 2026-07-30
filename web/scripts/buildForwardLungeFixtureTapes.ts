/**
 * Generate labelled SYNTHETIC forward-lunge pose tapes for browser verification.
 *
 * No real forward-lunge recording exists in this repository — the eval-tapes
 * suite is entirely squat footage — so the upload path is verified against
 * generated landmark sequences instead. Every tape written here says so in its
 * filename, its `meta.label`, and its `meta.source`, because a synthetic tape
 * must never be mistaken for participant evidence (ADR-016 residual risks,
 * ADR-017 scope).
 *
 * Run from `web/`:  npm run fixtures:forward-lunge
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTape, serializeTape } from '../src/eval/poseTape'
import { buildSyntheticInlineLungeFrames } from '../src/protocols/inlineLunge/fixtures'
import { FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID } from '../src/core/protocol'

const FPS = 30

interface FixtureCase {
  file: string
  label: string
  protocolId: string
  frames: ReturnType<typeof buildSyntheticInlineLungeFrames>
}

const cases: FixtureCase[] = [
  {
    file: 'SYNTHETIC-forward-lunge-3-trials-left.posetape.json',
    label: 'SYNTHETIC forward lunge — 3 complete left-lead trials (generated, not a recording)',
    protocolId: FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID,
    frames: buildSyntheticInlineLungeFrames({ leadSide: 'left', trials: 3 }),
  },
  {
    file: 'SYNTHETIC-forward-lunge-standing-only.posetape.json',
    label: 'SYNTHETIC forward lunge — standing only, no step (generated, not a recording)',
    protocolId: FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID,
    frames: buildSyntheticInlineLungeFrames({ standingFrames: 60, trials: 0 }),
  },
  {
    file: 'SYNTHETIC-forward-lunge-low-visibility.posetape.json',
    label: 'SYNTHETIC forward lunge — 3 trials then sustained landmark loss (generated, not a recording)',
    protocolId: FORWARD_LUNGE_OBSERVATION_PROTOCOL_ID,
    frames: buildSyntheticInlineLungeFrames({ trials: 3, trailingUnreadableFrames: 140 }),
  },
  {
    file: 'SYNTHETIC-wrong-observation-protocol.posetape.json',
    label: 'SYNTHETIC tape declaring the front-view squat observation protocol (generated, not a recording)',
    protocolId: 'front-view-squat-v1',
    frames: buildSyntheticInlineLungeFrames({ trials: 3 }),
  },
]

const outputDirectory = resolve('../eval-tapes')
mkdirSync(outputDirectory, { recursive: true })

for (const item of cases) {
  const tape = createTape(item.frames, {
    fps: FPS,
    label: item.label,
    source: 'synthetic',
    recordedAt: new Date(0).toISOString(),
    protocolId: item.protocolId,
    filtering: 'raw',
    framesFiltered: false,
  })
  const path = resolve(outputDirectory, item.file)
  writeFileSync(path, `${serializeTape(tape)}\n`, 'utf8')
  process.stdout.write(`${item.file} — ${item.frames.length} frames\n`)
}
