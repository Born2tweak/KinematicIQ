# Doctrine — Deferred-Scope Ledger

**Status:** Canonical doctrine. The explicit "do not build (yet)" list for this platform build. Distilled from MD #10 (`10_Future_of_Movement_Intelligence_Roadmap.md`, "What KinematicIQ Should Not Build") and the owner constraints in `docs/implementation/IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md` (Section E). Anything here is out of scope until its stated gate is met; adding it early is a constraint violation. Update this ledger in M11 (and whenever a milestone reveals a new deferral).

## Hard-deferred (do not build in this milestone set)

| Item | Why deferred | Gate to reconsider |
|---|---|---|
| **Pose-model swap** (RTMPose or any replacement for MediaPipe) | MediaPipe is load-bearing; a swap silently invalidates every captured tape and parity test | A replay-harness benchmark (MD #6 discipline) proving parity/superiority on the tape suite *before* any swap |
| **SMPL / digital humans / 3D avatars** | Beyond the existing `PoseScene3D` inspection view, this is unvalidated presentation with no analysis payoff | Explicit roadmap decision post-validation; not in scope |
| **OpenSim musculoskeletal modeling / force / torque estimates** | Kinetics are not defensible from single-RGB video (MD #3 §12); forbidden by claims policy | Multi-modal capture (force plate / IMU) + validation; not browser-only |
| **FHIR / clinical integrations / medical diagnosis** | Not a medical device; forbidden conclusions | Regulatory pathway + clinical validation; out of product scope |
| **Injury prediction / injury-risk scores** | High false-positive science, explicitly warned off; forbidden conclusion | Prospective validation for a specific population + endpoint (MD #10); effectively out of scope |
| **Wearables / IMU sensor fusion** | Browser-only, single-camera product for now | Sensor-fusion architecture milestone, post-core-platform |
| **Enterprise features / accounts / cloud sync / any backend** | Browser-only, local-persistence-only constraint | Would require a full backend/security scope change |
| **Movement embeddings / foundation-model work** | MD #10 long-horizon research bet, not a shippable feature now | Dedicated research track with data moat + validation infra |
| **Composite 0–100 "movement quality" score** | Permanently forbidden — hides context and uncertainty (MD #1 §4.4, MD #10) | **Never.** Not a deferral; a permanent prohibition |
| **PDF report generation / cloud report sharing** (M33 decision) | Local-only artifact strategy; HTML+JSON cover audit and sharing without a backend or heavyweight dependency | Explicit product decision post-validation; cloud sharing additionally gated on the backend scope change above |
| **Build-time app-version injection** | `APP_VERSION` in `export/sessionReport.ts` is a manual constant matching `web/package.json` | M46 model/algorithm version registry provides the single source |
| **Live filtering stack upgrade** (Butterworth or alternate live filter) | Current one-euro live variant is load-bearing for tape parity | M27: a named filter candidate + replay-harness benchmark on the labeled tape suite showing improvement |

## Explicitly not-refactored in this build (leave working as-is)

| Item | Why | Reference |
|---|---|---|
| Rep-counting gates (`analysis/repCounter.ts`) | Validation findings #5/#6 intentionally open pending labeled data | `docs/validation/session-log.md` |
| Phase-detector thresholds (`analysis/phaseDetector.ts`) | Same — must not be "fixed" as a side effect of protocol work | ditto |
| Pose-tape format (`eval/poseTape.ts`) | Audit trail; tapes must stay replayable | extend only additively, with a version bump |
| MediaPipe engine (`cv/poseEngine.ts`) | See pose-model swap above | — |
| The 3D/replay/demo layer | Cosmetic churn with no protocol payoff | commit `91f7129` |

## Open validation findings kept visible (do not paper over)

- **Findings #5/#6** — rep gates can count standing / impossible-flexion reps. The protocol/metric/finding refactor must not hide these; they stay surfaced by the quality gate. Revisit only with labeled ground-truth data.

## What MD #10 says to invest in (context, not this build's scope)

Validation partnerships; a proprietary ontology + metric versioning system (partially advanced by M3/M6); confidence scoring & explainability (advanced by M3/M7/M8); longitudinal personalization (seeded by M9, local-only); browser AI / WebGPU / on-device privacy; data governance as a product feature. These frame *why* the deferred items are deferred, not permission to start them here.
