import {
  FIGURE_VIEWBOX,
  GROUND_Y,
  HEAD_RADIUS,
  squatPose,
  type Pt,
} from './squatPose'

interface SquatFigureProps {
  /** Squat depth, 0 = standing, 1 = bottom. */
  depth: number
  /** Show the live knee-angle readout next to the knee joint. */
  showKneeAngle?: boolean
  className?: string
}

const LIMBS: Array<[keyof PoseJoints, keyof PoseJoints]> = [
  ['ankle', 'knee'],
  ['knee', 'hip'],
  ['hip', 'shoulder'],
  ['shoulder', 'elbow'],
  ['elbow', 'wrist'],
]

interface PoseJoints {
  ankle: Pt
  knee: Pt
  hip: Pt
  shoulder: Pt
  elbow: Pt
  wrist: Pt
}

export function SquatFigure({ depth, showKneeAngle = false, className }: SquatFigureProps) {
  const pose = squatPose(depth)
  const joints: PoseJoints = pose

  return (
    <svg
      viewBox={FIGURE_VIEWBOX}
      className={className}
      role="img"
      aria-label="Animated squat skeleton with tracked joints"
    >
      {/* Ground */}
      <line
        x1="22"
        y1={GROUND_Y}
        x2="178"
        y2={GROUND_Y}
        className="squat-figure__ground"
      />
      {/* Foot */}
      <line
        x1={pose.heel.x}
        y1={pose.heel.y}
        x2={pose.toe.x}
        y2={pose.toe.y}
        className="squat-figure__bone"
      />
      <line
        x1={pose.ankle.x}
        y1={pose.ankle.y}
        x2={pose.heel.x + 4}
        y2={pose.heel.y}
        className="squat-figure__bone"
      />
      {/* Limbs */}
      {LIMBS.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={joints[a].x}
          y1={joints[a].y}
          x2={joints[b].x}
          y2={joints[b].y}
          className="squat-figure__bone"
        />
      ))}
      {/* Neck + head */}
      <line
        x1={pose.shoulder.x}
        y1={pose.shoulder.y}
        x2={pose.head.x}
        y2={pose.head.y}
        className="squat-figure__bone"
      />
      <circle
        cx={pose.head.x}
        cy={pose.head.y}
        r={HEAD_RADIUS}
        className="squat-figure__head"
      />
      {/* Joints */}
      {(['ankle', 'knee', 'hip', 'shoulder', 'elbow', 'wrist'] as const).map(
        (name) => (
          <circle
            key={name}
            cx={joints[name].x}
            cy={joints[name].y}
            r={name === 'knee' || name === 'hip' ? 5 : 4}
            className={
              name === 'knee'
                ? 'squat-figure__joint squat-figure__joint--key'
                : 'squat-figure__joint'
            }
          />
        ),
      )}
      {showKneeAngle && (
        <text
          x={pose.knee.x + 12}
          y={pose.knee.y + 4}
          className="squat-figure__angle-label"
        >
          {Math.round(pose.kneeAngle)}°
        </text>
      )}
    </svg>
  )
}
