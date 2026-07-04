/**
 * Browser download of a pose tape as JSON — the capture path for the
 * Scientific Validation dataset (docs/strategy/validation-strategy.md):
 * a recorded session becomes a replayable tape that eval/replayHarness
 * and future labeling tooling consume.
 */
import { serializeTape, type PoseTape } from './poseTape'

/** Derive a safe .posetape.json filename from the tape's label. */
export function tapeFilename(tape: PoseTape): string {
  const base = (tape.meta.label ?? 'session')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  const stamp = (tape.meta.recordedAt ?? new Date().toISOString()).slice(0, 10)
  return `${base || 'session'}-${stamp}.posetape.json`
}

/** Trigger a client-side download of the tape. DOM-only; no upload occurs. */
export function downloadTape(tape: PoseTape): void {
  const blob = new Blob([serializeTape(tape)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  try {
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = tapeFilename(tape)
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}
