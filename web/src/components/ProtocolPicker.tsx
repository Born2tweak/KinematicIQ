import { useNavigate } from 'react-router-dom'
import { isAvailable } from '../core/protocol'
import { listProtocols } from '../protocols/registry'

const KIND_LABELS: Record<string, string> = {
  cyclic: 'rep-based',
  ballistic: 'flight & landing',
  gait: 'stride-based',
}

/**
 * Minimal protocol picker (M10). Available protocols start a session; planned
 * stubs are honestly labelled "in development — not yet validated" and cannot
 * start an analysis (the engine would throw NotImplementedError anyway).
 */
export function ProtocolPicker() {
  const navigate = useNavigate()
  const protocols = listProtocols()

  return (
    <div className="protocol-picker" role="list" aria-label="Movement protocols">
      {protocols.map(({ definition }) => {
        const available = isAvailable(definition)
        return (
          <button
            key={definition.id}
            role="listitem"
            type="button"
            className={`protocol-card${available ? '' : ' protocol-card--planned'}`}
            disabled={!available}
            aria-disabled={!available}
            onClick={available ? () => navigate('/camera') : undefined}
          >
            <span className="protocol-card__label">{definition.label}</span>
            <span className="protocol-card__kind">
              {KIND_LABELS[definition.kind] ?? definition.kind}
            </span>
            <span
              className={`protocol-card__status protocol-card__status--${definition.status}`}
            >
              {available ? 'Available' : 'In development — not yet validated'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
