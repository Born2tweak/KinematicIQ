/** Dataset-suite metric primitives used by M63/M64. No composite score. */

export interface ErrorSummary {
  sampleCount: number
  mae: number
  rmse: number
  bias: number
}

export interface DropoutRun {
  startIndex: number
  endIndex: number
  length: number
  recoveredAtIndex: number | null
}

function requireSameLength(a: readonly number[], b: readonly number[]): void {
  if (a.length === 0 || a.length !== b.length) {
    throw new Error('Waveforms must be non-empty and have equal length.')
  }
}

/** Pointwise reference error. Values must already share units and alignment. */
export function waveformError(
  candidate: readonly number[],
  reference: readonly number[],
): ErrorSummary {
  requireSameLength(candidate, reference)
  let absolute = 0
  let squared = 0
  let signed = 0
  for (let i = 0; i < candidate.length; i++) {
    const error = candidate[i] - reference[i]
    absolute += Math.abs(error)
    squared += error * error
    signed += error
  }
  return {
    sampleCount: candidate.length,
    mae: absolute / candidate.length,
    rmse: Math.sqrt(squared / candidate.length),
    bias: signed / candidate.length,
  }
}

/** RMS first difference: temporal noise proxy, not anatomical accuracy. */
export function jitterRms(values: readonly number[]): number {
  if (values.length < 2) return 0
  let squared = 0
  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1]
    squared += delta * delta
  }
  return Math.sqrt(squared / (values.length - 1))
}

/** Consecutive false states with explicit recovery index. */
export function dropoutRuns(observed: readonly boolean[]): DropoutRun[] {
  const runs: DropoutRun[] = []
  let start: number | null = null
  for (let i = 0; i <= observed.length; i++) {
    const present = i < observed.length ? observed[i] : true
    if (!present && start === null) start = i
    if (present && start !== null) {
      runs.push({
        startIndex: start,
        endIndex: i - 1,
        length: i - start,
        recoveredAtIndex: i < observed.length ? i : null,
      })
      start = null
    }
  }
  return runs
}

/** Coefficient of variation for a positive bone-length series. */
export function boneLengthCv(lengths: readonly number[]): number | null {
  if (lengths.length < 2 || lengths.some((value) => value <= 0)) return null
  const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length
  const variance =
    lengths.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (lengths.length - 1)
  return Math.sqrt(variance) / mean
}

/** Signed candidate-minus-reference event lag in milliseconds. */
export function eventLagMs(candidateMs: number, referenceMs: number): number {
  if (!Number.isFinite(candidateMs) || !Number.isFinite(referenceMs)) {
    throw new Error('Event timestamps must be finite.')
  }
  return candidateMs - referenceMs
}

/** Sample variance across paired view estimates; refuses fewer than two views. */
export function crossViewVariance(values: readonly number[]): number | null {
  if (values.length < 2) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    (values.length - 1)
}

