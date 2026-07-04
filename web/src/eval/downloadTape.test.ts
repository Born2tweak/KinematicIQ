import { describe, expect, it } from 'vitest'
import { tapeFilename } from './downloadTape'
import { createTape, deserializeTape, serializeTape } from './poseTape'
import { clearSessionTape, getSessionTape, storeSessionTape } from './tapeStore'

const tape = (label?: string, recordedAt?: string) =>
  createTape([], { fps: 15, label, source: 'upload', recordedAt })

describe('tapeFilename', () => {
  it('slugifies the label and appends the capture date', () => {
    expect(tapeFilename(tape('Squat Set 3.mp4', '2026-07-04T10:00:00Z'))).toBe(
      'squat-set-3-2026-07-04.posetape.json',
    )
  })

  it('falls back to a generic name when the label is missing or empty', () => {
    expect(tapeFilename(tape(undefined, '2026-07-04T10:00:00Z'))).toBe(
      'session-2026-07-04.posetape.json',
    )
    expect(tapeFilename(tape('...', '2026-07-04T10:00:00Z'))).toBe(
      'session-2026-07-04.posetape.json',
    )
  })
})

describe('tapeStore', () => {
  it('stores, returns, and clears the session tape', () => {
    clearSessionTape()
    expect(getSessionTape()).toBeNull()

    const stored = tape('a.mp4', '2026-07-04T10:00:00Z')
    storeSessionTape(stored)
    expect(getSessionTape()).toBe(stored)

    clearSessionTape()
    expect(getSessionTape()).toBeNull()
  })
})

describe('tape meta round-trip', () => {
  it('preserves recordedAt through serialize/deserialize', () => {
    const original = tape('a.mp4', '2026-07-04T10:00:00Z')
    const roundTripped = deserializeTape(serializeTape(original))
    expect(roundTripped.meta.recordedAt).toBe('2026-07-04T10:00:00Z')
  })
})
