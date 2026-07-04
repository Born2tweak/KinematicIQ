/**
 * Holds the pose tape of the most recent analysis session so the results
 * screen can offer it for download (analyst mode). Module-level by design:
 * a tape is a few MB of raw landmarks and does not belong in router state
 * or persistent storage — it lives exactly as long as the session it came
 * from, replaced by the next analysis.
 */
import type { PoseTape } from './poseTape'

let sessionTape: PoseTape | null = null

export function storeSessionTape(tape: PoseTape): void {
  sessionTape = tape
}

export function getSessionTape(): PoseTape | null {
  return sessionTape
}

export function clearSessionTape(): void {
  sessionTape = null
}
