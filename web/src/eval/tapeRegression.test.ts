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
    //
    // Snapshot DELIBERATELY updated in M16 (labeled-tape gate fixes,
    // docs/implementation/progress/M16 note): standing "reps" (findings #5)
    // are now REJECTED at the counter instead of counted-then-distrusted,
    // and descent evidence completes reps the FSM missed. The session-c
    // ledger moves from 12 counted / verdict invalid (4 untrusted, 26
    // phantoms) to 14 counted / verdict questionable — matching the session
    // log's own accounting (25 raw − 7 standing − 4 flexion artifacts).
    expect(replay.reps.length).toBe(14)

    expect(quality.verdict).toBe('questionable')
    expect(quality.trustedRepCount).toBe(12)
    expect(quality.untrustedRepNumbers).toEqual([1, 6])
    expect(quality.reasons.map((r) => r.id)).toEqual([
      'impossible-flexion-reps',
      'knee-less-reps',
    ])
    expect(quality.phantomCandidateCount).toBe(22)

    // Per-rep bottom frame indices — segmentation timing must not drift.
    expect(bottomFrames(replay.reps)).toEqual([
      1249, 1417, 1517, 1551, 1581, 1730, 1911, 1928, 1953, 1971, 2047, 2068,
      2402, 2478,
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
