/**
 * Self-contained HTML rendering for the exported session report (M33).
 *
 * The output is a single .html file with inline CSS, no scripts, no external
 * fonts, images, or network requests of any kind — it must open identically
 * from a local disk with networking disabled. All dynamic text is escaped.
 *
 * Copy rules: observation language only, disclaimer up top, validation tiers
 * shown per metric, and the invalid/questionable abstain state reproduced
 * exactly as the results screen renders it (docs/doctrine/claims-policy.md).
 */
import type { ExportedSessionReport } from './sessionReport'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formatValue(value: number | null, unit: string): string {
  if (value === null) return 'not readable'
  if (unit === 'deg') return `${round2(value)}°`
  if (unit === 'percent') return `${round2(value)}%`
  return `${round2(value)} ${unit}`
}

function listItems(items: readonly string[]): string {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
}

function section(title: string, body: string): string {
  return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`
}

function qualitySection(report: ExportedSessionReport): string {
  const { quality } = report
  const abstained = quality.verdict === 'invalid'
  const heading = abstained
    ? 'Why there is no movement report'
    : `Recording quality: ${quality.verdict}`
  let body = ''
  if (abstained) {
    body +=
      '<p>This recording could not support a trustworthy read, so posture ' +
      'reads, metric summaries, and coaching are withheld — only the reasons, ' +
      'capture fixes, and the rep audit below are exported.</p>'
  }
  if (quality.reasons.length > 0) {
    body += `<ul>${listItems(quality.reasons.map((r) => r.detail))}</ul>`
  }
  if (quality.captureFixes.length > 0) {
    body +=
      '<h3>How to get a trustworthy report next set</h3>' +
      `<ul>${listItems(quality.captureFixes)}</ul>`
  }
  if (quality.untrustedReps.length > 0) {
    body +=
      '<h3>Reps set aside</h3>' +
      `<ul>${listItems(quality.untrustedReps.map((rep) => rep.detail))}</ul>`
  }
  if (body === '') {
    body = '<p>No quality concerns were recorded for this set.</p>'
  }
  return section(heading, body)
}

function findingsSection(report: ExportedSessionReport): string {
  const findings = report.movement?.findings ?? []
  if (findings.length === 0) return ''
  const cards = findings
    .map((finding) => {
      const evidence = finding.evidence
        .map((ref) => `<li>${escapeHtml(ref.observed)}</li>`)
        .join('')
      const tryNext = finding.tryNext
        ? `<p><strong>Try next:</strong> ${escapeHtml(finding.tryNext)}</p>`
        : ''
      return (
        '<article class="finding">' +
        `<p>${escapeHtml(finding.statement)}</p>` +
        `<p class="meta">Confidence: ${escapeHtml(finding.confidence.level)}</p>` +
        (evidence ? `<ul class="meta">${evidence}</ul>` : '') +
        tryNext +
        '</article>'
      )
    })
    .join('')
  return section('What stood out', cards)
}

function metricsSection(report: ExportedSessionReport): string {
  const results = report.movement?.metricResults ?? []
  if (results.length === 0) return ''
  const rows = results
    .map(
      (metric) =>
        '<tr>' +
        `<td>${escapeHtml(metric.label)}</td>` +
        `<td>${escapeHtml(formatValue(metric.value, metric.unit))}</td>` +
        `<td>${escapeHtml(metric.confidence.level)}</td>` +
        `<td>${escapeHtml(metric.validationTier)}</td>` +
        '</tr>',
    )
    .join('')
  const table =
    '<table><thead><tr><th>Metric</th><th>Value</th><th>Confidence</th>' +
    `<th>Validation tier</th></tr></thead><tbody>${rows}</tbody></table>` +
    `<p class="meta">${escapeHtml(report.validationTierNote)}</p>`
  return section('Measured metrics', table)
}

function baselineSection(report: ExportedSessionReport): string {
  const baseline = report.movement?.baseline ?? null
  if (baseline === null || baseline.deltas.length === 0) return ''
  const rows = baseline.deltas
    .map((delta) => {
      const change = delta.change
        ? escapeHtml(
            delta.change.classification === 'within-noise'
              ? 'within noise'
              : delta.change.classification === 'possible-change'
                ? 'possible change'
                : 'not judged',
          )
        : ''
      return (
        '<tr>' +
        `<td>${escapeHtml(delta.label)}</td>` +
        `<td>${escapeHtml(formatValue(delta.baselineValue, delta.unit))}</td>` +
        `<td>${escapeHtml(formatValue(delta.currentValue, delta.unit))}</td>` +
        `<td>${delta.delta >= 0 ? '+' : ''}${round2(delta.delta)}</td>` +
        `<td>${change}</td>` +
        '</tr>'
      )
    })
    .join('')
  const intro =
    `<p>Compared against ${baseline.sessionCount} of this athlete's own saved ` +
    'sessions — not anyone else&#39;s numbers. Differences are checked against ' +
    'provisional noise thresholds (heuristic, not validated reliability data), ' +
    'so &quot;possible change&quot; is the strongest language offered.</p>'
  return section(
    'Compared to your baseline',
    intro +
      '<table><thead><tr><th>Metric</th><th>Baseline</th><th>This set</th>' +
      `<th>Delta</th><th>Read</th></tr></thead><tbody>${rows}</tbody></table>`,
  )
}

