export interface PairedAgreement {
  n: number
  mae: number
  rmse: number
  bias: number
  blandAltman: { lower: number; upper: number; assumption: string } | null
  correlation: number | null
}

function paired(a: readonly number[], b: readonly number[]): Array<[number, number]> {
  if (a.length !== b.length) throw new Error('Paired samples must have equal length.')
  return a.map((value, index) => [value, b[index]] as [number, number]).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
}

const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export function pairedAgreement(reference: readonly number[], estimate: readonly number[]): PairedAgreement | null {
  const pairs = paired(reference, estimate)
  if (!pairs.length) return null
  const differences = pairs.map(([truth, observed]) => observed - truth)
  const bias = mean(differences)
  const mae = mean(differences.map(Math.abs))
  const rmse = Math.sqrt(mean(differences.map((value) => value * value)))
  const sd = pairs.length < 2 ? null : Math.sqrt(differences.reduce((sum, value) => sum + (value - bias) ** 2, 0) / (pairs.length - 1))
  const xMean = mean(pairs.map(([x]) => x)); const yMean = mean(pairs.map(([, y]) => y))
  const numerator = pairs.reduce((sum, [x, y]) => sum + (x - xMean) * (y - yMean), 0)
  const denominator = Math.sqrt(pairs.reduce((sum, [x]) => sum + (x - xMean) ** 2, 0) * pairs.reduce((sum, [, y]) => sum + (y - yMean) ** 2, 0))
  return {
    n: pairs.length, mae, rmse, bias,
    blandAltman: sd === null ? null : { lower: bias - 1.96 * sd, upper: bias + 1.96 * sd, assumption: 'Paired differences are approximately normally distributed and independent.' },
    correlation: denominator === 0 ? null : numerator / denominator,
  }
}

export interface BinaryClassification { tp: number; fp: number; tn: number; fn: number; precision: number | null; recall: number | null; f1: number | null }

export function binaryClassification(reference: readonly boolean[], estimate: readonly boolean[]): BinaryClassification {
  if (reference.length !== estimate.length || reference.length === 0) throw new Error('Binary samples must be non-empty and equal length.')
  let tp = 0, fp = 0, tn = 0, fn = 0
  reference.forEach((truth, index) => { const observed = estimate[index]; if (truth && observed) tp++; else if (!truth && observed) fp++; else if (!truth && !observed) tn++; else fn++ })
  const precision = tp + fp === 0 ? null : tp / (tp + fp)
  const recall = tp + fn === 0 ? null : tp / (tp + fn)
  const f1 = precision === null || recall === null || precision + recall === 0 ? null : 2 * precision * recall / (precision + recall)
  return { tp, fp, tn, fn, precision, recall, f1 }
}

export function confusionMatrix(labels: readonly string[], reference: readonly string[], estimate: readonly string[]): number[][] {
  if (!labels.length || reference.length !== estimate.length) throw new Error('Confusion-matrix inputs are invalid.')
  const index = new Map(labels.map((label, i) => [label, i])); const matrix = labels.map(() => labels.map(() => 0))
  reference.forEach((truth, i) => { const row = index.get(truth); const column = index.get(estimate[i]); if (row === undefined || column === undefined) throw new Error('Unknown confusion-matrix label.'); matrix[row][column]++ })
  return matrix
}

export function exactCountAccuracy(reference: readonly number[], estimate: readonly number[]): number | null {
  const pairs = paired(reference, estimate); return pairs.length ? pairs.filter(([a, b]) => a === b).length / pairs.length : null
}

export interface IccResult { value: number; variant: 'ICC(2,1)'; assumption: string }

export function icc21(rows: readonly (readonly number[])[]): IccResult | null {
  if (rows.length < 2 || rows[0].length < 2 || rows.some((row) => row.length !== rows[0].length || row.some((v) => !Number.isFinite(v)))) return null
  const n = rows.length, k = rows[0].length, grand = mean(rows.flat())
  const rowMeans = rows.map(mean), columnMeans = Array.from({ length: k }, (_, j) => mean(rows.map((row) => row[j])))
  const msRows = k * rowMeans.reduce((s, v) => s + (v - grand) ** 2, 0) / (n - 1)
  const msCols = n * columnMeans.reduce((s, v) => s + (v - grand) ** 2, 0) / (k - 1)
  const residual = rows.reduce((s, row, i) => s + row.reduce((t, value, j) => t + (value - rowMeans[i] - columnMeans[j] + grand) ** 2, 0), 0)
  const msError = residual / ((n - 1) * (k - 1)); const denominator = msRows + (k - 1) * msError + k * (msCols - msError) / n
  return denominator === 0 ? null : { value: (msRows - msError) / denominator, variant: 'ICC(2,1)', assumption: 'Two-way random-effects, absolute agreement, single measurement; subjects and raters are random samples.' }
}
