/**
 * Tape regression (M2): the official regression net for the analysis pipeline.
 *
 * Replays the owner's real session-c tape through the SAME production pipeline
 * (`replayTape` → `runPipelineOnFrames`) and locks the observable outputs a
 * refactor must not silently change: rep count, the report-level quality
 * verdict (`assessSetQuality`), and per-rep bottom frame indices.
 *
 * Any change to these snapshots is a DEFECT unless deliberately justified in a
 * milestone progress note. This complements `replayParity.test.ts` (which locks
 * live/replay determinism) by locking the actual analysis result on real data.
 *
 * The tape is athlete motion data (~10 MB, gitignored, backed up in the owner's
 * OneDrive). Assertions run only when the file is present; the suite skips
 * cleanly in environments without it, exactly like replayParity.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { deserializeTape } from './poseTape'
import { replayTape } from './replayHarness'
import { bottomFrames } from './metrics'
import { assessSetQuality } from '../session/setQualityGate'

const SESSION_C_TAPE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../eval-tapes/live-session-2026-07-05.posetape.json',
)

describe('tape regression — session-c pipeline snapshot', () => {
  const available = existsSync(SESSION_C_TAPE)
  if (!available) {
    console.log(
      `session-c tape not found at ${SESSION_C_TAPE} — skipping tape regression snapshot`,
    )
  }

  it.skipIf(!available)('locks rep count, quality verdict, and bottom frames', () => {
    const tape = deserializeTape(readFileSync(SESSION_C_TAPE, 'utf8'))
    const replay = replayTape(tape)
    const quality = assessSetQuality(replay.reps, replay.repRejections)

    // Replay configuration: live-mode, one-euro filtering, reconstructed entry.
    expect(replay.applied).toEqual({
      filtering: 'one-euro',
      entry: 'seeded-reconstructed',
    })

    // Rep count is the primary regression anchor.
    expect(replay.reps.length).toBe(12)

    // Report-level quality gate: the recording is honestly rejected as invalid
    // (findings #5/#6/#8 survive replay), with the same reasons and exclusions.
    expect(quality.verdict).toBe('invalid')
    expect(quality.trustedRepCount).toBe(8)
    expect(quality.untrustedRepNumbers).toEqual([1, 2, 3, 8])
    expect(quality.reasons.map((r) => r.id)).toEqual([
      'standing-reps-counted',
      'impossible-flexion-reps',
      'knee-less-reps',
      'artifact-heavy-set',
    ])
    expect(quality.phantomCandidateCount).toBe(26)

    // Per-rep bottom frame indices — segmentation timing must not drift.
    expect(bottomFrames(replay.reps)).toEqual([
      1098, 1161, 1249, 1417, 1517, 1551, 1581, 1730, 1911, 1953, 2047, 2402,
    ])
  })

  it.skipIf(!available)('is deterministic across repeated replays', () => {
    const tape = deserializeTape(readFileSync(SESSION_C_TAPE, 'utf8'))
    const a = replayTape(tape)
    const b = replayTape(tape)
    expect(bottomFrames(a.reps)).toEqual(bottomFrames(b.reps))
    expect(a.reps.length).toBe(b.reps.length)
  })
})