function repAuditSection(report: ExportedSessionReport): string {
  if (report.repAudit.length === 0) return ''
  const rows = report.repAudit
    .map(
      (rep) =>
        '<tr>' +
        `<td>Rep ${rep.repNumber}</td>` +
        `<td>${escapeHtml(formatValue(rep.bottomKneeAngleDeg, 'deg'))}</td>` +
        `<td>${escapeHtml(formatValue(rep.avgTrunkLeanDeg, 'deg'))}</td>` +
        '</tr>',
    )
    .join('')
  return section(
    'Rep audit',
    '<table><thead><tr><th>Rep</th><th>Bottom knee angle</th>' +
      `<th>Avg trunk lean</th></tr></thead><tbody>${rows}</tbody></table>`,
  )
}

function provenanceSection(report: ExportedSessionReport): string {
  const { provenance } = report
  const rows: Array<[string, string | undefined]> = [
    ['Protocol', report.protocolId],
    ['Capture source', provenance.captureSource],
    ['Pose model', provenance.modelVersion],
    ['Filtering', provenance.filterVariant],
    ['Recorded at', provenance.recordedAt],
    ['Tape id', provenance.tapeId],
    ['App version', report.appVersion],
    ['Report schema', `v${report.schemaVersion}`],
    ['Claims policy', report.claimPolicyVersion],
    ['Generated at', report.generatedAt],
  ]
  const items = rows
    .filter((row): row is [string, string] => row[1] !== undefined)
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return section('Provenance', `<table><tbody>${items}</tbody></table>`)
}

const REPORT_CSS = `
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 46rem;
         padding: 0 1rem; color: #1a1a1a; line-height: 1.5; }
  h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; border-bottom: 1px solid #ddd;
       padding-bottom: 0.25rem; }
  h3 { font-size: 1rem; }
  table { border-collapse: collapse; width: 100%; margin: 0.5rem 0; }
  th, td { text-align: left; padding: 0.3rem 0.6rem; border-bottom: 1px solid #eee;
           font-size: 0.9rem; }
  .disclaimer { background: #fff8e6; border: 1px solid #e6d9a8; padding: 0.75rem;
                border-radius: 6px; font-size: 0.9rem; }
  .meta { color: #666; font-size: 0.85rem; }
  .finding { border: 1px solid #e5e5e5; border-radius: 6px; padding: 0.75rem;
             margin: 0.5rem 0; }
`

/** Render the full self-contained HTML document. */
export function renderReportHtml(report: ExportedSessionReport): string {
  const confidence =
    `<p class="meta">Camera confidence: ${escapeHtml(report.sessionConfidence)}` +
    ` (${report.sessionConfidenceScore}%)</p>`
  return (
    '<!doctype html>' +
    '<html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    `<title>KinematicIQ session report — ${escapeHtml(report.protocolId)}</title>` +
    `<style>${REPORT_CSS}</style></head><body>` +
    '<h1>KinematicIQ session report</h1>' +
    confidence +
    `<p class="disclaimer" role="note">${escapeHtml(report.disclaimer)}</p>` +
    qualitySection(report) +
    findingsSection(report) +
    metricsSection(report) +
    baselineSection(report) +
    repAuditSection(report) +
    provenanceSection(report) +
    '</body></html>'
  )
}
