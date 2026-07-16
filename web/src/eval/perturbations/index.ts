import type { PoseFrame } from '../../cv/types'

export const PERTURBATION_LIBRARY_VERSION = 'pose-perturbation-v1' as const

type Window = { startFrame: number; endFrame: number; landmarkIndices?: number[] }
export type Perturbation =
  | ({ kind: 'dropout'; every?: number } & Window)
  | ({ kind: 'visibility'; visibility: number } & Window)
  | ({ kind: 'coordinateJitter'; amplitude: number } & Window)
  | { kind: 'timestampJitter'; amplitudeMs: number; intentionalNonMonotonic?: boolean }
  | { kind: 'duplicateFrames'; frameIndices: number[] }
  | { kind: 'removeFrames'; frameIndices: number[] }
  | { kind: 'fpsResample'; targetFps: number }
  | ({ kind: 'occlusionMask'; xMin: number; xMax: number; yMin: number; yMax: number } & Omit<Window, 'landmarkIndices'>)
  | { kind: 'identity' }

export interface PerturbationManifest {
  version: typeof PERTURBATION_LIBRARY_VERSION
  seed: number
  sourceSha256: string
  outputSha256: string
  operations: Perturbation[]
}

const SHA256 = /^[a-f0-9]{64}$/
const cloneFrames = (frames: readonly PoseFrame[]): PoseFrame[] =>
  frames.map(frame => ({
    ...frame,
    landmarks: frame.landmarks.map(point => ({ ...point })),
    worldLandmarks: frame.worldLandmarks.map(point => ({ ...point })),
    quality: frame.quality ? { ...frame.quality, missingCritical: [...frame.quality.missingCritical] } : undefined,
  }))

