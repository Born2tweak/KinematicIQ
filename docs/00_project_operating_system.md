# KinematicIQ — Project Operating System

> **Purpose:** Single command-center document for daily orientation, execution focus, and cross-team alignment. Detailed specs live in linked docs; task tracking lives on the external Task Management Board.

**Related docs:** [PRD](06_prd.md) · [Architecture](07_architecture.md) · [Build plan](09_build_plan.md) · [AI rules](08_ai_rules.md) · [CV pipeline](10_computer_vision_pipeline.md) · [Scoring](11_scoring_systems.md) · [Movement tests](12_movement_tests.md) · [Feedback](13_feedback_logic.md)

---

## I. COMMAND CENTER (Startup Cockpit)

### 1.1 Executive Snapshot (Read/Update Daily)


| Field                       | Value                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Current Phase**           | Execution / Build                                                                                          |
| **Current Goal**            | Ship Layer 1 MVP within 3 weeks                                                                            |
| **Current MVP Focus**       | Client-side bodyweight squat analysis                                                                      |
| **Biggest Current Problem** | Week 1 incomplete — calibration (M5) and frame validation (M6) not started; results screen still mock data |
| **Last Updated**            | 2026-05-20                                                                                                 |


### 1.2 Active Priorities & Execution State

**Focus:** What the team executes on this week. Full task details live on the external Task Management Board.

#### Current Top 3 Priorities

1. Finalize Layer 1 MVP architecture, data contracts, and biomechanical definitions
2. Build Week 1 infrastructure: camera feed, MediaPipe Pose, overlays, validation
3. Organize the project operating system and AI-assisted workflow pipeline

#### Execution Status

**IN PROGRESS:**


| Milestone           | Status        | Notes                                         |
| ------------------- | ------------- | --------------------------------------------- |
| M1 App shell        | ✅ Done        | 3-screen flow, dark UI, `web/src/screens/`*   |
| M2 Camera feed      | ✅ Done        | Webcam stream + permissions on `CameraScreen` |
| M3 Pose engine      | ✅ Done        | MediaPipe in `web/src/cv/poseEngine.ts`       |
| M4 Skeleton overlay | ✅ Done        | `SkeletonOverlay` + `drawSkeleton`            |
| M5 Calibration      | ⬜ Not started | Framing guides, stance, neutral pose          |
| M6 Frame validation | ⬜ Not started | Visibility, instability, invalid positioning  |


**Week 2–3:** Not started (joint math, rep FSM, scoring, coaching cues, QA).

**Repo note:** Implementation lives under `web/` (Vite + React + TypeScript). Shell uses React Router; see [build plan](09_build_plan.md) if aligning to state-based routing.

#### IMMEDIATE NEXT ACTIONS (TODO)

1. **M5** — Add calibration UI: framing guides, stance positioning, neutral pose capture
2. **M6** — Frame validation: visibility loss, instability, invalid body position
3. Lock biomechanical metric contracts before M7 (joint math) — see [scoring systems](11_scoring_systems.md)

---

## II. STRATEGY & VISION (The North Star)

### 2.1 Core Thesis & Philosophy

KinematicIQ is a software-first movement intelligence platform that uses computer vision and biomechanics-informed logic to help athletes better understand movement quality, asymmetry, posture, compensation patterns, readiness, and performance trends.

#### What We Are NOT


| Area                                    | Status                   |
| --------------------------------------- | ------------------------ |
| Hardware / wearables product            | ❌ Out of scope (Layer 1) |
| Medical diagnosis or injury prediction  | ❌ Out of scope           |
| Backend / cloud / persistence (Layer 1) | ❌ Out of scope           |
| Advanced custom ML training (Layer 1)   | ❌ Out of scope           |


#### Top 3 Recent Decisions

1. Layer 1 is **fully client-side** — no backend, DB, auth, or persistence ([PRD §4](06_prd.md))
2. **MediaPipe Pose** as the sole pose engine for MVP ([AI rules](08_ai_rules.md))
3. **Heuristic scoring** only — interpretable, non-medical ([scoring systems](11_scoring_systems.md))

*Add dated decision log entries here as the team makes new calls.*

### 2.2 Product Definition & Success Metrics


