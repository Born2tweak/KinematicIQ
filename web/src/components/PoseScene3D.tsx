import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Grid, Html, OrbitControls } from '@react-three/drei'
import {
  createWorldLandmarkSmoother,
  jointArcPoints,
  worldToThree,
  POSE_CONNECTIONS,
  type Pose3DRefValue,
} from '../cv/pose3d'
import { CONFIDENCE_THRESHOLD, type JointAngles } from '../cv/types'

export type { Pose3DRefValue } from '../cv/pose3d'
export { createEmptyPose3DRef } from '../cv/pose3d'

const FRONT_CAMERA_MIRROR = false

const JOINT_COUNT = 33
const BONE_COUNT = POSE_CONNECTIONS.length
const JOINT_RADIUS = 0.022
const BONE_RADIUS_TOP = 0.011
const BONE_RADIUS_BOTTOM = 0.017
const ARC_RADIUS = 0.1
const ARC_SEGMENTS = 16
const HIDDEN_SCALE = 0.0001
const VISIBLE_SCALE = 1

interface PoseScene3DProps {
  poseRef: React.RefObject<Pose3DRefValue>
  mirror?: boolean
}

interface AngleArcSpec {
  key: keyof JointAngles
  a: number
  b: number
  c: number
}

const ANGLE_ARCS: AngleArcSpec[] = [
  { key: 'leftKnee', a: 23, b: 25, c: 27 },
  { key: 'rightKnee', a: 24, b: 26, c: 28 },
  { key: 'leftHip', a: 11, b: 23, c: 25 },
  { key: 'rightHip', a: 12, b: 24, c: 26 },
]

function formatDegrees(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return ''
  return `${Math.round(value)}°`
}

