import type { SquatState } from './types'
import type { AutoStartPhase } from '../analysis/autoStart'

export interface DebugOverlayData {
  autoStartPhase: AutoStartPhase
  squatPhase: SquatState
  emaKneeAngle: number | null
  hipY: number | null
  repCount: number
  poseConfidence: number
}

const PHASE_COLORS: Record<SquatState, string> = {
  STANDING: '#22c55e',
  DESCENDING: '#facc15',
  BOTTOM: '#ef4444',
  ASCENDING: '#3b82f6',
}

const AUTO_COLORS: Record<AutoStartPhase, string> = {
  WAITING: '#6b7280',
  CALIBRATING: '#facc15',
  READY: '#22c55e',
  ACTIVE: '#3b82f6',
}

/**
 * Draws a translucent debug HUD in the top-left corner of the canvas.
 * All values update every frame so the developer can see the FSM in real time.
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  data: DebugOverlayData,
  canvasWidth: number,
): void {
  const lines = buildLines(data)

  const padding = 10
  const lineHeight = 18
  const fontSize = 13
  const panelHeight = padding * 2 + lines.length * lineHeight
  const panelWidth = Math.min(280, canvasWidth * 0.45)

  ctx.save()

  // Panel background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.beginPath()
  ctx.roundRect(8, 8, panelWidth, panelHeight, 6)
  ctx.fill()

  // Text
  ctx.font = `bold ${fontSize}px "JetBrains Mono", "Fira Code", monospace`
  ctx.textBaseline = 'top'

  let y = 8 + padding
  for (const line of lines) {
    ctx.fillStyle = line.color
    ctx.fillText(line.label, 8 + padding, y)
    ctx.fillStyle = '#e5e7eb'
    ctx.fillText(line.value, 8 + padding + 110, y)
    y += lineHeight
  }

  ctx.restore()
}

interface DebugLine {
  label: string
  value: string
  color: string
}

function buildLines(data: DebugOverlayData): DebugLine[] {
  const kneeStr =
    data.emaKneeAngle !== null ? `${data.emaKneeAngle.toFixed(1)}°` : '---'
  const hipStr =
    data.hipY !== null ? data.hipY.toFixed(4) : '---'
  const confStr = `${(data.poseConfidence * 100).toFixed(0)}%`
  const confColor =
    data.poseConfidence >= 0.7
      ? '#22c55e'
      : data.poseConfidence >= 0.5
        ? '#facc15'
        : '#ef4444'

  return [
    {
      label: 'SESSION',
      value: data.autoStartPhase,
      color: AUTO_COLORS[data.autoStartPhase],
    },
    {
      label: 'PHASE',
      value: data.squatPhase,
      color: PHASE_COLORS[data.squatPhase],
    },
    { label: 'KNEE (EMA)', value: kneeStr, color: '#a78bfa' },
    { label: 'HIP Y', value: hipStr, color: '#67e8f9' },
    { label: 'REPS', value: String(data.repCount), color: '#f9a8d4' },
    { label: 'CONFIDENCE', value: confStr, color: confColor },
  ]
}
