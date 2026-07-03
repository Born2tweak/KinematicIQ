/**
 * Temporal landmark filtering for pose streams.
 *
 * Two paths, mirroring biomechanics practice (see docs/23_research_agenda.md,
 * sourced from Pose2Sim's Config_demo.toml and pyomeca's filter.py):
 *
 *   - LIVE (causal, streaming): One-Euro filter per landmark×axis. Low latency,
 *     adaptive cut-off so slow motion is smoothed hard and fast motion isn't
 *     blunted. Params: minCutoff 4 Hz, beta 1.5, dCutoff 1.0.
 *   - OFFLINE (video upload): zero-phase Butterworth (cutoff 6 Hz, order 4)
 *     applied forward-and-backward (`filtfilt`) so there is no phase lag, with
 *     gap-interpolation + Hampel outlier rejection as pre-stages. Requires the
 *     full signal, hence the two-pass structure in videoAnalyzer.
 *
 * Pure and dependency-free: One-Euro and Butterworth are hand-rolled so nothing
 * is added to the browser bundle. `visibility` is passed through unfiltered
 * (it is a confidence, not a coordinate).
 */
import type { NormalizedLandmark, PoseFrame } from './types'

// ── Sourced parameters (docs/23 → Pose2Sim / pyomeca) ──────────────
export const LIVE_ONE_EURO = { minCutoff: 4, beta: 1.5, dCutoff: 1.0 } as const
export const OFFLINE_BUTTERWORTH = { cutoffHz: 6, order: 4 } as const
export const HAMPEL_DEFAULTS = { window: 7, k: 3 } as const
/** Largest gap (frames) still linearly interpolated; longer gaps are left as-is. */
export const DEFAULT_MAX_GAP = 100

const TWO_PI = Math.PI * 2
const AXES = ['x', 'y', 'z'] as const

// ── One-Euro filter (causal, streaming — live path) ────────────────

/** Smoothing factor for an exponential low-pass at a given cut-off and dt. */
function smoothingAlpha(cutoff: number, dt: number): number {
  const tau = 1 / (TWO_PI * cutoff)
  return 1 / (1 + tau / dt)
}

class ScalarLowPass {
  private hatPrev: number | null = null

  filter(x: number, alpha: number): number {
    const prev = this.hatPrev
    const hat = prev === null ? x : alpha * x + (1 - alpha) * prev
    this.hatPrev = hat
    return hat
  }

  reset(): void {
    this.hatPrev = null
  }
}

/** One-Euro filter (Casiez et al. 2012) for a single scalar signal. */
export class OneEuroFilter {
  private readonly xFilter = new ScalarLowPass()
  private readonly dxFilter = new ScalarLowPass()
  private xPrev: number | null = null
  private tPrev: number | null = null

  constructor(
    private readonly minCutoff: number = LIVE_ONE_EURO.minCutoff,
    private readonly beta: number = LIVE_ONE_EURO.beta,
    private readonly dCutoff: number = LIVE_ONE_EURO.dCutoff,
  ) {}

  /** @param tSeconds monotonic timestamp in seconds. */
  filter(x: number, tSeconds: number): number {
    if (this.tPrev === null || this.xPrev === null) {
      this.tPrev = tSeconds
      this.xPrev = x
      return this.xFilter.filter(x, 1)
    }

    const dt = Math.max(tSeconds - this.tPrev, 1e-6)
    const dx = (x - this.xPrev) / dt
    const edx = this.dxFilter.filter(dx, smoothingAlpha(this.dCutoff, dt))
    const cutoff = this.minCutoff + this.beta * Math.abs(edx)
    const hatX = this.xFilter.filter(x, smoothingAlpha(cutoff, dt))

    this.xPrev = x
    this.tPrev = tSeconds
    return hatX
  }

  reset(): void {
    this.xFilter.reset()
    this.dxFilter.reset()
    this.xPrev = null
    this.tPrev = null
  }
}

export interface LiveStreamFilter {
  /** Return a new PoseFrame with One-Euro-filtered landmark coordinates. */
  filter(frame: PoseFrame): PoseFrame
  /** Reset all per-landmark filter state (call on session start). */
  reset(): void
}

/**
 * Stateful live filter holding one {@link OneEuroFilter} per landmark×axis.
 * Uses `frame.timestamp` (ms) as the clock. Immutable output.
 */
