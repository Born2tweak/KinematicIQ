# KinematicIQ Context Pack
<!-- AUTO-GENERATED 2026-06-02 15:12 â€” do not hand-edit, run scripts/generate-context-pack.ps1 -->

## Workspace
| Key | Value |
|-----|-------|
| Repo | `C:\Users\acetu\KinematicIQ` / https://github.com/Born2tweak/KinematicIQ.git |
| Branch | `master` |
| App | `web/` â€” Vite + React + TS â€” `npm run dev` -> http://localhost:5173/ |
| Pose engine | MediaPipe `@mediapipe/tasks-vision` (on-device, no backend) |
| Session start | Auto-start + auto-finish (calibrate -> squat -> stand still to end; Finish Now backup) |

## Product
Browser-only **bodyweight squat** analyzer. Camera -> MediaPipe Pose -> angles -> phases -> reps -> metrics -> score -> coaching. No backend, no auth, no persistence.

## Milestones (1-16 done, next: 17 - Video upload impl)
| # | Name | Status |
|---|------|--------|
| 1 | App shell + routing | **Done** |
| 2 | Camera + preview | **Done** |
| 3 | Pose estimation | **Done** |
| 4 | Skeleton overlay | **Done** |
| 5 | Joint angle math | **Done** |
| 6 | Phase detection | **Done** |
| 7 | Rep counting | **Done** |
| 8 | Auto-start + debug | **Done** |
| 9 | Scoring engine | **Done** |
| 10 | Feedback engine | **Done** |
| 11 | Results wiring | **Done** |
| 12 | Session metrics | **Done** |
| 13 | Polish + responsive | **Done** |
| 14 | Testing + scoring transparency | **Done** |
| 15 | UI polish (results/camera) | **Done** |
| 16 | Planning (video + outreach) | **Done** |
| 17 | Video upload impl | Not started |
| 18 | Cleanup | Not started |

## Divergences (repo vs docs)
| Topic | Docs say | Repo has |
|-------|----------|----------|
| Language | JS | **TypeScript** |
| Routing | State in App | **react-router-dom** `/` `/camera` `/results` |
| Pose folder | `pose/` | **`cv/`** |
| Analysis | not specified | **`analysis/`** |
| Session start | manual button | **auto-start FSM** |
| Results | mock in early docs | **live ``buildSessionResult`` via router state** |

## Key contracts
`poseEngine`: `initialize()` / `getReadyState()` / `detect(video, ts, frame)` -> `PoseFrame | null`
`PoseFrame`: `{ landmarks, worldLandmarks, poseConfidence, timestamp, frameIndex }`
`updatePhaseDetector(state, { kneeAngle, hipY, timestamp })` -> `{ phase, transitioned, smoothedKneeAngle, state }` (learns `standingKneeAngle`)
`updateRepCounter(state, { phase, transitioned, frame, angles, hipY, smoothedKneeAngle, standingKneeBaseline, standingHipY })` -> `{ repCount, reps, completedRep, state }`
`updateAutoStart(state, ...)` -> `{ phase, transitioned, activatedByDescent, state }`
`activateAnalysisPipeline(...)` â€” seeds rep 1 when ACTIVE starts mid-descent
`buildSessionResult(reps, poseConfidenceSamples)` -> `SessionResult` (scoring + feedback + metrics)
`updateAutoFinish(...)` â€” stand still 5s then 3s countdown -> navigate `/results`

## Architecture
**Phase FSM**: calibrated lockout knee (upright baseline -12 deg, min 152) | BOTTOM <105 deg | EMA 0.35 | 4-frame lockout debounce
**Auto-start**: WAITING -> CALIBRATING (60 frames) -> READY -> ACTIVE (`activatedByDescent` preserves first rep)
**Rep completion**: phase STANDING transition OR 4 near-standing frames after bottom (grace lockout)
**Auto-finish**: >=1 rep + stable STANDING 5s + countdown 3..1 (squat again cancels)
**Rejection**: knee-lift, chair/seated, duration 500ms-8s, avg pose confidence, must reach bottom
**Debug** (toggle in CameraScreen): candidate rep, blocking gate, missed-rep reason, validation gates

## Gaps
- Video upload (see docs/video_upload_plan.md) not implemented
- Expert outreach is doc-only (docs/expert_outreach.md)

## Planning & reference docs
- `docs/scoring_notes.md`
- `docs/video_upload_plan.md`
- `docs/expert_outreach.md`

## File tree (57 files in `web/src/`)
```
analysis/
  angles.test.ts
  angles.ts
  asymmetryDetector.ts
  autoFinish.test.ts
  autoFinish.ts
  autoStart.test.ts
  autoStart.ts
  geometry.test.ts
  geometry.ts
  metricCollector.ts
  phaseDetector.test.ts
  phaseDetector.ts
  repCounter.test.ts
  repCounter.ts
  setActivation.test.ts
  setActivation.ts
  squatRegressions.test.ts
components/
  AppShell.tsx
  Button.tsx
  Card.tsx
  ConfidenceBadge.tsx
  DisclaimerBanner.tsx
  FeedbackCard.tsx
  RepCounter.tsx
  ScoreDisplay.tsx
  SessionStatusCard.tsx
  SkeletonOverlay.tsx
cv/
  drawCalibration.ts
  drawDebugOverlay.ts
  drawSkeleton.ts
  poseConnections.ts
  poseEngine.ts
  types.ts
feedback/
  confidenceCalculator.ts
  feedbackEngine.ts
  feedbackReasoning.test.ts
  feedbackReasoning.ts
  feedbackTemplates.ts
scoring/
  scoringConfig.ts
  scoringEngine.test.ts
  scoringEngine.ts
  scoringExplanations.test.ts
  scoringExplanations.ts
screens/
  CameraScreen.tsx
  cameraSessionUi.ts
  LandingScreen.tsx
  ResultsScreen.tsx
session/
  buildSessionResult.test.ts
  buildSessionResult.ts
  types.ts
test/
  fixtures/
    poseFixtures.ts
  helpers/
    squatPipeline.ts
  squatFixtures.ts
  squatSimulation.ts
App.tsx
index.css
main.tsx
```

## Rules
1. Squat only, client-side only, no persistence
2. Extend TS + `cv/` + `analysis/` + router structure
3. One milestone at a time
4. Do not invent backend, auth, storage, or extra movements
5. Do not refactor unrelated working code

## Agent paste block
```
KinematicIQ â€” Repo: C:\Users\acetu\KinematicIQ (master, pull first)
App: web/ â€” npm run dev -> http://localhost:5173/
READ: docs/00_context_pack.md (auto-generated ground truth)
State: M1-16 done. Next: M17 (Video upload impl).
Results: live session via buildSessionResult.
No backend/auth/storage. Folders: cv/, analysis/, scoring/, feedback/, session/.
```