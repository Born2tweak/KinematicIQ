/**
 * Personal baseline (M31) — the athlete compared against their OWN saved
 * history, never against other people or population norms (MD07 Part 7).
 *
 * Local-only: reads the sessions the athlete explicitly saved (M9 store).
 * Honest small-N handling: no baseline at all under MIN_BASELINE_SESSIONS,
 * and invalid sets never feed it. Deltas carry both the raw difference
 * (always inspectable) and an MDC-aware classification (M32) against
 * heuristic noise thresholds — see session/changeDetection.ts.
 */
import type { StoredSession } from '../storage/sessionStore'
import { isReadableRecord } from '../storage/sessionStore'
import type { ProtocolId } from '../core/protocol'
import { classifyMetricChange } from './changeDetection'
import type {
  BaselineMetricDelta,
  SessionBaseline,
  SessionResult,
} from './types'

/** Below this many usable saved sessions, no baseline is claimed. */
export const MIN_BASELINE_SESSIONS = 3

/** History records that may feed a baseline for `protocolId`. */
function usableHistory(
  history: readonly StoredSession[],
  protocolId: ProtocolId,
): StoredSession[] {
  return history.filter(
    (record) =>
      isReadableRecord(record) &&
      record.protocolId === protocolId &&
      record.result.quality.verdict !== 'invalid' &&
      record.result.metricResults.length > 0,
  )
}

/**
 * Build the athlete's personal baseline for the current result, or null when
 * history cannot honestly support one (< MIN_BASELINE_SESSIONS usable saved
 * sessions of the same protocol). Only metrics readable in BOTH the current
 * set and every contributing average are compared.
 */
export function computeBaseline(
  history: readonly StoredSession[],
  current: SessionResult,
): SessionBaseline | null {
  const usable = usableHistory(history, current.protocolId)
  if (usable.length < MIN_BASELINE_SESSIONS) return null

  // Mean per metricId across history, counting only non-null values.
  const sums = new Map<string, { sum: number; n: number }>()
  for (const record of usable) {
    for (const metric of record.result.metricResults) {
      if (metric.value === null) continue
      const acc = sums.get(metric.metricId) ?? { sum: 0, n: 0 }
      acc.sum += metric.value
      acc.n += 1
      sums.set(metric.metricId, acc)
    }
  }

  const deltas: BaselineMetricDelta[] = []
  for (const metric of current.metricResults) {
    if (metric.value === null) continue
    const acc = sums.get(metric.metricId)
    // A metric must have been readable in a majority of baseline sessions —
    // a one-off historical read is not a baseline.
    if (!acc || acc.n < Math.ceil(usable.length / 2)) continue
    const baselineValue = acc.sum / acc.n
    const delta = metric.value - baselineValue
    deltas.push({
      metricId: metric.metricId,
      label: metric.label,
      unit: metric.unit,
      baselineValue,
      currentValue: metric.value,
      delta,
      // MDC-aware interpretation (M32) — conservative change language only.
      change: classifyMetricChange(metric.metricId, delta, {
        sessionCount: usable.length,
        currentConfidence: current.sessionConfidence,
      }),
    })
  }

  if (deltas.length === 0) return null
  return { scope: 'longitudinal', sessionCount: usable.length, deltas }
}
