import type { SquatState } from './types'
import type { AutoStartPhase } from '../analysis/autoStart'
import type { RepValidation } from '../analysis/repCounter'

export interface DebugOverlayData {
  autoStartPhase: AutoStartPhase
  squatPhase: SquatState
  emaKneeAngle: number | null
  leftKneeAngle: number | null
  rightKneeAngle: number | null
  hipY: number | null
  hipDrop: number | null
  repCount: number
  repCountDisplayed: number
  poseConfidence: number
  lastValidation: RepValidation | null
  candidateRepActive: boolean
  reachedBottom: boolean
  awaitingStandingCompletion: boolean
  standingFrames: number
  standingKneeBaseline: number | null
  lockoutKneeThreshold: number | null
  blockingGate: string | null
  lastMissedRepReason: string | null
  completedRepThisFrame: boolean
  previousPhase: SquatState
  seatedLive: boolean
  maxHipDropLive: number
  /** Rejected rep candidates so far this set (gate diagnostics). */
  rejectionCount: number
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
 * Draws a translucent debug HUD along the left edge of the canvas, starting
 * BELOW the top-left status card zone so the two never overlap. All values
 * update every frame so the developer can see the FSM in real time.
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  data: DebugOverlayData,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const lines = buildLines(data)

  const padding = 10
  const fontSize = 13
  const panelWidth = Math.min(320, canvasWidth * 0.52)
  // Reserve the top ~22% of the stage for the DOM status card.
  const panelTop = Math.max(120, Math.round(canvasHeight * 0.22))
  // Shrink line height if the panel would run past the bottom edge.
  const available = canvasHeight - panelTop - 16
  const lineHeight = Math.min(18, Math.max(12, Math.floor((available - padding * 2) / lines.length)))
  const panelHeight = padding * 2 + lines.length * lineHeight

  ctx.save()

  // Panel background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.beginPath()
  ctx.roundRect(8, panelTop, panelWidth, panelHeight, 6)
  ctx.fill()

  // Text
  ctx.font = `bold ${fontSize}px "JetBrains Mono", "Fira Code", monospace`
  ctx.textBaseline = 'top'

  let y = panelTop + padding
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

const PASS = '#22c55e'
const FAIL = '#ef4444'

function gate(label: string, passed: boolean): DebugLine {
  return { label, value: passed ? 'PASS' : 'FAIL', color: passed ? PASS : FAIL }
}

function buildLines(data: DebugOverlayData): DebugLine[] {
  const kneeStr =
    data.emaKneeAngle !== null ? `${data.emaKneeAngle.toFixed(1)}°` : '---'
  const leftStr =
    data.leftKneeAngle !== null ? `${data.leftKneeAngle.toFixed(1)}°` : '---'
  const rightStr =
    data.rightKneeAngle !== null ? `${data.rightKneeAngle.toFixed(1)}°` : '---'
  const hipStr =
    data.hipY !== null ? data.hipY.toFixed(4) : '---'
  const hipDropStr =
    data.hipDrop !== null ? data.hipDrop.toFixed(4) : '---'
  const confStr = `${(data.poseConfidence * 100).toFixed(0)}%`
  const confColor =
    data.poseConfidence >= 0.7
      ? '#22c55e'
      : data.poseConfidence >= 0.5
        ? '#facc15'
        : '#ef4444'

  const lines: DebugLine[] = [
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
    { label: 'L KNEE', value: leftStr, color: '#a78bfa' },
    { label: 'R KNEE', value: rightStr, color: '#a78bfa' },
    { label: 'HIP Y', value: hipStr, color: '#67e8f9' },
    { label: 'HIP DROP', value: hipDropStr, color: '#67e8f9' },
    { label: 'REPS(state)', value: String(data.repCount), color: '#f9a8d4' },
    { label: 'REPS(disp)', value: String(data.repCountDisplayed), color: data.repCount !== data.repCountDisplayed ? '#ef4444' : '#f9a8d4' },
    { label: 'CONFIDENCE', value: confStr, color: confColor },
    { label: '── REP ──', value: '', color: '#6b7280' },
    {
      label: 'CANDIDATE',
      value: data.candidateRepActive ? 'YES' : 'no',
      color: data.candidateRepActive ? '#22c55e' : '#6b7280',
    },
    {
      label: 'HIT BOTTOM',
      value: data.reachedBottom ? 'YES' : 'no',
      color: data.reachedBottom ? '#22c55e' : '#6b7280',
    },
    {
      label: 'AWAIT STAND',
      value: data.awaitingStandingCompletion ? 'YES' : 'no',
      color: data.awaitingStandingCompletion ? '#facc15' : '#6b7280',
    },
    {
      label: 'STAND FR',
      value: String(data.standingFrames),
      color: data.standingFrames >= 4 ? '#22c55e' : '#e5e7eb',
    },
    {
      label: 'CAL KNEE',
      value:
        data.standingKneeBaseline !== null
          ? `${data.standingKneeBaseline.toFixed(0)}°`
          : '---',
      color: '#a78bfa',
    },
    {
      label: 'LOCKOUT ≥',
      value:
        data.lockoutKneeThreshold !== null
          ? `${data.lockoutKneeThreshold.toFixed(0)}°`
          : '---',
      color: '#a78bfa',
    },
    {
      label: 'BLOCK GATE',
      value: data.blockingGate ?? '—',
      color: data.blockingGate ? '#facc15' : '#6b7280',
    },
    {
      label: 'MISSED',
      value: data.lastMissedRepReason ?? '—',
      color: data.lastMissedRepReason ? '#ef4444' : '#6b7280',
    },
    {
      label: 'COMPLETED',
      value: data.completedRepThisFrame ? 'YES' : '—',
      color: data.completedRepThisFrame ? '#22c55e' : '#6b7280',
    },
    { label: 'PREV PHASE', value: data.previousPhase, color: PHASE_COLORS[data.previousPhase] },
    { label: 'SEATED', value: data.seatedLive ? 'YES' : 'no', color: data.seatedLive ? '#ef4444' : '#6b7280' },
    { label: 'MAX H.DROP', value: data.maxHipDropLive.toFixed(3), color: data.maxHipDropLive > 0.30 ? '#ef4444' : '#6b7280' },
    {
      label: 'REJECTIONS',
      value: String(data.rejectionCount),
      color: data.rejectionCount > 0 ? '#facc15' : '#6b7280',
    },
  ]

  const v = data.lastValidation
  if (v) {
    lines.push(
      { label: '── GATES ──', value: '', color: '#6b7280' },
      gate('REACHED BTM', v.reachedBottom),
      gate('BILATERAL', v.bilateralBend),
      gate('HIP DESC', v.hipDescended),
      gate('FEET STABLE', v.feetStable),
      gate('DURATION', v.validDuration),
      gate('KNEE LIFT', !v.isKneeLift),
      gate('SEATED', !v.seatedMovementDetected),
      { label: 'MAX HIP DR', value: v.maxHipDrop.toFixed(3), color: v.maxHipDrop > 0.30 ? '#ef4444' : '#e5e7eb' },
      { label: 'BTM HOLD', value: `${v.bottomHoldMs.toFixed(0)}ms`, color: v.bottomHoldMs > 1200 ? '#ef4444' : '#e5e7eb' },
    )
    if (v.rejectionReason) {
      lines.push({
        label: 'REJECTED',
        value: v.rejectionReason,
        color: '#ef4444',
      })
    }
  }

  return lines
}
