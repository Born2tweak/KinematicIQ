/**
 * Offline reliability helpers (M49).
 *
 * These are descriptive validation-study utilities, not product claims. They
 * intentionally avoid ICC until the dataset has the rater/session structure
 * required to estimate it honestly.
 */

export interface ReliabilityMeasurement {
  participantId: string
  sessionId: string
  metricId: string
  value: number | null
}

export interface MetricReliabilitySummary {
  metricId: string
  observationCount: number
  participantCount: number
  repeatPairCount: number
  mean: number | null
  sampleStandardDeviation: number | null
  semLike: number | null
  mdc95Like: number | null
  meanAbsoluteRepeatDifference: number | null
  limitations: string[]
}

const MDC_95_MULTIPLIER = 1.96 * Math.sqrt(2)

function finiteValues(values: readonly (number | null | undefined)[]): number[] {
  return values.filter(
    (value): value is number =>
      typeof value === 'number' && Number.isFinite(value),
  )
}

export function mean(values: readonly (number | null | undefined)[]): number | null {
  const usable = finiteValues(values)
  if (usable.length === 0) return null
  return usable.reduce((sum, value) => sum + value, 0) / usable.length
}

export function sampleStandardDeviation(
  values: readonly (number | null | undefined)[],
): number | null {
  const usable = finiteValues(values)
  if (usable.length < 2) return null
  const avg = mean(usable)
  if (avg === null) return null
  const variance =
    usable.reduce((sum, value) => sum + (value - avg) ** 2, 0) /
    (usable.length - 1)
  return Math.sqrt(variance)
}

export function semLike(values: readonly (number | null | undefined)[]): number | null {
  const usable = finiteValues(values)
  const sd = sampleStandardDeviation(usable)
  if (sd === null) return null
  return sd / Math.sqrt(usable.length)
}

export function mdc95Like(values: readonly (number | null | undefined)[]): number | null {
  const sem = semLike(values)
  return sem === null ? null : MDC_95_MULTIPLIER * sem
}

function repeatDifferences(
  measurements: readonly ReliabilityMeasurement[],
): number[] {
  const byParticipant = new Map<string, ReliabilityMeasurement[]>()
  for (const measurement of measurements) {
    if (measurement.value === null || !Number.isFinite(measurement.value)) {
      continue
    }
    const group = byParticipant.get(measurement.participantId) ?? []
    group.push(measurement)
    byParticipant.set(measurement.participantId, group)
  }

  const diffs: number[] = []
  for (const group of byParticipant.values()) {
    const ordered = [...group].sort((a, b) =>
      a.sessionId.localeCompare(b.sessionId),
    )
    for (let i = 1; i < ordered.length; i += 1) {
      diffs.push(Math.abs(ordered[i].value! - ordered[i - 1].value!))
    }
  }
  return diffs
}

export function summarizeMetricReliability(
  measurements: readonly ReliabilityMeasurement[],
  metricId: string,
): MetricReliabilitySummary {
  const metricMeasurements = measurements.filter((m) => m.metricId === metricId)
  const values = finiteValues(metricMeasurements.map((m) => m.value))
  const participantIds = new Set(
    metricMeasurements
      .filter((m) => m.value !== null && Number.isFinite(m.value))
      .map((m) => m.participantId),
  )
  const diffs = repeatDifferences(metricMeasurements)

  const limitations: string[] = []
  if (values.length < 2) {
    limitations.push('Fewer than two usable observations; variability is not estimated.')
  }
  if (diffs.length === 0) {
    limitations.push('No repeated participant sessions; repeat difference is not estimated.')
  }
  limitations.push('SEM/MDC outputs are descriptive estimates, not formal ICC reliability.')

  return {
    metricId,
    observationCount: values.length,
    participantCount: participantIds.size,
    repeatPairCount: diffs.length,
    mean: mean(values),
    sampleStandardDeviation: sampleStandardDeviation(values),
    semLike: semLike(values),
    mdc95Like: mdc95Like(values),
    meanAbsoluteRepeatDifference: mean(diffs),
    limitations,
  }
}

export function summarizeReliability(
  measurements: readonly ReliabilityMeasurement[],
): MetricReliabilitySummary[] {
  const metricIds = [...new Set(measurements.map((m) => m.metricId))].sort()
  return metricIds.map((metricId) =>
    summarizeMetricReliability(measurements, metricId),
  )
}
