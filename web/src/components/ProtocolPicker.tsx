import { useNavigate } from 'react-router-dom'
import { listProtocols } from '../protocols/registry'
import { groupProtocolDefinitions } from './protocolPickerModel'

const KIND_LABELS: Record<string, string> = {
  cyclic: 'rep-based',
  ballistic: 'flight & landing',
  gait: 'stride-based',
}

export function ProtocolPicker() {
  const navigate = useNavigate()
  const groups = groupProtocolDefinitions(listProtocols().map(({ definition }) => definition))

  return (
    <div className="protocol-picker" aria-label="Movement protocols">
      <section className="protocol-picker__group" aria-labelledby="available-movements">
        <h3 id="available-movements">Available now</h3>
        <div className="protocol-picker__grid" role="list">
          {groups.available.map((definition) => (
            <div key={definition.id} role="listitem" className="protocol-card-listitem">
              <button type="button" className="protocol-card"
                onClick={() => navigate('/camera', { state: { protocolId: definition.id } })}>
                <span className="protocol-card__label">{definition.label}</span>
                <span className="protocol-card__kind">{KIND_LABELS[definition.kind] ?? definition.kind}</span>
                <span className="protocol-card__status protocol-card__status--available">Available</span>
                <span className="protocol-card__instruction">{definition.capture.viewInstruction}</span>
                <span className="protocol-card__setup">{definition.capture.setupInstructions[0]}</span>
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="protocol-picker__group" aria-labelledby="research-movements">
        <h3 id="research-movements">Research roadmap</h3>
        <p className="protocol-picker__description">These movements are not validated and cannot start an analysis.</p>
        <div className="protocol-picker__grid" role="list">
          {groups.research.map((definition) => (
            <article key={definition.id} role="listitem" className="protocol-card protocol-card--planned">
              <span className="protocol-card__label">{definition.label}</span>
              <span className="protocol-card__kind">{KIND_LABELS[definition.kind] ?? definition.kind}</span>
              <span className="protocol-card__status protocol-card__status--planned">Research only — validation pending</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
