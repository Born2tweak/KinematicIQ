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

// Static overlay guides (head target box, feet line, center line) were
// removed in favor of dynamic capture guidance — see cv/captureGuidance.ts.
