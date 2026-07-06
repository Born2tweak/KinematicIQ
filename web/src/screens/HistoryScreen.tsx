import { useCallback, useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { buildHistoryRows, historyObservation } from '../storage/historyView'
import { getSessionStore, type StoredSession } from '../storage/sessionStore'

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

      <p className="results-panel__intro">
        Sessions you chose to save, stored only in this browser. Nothing leaves
        this device.
      </p>

      {sessions !== null && rows.length === 0 && (
        <Card
          title="No saved sessions"
          subtitle="Finish a set and tap “Save to history” on the results page."
        />
      )}

      {observation !== null && (
        <p className="results-alert results-alert--info" role="status">
          {observation}
        </p>
      )}

      {rows.length > 0 && (
        <ul className="history-list" aria-label="Saved sessions">
          {rows.map((row) => (
            <li key={row.id} className="history-row">
              <div className="history-row__head">
                <span className="history-row__protocol">{row.protocolId}</span>
                <span className="history-row__date">{row.dateLabel}</span>
              </div>
              <span className="history-row__detail">
                {row.repCount} reps ({row.trustedRepCount} trusted) · recording{' '}
                {row.verdict} · camera confidence {row.confidenceLevel}
              </span>
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
