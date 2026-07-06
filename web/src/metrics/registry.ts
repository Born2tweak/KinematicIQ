/**
 * Metric registry (M6) — maps a protocol to its metric definitions (included
 * and excluded). The finding engine (M7) and report (M8) resolve metric ids to
 * definitions through here. Squat is the only populated protocol today.
 */
import type { MetricDefinition } from '../core/metric'
import type { ProtocolId } from '../core/protocol'
import {
  SQUAT_EXCLUDED_METRICS,
  SQUAT_METRIC_DEFINITIONS,
} from './squatMetrics'

interface ProtocolMetrics {
  included: MetricDefinition[]
  excluded: MetricDefinition[]
}

const METRICS_BY_PROTOCOL: Partial<Record<ProtocolId, ProtocolMetrics>> = {
  squat: {
    included: SQUAT_METRIC_DEFINITIONS,
    excluded: SQUAT_EXCLUDED_METRICS,
  },
}

/** Included metric definitions a protocol emits. Empty for unpopulated protocols. */
export function getMetricDefinitions(protocolId: ProtocolId): MetricDefinition[] {
  return METRICS_BY_PROTOCOL[protocolId]?.included ?? []
}

/** Cataloged-but-excluded metrics (kept for the record). */
export function getExcludedMetricDefinitions(
  protocolId: ProtocolId,
): MetricDefinition[] {
  return METRICS_BY_PROTOCOL[protocolId]?.excluded ?? []
}

/** Resolve a single metric definition by id within a protocol. */
export function getMetricDefinition(
  protocolId: ProtocolId,
  metricId: string,
): MetricDefinition | undefined {
  const bucket = METRICS_BY_PROTOCOL[protocolId]
  if (!bucket) return undefined
  return (
    bucket.included.find((d) => d.id === metricId) ??
    bucket.excluded.find((d) => d.id === metricId)
  )
}
