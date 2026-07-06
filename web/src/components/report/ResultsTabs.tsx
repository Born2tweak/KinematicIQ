import { RESULTS_TABS, type ResultsTabId } from './resultsTabsModel'

interface ResultsTabsProps {
  active: ResultsTabId
  onChange: (id: ResultsTabId) => void
}

/** Presentational progressive-disclosure tab bar (Summary / Evidence / Expert). */
export function ResultsTabs({ active, onChange }: ResultsTabsProps) {
  return (
    <div className="results-tabs" role="tablist" aria-label="Report detail level">
      {RESULTS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`results-tab${active === tab.id ? ' results-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
