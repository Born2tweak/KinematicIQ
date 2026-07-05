/**
 * Replay parity (finding #7): the same tape must reproduce the live session —
 * same rep count, same phases, same candidates and rejections, same metrics.
 * This is what makes pose tapes usable as regression fixtures; the whole
 * validation strategy depends on it.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { deserializeTape } from './poseTape'
import { replayTape } from './replayHarness'
import {
  simulateLiveSession,
  syntheticSessionKneeScript,
  syntheticSquatFrame,
} from '../test/helpers/liveSessionSim'

const FRAME_MS = 66 // ~15fps, matching live capture cadence

function syntheticRawFrames() {
  return syntheticSessionKneeScript(3).map((kneeAngleDeg, index) =>
    syntheticSquatFrame({
      frameIndex: index,
      timestamp: index * FRAME_MS,
      kneeAngleDeg,
    }),
  )
}

describe('replayTape live parity (synthetic session)', () => {
  it('reproduces the live session exactly: reps, phases, rejections, metrics', () => {
    const live = simulateLiveSession(syntheticRawFrames())
    // Sanity: the simulated session actually counted the squats.
    expect(live.reps.length).toBe(3)
    expect(live.entryState).not.toBeNull()
    expect(live.entryState!.activatedByDescent).toBe(true)

    const replay = replayTape(live.tape)
    expect(replay.applied.entry).toBe('seeded-from-meta')
    expect(replay.applied.filtering).toBe('one-euro')

    // Rep-level parity: identical counts and identical per-rep metrics.
    expect(replay.reps.length).toBe(live.reps.length)
    expect(replay.reps).toEqual(live.reps)

    // Rejection parity: same candidates rejected by the same gates.
    expect(replay.repRejections).toEqual(live.rejections)

    // Phase parity: the FSM walked the same phases frame by frame.
    expect(replay.frameTrace.map((s) => s.phase)).toEqual(live.phases)
  })

  it('is deterministic: replaying the same tape twice is identical', () => {
    const live = simulateLiveSession(syntheticRawFrames())
    const a = replayTape(live.tape)
    const b = replayTape(live.tape)
    expect(a.reps).toEqual(b.reps)
    expect(a.repRejections).toEqual(b.repRejections)
    expect(a.frameTrace).toEqual(b.frameTrace)
  })

  it('cold mode differs from live mode only in entry/filtering, not determinism', () => {
    const live = simulateLiveSession(syntheticRawFrames())
    const cold = replayTape(live.tape, { mode: 'cold' })
    expect(cold.applied).toEqual({ filtering: 'none', entry: 'cold' })
    const coldAgain = replayTape(live.tape, { mode: 'cold' })
    expect(cold.reps).toEqual(coldAgain.reps)
  })

  it('never re-filters a tape whose frames were saved post-filter', () => {
    const live = simulateLiveSession(syntheticRawFrames())
    const legacyTape = {
      ...live.tape,
      meta: { ...live.tape.meta, framesFiltered: true },
    }
    const replay = replayTape(legacyTape)
    expect(replay.applied.filtering).toBe('none')
  })
})

// ── Real session-c tape (owner's 2026-07-04 recording) ─────────────
// The tape is athlete motion data and lives outside git (eval-tapes/,
// backed up in the owner's OneDrive ShareX folder). Assertions run only
// when the file is present; the synthetic suite above always runs.

const SESSION_C_TAPE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../eval-tapes/live-session-2026-07-05.posetape.json',
)

describe('replayTape on the real session-c tape', () => {
  const available = existsSync(SESSION_C_TAPE)
  if (!available) {
    console.log(`session-c tape not found at ${SESSION_C_TAPE} — skipping real-tape parity assertions`)
  }

  it.skipIf(!available)('replays deterministically under live mode', () => {
    const tape = deserializeTape(readFileSync(SESSION_C_TAPE, 'utf8'))
    const a = replayTape(tape)
    const b = replayTape(tape)
    expect(a.reps).toEqual(b.reps)
    expect(a.repRejections).toEqual(b.repRejections)
    expect(a.applied.filtering).toBe('one-euro')
    // Pre-entry-state tape: replay reconstructs activation from frame 0.
    expect(a.applied.entry).toBe('seeded-reconstructed')
  })

  it.skipIf(!available)(
    'reproduces the false-positive families the live session showed (findings #5/#6/#8)',
    () => {
      const tape = deserializeTape(readFileSync(SESSION_C_TAPE, 'utf8'))
      const { reps } = replayTape(tape)
      const bottoms = reps.map((rep) =>
        rep.minLeftKneeAngle === null && rep.minRightKneeAngle === null
          ? null
          : Math.min(rep.minLeftKneeAngle ?? 999, rep.minRightKneeAngle ?? 999),
      )
      // Standing bottoms (finding #5), knee-less rep (finding #8), and
      // extreme-flexion artifacts (finding #6) all survive replay — the
      // tape is a usable regression fixture for the open findings.
      expect(bottoms.some((b) => b !== null && b >= 170)).toBe(true)
      expect(bottoms.some((b) => b === null)).toBe(true)
      expect(bottoms.some((b) => b !== null && b <= 30)).toBe(true)
    },
  )
})
