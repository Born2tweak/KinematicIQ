/**
 * The primary metric rail for the Results screen (P2).
 *
 * The approved reference puts three to five metrics above the fold at equal
 * prominence to each other and above everything else on the page. The old
 * screen instead rendered every metric result in one flat list inside the
 * Evidence tab, where a headline read and an incidental one carried identical
 * weight and the athlete had to scroll past the narrative to reach any number.
 *
 * Selection rules, in order:
 *
 *   1. Only metrics with a value. An abstained read is not promoted into the
 *      rail — it stays in the full Evidence table where its `not readable`
 *      state and quality flags are legible. Silently showing four metrics
 *      instead of five is correct; inventing a fifth is not.
 *   2. One entry per metric concept. `dedupeKey` collapses per-side variants
 *      so left/right knee flexion cannot occupy two of five slots.
 *   3. Confidence first, then the protocol's own declared metric order. A
 *      protocol lists its metrics in the order it considers meaningful, so
 *      that ordering is real information and not an implementation detail.
 *
 * This module is pure and holds no protocol-specific knowledge beyond the
 * declared order it reads back from the registry.
 */
import { hasValue, type MetricResult } from '../../core/metric'
import type { ConfidenceLevel } from '../../core/confidence'
import { getProtocol } from '../../protocols/registry'
import type { SessionResult } from '../../session/types'

/** Rail capacity, from the approved reference. */
export const MAX_PRIMARY_METRICS = 5

export interface PrimaryMetric {
  metricId: string
  label: string
  /** Pre-formatted for display, unit included. Never null — see `hasValue`. */
  display: string
  value: number
  unit: string
  confidence: ConfidenceLevel
  validationTier: string
  /** True when the read describes one side only (rendered as a qualifier). */
  sided: boolean
}

const CONFIDENCE_RANK: Record<ConfidenceLevel, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

/**
 * The concept a metric measures, with per-side variants collapsed.
 *
 * Metric ids are dotted paths whose last segment carries the side when one
 * applies (`squat.depth.min-knee-angle.left`). Stripping a trailing side
 * segment is enough to group them and needs no per-protocol table.
 */
export function dedupeKey(metricId: string): string {
  return metricId.replace(/\.(left|right)$/, '')
}

/** Value + unit as one display string; degrees and percent lose the space. */
export function formatMetricValue(value: number, unit: string): string {
  const rounded = Math.round(value * 100) / 100
  if (unit === 'deg') return `${rounded}°`
  if (unit === 'percent') return `${rounded}%`
  if (unit === 'normalized' || unit === 'ratio') return `${rounded}`
  return `${rounded} ${unit}`
}

function declaredOrder(protocolId: SessionResult['protocolId']): Map<string, number> {
  const order = new Map<string, number>()
  try {
    getProtocol(protocolId).definition.metrics.forEach((metric, index) => {
      order.set(metric.id, index)
    })
  } catch {
    // An unregistered protocol still gets a rail — it just falls back to
    // confidence order alone rather than throwing on the results screen.
  }
  return order
}

/**
 * Up to {@link MAX_PRIMARY_METRICS} readable metrics for the rail.
 *
 * Returns `[]` for an abstained set: an invalid recording publishes no metric
 * summary at all, and the rail must not be the one surface that leaks numbers
 * past the quality gate.
 */
export function primaryMetrics(result: SessionResult): PrimaryMetric[] {
  if (result.quality.verdict === 'invalid') return []

  const order = declaredOrder(result.protocolId)
  const rankOf = (metric: MetricResult): number =>
    order.get(metric.metricId) ?? order.get(dedupeKey(metric.metricId)) ?? Number.MAX_SAFE_INTEGER

  const readable = result.metricResults.filter(hasValue)

  const best = new Map<string, MetricResult & { value: number }>()
  for (const metric of readable) {
    const key = dedupeKey(metric.metricId)
    const held = best.get(key)
    if (
      !held ||
      CONFIDENCE_RANK[metric.confidence.level] < CONFIDENCE_RANK[held.confidence.level]
    ) {
      best.set(key, metric)
    }
  }

  return [...best.values()]
    .sort((a, b) => {
      const byConfidence =
        CONFIDENCE_RANK[a.confidence.level] - CONFIDENCE_RANK[b.confidence.level]
      if (byConfidence !== 0) return byConfidence
      const byDeclared = rankOf(a) - rankOf(b)
      if (byDeclared !== 0) return byDeclared
      return a.metricId.localeCompare(b.metricId)
    })
    .slice(0, MAX_PRIMARY_METRICS)
    .map((metric) => ({
      metricId: metric.metricId,
      label: metric.label,
      display: formatMetricValue(metric.value, metric.unit),
      value: metric.value,
      unit: metric.unit,
      confidence: metric.confidence.level,
      validationTier: metric.validationTier,
      sided: metric.side === 'left' || metric.side === 'right',
    }))
}
