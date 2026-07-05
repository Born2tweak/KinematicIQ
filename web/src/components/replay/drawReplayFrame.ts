/**
 * Canvas renderer for the Results replay: 2D skeleton of the current frame,
 * plus optional Demo Mode effects — ghost poses (recent-frame fade) and the
 * hip/COM trajectory line.
 *
 * Pure presentation: reads analysis outputs, never writes them. Demo Mode is
 * a draw-time flag only; the analysis view model is computed elsewhere and is
 * bit-identical whether these effects render or not.
 */
import { POSE_CONNECTIONS } from '../../cv/poseConnections'
import { midpoint, safeLandmark } from '../../analysis/geometry'
import {
  CONFIDENCE_THRESHOLD,
  LANDMARK_INDICES,
  type NormalizedLandmark,
  type PoseFrame,
} from '../../cv/types'

const BONE_COLOR = 'rgba(34, 211, 238, 0.95)'
const JOINT_COLOR = 'rgba(255, 255, 255, 0.95)'
const GHOST_COLOR = '56, 189, 248' // sky-400 rgb triplet
const TRAJECTORY_COLOR = 'rgba(250, 204, 21, 0.85)' // amber
const BONE_WIDTH = 5
const JOINT_RADIUS = 6

/** Demo Mode: how many recent frames leave a ghost, and their spacing. */
export const GHOST_COUNT = 4
export const GHOST_STRIDE = 4
/** Demo Mode: how many recent frames the hip trajectory spans. */
export const TRAJECTORY_SPAN = 90

export interface ReplayDrawOptions {
  demoMode: boolean
}

function visible(lm: NormalizedLandmark | undefined): lm is NormalizedLandmark {
  return lm !== undefined && lm.visibility >= CONFIDENCE_THRESHOLD
}

function drawSkeletonInto(
  ctx: CanvasRenderingContext2D,
  landmarks: readonly NormalizedLandmark[],
  width: number,
  height: number,
  boneStyle: string,
  jointStyle: string | null,
  lineWidth: number,
): void {
  ctx.strokeStyle = boneStyle
  ctx.lineWidth = lineWidth
  ctx.lineCap = 'round'
  for (const [i0, i1] of POSE_CONNECTIONS) {
    const a = landmarks[i0]
    const b = landmarks[i1]
    if (!visible(a) || !visible(b)) continue
    ctx.beginPath()
    ctx.moveTo(a.x * width, a.y * height)
    ctx.lineTo(b.x * width, b.y * height)
    ctx.stroke()
  }
  if (jointStyle) {
    ctx.fillStyle = jointStyle
    for (const lm of landmarks) {
      if (!visible(lm)) continue
      ctx.beginPath()
      ctx.arc(lm.x * width, lm.y * height, JOINT_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function hipPoint(frame: PoseFrame): { x: number; y: number } | null {
  const left = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const right = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return left && right ? midpoint(left, right) : null
}

/**
 * Render one replay frame. `frames` is the full analyzed sequence so Demo
 * Mode can reach back for ghosts and the trajectory; `sampleIndex` addresses
 * the current frame.
 */
export function drawReplayFrame(
  ctx: CanvasRenderingContext2D,
  frames: readonly PoseFrame[],
  sampleIndex: number,
  width: number,
  height: number,
  options: ReplayDrawOptions,
): void {
  ctx.clearRect(0, 0, width, height)
  const frame = frames[sampleIndex]
  if (!frame) return

  if (options.demoMode) {
    // Hip/COM trajectory over the recent window.
    const start = Math.max(0, sampleIndex - TRAJECTORY_SPAN)
    ctx.strokeStyle = TRAJECTORY_COLOR
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    for (let i = start; i <= sampleIndex; i++) {
      const p = hipPoint(frames[i])
      if (!p) continue
      if (started) {
        ctx.lineTo(p.x * width, p.y * height)
      } else {
        ctx.moveTo(p.x * width, p.y * height)
        started = true
      }
    }
    if (started) ctx.stroke()

    // Ghost poses: recent frames fading out.
    for (let g = GHOST_COUNT; g >= 1; g--) {
      const idx = sampleIndex - g * GHOST_STRIDE
      if (idx < 0) continue
      const alpha = 0.28 * (1 - g / (GHOST_COUNT + 1))
      drawSkeletonInto(
        ctx,
        frames[idx].landmarks,
        width,
        height,
        `rgba(${GHOST_COLOR}, ${alpha.toFixed(3)})`,
        null,
        BONE_WIDTH - 2,
      )
    }
  }

  drawSkeletonInto(
    ctx,
    frame.landmarks,
    width,
    height,
    BONE_COLOR,
    JOINT_COLOR,
    BONE_WIDTH,
  )
}
