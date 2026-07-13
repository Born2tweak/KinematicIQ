import { Suspense, lazy, type RefObject } from 'react'
import { Button } from '../components/Button'
import { DepthSparkline } from '../components/DepthSparkline'
import { DisclaimerBanner } from '../components/DisclaimerBanner'
import { SessionStatusCard } from '../components/SessionStatusCard'
import type { Pose3DRefValue } from '../cv/pose3d'
import type { CaptureReadinessAssessment } from '../cv/captureReadiness'
import {
  canManuallyFinish,
  showsCameraDisclaimer,
  type CameraSessionPhase,
  type SessionStatusCopy,
} from './cameraSessionUi'

const PoseScene3D = lazy(() => import('../components/PoseScene3D'))

export function CameraReadinessPanel(props: {
  phase: CameraSessionPhase
  status: SessionStatusCopy
  calibrationProgress: number
  missingJoints: string[]
  repFeedback: string | null
  showChecklist: boolean
  readiness: CaptureReadinessAssessment | null
}) {
  return (
    <div className="camera-hud--top-left">
      <SessionStatusCard
        compact
        phase={props.phase}
        title={props.status.title}
        subtitle={props.status.subtitle}
        calibrationProgress={props.calibrationProgress}
        missingJoints={props.missingJoints}
        repFeedback={props.repFeedback}
      />
      {props.showChecklist && props.readiness && (
        <details
          className={`capture-readiness capture-readiness--${props.readiness.state}`}
        >
          <summary className="capture-readiness__heading">
            {props.readiness.state === 'ready'
              ? 'Ready to record'
              : props.readiness.state === 'marginal'
                ? 'Almost ready'
                : 'Get set up'}
          </summary>
          <ul className="capture-readiness__list">
            {props.readiness.checklist.map((item) => (
              <li
                key={item.id}
                className={`capture-readiness__item${item.ok ? ' capture-readiness__item--ok' : ''}`}
              >
                <span aria-hidden className="capture-readiness__mark">{item.ok ? '✓' : '○'}</span>
                {item.label}
              </li>
            ))}
            {props.readiness.geometryChecks.map((item) => (
              <li
                key={item.id}
                className={`capture-readiness__item${
                  item.status === 'pass'
                    ? ' capture-readiness__item--ok'
                    : item.status === 'warn'
                      ? ' capture-readiness__item--warn'
                      : ''
                }`}
              >
                <span aria-hidden className="capture-readiness__mark">
                  {item.status === 'pass' ? '✓' : item.status === 'warn' ? '!' : '○'}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export function CameraAnalystTools(props: {
  isAnalyst: boolean
  toggleAnalyst: () => void
  show3D: boolean
  toggle3D: () => void
  showDebug: boolean
  toggleDebug: () => void
  expand3D: boolean
  toggleExpand3D: () => void
  pose3DRef: RefObject<Pose3DRefValue>
  mirror: boolean
}) {
  return (
    <>
      <div className="camera-hud--tools">
        <button
          type="button"
          className={`hud-tool${props.isAnalyst ? ' hud-tool--on' : ''}`}
          onClick={props.toggleAnalyst}
          aria-pressed={props.isAnalyst}
          aria-expanded={props.isAnalyst}
          aria-controls="camera-analyst-tool-buttons"
          title="Analyst mode reveals the 3D pose view and debug tools"
        >
          Analyst details
        </button>
        {props.isAnalyst && (
          <span id="camera-analyst-tool-buttons" className="camera-analyst-tool-buttons">
          <button
            type="button"
            className={`hud-tool${props.show3D ? ' hud-tool--on' : ''}`}
            onClick={props.toggle3D}
            aria-pressed={props.show3D}
            aria-label={props.show3D ? 'Hide live 3D pose view' : 'Show live 3D pose view'}
          >
            3D
          </button>
          <button
            type="button"
            className={`hud-tool${props.showDebug ? ' hud-tool--on' : ''}`}
            onClick={props.toggleDebug}
            aria-pressed={props.showDebug}
            aria-label={props.showDebug ? 'Hide developer debug overlay' : 'Show developer debug overlay'}
          >
            DBG
          </button>
          </span>
        )}
      </div>
      {props.isAnalyst && props.show3D && (
        <div aria-label="Analyst details" className={`camera-3d-panel${props.expand3D ? ' camera-3d-panel--expanded' : ''}`}>
          <button
            type="button"
            className="camera-3d-expand"
            onClick={props.toggleExpand3D}
            aria-pressed={props.expand3D}
          >
            {props.expand3D ? 'Collapse' : 'Expand'}
          </button>
          <Suspense fallback={null}>
            <PoseScene3D poseRef={props.pose3DRef} mirror={props.mirror} />
          </Suspense>
          <DepthSparkline dataRef={props.pose3DRef} />
        </div>
      )}
    </>
  )
}

export function CameraActionBar(props: {
  phase: CameraSessionPhase
  isFinishing: boolean
  onFinish: () => void
  onCancel: () => void
}) {
  const canFinish = canManuallyFinish(props.phase)
  return (
    <div className="camera-hud--bottom">
      <div className="camera-action-bar">
        <Button
          variant="secondary"
          onClick={props.onFinish}
          disabled={!canFinish || props.isFinishing}
        >
          Finish Now
        </Button>
        <Button variant="ghost" onClick={props.onCancel}>Cancel</Button>
      </div>
      {showsCameraDisclaimer(props.phase) && <DisclaimerBanner />}
    </div>
  )
}
