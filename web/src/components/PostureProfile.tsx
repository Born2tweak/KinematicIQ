import type { PostureConcept } from '../analysis/posture/postureConcepts'
import type { SessionResult } from '../session/types'
import { buildVerdictEvidence } from './report/verdictEvidence'

interface PostureProfileProps {
  concepts: PostureConcept[]
  /**
   * When provided, each verdict card expands to show its supporting
   * evidence (reps analyzed/excluded, source reads, per-dimension
   * confidence). Presentation only — derived from the result, never
   * feeding back into it.
   */
  result?: SessionResult | null
}

function statusGlyph(status: PostureConcept['status']): string {
  switch (status) {
    case 'ok':
      return '✓'
    case 'watch':
      return '!'
    case 'info':
      return 'i'
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
    case 'info':
      return 'Observation'
    default:
      return 'Not enough data'
  }
}

function ConceptEvidence({
  concept,
  result,
}: {
  concept: PostureConcept
  result: SessionResult
}) {
  const evidence = buildVerdictEvidence(concept, result)
  return (
    <details className="posture-chip__evidence">
      <summary className="posture-chip__evidence-toggle">
        Show the evidence
      </summary>
      <div className="posture-chip__evidence-body">
        <p className="posture-chip__evidence-line">
          Based on {evidence.repsAnalyzed} of {evidence.repsCounted} counted
          reps.
        </p>
        {evidence.derivedFrom.length > 0 && (
          <>
            <h4 className="posture-chip__evidence-heading">Derived from</h4>
            <ul className="posture-chip__evidence-list">
              {evidence.derivedFrom.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </>
        )}
        {evidence.excludedReps.length > 0 && (
          <>
            <h4 className="posture-chip__evidence-heading">
              Excluded reps ({evidence.excludedReps.length})
            </h4>
            <ul className="posture-chip__evidence-list">
              {evidence.excludedReps.map((rep) => (
                <li key={rep.repNumber}>{rep.why}</li>
              ))}
            </ul>
          </>
        )}
        <h4 className="posture-chip__evidence-heading">Confidence, by dimension</h4>
        <ul className="posture-chip__dimensions">
          {evidence.dimensions.map((dim) => (
            <li key={dim.id} className="posture-chip__dimension">
              <div className="posture-chip__dimension-head">
                <span>{dim.label}</span>
                <span>{dim.score}%</span>
              </div>
              <div className="posture-chip__dimension-bar">
                <div
                  className="posture-chip__dimension-fill"
                  style={{ width: `${dim.score}%` }}
                  role="progressbar"
                  aria-valuenow={dim.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={dim.label}
                />
              </div>
              <p className="posture-chip__dimension-basis">{dim.basis}</p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  )
}

/**
 * The posture profile: coach-vocabulary concept chips that lead the
 * movement report. Each chip is an observation with confidence — and,
 * when the full result is provided, an expandable evidence panel.
 */
export function PostureProfile({ concepts, result = null }: PostureProfileProps) {
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
            {result && <ConceptEvidence concept={c} result={result} />}
          </div>
        </li>
      ))}
    </ul>
  )
}
