import type { NormalizedLandmark } from './types'

export type LandmarkObservationState =
  | 'observed'
  | 'low-confidence'
  | 'short-gap'
  | 'recovered'
  | 'missing'
  | 'out-of-frame'
  | 'ambiguous-side'
  | 'rejected'

export interface LandmarkObservation {
  frameIndex: number
  landmarkIndex: number
  state: LandmarkObservationState
  /** Original tracker output, retained even when ineligible. Never synthesized. */
  raw: NormalizedLandmark | null
  /** Present only when a separate recovery algorithm supplies a value. */
  recovered: NormalizedLandmark | null
  reason: string | null
}

export interface LandmarkStateInput {
  frameIndex: number
  landmarkIndex: number
  raw: NormalizedLandmark | null
  shortGap?: boolean
  recovered?: NormalizedLandmark | null
  ambiguousSide?: boolean
  rejectedReason?: string | null
  visibilityThreshold?: number
}

export function classifyLandmarkObservation(input: LandmarkStateInput): LandmarkObservation {
  const threshold = input.visibilityThreshold ?? 0.5
  const base = {
    frameIndex: input.frameIndex,
    landmarkIndex: input.landmarkIndex,
    raw: input.raw,
    recovered: input.recovered ?? null,
  }
  if (input.rejectedReason) return { ...base, state: 'rejected', reason: input.rejectedReason }
  if (input.ambiguousSide) return { ...base, state: 'ambiguous-side', reason: 'side identity is ambiguous' }
  if (input.recovered) return { ...base, state: 'recovered', reason: 'value supplied by declared recovery method' }
  if (input.shortGap) return { ...base, state: 'short-gap', reason: 'short missing run; no coordinate invented' }
  if (!input.raw || ![input.raw.x, input.raw.y, input.raw.z].every(Number.isFinite)) {
    return { ...base, state: 'missing', reason: 'tracker coordinate unavailable' }
  }
  if (input.raw.x < 0 || input.raw.x > 1 || input.raw.y < 0 || input.raw.y > 1) {
    return { ...base, state: 'out-of-frame', reason: 'normalized coordinate outside image bounds' }
  }
  if (input.raw.visibility < threshold) {
    return { ...base, state: 'low-confidence', reason: 'visibility below declared threshold' }
  }
  return { ...base, state: 'observed', reason: null }
}

export function landmarkMetricEligibility(observation: LandmarkObservation): {
  eligible: boolean
  evidence: 'direct' | 'recovered' | 'none'
} {
  if (observation.state === 'observed') return { eligible: true, evidence: 'direct' }
  if (observation.state === 'recovered') return { eligible: true, evidence: 'recovered' }
  return { eligible: false, evidence: 'none' }
}
