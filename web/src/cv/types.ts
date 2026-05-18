export interface NormalizedLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface WorldLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface PoseFrame {
  timestamp: number
  frameIndex: number
  landmarks: NormalizedLandmark[]
  worldLandmarks: WorldLandmark[]
  poseConfidence: number
}

export interface JointAngles {
  leftKnee: number | null
  rightKnee: number | null
  leftHip: number | null
  rightHip: number | null
  trunkLean: number | null
  pelvisTilt: number | null
}

export interface SmoothedFrame {
  timestamp: number
  frameIndex: number
  landmarks: NormalizedLandmark[]
  angles: JointAngles
  confidence: number
}

export type SquatState = 'STANDING' | 'DESCENDING' | 'BOTTOM' | 'ASCENDING'

export interface RepMetrics {
  repNumber: number
  startFrameIndex: number
  bottomFrameIndex: number
  endFrameIndex: number
  startTimestamp: number
  endTimestamp: number
  minLeftKneeAngle: number | null
  minRightKneeAngle: number | null
  maxTrunkLean: number | null
  kneeAsymmetry: number | null
  confidence: number
  durationMs: number
}

export interface SessionMetrics {
  repCount: number
  reps: RepMetrics[]
  averageDepth: number | null
  averageTrunkLean: number | null
  averageSymmetryScore: number | null
  overallConfidence: number
}

export type FeedbackSeverity = 'info' | 'warning' | 'critical'
export type FeedbackCategory = 'depth' | 'trunk' | 'symmetry' | 'confidence' | 'general'

export interface FeedbackMessage {
  id: string
  category: FeedbackCategory
  severity: FeedbackSeverity
  message: string
}

export interface MovementScore {
  depth: number | null
  trunkControl: number | null
  symmetry: number | null
  overall: number | null
}

export interface PipelineState {
  isLoaded: boolean
  isRunning: boolean
  currentSquatState: SquatState
  currentAngles: JointAngles | null
  currentConfidence: number
  completedReps: RepMetrics[]
  currentRepCount: number
  sessionMetrics: SessionMetrics | null
  feedback: FeedbackMessage[]
  scores: MovementScore | null
  error: string | null
}

export interface SegmenterResult {
  state: SquatState
  completedRep: RepMetrics | null
}

export const LANDMARK_INDICES = {
  NOSE: 0,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

export const CONFIDENCE_THRESHOLD = 0.5

export const CRITICAL_LANDMARKS = [
  LANDMARK_INDICES.LEFT_SHOULDER,
  LANDMARK_INDICES.RIGHT_SHOULDER,
  LANDMARK_INDICES.LEFT_HIP,
  LANDMARK_INDICES.RIGHT_HIP,
  LANDMARK_INDICES.LEFT_KNEE,
  LANDMARK_INDICES.RIGHT_KNEE,
  LANDMARK_INDICES.LEFT_ANKLE,
  LANDMARK_INDICES.RIGHT_ANKLE,
] as const
