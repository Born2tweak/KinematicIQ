import { describe, expect, it } from 'vitest'
import { makeConfidence } from '../core/confidence'
import { makeProvenance } from '../core/provenance'
import type { MetricResult } from '../core/metric'
import {
  METRIC_CSV_COLUMNS,
  buildMetricCsv,
  metricCsvFilename,
} from './metricCsv'

function metric(overrides: Partial<MetricResult> = {}): MetricResult {
  return {
    metricId: 'squat.depth.min-knee-angle',
    label: 'Min knee angle',
    value: 118.4,
    unit: 'deg',
    side: 'bilateral',
    confidence: makeConfidence(0.8),
    provenance: makeProvenance({
      captureSource: 'upload',
      protocolId: 'front-view-squat-v1',
      recordedAt: '2026-07-07T12:00:00.000Z',
    }),
    validationTier: 'experimental',
    ...overrides,
  }
}

function rows(csv: string): string[] {
  return csv.split('\r\n')
}

describe('metricCsv (M53)', () => {
  it('emits a stable header row in the documented column order', () => {
    const csv = buildMetricCsv([metric()])
    expect(rows(csv)[0]).toBe(METRIC_CSV_COLUMNS.join(','))
  })

  it('writes provenance columns from the metric result', () => {
    const csv = buildMetricCsv([metric()])
    const dataRow = rows(csv)[1].split(',')
    const col = (name: (typeof METRIC_CSV_COLUMNS)[number]) =>
      dataRow[METRIC_CSV_COLUMNS.indexOf(name)]
    expect(col('protocolId')).toBe('front-view-squat-v1')
    expect(col('metricId')).toBe('squat.depth.min-knee-angle')
    expect(col('confidence')).toBe('High')
    expect(col('validationTier')).toBe('experimental')
    expect(col('captureSource')).toBe('upload')
    expect(col('filterVariant')).toBe('raw')
    expect(col('not_readable')).toBe('')
  })

  it('exports a null value as a blank field flagged not_readable (never zero)', () => {
    const csv = buildMetricCsv([metric({ value: null })])
    const dataRow = rows(csv)[1].split(',')
    expect(dataRow[METRIC_CSV_COLUMNS.indexOf('value')]).toBe('')
    expect(dataRow[METRIC_CSV_COLUMNS.indexOf('not_readable')]).toBe(
      'not_readable',
    )
  })

  it('escapes commas, quotes, and newlines per RFC 4180', () => {
    const csv = buildMetricCsv([
      metric({ label: 'Knee, angle "peak"\nbottom' }),
    ])
    // The whole file has 2 logical lines (header + 1 record); the embedded
    // newline lives inside a quoted field, so splitting on the record
    // separator must still yield the escaped field intact.
    expect(csv).toContain('"Knee, angle ""peak""\nbottom"')
  })

  it('trims float noise to 6 significant figures', () => {
    const csv = buildMetricCsv([metric({ value: 0.1 + 0.2 })])
    expect(rows(csv)[1]).toContain('0.3')
    expect(rows(csv)[1]).not.toContain('0.30000000000000004')
  })

  it('builds a dated, protocol-scoped filename and falls back to session', () => {
    expect(metricCsvFilename('front-view-squat-v1', '2026-07-07T09:00:00Z')).toBe(
      'kinematiciq-metrics-front-view-squat-v1-2026-07-07.csv',
    )
    expect(metricCsvFilename(undefined, '2026-07-07T09:00:00Z')).toBe(
      'kinematiciq-metrics-session-2026-07-07.csv',
    )
  })
})
