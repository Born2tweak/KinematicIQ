/**
 * Capture identity.
 *
 * A capture id names one ingestion run. It was previously the uploaded file's
 * name, which is neither unique (two people upload `IMG_0042.MOV`) nor stable
 * (the same recording renamed becomes a different capture) nor present (a live
 * session has no file at all). Worse, a filename is athlete-supplied text that
 * ends up inside exported evidence.
 *
 * The id generated here is opaque and carries no personal information. The
 * human-readable label stays a separate field on the pose tape, where it is
 * understood to be a label and not an identifier.
 */

/** Source-kind prefix, so an id is legible in a log without being parsed. */
export type CaptureIdPrefix = 'upload' | 'live' | 'replay' | 'fixture'

/**
 * Mint an id for one capture.
 *
 * Uses `crypto.randomUUID` where available and falls back to
 * `getRandomValues`, which every browser this app supports has. There is no
 * `Math.random` path: a collision here silently merges two captures, and a
 * thrown error is a far better outcome than that.
 */
export function newCaptureId(prefix: CaptureIdPrefix): string {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi) {
    throw new Error('Capture ids require the Web Crypto API, which is unavailable here.')
  }
  if (typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}-${cryptoApi.randomUUID()}`
  }
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16))
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${prefix}-${hex}`
}
