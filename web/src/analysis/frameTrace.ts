/**
 * Frame trace — the per-frame reconstruction stream that survives the pipeline
 * (ontology §3.4: posture as a time series). `RepMetrics` aggregates discard
 * per-frame signals; evidence generators (ontology §3.10) need them back:
 * trunk-vs-progress trajectories, and a SIGNED lateral hip offset that
 * `repCounter`'s unsigned `hipShiftAtBottom` cannot provide.
 *
 * Additive by design: taps the same per-frame values the FSM already computes,
 * never feeds back into phase detection or rep counting.
 */
import { midpoint, safeLandmark } from './geometry'
import {
  LANDMARK_INDICES,
  type JointAngles,
  type PoseFrame,
  type SquatState,
} from '../cv/types'

/**
 * Below this normalized hip width the athlete is effectively side-on to the
 * camera and a lateral offset ratio would explode; the sample records null
 * instead (protocol-dependent availability, ontology §3.2).
 */
const MIN_HIP_WIDTH = 0.02

export interface FrameTraceSample {
  frameIndex: number
  timestamp: number
  /** Phase the FSM assigned to this frame (after debounce). */
  phase: SquatState
  /** Tracking knee angle — min of left/right, the same signal the FSM consumes. */
  kneeAngle: number | null
  trunkLean: number | null
  /**
   * Lateral hip offset at this frame: (hip midpoint x − ankle midpoint x),
   * normalized by hip width, sign preserved. Positive = toward image +x;
   * direction naming (athlete left/right) is resolved by the evidence layer
   * from landmark identities, not here.
   */
  signedHipOffsetX: number | null
  /** Average hip Y (normalized, increases downward). */
  hipY: number | null
  poseConfidence: number
}

/** Tracking knee angle — mirrors `videoAnalyzer.trackingKneeAngle`. */
function minKneeAngle(angles: JointAngles): number | null {
  const knees = [angles.leftKnee, angles.rightKnee].filter(
    (value): value is number => value !== null,
  )
  return knees.length === 0 ? null : Math.min(...knees)
}

/** Signed, hip-width-normalized lateral offset of hips over ankles. */
export function signedHipOffsetX(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  const leftAnkle = safeLandmark(frame, LANDMARK_INDICES.LEFT_ANKLE)
  const rightAnkle = safeLandmark(frame, LANDMARK_INDICES.RIGHT_ANKLE)
  if (!leftHip || !rightHip || !leftAnkle || !rightAnkle) return null

  const hipWidth = Math.abs(leftHip.x - rightHip.x)
  if (hipWidth < MIN_HIP_WIDTH) return null

  const hipMid = midpoint(leftHip, rightHip)
  const ankleMid = midpoint(leftAnkle, rightAnkle)
  return (hipMid.x - ankleMid.x) / hipWidth
}

function computeHipY(frame: PoseFrame): number | null {
  const leftHip = safeLandmark(frame, LANDMARK_INDICES.LEFT_HIP)
  const rightHip = safeLandmark(frame, LANDMARK_INDICES.RIGHT_HIP)
  return leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null
}

/** Build one trace sample from values the pipeline already has in hand. */
export function buildFrameTraceSample(
  frame: PoseFrame,
  angles: JointAngles,
  phase: SquatState,
): FrameTraceSample {
  return {
    frameIndex: frame.frameIndex,
    timestamp: frame.timestamp,
    phase,
    kneeAngle: minKneeAngle(angles),
    trunkLean: angles.trunkLean,
    signedHipOffsetX: signedHipOffsetX(frame),
    hipY: computeHipY(frame),
    poseConfidence: frame.poseConfidence,
  }
}

export interface FrameTraceCollector {
  /** Record one sample; call once per analyzed frame, after phase resolution. */
  record(frame: PoseFrame, angles: JointAngles, phase: SquatState): void
  readonly count: number
  /** Snapshot of the trace so far (copy — safe to hold across resets). */
  build(): FrameTraceSample[]
  reset(): void
}

/**
 * Accumulate per-frame samples alongside the FSM loop. Same collector idiom as
 * `eval/poseTape.createTapeRecorder`.
 */
export function createFrameTraceCollector(): FrameTraceCollector {
  let samples: FrameTraceSample[] = []
  return {
    record(frame: PoseFrame, angles: JointAngles, phase: SquatState): void {
      samples.push(buildFrameTraceSample(frame, angles, phase))
    },
    get count(): number {
      return samples.length
    },
    build(): FrameTraceSample[] {
      return samples.slice()
    },
    reset(): void {
      samples = []
    },
  }
}
