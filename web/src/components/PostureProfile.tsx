import type { PostureConcept } from '../analysis/posture/postureConcepts'

interface PostureProfileProps {
  concepts: PostureConcept[]
}

function statusGlyph(status: PostureConcept['status']): string {
  switch (status) {
    case 'ok':
      return '✓'
    case 'watch':
      return '!'
    default:
      return '—'
  }
}

function statusText(status: PostureConcept['status']): string {
  switch (status) {
    case 'ok':
      return 'Looks good'
    case 'watch':
      return 'Worth a look'
    default:
      return 'Not enough data'
  }
}

/**
 * The posture profile: coach-vocabulary concept chips that lead the
 * movement report. Each chip is an observation with confidence — the
 * numeric score stays available as the detail layer below.
 */
export function PostureProfile({ concepts }: PostureProfileProps) {
  if (concepts.length === 0) return null

  return (
    <ul className="posture-profile" aria-label="Posture profile">
      {concepts.map((c) => (
        <li key={c.id} className={`posture-chip posture-chip--${c.status}`}>
          <span className="posture-chip__badge" aria-hidden>
            {statusGlyph(c.status)}
          </span>
          <div className="posture-chip__body">
            <div className="posture-chip__head">
              <span className="posture-chip__label">{c.label}</span>
              <span className="posture-chip__status">{statusText(c.status)}</span>
            </div>
            <p className="posture-chip__observation">{c.observation}</p>
            <span
              className={`posture-chip__confidence posture-chip__confidence--${c.confidence.toLowerCase()}`}
            >
              {c.confidence} confidence
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