function random(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let next = value
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

export async function sha256Json(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function validateWindow(operation: Window): void {
  if (!Number.isInteger(operation.startFrame) || !Number.isInteger(operation.endFrame) || operation.startFrame < 0 || operation.endFrame < operation.startFrame) {
    throw new Error('Perturbation frame window must be ordered non-negative integers.')
  }
  if (operation.landmarkIndices?.some(index => !Number.isInteger(index) || index < 0 || index > 32)) throw new Error('Landmark index must be in 0..32.')
}

function selected(frame: PoseFrame, operation: Window): number[] {
  return operation.landmarkIndices ?? frame.landmarks.map((_, index) => index)
}

function applyOne(input: readonly PoseFrame[], operation: Perturbation, rng: () => number): PoseFrame[] {
  const frames = cloneFrames(input)
  if (operation.kind === 'identity') return frames
  if ('startFrame' in operation) validateWindow(operation)
  if (operation.kind === 'dropout') {
    if (operation.every !== undefined && (!Number.isInteger(operation.every) || operation.every < 1)) throw new Error('Dropout every must be a positive integer.')
    frames.forEach((frame, index) => {
      if (index < operation.startFrame || index > operation.endFrame || (operation.every && (index - operation.startFrame) % operation.every !== 0)) return
      selected(frame, operation).forEach(point => { frame.landmarks[point].visibility = 0; if (frame.worldLandmarks[point]) frame.worldLandmarks[point].visibility = 0 })
    })
  } else if (operation.kind === 'visibility') {
    if (operation.visibility < 0 || operation.visibility > 1) throw new Error('Visibility must be in 0..1.')
    frames.forEach((frame, index) => {
      if (index < operation.startFrame || index > operation.endFrame) return
      selected(frame, operation).forEach(point => { frame.landmarks[point].visibility = operation.visibility; if (frame.worldLandmarks[point]) frame.worldLandmarks[point].visibility = operation.visibility })
    })
  } else if (operation.kind === 'coordinateJitter') {
    if (!(operation.amplitude >= 0 && operation.amplitude <= 1)) throw new Error('Coordinate jitter amplitude must be in 0..1.')
    frames.forEach((frame, index) => {
      if (index < operation.startFrame || index > operation.endFrame) return
      selected(frame, operation).forEach(point => {
        for (const axis of ['x', 'y', 'z'] as const) frame.landmarks[point][axis] += (rng() * 2 - 1) * operation.amplitude
      })
    })
  } else if (operation.kind === 'timestampJitter') {
    if (!(operation.amplitudeMs >= 0)) throw new Error('Timestamp jitter amplitude must be non-negative.')
    frames.forEach(frame => { frame.timestamp += (rng() * 2 - 1) * operation.amplitudeMs })
    if (!operation.intentionalNonMonotonic) {
      for (let index = 1; index < frames.length; index++) frames[index].timestamp = Math.max(frames[index].timestamp, frames[index - 1].timestamp + 0.001)
    }
  } else if (operation.kind === 'duplicateFrames') {
    const indices = new Set(operation.frameIndices)
    if ([...indices].some(index => !Number.isInteger(index) || index < 0 || index >= frames.length)) throw new Error('Duplicate frame index is outside the sequence.')
    return frames.flatMap((frame, index) => {
      if (!indices.has(index)) return [frame]
      const duplicate = cloneFrames([frame])[0]
      duplicate.timestamp = index + 1 < frames.length ? (frame.timestamp + frames[index + 1].timestamp) / 2 : frame.timestamp + 0.001
      return [frame, duplicate]
    })
  } else if (operation.kind === 'removeFrames') {
    const indices = new Set(operation.frameIndices)
    if ([...indices].some(index => !Number.isInteger(index) || index < 0 || index >= frames.length)) throw new Error('Removal frame index is outside the sequence.')
    return frames.filter((_, index) => !indices.has(index))
  } else if (operation.kind === 'fpsResample') {
    if (!(operation.targetFps > 0) || frames.length < 2) throw new Error('FPS resampling requires a positive FPS and at least two frames.')
    const interval = 1000 / operation.targetFps
    const output: PoseFrame[] = []
    for (let time = frames[0].timestamp; time <= frames[frames.length - 1].timestamp + interval / 2; time += interval) {
      const nearest = frames.reduce((best, frame) => Math.abs(frame.timestamp - time) < Math.abs(best.timestamp - time) ? frame : best)
      const copy = cloneFrames([nearest])[0]
      copy.timestamp = time
      output.push(copy)
    }
    return output
  } else if (operation.kind === 'occlusionMask') {
    if (operation.xMin < 0 || operation.yMin < 0 || operation.xMax > 1 || operation.yMax > 1 || operation.xMin > operation.xMax || operation.yMin > operation.yMax) throw new Error('Occlusion mask must be bounded and ordered in normalized coordinates.')
    frames.forEach((frame, index) => {
      if (index < operation.startFrame || index > operation.endFrame) return
      frame.landmarks.forEach(point => { if (point.x >= operation.xMin && point.x <= operation.xMax && point.y >= operation.yMin && point.y <= operation.yMax) point.visibility = 0 })
    })
  }
  return frames
}

export function validateTimestamps(frames: readonly PoseFrame[]): void {
  for (let index = 1; index < frames.length; index++) if (frames[index].timestamp <= frames[index - 1].timestamp) throw new Error(`Nonmonotonic timestamp at sequence index ${index}.`)
}

export async function applyPerturbations(input: readonly PoseFrame[], operations: readonly Perturbation[], options: { seed: number; sourceSha256?: string }): Promise<{ frames: PoseFrame[]; manifest: PerturbationManifest }> {
  if (!Number.isInteger(options.seed)) throw new Error('Perturbation seed must be an integer.')
  const sourceSha256 = options.sourceSha256 ?? await sha256Json(input)
  if (!SHA256.test(sourceSha256)) throw new Error('Source checksum must be lowercase SHA-256.')
  const rng = random(options.seed)
  const frames = operations.reduce((current, operation) => applyOne(current, operation, rng), cloneFrames(input))
  const permitsNonMonotonic = operations.some(operation => operation.kind === 'timestampJitter' && operation.intentionalNonMonotonic)
  if (!permitsNonMonotonic) validateTimestamps(frames)
  const copiedOperations = JSON.parse(JSON.stringify(operations)) as Perturbation[]
  return { frames, manifest: { version: PERTURBATION_LIBRARY_VERSION, seed: options.seed, sourceSha256, outputSha256: await sha256Json(frames), operations: copiedOperations } }
}
