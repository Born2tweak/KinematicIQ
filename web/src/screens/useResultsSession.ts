/**
 * Session identity for the Results screen (P2).
 *
 * Before this, a finished analysis existed only inside `location.state`. A
 * refresh, a pasted link, or a History row all rendered the empty "no session
 * yet" card, because there was no address for a session and no way to read one
 * back. This hook makes `/results/:sessionId` canonical:
 *
 *   1. An analysis hands off at `/results` carrying its result in router state.
 *   2. The result is persisted immediately (ADR-018) and the URL is REPLACED
 *      with `/results/:id`, so Back does not return to a dead hand-off entry.
 *   3. `/results/:id` with no router state reads the record from the store.
 *
 * Persistence is automatic and local. `buildStoredSession` mints the id, so
 * the id in the URL is the record's own primary key rather than a second
 * identifier that could drift from it.
 */
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { buildStoredSession, getSessionStore } from '../storage/sessionStore'
import { getCaptureMediaStore } from '../media/captureMediaStore'
import { takePendingCapture } from '../media/pendingCapture'
import { storeSessionTape } from '../eval/tapeStore'
import type { PoseTape } from '../eval/poseTape'
import type { SessionResult } from '../session/types'

export type ResultsSessionState =
  | { status: 'loading' }
  /** No session in state, no id in the URL, or no record for that id. */
  | { status: 'missing' }
  | {
      status: 'ready'
      result: SessionResult
      sessionId: string | null
      /** False only when the automatic local write failed (private mode, quota). */
      stored: boolean
      /**
       * The session's own source footage, when it has any. Null is an ordinary
       * outcome — a replayed pose tape has no video, a browser may refuse to
       * record, and the report never depends on it.
       */
      media: Blob | null
      /** Landmarks for the replay, restored on reload. Null when unavailable. */
      tape: PoseTape | null
    }

export function useResultsSession(): ResultsSessionState {
  const location = useLocation()
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const handedOff = (location.state as { result?: SessionResult } | null)?.result

  const [state, setState] = useState<ResultsSessionState>(() =>
    handedOff
      ? {
          status: 'ready',
          result: handedOff,
          sessionId: sessionId ?? null,
          stored: false,
          media: null,
          tape: null,
        }
      : { status: 'loading' },
  )

  /**
   * The in-flight (or settled) write for the current hand-off.
   *
   * One write per result — StrictMode invokes this effect twice in dev, and
   * minting a record inside the effect body would persist the same set twice
   * under two ids. Caching the PROMISE rather than a "done" flag is what makes
   * that safe: the second invocation must still subscribe and receive the id,
   * because the first invocation's subscription was already cancelled by its
   * own cleanup. A boolean guard leaves the screen believing the write failed.
   */
  const persistRef = useRef<{
    result: SessionResult
    captured: ReturnType<typeof takePendingCapture>
    write: Promise<string>
  } | null>(null)

  // Latest state, readable inside the effect without making `state` a
  // dependency (which would re-run the effect on every transition it causes).
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    let cancelled = false

    // Path 1: a fresh analysis. Persist, then take on its id.
    if (handedOff) {
      if (persistRef.current?.result !== handedOff) {
        const record = buildStoredSession(handedOff)
        // Drain the capture artifacts ONCE, outside the write promise: `take`
        // clears as it reads, so calling it on StrictMode's second invocation
        // would find nothing and silently drop the video.
        const captured = takePendingCapture()
        persistRef.current = {
          result: handedOff,
          captured,
          write: getSessionStore()
            .save(record)
            .then(async () => {
              // Media is best-effort and strictly secondary to the report: a
              // quota failure on a 20 MB video must not fail the session
              // write, so it is caught separately and reported as absent.
              const mediaStore = getCaptureMediaStore()
              if (captured.media) {
                await mediaStore
                  .saveMedia({
                    sessionId: record.id,
                    blob: captured.media.blob,
                    mimeType: captured.media.mimeType,
                    source: captured.media.source,
                    durationMs: captured.media.durationMs,
                    sizeBytes: captured.media.blob.size,
                  })
                  .catch(() => undefined)
              }
              if (captured.tape) {
                await mediaStore
                  .saveTape({ sessionId: record.id, tape: captured.tape })
                  .catch(() => undefined)
              }
              return record.id
            }),
        }
      }
      const captured = persistRef.current.captured
      persistRef.current.write
        .then((id) => {
          if (cancelled) return
          setState({
            status: 'ready',
            result: handedOff,
            sessionId: id,
            stored: true,
            media: captured.media?.blob ?? null,
            tape: captured.tape,
          })
          // Replace, don't push: the hand-off entry holds a result object that
          // will not survive a reload, so it must not stay in history.
          navigate(`/results/${id}`, { replace: true, state: null })
        })
        .catch(() => {
          if (cancelled) return
          // A failed local write must never cost the athlete the report they
          // are already looking at — show it, and say it was not stored.
          setState({
            status: 'ready',
            result: handedOff,
            sessionId: null,
            stored: false,
            media: captured.media?.blob ?? null,
            tape: captured.tape,
          })
        })
      return () => {
        cancelled = true
      }
    }

    // Path 2: an addressed session. Read it back from this device.
    if (sessionId) {
      // ...unless this is the redirect that just happened. The replace in
      // path 1 clears the router state, so this effect immediately re-runs
      // with an id and no hand-off — re-reading IndexedDB there would flash
      // the loading state over a report already on screen (visible on slower
      // engines) and cost a pointless round-trip for a result we hold.
      if (stateRef.current.status === 'ready' && stateRef.current.sessionId === sessionId) {
        return
      }
      setState({ status: 'loading' })
      getSessionStore()
        .get(sessionId)
        .then(async (record) => {
          if (!record) return null
          // Artifacts are optional and independently recoverable: a report
          // whose video failed to store still reloads with its landmarks, and
          // one with neither still reloads as a report.
          const mediaStore = getCaptureMediaStore()
          const [media, tape] = await Promise.all([
            mediaStore.getMedia(record.id).catch(() => null),
            mediaStore.getTape(record.id).catch(() => null),
          ])
          return { record, media, tape }
        })
        .then((loaded) => {
          if (cancelled) return
          if (!loaded) {
            setState({ status: 'missing' })
            return
          }
          // The replay harness reads the tape from this module-level store;
          // restoring it here is what makes the player work after a reload.
          if (loaded.tape) storeSessionTape(loaded.tape)
          setState({
            status: 'ready',
            result: loaded.record.result,
            sessionId: loaded.record.id,
            stored: true,
            media: loaded.media?.blob ?? null,
            tape: loaded.tape,
          })
        })
        .catch(() => {
          if (!cancelled) setState({ status: 'missing' })
        })
      return () => {
        cancelled = true
      }
    }

    setState({ status: 'missing' })
    return () => {
      cancelled = true
    }
  }, [handedOff, sessionId, navigate])

  return state
}
