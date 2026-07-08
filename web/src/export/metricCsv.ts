/**
 * Metric evidence CSV export (M53).
 *
 * A local, tabular export of the set's metric results for coaches and
 * biomechanists — metrics with their confidence, validation tier, and full
 * capture provenance, and nothing else. No pose frames, no composite grade,
 * no normative score (claims-policy: evidence, not a grade). Purely
 * client-side: the string is handed to a Blob download, never uploaded.
 *
 * Design sources: docs/research/11 (expert workflow), docs/research/08
 * (export formats), docs/research/03 (metric reporting), claims-policy.
 */
import type { MetricResult } from '../core/metric'

/** Stable column order — appended-to only, never reordered (readers depend on it). */
export const METRIC_CSV_COLUMNS = [
  'protocolId',
  'metricId',
  'label',
  'value',
  'unit',
  'confidence',
  'validationTier',
  'captureSource',
  'modelVersion',
  'filterVariant',
  'not_readable',
] as const

/** RFC 4180 field escaping: quote when the value holds a comma, quote, or newline. */
function escapeCsvField(field: string): string {
  if (/[",\r\n]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

/**
 * Format a numeric metric value for CSV: integers stay exact; fractional
 * values are trimmed to 6 significant figures so float noise
 * (0.30000000000000004) does not leak into the export.
 */
function formatValue(value: number): string {
  if (Number.isInteger(value)) return String(value)
  return String(Number(value.toPrecision(6)))
}

function metricRow(m: MetricResult): string[] {
  const readable = m.value !== null
  return [
    m.provenance.protocolId ?? '',
    m.metricId,
    m.label,
    readable ? formatValue(m.value as number) : '',
    m.unit,
    m.confidence.level,
    m.validationTier,
    m.provenance.captureSource,
    m.provenance.modelVersion,
    m.provenance.filterVariant,
    readable ? '' : 'not_readable',
  ]
}

/**
 * Build the CSV text for a set's metric results. Null (abstained) values are
 * exported as a blank `value` with the `not_readable` flag set — never zero,
 * never dropped, so the export mirrors verdict-or-abstain.
 */
export function buildMetricCsv(results: readonly MetricResult[]): string {
  const rows = [METRIC_CSV_COLUMNS.join(',')]
  for (const m of results) {
    rows.push(metricRow(m).map(escapeCsvField).join(','))
  }
  return rows.join('\r\n')
}

/** `kinematiciq-metrics-<protocol>-<yyyy-mm-dd>.csv` */
export function metricCsvFilename(
  protocolId: string | undefined,
  isoDate: string,
): string {
  const protocol = protocolId && protocolId.length > 0 ? protocolId : 'session'
  return `kinematiciq-metrics-${protocol}-${isoDate.slice(0, 10)}.csv`
}
