import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { buildHistoryRows, historyObservation } from '../storage/historyView'
import { getSessionStore, type StoredSession } from '../storage/sessionStore'
import { getCaptureMediaStore } from '../media/captureMediaStore'

/**
 * Local session history (M9). Everything shown here lives in this browser's
 * IndexedDB only — no accounts, no cloud, and a one-tap delete-all control.
 */
export function HistoryScreen() {
  const [sessions, setSessions] = useState<StoredSession[] | null>(null)

  const refresh = useCallback(async () => {
    setSessions(await getSessionStore().list())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleDeleteAll = useCallback(async () => {
    if (!window.confirm('Delete all saved sessions from this device?')) return
    await getSessionStore().deleteAll()
    // Source video and pose tapes live in their own database (P3). Deleting
    // only the reports would leave the actual footage on the device — the
    // opposite of what this control promises, and the more sensitive half.
    await getCaptureMediaStore().deleteAll()
    await refresh()
  }, [refresh])

  const rows = sessions === null ? [] : buildHistoryRows(sessions)
  const observation = sessions === null ? null : historyObservation(sessions)

  return (
    <div className="results-page stack-lg">
      <header className="results-page__header report-header">
        <div className="report-header__titles">
          <p className="landing-eyebrow">Local history</p>
          <h1 className="page-title">Saved sessions</h1>
        </div>
      </header>

      {/* Sessions are stored automatically as of ADR-018 — this copy used to
          describe a "Save to history" tap that no longer exists. */}
      <p className="results-panel__intro">
        Every completed analysis, stored automatically in this browser only —
        including the video, when one was kept. Nothing leaves this device, and
        deleting a session deletes its footage with it.
      </p>

      {sessions !== null && rows.length === 0 && (
        <Card
          title="No sessions yet"
          subtitle="Record or upload a movement — the analysis is saved here automatically when it finishes."
        />
      )}

      {observation !== null && (
        <p className="results-alert results-alert--info" role="status">
          {observation}
        </p>
      )}

      {rows.length > 0 && (
        <ul className="history-list" aria-label="Saved sessions">
          {/* The row opens the stored report at its canonical address. The
              dense sortable table, labels, and per-row delete land in P6;
              this is the link that makes `/results/:id` real from here. */}
          {rows.map((row) => (
            <li key={row.id} className="history-row">
              <Link to={`/results/${row.id}`} className="history-row__link">
                <div className="history-row__head">
                  <span className="history-row__protocol">{row.protocolId}</span>
                  <span className="history-row__date">{row.dateLabel}</span>
                </div>
                <span className="history-row__detail">
                  {row.repCount} reps ({row.trustedRepCount} trusted) · recording{' '}
                  {row.verdict} · camera confidence {row.confidenceLevel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="results-actions">
        <Button to="/camera" variant="primary">
          Record a set
        </Button>
        {rows.length > 0 && (
          <Button variant="secondary" onClick={() => void handleDeleteAll()}>
            Delete all saved sessions
          </Button>
        )}
      </div>
    </div>
  )
}
