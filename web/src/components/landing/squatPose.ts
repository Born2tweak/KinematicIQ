/**
 * Side-view squat kinematics for the landing-page demos.
 * Pure geometry — mirrors the joint-angle approach the analyzer uses,
 * parameterized by squat depth t in [0, 1] (0 = standing, 1 = bottom).
 */

export interface Pt {
  x: number
  y: number
}

export interface SquatPose {
  ankle: Pt
  knee: Pt
  hip: Pt
  shoulder: Pt
  head: Pt
  elbow: Pt
  wrist: Pt
  heel: Pt
  toe: Pt
  kneeAngle: number
  hipAngle: number
}

const DEG = Math.PI / 180

const SHANK = 56
const THIGH = 56
const TORSO = 62
const NECK = 10
export const HEAD_RADIUS = 11
const UPPER_ARM = 30
const FOREARM = 28

const ANKLE: Pt = { x: 96, y: 222 }
export const GROUND_Y = ANKLE.y + 10
export const FIGURE_VIEWBOX = '14 6 172 236'

function dirUp(phi: number): Pt {
  return { x: Math.sin(phi), y: -Math.cos(phi) }
}

function dirDown(phi: number): Pt {
  return { x: Math.sin(phi), y: Math.cos(phi) }
}

function extend(p: Pt, d: Pt, len: number): Pt {
  return { x: p.x + d.x * len, y: p.y + d.y * len }
}

function jointAngle(center: Pt, a: Pt, b: Pt): number {
  const v1 = { x: a.x - center.x, y: a.y - center.y }
  const v2 = { x: b.x - center.x, y: b.y - center.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)
  if (mag === 0) return 180
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) / DEG
}

export function squatPose(t: number): SquatPose {
  const depth = Math.min(1, Math.max(0, t))
  const shankLean = depth * 26 * DEG
  const thighBack = depth * 86 * DEG
  const torsoLean = depth * 40 * DEG
  const armRaise = (8 + depth * 82) * DEG

  const ankle = ANKLE
  const knee = extend(ankle, dirUp(shankLean), SHANK)
  const hip = extend(knee, dirUp(-thighBack), THIGH)
  const shoulder = extend(hip, dirUp(torsoLean), TORSO)
  const head = extend(shoulder, dirUp(torsoLean), NECK + HEAD_RADIUS)
  const elbow = extend(shoulder, dirDown(armRaise), UPPER_ARM)
  const wrist = extend(elbow, dirDown(armRaise + (1 - depth) * 4 * DEG), FOREARM)

  return {
    ankle,
    knee,
    hip,
    shoulder,
    head,
    elbow,
    wrist,
    heel: { x: ankle.x - 10, y: GROUND_Y },
    toe: { x: ankle.x + 27, y: GROUND_Y },
    kneeAngle: jointAngle(knee, hip, ankle),
    hipAngle: jointAngle(hip, shoulder, knee),
  }
}

export type DemoPhase = 'STANDING' | 'DESCENT' | 'BOTTOM' | 'ASCENT'

/** Mirrors the analyzer's thresholds: BOTTOM < 105°, lockout near full extension. */
export function phaseForDepth(kneeAngle: number, descending: boolean): DemoPhase {
  if (kneeAngle >= 165) return 'STANDING'
  if (kneeAngle < 105) return 'BOTTOM'
  return descending ? 'DESCENT' : 'ASCENT'
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export interface CycleSample {
  depth: number
  descending: boolean
  /** True on the sample where a rep just completed (returned to standing). */
  cycleProgress: number
}

/**
 * Maps elapsed time within one squat cycle to depth.
 * Segments: stand → descend → hold bottom → ascend.
 */
export function squatCycle(
  elapsedMs: number,
  durations = { stand: 600, descent: 1000, bottom: 320, ascent: 980 },
): CycleSample {
  const total =
    durations.stand + durations.descent + durations.bottom + durations.ascent
  const ms = ((elapsedMs % total) + total) % total

  if (ms < durations.stand) {
    return { depth: 0, descending: false, cycleProgress: ms / total }
  }
  const afterStand = ms - durations.stand
  if (afterStand < durations.descent) {
    return {
      depth: easeInOutCubic(afterStand / durations.descent),
      descending: true,
      cycleProgress: ms / total,
    }
  }
  const afterDescent = afterStand - durations.descent
  if (afterDescent < durations.bottom) {
    return { depth: 1, descending: true, cycleProgress: ms / total }
  }
  const afterBottom = afterDescent - durations.bottom
  return {
    depth: 1 - easeInOutCubic(afterBottom / durations.ascent),
    descending: false,
    cycleProgress: ms / total,
  }
}

export const CYCLE_TOTAL_MS = 600 + 1000 + 320 + 980
