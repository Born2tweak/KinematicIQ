/**
 * Dynamic capture guidance — turns the current pose frame into ONE actionable
 * positioning instruction (Kinect-style), instead of static overlay guides.
 * Pure and dependency-free; the camera HUD renders the words, the canvas
 * renders only a state-colored frame border.
 */
import { CONFIDENCE_THRESHOLD, LANDMARK_INDICES, type PoseFrame } from './types'

export interface CaptureGuidance {
  /** True when the full body is framed well enough to calibrate. */
  ok: boolean
  /** One imperative instruction — never more than one action at a time. */
  instruction: string
  /** Optional second line with setup context. */
  detail: string | null
}

const SETUP_DETAIL = 'Camera at hip height, 3–4 m away, facing you.'

function visible(frame: PoseFrame, index: number): boolean {
  const lm = frame.landmarks[index]
  return lm !== undefined && lm.visibility >= CONFIDENCE_THRESHOLD
}

function avgY(frame: PoseFrame, a: number, b: number): number | null {
  const la = frame.landmarks[a]
  const lb = frame.landmarks[b]
  if (!la || !lb) return null
  return (la.y + lb.y) / 2
}

function avgX(frame: PoseFrame, a: number, b: number): number | null {
  const la = frame.landmarks[a]
  const lb = frame.landmarks[b]
  if (!la || !lb) return null
  return (la.x + lb.x) / 2
}

export function deriveCaptureGuidance(
  frame: PoseFrame | null,
): CaptureGuidance {
  if (!frame || frame.landmarks.length === 0) {
    return {
      ok: false,
      instruction: 'Step into frame',
      detail: SETUP_DETAIL,
    }
  }

  const { NOSE, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE } =
    LANDMARK_INDICES

  const headVisible = visible(frame, NOSE)
  const shouldersVisible =
    visible(frame, LEFT_SHOULDER) && visible(frame, RIGHT_SHOULDER)
  const hipsVisible = visible(frame, LEFT_HIP) && visible(frame, RIGHT_HIP)
  const kneesVisible = visible(frame, LEFT_KNEE) && visible(frame, RIGHT_KNEE)
  const anklesVisible =
    visible(frame, LEFT_ANKLE) && visible(frame, RIGHT_ANKLE)

  // Nothing solid on screen yet.
  if (!shouldersVisible && !hipsVisible) {
    return {
      ok: false,
      instruction: 'Step into frame',
      detail: SETUP_DETAIL,
    }
  }

  const hipY = avgY(frame, LEFT_HIP, RIGHT_HIP)

  // Feet cut off: too close, or camera aimed too high.
  if (!anklesVisible) {
    if (hipY !== null && hipY > 0.7) {
      return {
        ok: false,
        instruction: 'Step back — your feet are out of frame',
        detail: null,
      }
    }
    return {
      ok: false,
      instruction: 'Tilt the camera down until your feet are in frame',
      detail: null,
    }
  }

  // Head cut off: too close, or camera aimed too low.
  if (!headVisible) {
    const shoulderY = avgY(frame, LEFT_SHOULDER, RIGHT_SHOULDER)
    if (shoulderY !== null && shoulderY < 0.18) {
      return {
        ok: false,
        instruction: 'Step back — your head is out of frame',
        detail: null,
      }
    }
    return {
      ok: false,
      instruction: 'Tilt the camera up until your head is in frame',
      detail: null,
    }
  }

  if (!kneesVisible || !hipsVisible || !shouldersVisible) {
    return {
      ok: false,
      instruction: 'Adjust until your whole body is visible',
      detail: SETUP_DETAIL,
    }
  }

  // Full body visible — check framing quality.
  const noseY = frame.landmarks[NOSE]?.y ?? null
  const ankleY = avgY(frame, LEFT_ANKLE, RIGHT_ANKLE)
  const bodyHeight = noseY !== null && ankleY !== null ? ankleY - noseY : null

  if (bodyHeight !== null && bodyHeight > 0.92) {
    return { ok: false, instruction: 'Step back a little', detail: null }
  }
  if (bodyHeight !== null && bodyHeight < 0.4) {
    return { ok: false, instruction: 'Step closer to the camera', detail: null }
  }

  const centerX = avgX(frame, LEFT_HIP, RIGHT_HIP)
  if (centerX !== null && Math.abs(centerX - 0.5) > 0.2) {
    return {
      ok: false,
      instruction: 'Move to the center of the frame',
      detail: null,
    }
  }

  return {
    ok: true,
    instruction: 'Full body detected — hold still',
    detail: null,
  }
}

/**
 * Minimal canvas feedback for capture state: a soft inset border, green when
 * framing is good, amber while adjusting. Replaces the old static guides
 * (head target box, feet line, center line).
 */
export function drawCaptureStateBorder(
  ctx: CanvasRenderingContext2D,
  ok: boolean,
  width: number,
  height: number,
): void {
  const inset = Math.round(Math.min(width, height) * 0.015) + 6
  ctx.save()
  ctx.strokeStyle = ok ? 'rgba(34, 197, 94, 0.85)' : 'rgba(251, 191, 36, 0.75)'
  ctx.lineWidth = 3
  ctx.shadowColor = ok ? '#22c55e' : '#fbbf24'
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.roundRect(inset, inset, width - inset * 2, height - inset * 2, 18)
  ctx.stroke()
  ctx.restore()
}
