/**
 * Pure, dependency-free helpers for the live 3D pose overlay.
 *
 * MediaPipe worldLandmarks are metric (meters), hip-centered, Y-down.
 * three.js is Y-up. `worldToThree` is the single place that encodes this
 * conversion; nothing else should inline sign flips.
 *
 * No import of three.js / @react-three/fiber here — this file must stay
 * importable from Vitest/jsdom with zero WebGL dependency. The rendering
 * component (PoseScene3D) builds on top of these exports.
 */
import { LIVE_ONE_EURO, OneEuroFilter } from './landmarkFilter'
import { LANDMARK_INDICES } from './types'
import type { JointAngles, WorldLandmark } from './types'

export { POSE_CONNECTIONS } from './poseConnections'

export interface Vector3Like {
  x: number
  y: number
  z: number
}

/** Convert a MediaPipe world landmark (meters, hip-centered, Y-down) to three.js Y-up space. */
export function worldToThree(
  lm: Vector3Like,
  opts: { mirror?: boolean } = {},
): Vector3Like {
  return {
    x: opts.mirror ? -lm.x : lm.x,
    y: -lm.y,
    z: -lm.z,
  }
}

/** Midpoint of the left/right hip world landmarks — a center-of-mass proxy. */
export function hipCenter(worldLandmarks: readonly WorldLandmark[]): Vector3Like {
  const left = worldLandmarks[LANDMARK_INDICES.LEFT_HIP]
  const right = worldLandmarks[LANDMARK_INDICES.RIGHT_HIP]
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  }
}

function subtract(a: Vector3Like, b: Vector3Like): Vector3Like {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

function length(v: Vector3Like): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
}

function scale(v: Vector3Like, s: number): Vector3Like {
  return { x: v.x * s, y: v.y * s, z: v.z * s }
}

function add(a: Vector3Like, b: Vector3Like): Vector3Like {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

function dot(a: Vector3Like, b: Vector3Like): number {
  return a.x * b.x + a.y * b.y + a.z * b.z
}

function normalize(v: Vector3Like): Vector3Like | null {
  const len = length(v)
  if (!Number.isFinite(len) || len < 1e-9) return null
  return scale(v, 1 / len)
}

/**
 * Points tracing the arc at joint `b`, sweeping from the direction of `a`
 * to the direction of `c` (both relative to `b`), at the given `radius`,
 * in the plane spanned by the two rays. Returns `segments + 1` points.
 * Degenerate (parallel/antiparallel or zero-length) rays yield `[]`.
 */
export function jointArcPoints(
  a: Vector3Like,
  b: Vector3Like,
  c: Vector3Like,
  radius: number,
  segments: number,
): Vector3Like[] {
  const u = normalize(subtract(a, b))
  const vRaw = normalize(subtract(c, b))
  if (!u || !vRaw) return []

  const uDotV = dot(u, vRaw)
  const e2Raw = subtract(vRaw, scale(u, uDotV))
  const e2 = normalize(e2Raw)
  if (!e2) return []

  const clampedDot = Math.max(-1, Math.min(1, uDotV))
  const theta = Math.acos(clampedDot)

  const points: Vector3Like[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const angle = t * theta
    const dir = add(scale(u, Math.cos(angle)), scale(e2, Math.sin(angle)))
    points.push(add(b, scale(dir, radius)))
  }
  return points
}

export interface WorldLandmarkSmoother {
  smooth(worldLandmarks: readonly WorldLandmark[], timestampMs: number): WorldLandmark[]
  reset(): void
}

/**
 * Stateful smoother holding one {@link OneEuroFilter} per landmark×axis
 * (x, y, z) over worldLandmarks. Mirrors `createLiveStreamFilter` in
 * landmarkFilter.ts but for the 3D metric stream. `visibility` passes
 * through unfiltered.
 */
export function createWorldLandmarkSmoother(
  params: { minCutoff?: number; beta?: number; dCutoff?: number } = {},
): WorldLandmarkSmoother {
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
    smooth(worldLandmarks: readonly WorldLandmark[], timestampMs: number): WorldLandmark[] {
      const tSec = timestampMs / 1000
      return worldLandmarks.map((lm, i) => ({
        x: get(`${i}x`).filter(lm.x, tSec),
        y: get(`${i}y`).filter(lm.y, tSec),
        z: get(`${i}z`).filter(lm.z, tSec),
        visibility: lm.visibility,
      }))
    },
    reset(): void {
      filters.clear()
    },
  }
}

/**
 * Per-frame hand-off from the camera runLoop to the 3D scene, written to a
 * mutable ref (no React re-renders). Lives here (not in PoseScene3D.tsx) so
 * CameraScreen can construct/reset it without statically importing three.js.
 */
export interface Pose3DRefValue {
  worldLandmarks: WorldLandmark[] | null
  angles: JointAngles | null
  timestamp: number
  poseConfidence: number
  /** Recent hip-center history, raw MediaPipe world space (not worldToThree-converted). */
  hipTrail: Vector3Like[]
  depthHistory: { t: number; y: number }[]
}

export function createEmptyPose3DRef(): Pose3DRefValue {
  return {
    worldLandmarks: null,
    angles: null,
    timestamp: 0,
    poseConfidence: 0,
    hipTrail: [],
    depthHistory: [],
  }
}