export function createLiveStreamFilter(
  params: { minCutoff?: number; beta?: number; dCutoff?: number } = {},
): LiveStreamFilter {
  const minCutoff = params.minCutoff ?? LIVE_ONE_EURO.minCutoff
  const beta = params.beta ?? LIVE_ONE_EURO.beta
  const dCutoff = params.dCutoff ?? LIVE_ONE_EURO.dCutoff

  const filters = new Map<string, OneEuroFilter>()
  const get = (key: string): OneEuroFilter => {
    let f = filters.get(key)
    if (!f) {
      f = new OneEuroFilter(minCutoff, beta, dCutoff)
      filters.set(key, f)
    }
    return f
  }

  return {
    filter(frame: PoseFrame): PoseFrame {
      const tSec = frame.timestamp / 1000
      const landmarks: NormalizedLandmark[] = frame.landmarks.map((lm, i) => ({
        x: get(`${i}x`).filter(lm.x, tSec),
        y: get(`${i}y`).filter(lm.y, tSec),
        z: get(`${i}z`).filter(lm.z, tSec),
        visibility: lm.visibility,
      }))
      return { ...frame, landmarks }
    },
    reset(): void {
      filters.clear()
    },
  }
}

// ── Offline pre-stages ─────────────────────────────────────────────

/**
 * Linearly interpolate non-finite runs shorter than `maxGap`. Leading/trailing
 * gaps and runs longer than `maxGap` are left untouched (still non-finite).
 */
export function interpolateGaps(
  signal: readonly number[],
  maxGap: number = DEFAULT_MAX_GAP,
): number[] {
  const out = signal.slice()
  const missing = (v: number): boolean => !Number.isFinite(v)
  let i = 0
  while (i < out.length) {
    if (!missing(out[i])) {
      i++
      continue
    }
    let j = i
    while (j < out.length && missing(out[j])) j++
    const left = i - 1
    const right = j
    if (left >= 0 && right < out.length && right - i <= maxGap) {
      const a = out[left]
      const b = out[right]
      for (let k = i; k < j; k++) {
        out[k] = a + ((b - a) * (k - left)) / (right - left)
      }
    }
    i = j
  }
  return out
}

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/**
 * Hampel filter: replace points more than `k`·σ from the local median with the
 * median, where σ = 1.4826·MAD in a sliding window. Rejects pose spikes before
 * low-pass filtering. Non-finite samples are ignored, not replaced.
 */
export function hampelReject(
  signal: readonly number[],
  window: number = HAMPEL_DEFAULTS.window,
  k: number = HAMPEL_DEFAULTS.k,
): number[] {
  const out = signal.slice()
  const half = Math.floor(window / 2)
  const MAD_TO_SIGMA = 1.4826
  for (let i = 0; i < out.length; i++) {
    if (!Number.isFinite(signal[i])) continue
    const lo = Math.max(0, i - half)
    const hi = Math.min(out.length - 1, i + half)
    const win: number[] = []
    for (let j = lo; j <= hi; j++) {
      if (Number.isFinite(signal[j])) win.push(signal[j])
    }
    if (win.length === 0) continue
    const med = median(win)
    const sigma = MAD_TO_SIGMA * median(win.map((v) => Math.abs(v - med)))
    // When MAD is 0 (a near-constant window) any deviation is an outlier;
    // otherwise use the standard k·sigma Hampel test.
    const isOutlier =
      sigma > 0 ? Math.abs(signal[i] - med) > k * sigma : signal[i] !== med
    if (isOutlier) {
      out[i] = med
    }
  }
  return out
}

// ── Zero-phase Butterworth (offline path) ──────────────────────────

