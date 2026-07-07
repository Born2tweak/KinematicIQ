# M41 — Assessment Workflow State Model

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/session/assessmentWorkflow.ts`** (new) — the typed,
protocol-agnostic capture workflow (R11 workflow states, R08 evented
pipeline). Pure: no DOM, no camera, no React.

- Nine stages per the roadmap: `select → prepare → cameraCheck → calibrate →
  ready → capture → autoFinishPending → qualityReview → results`.
- `advanceWorkflow` — pure transition reducer over an explicit legal-
  transition table. **Illegal events are no-ops**: camera callbacks can fire
  out of order and must never corrupt the workflow. `cameraFailed`/
  `cameraRetry` manage the error field; `reset` is always legal;
  `protocolSelected` carries the protocol id.
- Cancel/retake paths modeled: `finishCancelled` (squat again during the
  countdown) returns to `capture`; `retakeRequested` from review or results
  returns to `cameraCheck`.
- `workflowStageForCameraPhase` — total mapping from today's
  `CameraSessionPhase` (WAITING/CALIBRATING/READY/ACTIVE/
  AUTO_FINISH_PENDING/FINISHED) onto the model. FINISHED maps to `results`,
  not `qualityReview` — the live flow routes straight to the report today;
  the M51 quality-review screen will be the first entrant of that stage.

**`web/src/screens/CameraScreen.tsx`** — minimal, display-only wiring
(roadmap steps 4–5, "do not rewrite"): one import, a derived
`workflowStage`, and a `data-workflow-stage` attribute on the stage
container. The detection loop, auto-start/auto-finish state, and all refs
are untouched.

## Tests (`assessmentWorkflow.test.ts`, 10 tests)

- Nominal path walks all nine stages in order.
- Cancel (pending → capture), finish (capture/pending → qualityReview),
  retake (review/results → cameraCheck), camera error + retry (error field
  set/cleared), reset.
- Illegal events return the same state object (identity-checked).
- Camera-phase mapping covered for every phase.

## Quality gates

- `npm run build` — clean.
- `npm test` — 60 files / 388 tests passing (378 + 10 new).
- `npm run test:e2e:camera` — 3/3 passing (CameraScreen touched ⇒ e2e gate;
  behavior-preserving change confirmed against the live fixture flow).