| Field                  | Value                                                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product core**       | Browser squat analyzer with real-time CV + explainable feedback                                                                                |
| **MVP goal**           | High-signal, real-time bodyweight squat analysis prototype (Layer 1)                                                                           |
| **Primary user**       | Self-training athletes; secondary: coaches doing quick movement screens ([PRD §3](06_prd.md))                                                  |
| **Success definition** | Camera + skeleton at 15+ FPS; rep count ±1 for 3–5 reps; score + cues after a set; no medical claims; fully client-side ([PRD §14](06_prd.md)) |
| **Non-goals**          | Persistence, auth, cloud APIs, hardware, medical diagnosis, advanced ML                                                                        |
| **Core metrics**       | Real-time FPS (target **15–30 FPS**)                                                                                                           |


---

## III. LAYER 1 MVP (CURRENT EXECUTION FOCUS)

### 3.1 MVP Definition & Constraints (Meeting 2)

**Layer 1 MVP:** A fully client-side, browser-based movement intelligence prototype focused only on analyzing a **bodyweight squat** using real-time computer vision.

#### Strict Constraints (Non-Goals)


| Constraint   | Rule                                                                         |
| ------------ | ---------------------------------------------------------------------------- |
| Movement     | Single movement only — bodyweight squat                                      |
| Architecture | Fully client-side; no backend, DB, persistence, auth, cloud APIs, hardware   |
| Scope        | No medical claims, injury diagnosis, force estimation, or advanced ML models |


### 3.2 Core Biomechanical Metrics

Metrics driving the scoring engine:

- Squat depth
- Hip shift
- Knee symmetry
- Torso angle
- Valgus approximation

*Definitions and thresholds:* [movement tests](12_movement_tests.md), [biomechanics research](09_biomechanics_research.md)

### 3.3 Scoring Philosophy


| Principle   | Detail                                  |
| ----------- | --------------------------------------- |
| Methodology | Heuristic-based scoring                 |
| Principle   | Interpretable, explainable, non-medical |
| Mandate     | No predictive injury claims             |


### 3.4 3-Week Execution Milestones

#### Week 1: Core CV Infrastructure (M1–M6)


| ID  | Description                                                             | Owner          | Status |
| --- | ----------------------------------------------------------------------- | -------------- | ------ |
| M1  | App shell: 3-screen flow (Landing, Camera, Results), responsive dark UI | UI/UX (Benian) | ✅      |
| M2  | Camera feed: webcam stream, permissions, realtime rendering             | CV (Oyin)      | ✅      |
| M3  | Pose engine: MediaPipe Pose, live landmarks in-browser                  | CV (Oyin)      | ✅      |
| M4  | Skeleton overlay: realtime joint + bone overlay                         | UI/UX (Benian) | ✅      |
| M5  | Calibration: framing guides, stance positioning, neutral pose capture   | CV (Oyin)      | ⬜      |
| M6  | Frame validation: visibility loss, instability, invalid positioning     | CV (Oyin)      | ⬜      |


#### Week 2: Biomechanics + Scoring (M7–M10)


| ID  | Description                                                | Owner                  | Status |
| --- | ---------------------------------------------------------- | ---------------------- | ------ |
| M7  | Joint math: angles, torso, stance width, smoothing         | Biomechanics (Andrian) | ⬜      |
| M8  | Rep state machine: phases + rep count                      | Biomechanics (Andrian) | ⬜      |
| M9  | Asymmetry metrics: hip shift, knee symmetry, depth, valgus | Biomechanics (Andrian) | ⬜      |
| M10 | Scoring engine: 0–100 heuristic scores                     | Product (Thomas)       | ⬜      |


#### Week 3: Feedback, QA, Optimization (M11–M15)


| ID  | Description                                                            | Owner                  | Status |
| --- | ---------------------------------------------------------------------- | ---------------------- | ------ |
| M11 | UI polish: progress, active states, transitions, responsive refinement | UI/UX (Benian)         | ⬜      |
| M12 | Coaching cue engine: threshold-based feedback                          | Product (Thomas)       | ⬜      |
| M13 | Results screen: score, breakdowns, observations, disclaimer            | UI/UX (Benian)         | ⬜      |
| M14 | QA: cross-device, lighting, browser, positioning                       | Product (Thomas)       | ⬜      |
| M15 | Optimization: refactor, dead code removal, production build            | Biomechanics (Andrian) | ⬜      |


*Step-by-step acceptance criteria:* [build plan](09_build_plan.md)

---

## IV. SYSTEM ARCHITECTURE & COMPONENTS (Persistent Brain)

### 4.1 Canonical System Pipeline (Core Flow)