interface Biquad {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

/**
 * Digital Butterworth low-pass as a cascade of RBJ biquads. Even order only:
 * order/2 sections with Q_k = 1 / (2·cos(π(2k+1)/(2·order))).
 */
function butterLowpassBiquads(cutoffHz: number, order: number, fs: number): Biquad[] {
  if (order % 2 !== 0 || order < 2) {
    throw new Error(`butterworth: even order >= 2 required, got ${order}`)
  }
  const w0 = (TWO_PI * cutoffHz) / fs
  const cosw0 = Math.cos(w0)
  const sinw0 = Math.sin(w0)
  const sections: Biquad[] = []
  for (let k = 0; k < order / 2; k++) {
    const q = 1 / (2 * Math.cos((Math.PI * (2 * k + 1)) / (2 * order)))
    const alpha = sinw0 / (2 * q)
    const a0 = 1 + alpha
    sections.push({
      b0: ((1 - cosw0) / 2) / a0,
      b1: (1 - cosw0) / a0,
      b2: ((1 - cosw0) / 2) / a0,
      a1: (-2 * cosw0) / a0,
      a2: (1 - alpha) / a0,
    })
  }
  return sections
}

function applyBiquads(signal: readonly number[], biquads: readonly Biquad[]): number[] {
  let x: number[] = signal.slice()
  for (const bq of biquads) {
    const y = new Array<number>(x.length)
    let x1 = 0
    let x2 = 0
    let y1 = 0
    let y2 = 0
    for (let n = 0; n < x.length; n++) {
      const xn = x[n]
      const yn = bq.b0 * xn + bq.b1 * x1 + bq.b2 * x2 - bq.a1 * y1 - bq.a2 * y2
      y[n] = yn
      x2 = x1
      x1 = xn
      y2 = y1
      y1 = yn
    }
    x = y
  }
  return x
}

/**
 * Zero-phase Butterworth low-pass (forward + backward pass). Odd-reflection
 * padding at both ends reduces edge transients. Signals too short to filter
 * meaningfully are returned unchanged.
 */
export function butterworthFiltfilt(
  signal: readonly number[],
  cutoffHz: number = OFFLINE_BUTTERWORTH.cutoffHz,
  order: number = OFFLINE_BUTTERWORTH.order,
  fs = 15,
): number[] {
  const n = signal.length
  if (n < order * 3 + 1) return signal.slice()

  const biquads = butterLowpassBiquads(cutoffHz, order, fs)
  const pad = Math.min(3 * order, n - 1)

  const padded: number[] = []
  for (let i = pad; i >= 1; i--) padded.push(2 * signal[0] - signal[i])
  for (let i = 0; i < n; i++) padded.push(signal[i])
  for (let i = 1; i <= pad; i++) padded.push(2 * signal[n - 1] - signal[n - 1 - i])

  let y = applyBiquads(padded, biquads)
  y.reverse()
  y = applyBiquads(y, biquads)
  y.reverse()

  return y.slice(pad, pad + n)
}

// ── Offline frame-sequence filter ──────────────────────────────────

export interface OfflineFilterOptions {
  /** Sampling rate of the frame sequence in Hz (analysis fps). */
  fps?: number
  butterworth?: { cutoffHz?: number; order?: number }
  /** Hampel outlier rejection; pass `false` to disable. */
  hampel?: { window?: number; k?: number } | false
  maxGap?: number
}

/**
 * Filter a full pose sequence offline: for each landmark×axis, interpolate small
 * gaps → Hampel reject → zero-phase Butterworth. Returns new frames (immutable);
 * `visibility`, `worldLandmarks`, timestamps and indices are preserved.
 */
export function filterFrameSequence(
  frames: readonly PoseFrame[],
  options: OfflineFilterOptions = {},
): PoseFrame[] {
  const n = frames.length
  if (n === 0) return []

  const fps = options.fps ?? 15
  const cutoffHz = options.butterworth?.cutoffHz ?? OFFLINE_BUTTERWORTH.cutoffHz
  const order = options.butterworth?.order ?? OFFLINE_BUTTERWORTH.order
  const maxGap = options.maxGap ?? DEFAULT_MAX_GAP
  const numLandmarks = frames[0].landmarks.length

  const outLandmarks: NormalizedLandmark[][] = frames.map((f) =>
    f.landmarks.map((l) => ({ ...l })),
  )

  for (let li = 0; li < numLandmarks; li++) {
    for (const axis of AXES) {
      let sig = frames.map((f) => f.landmarks[li]?.[axis] ?? NaN)
      sig = interpolateGaps(sig, maxGap)
      if (options.hampel !== false) {
        sig = hampelReject(sig, options.hampel?.window, options.hampel?.k)
      }
      const filtered = butterworthFiltfilt(sig, cutoffHz, order, fps)
      for (let fi = 0; fi < n; fi++) {
        if (Number.isFinite(filtered[fi])) {
          outLandmarks[fi][li][axis] = filtered[fi]
        }
      }
    }
  }

  return frames.map((f, fi) => ({ ...f, landmarks: outLandmarks[fi] }))
}
