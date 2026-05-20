import { Button } from '../components/Button'
import { Card } from '../components/Card'

const mockResult = {
  summary: 'Good squat depth with minor left knee drift detected during descent.',
  confidence: 87,
  details: [
    { label: 'Knee angle symmetry', value: '92% balanced' },
    { label: 'Trunk lean', value: '8° forward' },
    { label: 'Rep quality', value: 'Strong (4/5 reps)' },
  ],
} as const

export function ResultsScreen() {
  return (
    <div className="stack-lg">
      <h1 className="page-title">Results</h1>

      <Card className="result-card">
        <p className="result-card__summary">{mockResult.summary}</p>

        <div className="confidence">
          <div className="confidence__header">
            <span className="confidence__label">Confidence</span>
            <span className="confidence__value">{mockResult.confidence}%</span>
          </div>
          <div className="confidence__bar">
            <div
              className="confidence__fill"
              style={{ width: `${mockResult.confidence}%` }}
              role="progressbar"
              aria-valuenow={mockResult.confidence}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        <div className="detail-rows">
          {mockResult.details.map((row) => (
            <div key={row.label} className="detail-row">
              <span className="detail-row__label">{row.label}</span>
              <span className="detail-row__value">{row.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="results-actions">
        <Button to="/camera" variant="primary">
          Scan Again
        </Button>
        <Button to="/" variant="secondary">
          Back Home
        </Button>
      </div>
    </div>
  )
}
