import { jitterRms, waveformError } from '../benchmark/benchmarkMetrics'

export const UI_PRMD_REDUCED_DIMENSIONS = 117
export const UI_PRMD_REDUCED_SAMPLES = 240

export interface UiPrmdTrial {
  trialIndex: number
  classLabel: 'demonstrated' | 'non-optimal'
  signals: number[][]
  sourceQualityLabel: number
}

export interface UiPrmdPilotBaseline {
  schemaVersion: 1
  dataset: {
    id: 'ui-prmd'
    version: string
    sourceCommit: string
    acquiredArtifacts: Record<string, string>
  }
  cohort: {
    trialsPerClass: number
    dimensions: number
    normalizedSamples: number
    demonstratedLabel: NumericSummary
    nonOptimalLabel: NumericSummary
  }
  waveform: {
    pairedSampleCount: number
    demonstratedJitterRmsMean: number
    nonOptimalJitterRmsMean: number
    pairedClassError: ReturnType<typeof waveformError>
  }
  limitations: string[]
}

interface NumericSummary {
  count: number
  min: number
  max: number
  mean: number
  standardDeviation: number
}

function parseCsvRows(text: string): number[][] {
  const rows = text.trim().split(/\r?\n/).map((line) =>
    line.split(',').map((raw) => {
      const value = Number(raw)
      if (!Number.isFinite(value)) throw new Error('UI-PRMD CSV contains a non-finite value.')
      return value
    }),
  )
  if (rows.length === 0) throw new Error('UI-PRMD CSV is empty.')
  const columns = rows[0].length
  if (rows.some((row) => row.length !== columns)) {
    throw new Error('UI-PRMD CSV rows have inconsistent widths.')
  }
  return rows
}

function parseLabels(text: string): number[] {
  return parseCsvRows(text).map((row) => {
    if (row.length !== 1) throw new Error('UI-PRMD label file must have one value per row.')
    return row[0]
  })
}

export function parseUiPrmdTrials(
  matrixCsv: string,
  labelsCsv: string,
  classLabel: UiPrmdTrial['classLabel'],
  dimensions = UI_PRMD_REDUCED_DIMENSIONS,
  samples = UI_PRMD_REDUCED_SAMPLES,
): UiPrmdTrial[] {
  const rows = parseCsvRows(matrixCsv)
  const labels = parseLabels(labelsCsv)
  if (rows[0].length !== samples) {
    throw new Error(`Expected ${samples} normalized samples, found ${rows[0].length}.`)
  }
  if (rows.length % dimensions !== 0) {
    throw new Error(`Matrix row count must be divisible by ${dimensions} dimensions.`)
  }
  const trialCount = rows.length / dimensions
  if (labels.length !== trialCount) {
    throw new Error(`Expected ${trialCount} labels, found ${labels.length}.`)
  }
  return Array.from({ length: trialCount }, (_, trialIndex) => ({
    trialIndex,
    classLabel,
    signals: rows.slice(trialIndex * dimensions, (trialIndex + 1) * dimensions),
    sourceQualityLabel: labels[trialIndex],
  }))
}

function summarize(values: readonly number[]): NumericSummary {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  const variance = values.length > 1
    ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)
    : 0
  return {
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean,
    standardDeviation: Math.sqrt(variance),
  }
}

export function buildUiPrmdPilotBaseline(input: {
  demonstrated: UiPrmdTrial[]
  nonOptimal: UiPrmdTrial[]
  version: string
  sourceCommit: string
  acquiredArtifacts: Record<string, string>
}): UiPrmdPilotBaseline {
  if (input.demonstrated.length === 0 || input.demonstrated.length !== input.nonOptimal.length) {
    throw new Error('UI-PRMD pilot needs equal non-empty demonstrated and non-optimal cohorts.')
  }
  const demonstratedValues: number[] = []
  const nonOptimalValues: number[] = []
  const demonstratedJitter: number[] = []
  const nonOptimalJitter: number[] = []
  for (let trial = 0; trial < input.demonstrated.length; trial++) {
    const a = input.demonstrated[trial]
    const b = input.nonOptimal[trial]
    if (a.signals.length !== b.signals.length) throw new Error('Paired trials differ in dimensions.')
    for (let dim = 0; dim < a.signals.length; dim++) {
      demonstratedValues.push(...a.signals[dim])
      nonOptimalValues.push(...b.signals[dim])
      demonstratedJitter.push(jitterRms(a.signals[dim]))
      nonOptimalJitter.push(jitterRms(b.signals[dim]))
    }
  }
  const mean = (values: readonly number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length
  return {
    schemaVersion: 1,
    dataset: {
      id: 'ui-prmd',
      version: input.version,
      sourceCommit: input.sourceCommit,
      acquiredArtifacts: input.acquiredArtifacts,
    },
    cohort: {
      trialsPerClass: input.demonstrated.length,
      dimensions: input.demonstrated[0].signals.length,
      normalizedSamples: input.demonstrated[0].signals[0].length,
      demonstratedLabel: summarize(input.demonstrated.map((trial) => trial.sourceQualityLabel)),
      nonOptimalLabel: summarize(input.nonOptimal.map((trial) => trial.sourceQualityLabel)),
    },
    waveform: {
      pairedSampleCount: demonstratedValues.length,
      demonstratedJitterRmsMean: mean(demonstratedJitter),
      nonOptimalJitterRmsMean: mean(nonOptimalJitter),
      pairedClassError: waveformError(nonOptimalValues, demonstratedValues),
    },
    limitations: [
      'The repository matrices are centered, scaled, and linearly aligned to 240 samples.',
      'Absolute joint angles, source timestamps, and event timing cannot be recovered.',
      'The reduced matrix omits subject and repetition identity; no subject-independent split is possible.',
      'Correct/non-optimal labels are dataset-provided categories, not KinematicIQ clinical or coaching validity.',
    ],
  }
}

