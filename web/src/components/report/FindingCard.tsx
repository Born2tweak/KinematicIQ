import type { Finding } from '../../core/finding'
import { ConfidenceBadge } from '../ConfidenceBadge'
import { buildFindingCardModel } from './findingCardModel'

interface FindingCardProps {
  finding: Finding
  /** Render the rule-provenance line (M50). Evidence/Expert only — never Summary. */
  showProvenance?: boolean
}

/**
 * A single finding rendered as a card: observation-language statement, its
 * metric evidence chain, a confidence badge, and the keyed cue (M8).
 */
export function FindingCard({ finding, showProvenance = false }: FindingCardProps) {
  const model = buildFindingCardModel(finding, { showProvenance })
  return (
    <article className={`finding-card finding-card--${finding.priority}`}>
      <div className="finding-card__header">
        <p className="finding-card__statement">{model.statement}</p>
        <ConfidenceBadge level={model.confidenceLevel} />
      </div>
      {model.evidence.length > 0 && (
        <ul className="finding-card__evidence">
          {model.evidence.map((line, index) => (
            <li key={index} className="finding-card__evidence-item">
              {line}
            </li>
          ))}
        </ul>
      )}
      {model.tryNext && (
        <p className="finding-card__try-next">
          <span className="finding-card__try-next-label">Try next:</span>{' '}
          {model.tryNext}
        </p>
      )}
      {model.provenance && (
        <p className="finding-card__provenance">{model.provenance}</p>
      )}
    </article>
  )
}
