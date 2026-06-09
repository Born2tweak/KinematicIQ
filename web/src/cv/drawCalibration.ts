import { CONFIDENCE_THRESHOLD, PoseFrame } from './types'

export interface CalibrationResult {
  isCalibrated: boolean
  missingJoints: string[]
}

export function checkCalibration(poseFrame: PoseFrame | null): CalibrationResult {
  if (!poseFrame) {
    return { isCalibrated: false, missingJoints: ['Full Body'] }
  }

  const missing: string[] = []
  const landmarks = poseFrame.landmarks

  // Helper to check landmark visibility
  const isVisible = (idx: number) => {
    const lm = landmarks[idx]
    return lm !== undefined && lm.visibility >= CONFIDENCE_THRESHOLD
  }

  const shouldersVisible = isVisible(11) && isVisible(12)
  const hipsVisible = isVisible(23) && isVisible(24)
  const kneesVisible = isVisible(25) && isVisible(26)
  const anklesVisible = isVisible(27) && isVisible(28)

  if (!shouldersVisible) missing.push('Shoulders')
  if (!hipsVisible) missing.push('Hips')
  if (!kneesVisible) missing.push('Knees')
  if (!anklesVisible) missing.push('Ankles/Feet')

  return {
    isCalibrated: missing.length === 0,
    missingJoints: missing,
  }
}

export function drawCalibrationGuides(
  ctx: CanvasRenderingContext2D,
  poseFrame: PoseFrame | null,
  width: number,
  height: number,
): boolean {
  const { isCalibrated } = checkCalibration(poseFrame)
  
  const accentColor = isCalibrated ? '#22c55e' : '#ef4444' // Neon green vs neon red
  const labelColor = isCalibrated ? '#4ade80' : '#f87171'

  ctx.save()

  // 1. Draw Ground/Feet Line
  const groundY = height * 0.85
  ctx.strokeStyle = accentColor
  ctx.lineWidth = 2
  ctx.setLineDash([6, 6])
  ctx.shadowColor = accentColor
  ctx.shadowBlur = 6
  ctx.beginPath()
  ctx.moveTo(width * 0.15, groundY)
  ctx.lineTo(width * 0.85, groundY)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.shadowBlur = 0

  // Label for Ground Line
  ctx.fillStyle = labelColor
  ctx.font = 'bold 12px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ALIGN FEET ON THIS LINE', width * 0.5, groundY + 18)

  // 2. Draw Head Target Box
  const boxWidth = width * 0.25
  const boxHeight = height * 0.22
  const boxX = (width - boxWidth) / 2
  const boxY = height * 0.08

  ctx.strokeStyle = accentColor
  ctx.lineWidth = 2
  ctx.shadowColor = accentColor
  ctx.shadowBlur = 6
  
  // Draw corners of the target box for a futuristic camera UI feel
  const cornerLength = 15
  
  // Top-Left corner
  ctx.beginPath()
  ctx.moveTo(boxX + cornerLength, boxY)
  ctx.lineTo(boxX, boxY)
  ctx.lineTo(boxX, boxY + cornerLength)
  ctx.stroke()
  
  // Top-Right corner
  ctx.beginPath()
  ctx.moveTo(boxX + boxWidth - cornerLength, boxY)
  ctx.lineTo(boxX + boxWidth, boxY)
  ctx.lineTo(boxX + boxWidth, boxY + cornerLength)
  ctx.stroke()
  
  // Bottom-Left corner
  ctx.beginPath()
  ctx.moveTo(boxX, boxY + boxHeight - cornerLength)
  ctx.lineTo(boxX, boxY + boxHeight)
  ctx.lineTo(boxX + cornerLength, boxY + boxHeight)
  ctx.stroke()
  
  // Bottom-Right corner
  ctx.beginPath()
  ctx.moveTo(boxX + boxWidth, boxY + boxHeight - cornerLength)
  ctx.lineTo(boxX + boxWidth, boxY + boxHeight)
  ctx.lineTo(boxX + boxWidth - cornerLength, boxY + boxHeight)
  ctx.stroke()
  
  ctx.shadowBlur = 0

  // Label for Head Box
  ctx.fillText('ALIGN HEAD HERE', width * 0.5, boxY - 10)

  // 3. Draw Center Guide Line (Muted)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width * 0.5, 0)
  ctx.lineTo(width * 0.5, height)
  ctx.stroke()

  ctx.restore()

  return isCalibrated
}
