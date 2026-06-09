import { POSE_CONNECTIONS } from './poseConnections'
import { CONFIDENCE_THRESHOLD, type NormalizedLandmark } from './types'

const BONE_COLOR = 'rgba(34, 211, 238, 0.9)'
const JOINT_COLOR = 'rgba(255, 255, 255, 0.95)'
const BONE_WIDTH = 6
const JOINT_RADIUS = 9

export interface DrawSkeletonOptions {
  mirrored?: boolean
  minVisibility?: number
}

function isVisible(
  landmark: NormalizedLandmark | undefined,
  minVisibility: number,
): landmark is NormalizedLandmark {
  return landmark !== undefined && landmark.visibility >= minVisibility
}

function toPixel(
  landmark: NormalizedLandmark,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: landmark.x * width,
    y: landmark.y * height,
  }
}

export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  options: DrawSkeletonOptions = {},
): void {
  const { mirrored = false, minVisibility = CONFIDENCE_THRESHOLD } = options

  ctx.clearRect(0, 0, width, height)

  if (!landmarks.length) {
    return
  }

  ctx.save()

  if (mirrored) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }

  // Bones
  ctx.strokeStyle = BONE_COLOR
  ctx.lineWidth = BONE_WIDTH
  ctx.lineCap = 'round'

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx]
    const end = landmarks[endIdx]

    if (!isVisible(start, minVisibility) || !isVisible(end, minVisibility)) {
      continue
    }

    const startPx = toPixel(start, width, height)
    const endPx = toPixel(end, width, height)

    ctx.beginPath()
    ctx.moveTo(startPx.x, startPx.y)
    ctx.lineTo(endPx.x, endPx.y)
    ctx.stroke()
  }

  // Joints
  ctx.fillStyle = JOINT_COLOR

  for (const landmark of landmarks) {
    if (!isVisible(landmark, minVisibility)) {
      continue
    }

    const { x, y } = toPixel(landmark, width, height)
    ctx.beginPath()
    ctx.arc(x, y, JOINT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

export function clearSkeleton(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height)
}