function Skeleton({
  poseRef,
  mirror,
}: {
  poseRef: React.RefObject<Pose3DRefValue>
  mirror: boolean
}) {
  const jointsRef = useRef<THREE.InstancedMesh>(null)
  const bonesRef = useRef<THREE.InstancedMesh>(null)
  const trailRef = useRef<THREE.Line>(null)
  const arcRefs = useRef<(THREE.Line | null)[]>([])
  const labelGroupRefs = useRef<(THREE.Group | null)[]>([])
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])

  const smoother = useMemo(() => createWorldLandmarkSmoother(), [])
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), [])
  const tmpPosition = useMemo(() => new THREE.Vector3(), [])
  const tmpScale = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const tmpQuaternion = useMemo(() => new THREE.Quaternion(), [])
  const tmpDirection = useMemo(() => new THREE.Vector3(), [])
  const boneUpAxis = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const identityQuaternion = useMemo(() => new THREE.Quaternion(), [])
  // Smoothed vertical offset planting the lowest visible landmark on the
  // grid plane. MediaPipe world coords are hip-centered, so without this the
  // skeleton floats mid-air and drifts as the hip origin moves. Pure
  // visualization anchoring — no accuracy is implied (see panel badge).
  const groundOffsetRef = useRef<number | null>(null)

  const trailGeometry = useMemo(() => new THREE.BufferGeometry(), [])
  const trailLineObject = useMemo(
    () => new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: '#facc15' })),
    [trailGeometry],
  )
  const arcGeometries = useMemo(
    () => ANGLE_ARCS.map(() => new THREE.BufferGeometry()),
    [],
  )
  const arcLines = useMemo(
    () =>
      arcGeometries.map(
        (geometry) => new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#4ade80' })),
      ),
    [arcGeometries],
  )

  useFrame(() => {
    const data = poseRef.current
    const jointsMesh = jointsRef.current
    const bonesLine = bonesRef.current
    if (!data || !jointsMesh || !bonesLine) return

    if (!data.worldLandmarks || data.worldLandmarks.length === 0) {
      tmpMatrix.compose(
        tmpPosition.set(0, 0, 0),
        identityQuaternion,
        tmpScale.set(HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE),
      )
      for (let i = 0; i < JOINT_COUNT; i++) {
        jointsMesh.setMatrixAt(i, tmpMatrix)
      }
      for (let i = 0; i < BONE_COUNT; i++) {
        bonesLine.setMatrixAt(i, tmpMatrix)
      }
      jointsMesh.instanceMatrix.needsUpdate = true
      bonesLine.instanceMatrix.needsUpdate = true
      return
    }

    const smoothed = smoother.smooth(data.worldLandmarks, data.timestamp)
    const points = smoothed.map((lm) => worldToThree(lm, { mirror }))

    // Ground anchoring: ease the lowest visible point onto the grid plane.
    let minY = Infinity
    for (let i = 0; i < JOINT_COUNT; i++) {
      const lm = smoothed[i]
      if (lm && lm.visibility >= CONFIDENCE_THRESHOLD && points[i]) {
        minY = Math.min(minY, points[i].y)
      }
    }
    if (Number.isFinite(minY)) {
      const target = -minY
      groundOffsetRef.current =
        groundOffsetRef.current === null
          ? target
          : groundOffsetRef.current + (target - groundOffsetRef.current) * 0.15
    }
    const groundOffset = groundOffsetRef.current ?? 0
    for (const p of points) {
      p.y += groundOffset
    }

    for (let i = 0; i < JOINT_COUNT; i++) {
      const lm = smoothed[i]
      const p = points[i]
      const visible = !!lm && lm.visibility >= CONFIDENCE_THRESHOLD
      const scaleValue = visible ? VISIBLE_SCALE : HIDDEN_SCALE
      tmpMatrix.compose(
        tmpPosition.set(visible ? p.x : 0, visible ? p.y : 0, visible ? p.z : 0),
        identityQuaternion,
        tmpScale.set(scaleValue, scaleValue, scaleValue),
      )
      jointsMesh.setMatrixAt(i, tmpMatrix)
    }
    jointsMesh.instanceMatrix.needsUpdate = true

    // Tapered cylinder bones: unit-height cylinder oriented from p0 to p1.
    POSE_CONNECTIONS.forEach(([i0, i1], idx) => {
      const lm0 = smoothed[i0]
      const lm1 = smoothed[i1]
      const visible =
        !!lm0 &&
        !!lm1 &&
        lm0.visibility >= CONFIDENCE_THRESHOLD &&
        lm1.visibility >= CONFIDENCE_THRESHOLD
      if (!visible) {
        tmpMatrix.compose(
          tmpPosition.set(0, 0, 0),
          identityQuaternion,
          tmpScale.set(HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE),
        )
        bonesLine.setMatrixAt(idx, tmpMatrix)
        return
      }
      const p0 = points[i0]
      const p1 = points[i1]
      tmpDirection.set(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z)
      const boneLength = tmpDirection.length()
      if (boneLength < 1e-6) {
        tmpMatrix.compose(
          tmpPosition.set(0, 0, 0),
          identityQuaternion,
          tmpScale.set(HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE),
        )
        bonesLine.setMatrixAt(idx, tmpMatrix)
        return
      }
      tmpDirection.multiplyScalar(1 / boneLength)
      tmpQuaternion.setFromUnitVectors(boneUpAxis, tmpDirection)
      tmpMatrix.compose(
        tmpPosition.set((p0.x + p1.x) / 2, (p0.y + p1.y) / 2, (p0.z + p1.z) / 2),
        tmpQuaternion,
        tmpScale.set(1, boneLength, 1),
      )
      bonesLine.setMatrixAt(idx, tmpMatrix)
    })
    bonesLine.instanceMatrix.needsUpdate = true

    // Angle arcs
    ANGLE_ARCS.forEach((spec, idx) => {
      const lmA = smoothed[spec.a]
      const lmB = smoothed[spec.b]
      const lmC = smoothed[spec.c]
      const arcLine = arcRefs.current[idx]
      const label = labelRefs.current[idx]
      const ok =
        !!lmA &&
        !!lmB &&
        !!lmC &&
        lmA.visibility >= CONFIDENCE_THRESHOLD &&
        lmB.visibility >= CONFIDENCE_THRESHOLD &&
        lmC.visibility >= CONFIDENCE_THRESHOLD

      const geometry = arcGeometries[idx]
      if (!ok) {
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3))
        if (arcLine) arcLine.visible = false
        if (label) label.style.display = 'none'
        return
      }

      const pA = points[spec.a]
      const pB = points[spec.b]
      const pC = points[spec.c]
      const arcPoints = jointArcPoints(pA, pB, pC, ARC_RADIUS, ARC_SEGMENTS)
      if (arcPoints.length === 0) {
        if (arcLine) arcLine.visible = false
        if (label) label.style.display = 'none'
        return
      }

      const flat = new Float32Array(arcPoints.length * 3)
      arcPoints.forEach((pt, i) => {
        flat[i * 3] = pt.x
        flat[i * 3 + 1] = pt.y
        flat[i * 3 + 2] = pt.z
      })
      geometry.setAttribute('position', new THREE.BufferAttribute(flat, 3))
      geometry.attributes.position.needsUpdate = true
      if (arcLine) arcLine.visible = true

      const mid = arcPoints[Math.floor(arcPoints.length / 2)]
      const labelGroup = labelGroupRefs.current[idx]
      if (labelGroup) {
        labelGroup.position.set(mid.x, mid.y, mid.z)
      }

      if (label) {
        const angleValue = data.angles ? data.angles[spec.key] : null
        const text = formatDegrees(angleValue)
        label.textContent = text
        label.style.display = text ? 'block' : 'none'
      }
    })

    // COM trail
    const trailLine = trailRef.current
    if (trailLine && data.hipTrail.length > 0) {
      const trailPoints = data.hipTrail.map((pt) => worldToThree(pt, { mirror }))
      const flat = new Float32Array(trailPoints.length * 3)
      trailPoints.forEach((pt, i) => {
        flat[i * 3] = pt.x
        flat[i * 3 + 1] = pt.y + groundOffset
        flat[i * 3 + 2] = pt.z
      })
      trailGeometry.setAttribute('position', new THREE.BufferAttribute(flat, 3))
      trailGeometry.attributes.position.needsUpdate = true
      trailLine.visible = true
    } else if (trailLine) {
      trailLine.visible = false
    }
  })

  return (
    <group>
      <instancedMesh ref={jointsRef} args={[undefined, undefined, JOINT_COUNT]} castShadow>
        <sphereGeometry args={[JOINT_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0ea5e9"
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.2}
        />
      </instancedMesh>
      <instancedMesh ref={bonesRef} args={[undefined, undefined, BONE_COUNT]} castShadow>
        <cylinderGeometry args={[BONE_RADIUS_TOP, BONE_RADIUS_BOTTOM, 1, 10]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.25} />
      </instancedMesh>
      <primitive object={trailLineObject} ref={trailRef} />
      {ANGLE_ARCS.map((spec, idx) => (
        <group key={spec.key}>
          <primitive
            object={arcLines[idx]}
            ref={(obj: THREE.Line | null) => {
              arcRefs.current[idx] = obj
            }}
          />
          <group
            ref={(obj: THREE.Group | null) => {
              labelGroupRefs.current[idx] = obj
            }}
          >
            <Html center occlude={false} style={{ pointerEvents: 'none' }}>
              <div
                ref={(el) => {
                  labelRefs.current[idx] = el
                }}
                className="pose3d-angle-label"
                style={{ display: 'none' }}
              />
            </Html>
          </group>
        </group>
      ))}
    </group>
  )
}

export default function PoseScene3D({ poseRef, mirror = FRONT_CAMERA_MIRROR }: PoseScene3DProps) {
  return (
    <div className="camera-3d-container">
      <Canvas shadows camera={{ position: [0, 1.2, 2.5], fov: 50 }}>
        <color attach="background" args={['#0b1220']} />
        <fog attach="fog" args={['#0b1220', 6, 14]} />
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[2.5, 4, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={12}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <directionalLight position={[-2, 2, -2.5]} intensity={0.35} color="#7dd3fc" />
        <ContactShadows
          position={[0, 0.001, 0]}
          opacity={0.55}
          scale={8}
          blur={2.4}
          far={3}
          resolution={512}
          color="#020617"
        />
        <Grid
          args={[6, 6]}
          cellSize={0.25}
          cellThickness={0.5}
          sectionSize={1}
          sectionThickness={1}
          cellColor="#1e293b"
          sectionColor="#334155"
          fadeDistance={8}
          infiniteGrid
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={6}
        />
        <Skeleton poseRef={poseRef} mirror={mirror} />
      </Canvas>
      <div className="camera-3d-badge">
        Depth (Z): on-device estimate — not validated
      </div>
    </div>
  )
}