```
Camera Feed → Pose Detection → Landmark Extraction → Frame Validation
  → Joint Math → Rep State Machine → Biomechanical Metrics → Scoring Engine
  → Coaching Cue Engine → Results UI
```

### 4.2 Technical Stack & Priorities


| Layer          | Choice                                                 |
| -------------- | ------------------------------------------------------ |
| Frontend       | React 18, TypeScript, Vite (`web/`)                    |
| Backend        | None (Layer 1 client-side only)                        |
| Pose engine    | MediaPipe Pose (BlazePose) — `@mediapipe/tasks-vision` |
| Runtime target | Browser / WASM, **15–30 FPS**                          |
| Storage        | None                                                   |


**Architectural priorities (in order):**

1. Stability
2. Realtime responsiveness
3. Simplicity
4. Interpretability
5. Visual polish

### 4.3 Repository Structure (Execution Layer)

**Target modular layout** (see [architecture §2](07_architecture.md)):

```
web/src/
├── app/              # Routing, shell
├── screens/          # Landing, Camera, Results
├── components/       # UI + overlay
├── camera/           # (planned) stream lifecycle
├── pose/             # (today: cv/) MediaPipe + landmarks
├── biomechanics/     # (planned) joint math, rep FSM
├── scoring/          # (planned) heuristic scores
├── coaching/         # (planned) cues
├── shared/           # (planned) utilities
└── types/            # (planned) shared types
```

**Current implementation:** `screens/`, `components/`, `cv/` — migrate toward the layout above as milestones add modules.

---

## V. TEAM OWNERSHIP & ROLES

### 5.1 Layer 1 Component Ownership (Meeting 2)


| Role                    | Person  | Ownership                                                              |
| ----------------------- | ------- | ---------------------------------------------------------------------- |
| UI/UX Developer         | Benian  | App shell, overlays, progress UI, results UI, responsiveness, polish   |
| CV Engineer             | Oyin    | Camera, MediaPipe, landmarks, calibration, frame validation            |
| Biomechanics Engineer   | Andrian | Joint math, smoothing, rep FSM, asymmetry metrics, biomechanical logic |
| Coaching / Product Lead | Thomas  | Scoring thresholds, coaching cues, QA, terminology, testing            |


---

## VI. LONG-TERM ROADMAP

### 6.1 Phased Evolution (High-Level)


| Phase             | Focus                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| **Phase 1** (MVP) | Pose estimation, squat analysis, basic feedback — client-side only         |
| **Phase 2**       | Jump intelligence — CMJ, landing, readiness trends                         |
| **Phase 3**       | Athlete baselines — longitudinal tracking, personalized scoring            |
| **Phase 4**       | Advanced movement intelligence — sprint/decel, multi-angle, team analytics |
| **Phase 5**       | AI-native coaching — adaptive coaching, personalized intelligence          |


---

## VII. DOMAIN INTELLIGENCE & RESEARCH

### 7.1 Movement Profile: Bodyweight Squat (Layer 1)


| Item                    | Detail                                                                   |
| ----------------------- | ------------------------------------------------------------------------ |
| Core MVP metrics        | Squat depth, hip shift, knee symmetry, torso angle, valgus approximation |
| Additional tracked      | Knee angle, hip angle, trunk angle, knee tracking, depth                 |
| Possible issues         | Knee valgus, heel rise, excessive trunk lean, asymmetrical loading       |
| Future AI possibilities | *TBD — post Layer 1*                                                     |


*Full test spec:* [movement tests](12_movement_tests.md)

### 7.2 Core Domain Insights


| Area                         | Notes                                                             |
| ---------------------------- | ----------------------------------------------------------------- |
| Key biomechanics insights    | *Capture in [biomechanics research](09_biomechanics_research.md)* |
| Key computer vision insights | *Capture in [CV pipeline](10_computer_vision_pipeline.md)*        |
| Key scoring insights         | *Capture in [scoring systems](11_scoring_systems.md)*             |
| Important constraints        | Client-side only; no medical language; confidence-gated feedback  |


### 7.3 Backlog Movement Profiles


| Movement             | Status            |
| -------------------- | ----------------- |
| Countermovement jump | Backlog (Phase 2) |
| Landing mechanics    | Backlog (Phase 2) |


---

## Changelog (OS document)


| Date       | Change                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| 2026-05-20 | Initial OS doc; execution status synced to `web/` repo state (M1–M4 complete) |


