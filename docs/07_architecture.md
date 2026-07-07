# KinematicIQ — Architecture Document

> **Revised 2026-07-06 (M34 docs sync — current through M33).** Protocol-engine
> architecture with `core/`, `protocols/`, `metrics/`, `findings/`, `storage/`,
> `export/` (M33 report artifact), and `camera/` (pluggable sources for
> deterministic testing) modules; routes `/`, `/camera`, `/upload`, `/results`,
> `/history`; progressive-disclosure report with personal baseline (M31) and
> MDC-aware change language (M32). Doctrine lives in `docs/doctrine/`; source
> specs in `docs/research/`; the build record in `docs/implementation/progress/`.
> Sections 5–8 describe module responsibilities; filenames are illustrative of
> the current TypeScript modules listed in §2.

## 1. Architecture Overview

KinematicIQ is a **fully client-side** web application. There is no backend, no API, and no network requests after the initial page load. All pose estimation, biomechanics analysis, metric derivation, finding rules, and feedback run in the browser. The only persistence is the opt-in, local-only session history (IndexedDB, M9) — explicitly user-initiated, with a delete-all control.

The platform is organized around a **protocol engine**:

```
core/        movement-agnostic schemas (Confidence, Provenance, Metric, Protocol, Finding)
   ▲
protocols/   registry: ProtocolDefinition + runtime MovementProfile per movement
   ▲                    (squat available; hipHinge/jump/sprint planned stubs — analyze throws)
metrics/     per-protocol MetricDefinitions → MetricResult[] (value+confidence+provenance+tier)
   ▲
findings/    rules: MetricResult[] → Finding[] (observation language) → coaching cues
   ▲
session/     set quality gate (full abstain) + SessionResult assembly
   ▲
screens/     progressive disclosure: Summary (findings) / Evidence (metrics) / Expert (diagnostics)
storage/     opt-in local history (IndexedDB), versioned records
```

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  UI /    │  │  Camera  │  │  MediaPipe    │  │
│  │  React   │←→│  Module  │→→│  Pose Engine  │  │
│  │  App     │  │          │  │  (on-device)  │  │
│  └────┬─────┘  └──────────┘  └───────┬───────┘  │
│       │                              │           │
│       │         ┌────────────────────┘           │
│       │         ▼                                │
│  ┌────┴────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Results │  │ Biomech  │  │   Scoring     │  │
│  │ Screen  │←─│ Analysis │←─│   Engine      │  │
│  │         │  │ Module   │  │               │  │
│  └─────────┘  └────┬─────┘  └───────────────┘  │
│                     │                            │
│               ┌─────▼─────┐                      │
│               │ Feedback  │                      │
│               │ Engine    │                      │
│               └───────────┘                      │
└─────────────────────────────────────────────────┘
```

### Key principles
- **No backend** — everything runs client-side
- **Opt-in local persistence only** — sessions are saved to IndexedDB only when the user explicitly taps "Save to history"; everything else is in-memory and discarded on page close
- **Modular** — each concern (camera, pose, analysis, protocols, metrics, findings, feedback, UI, storage) is a separate module
- **Swappable pose engine** — MediaPipe first, but the interface allows replacing it (a swap requires a benchmark; see doctrine)
- **Rule-based analysis** — no ML training, no black boxes in the analysis layer
- **Verdict-or-abstain** — untrustworthy recordings produce a full abstain, not a hedged report; no composite quality score exists anywhere

---

## 2. Recommended Folder Structure

```
web/
├── src/
│   ├── App.tsx                       # Root component, React Router routes
│   ├── main.tsx                      # Entry point
│   ├── index.css                     # Global styles (liquid-glass token system)
│   ├── screens/
│   │   ├── LandingScreen.tsx         # Marketing landing page ("/")
│   │   ├── CameraScreen.tsx          # Live camera analysis ("/camera")
│   │   ├── UploadScreen.tsx          # Pre-recorded video analysis ("/upload")
│   │   ├── ResultsScreen.tsx         # Score, feedback, results ("/results")
│   │   └── cameraSessionUi.ts        # Camera session status copy helpers
│   ├── components/
│   │   ├── AppShell.tsx              # Nav + layout wrapper around routes
│   │   ├── SkeletonOverlay.tsx       # Canvas-based skeleton drawing
│   │   ├── RepCounter.tsx            # Live rep count display
│   │   ├── SessionStatusCard.tsx     # Calibration/session status
│   │   ├── ScoreDisplay.tsx          # Visual score ring
│   │   ├── FeedbackCard.tsx          # Coaching cue card
│   │   ├── ConfidenceBadge.tsx       # Confidence level indicator
│   │   ├── DisclaimerBanner.tsx      # Safety disclaimer
│   │   ├── DepthSparkline.tsx        # Depth-over-time sparkline (analyst)
│   │   ├── PoseScene3D.tsx           # 3D world-landmark viewer (analyst)
│   │   └── landing/                  # Landing-page demo components
│   ├── cv/                           # Pose estimation + drawing (was "pose/")
│   │   ├── poseEngine.ts             # MediaPipe init + per-frame inference
│   │   ├── types.ts                  # PoseFrame, landmark types
│   │   ├── poseConnections.ts        # Skeleton edge definitions
│   │   ├── landmarkFilter.ts         # Temporal landmark filtering
│   │   ├── pose3d.ts                 # worldLandmark (3D) helpers
│   │   ├── drawSkeleton.ts / drawCalibration.ts / drawDebugOverlay.ts
│   │   └── videoFrameSource.ts       # Frame stepping for uploaded video
│   ├── analysis/
│   │   ├── angles.ts / geometry.ts / stats.ts   # Pure math
│   │   ├── phaseDetector.ts          # Squat phase state machine
│   │   ├── repCounter.ts             # Rep counting + validation gates
│   │   ├── autoStart.ts / autoFinish.ts / setActivation.ts
│   │   ├── asymmetryDetector.ts      # Left-right comparison
│   │   ├── metricCollector.ts        # Per-rep and per-set aggregation
│   │   └── videoAnalyzer.ts          # Offline pipeline for uploaded video
│   ├── scoring/
│   │   ├── scoringEngine.ts          # Rule-based score calculation
│   │   ├── scoringConfig.ts          # Thresholds, weights, bands
│   │   └── scoringExplanations.ts    # Human-readable score explanations
│   ├── feedback/
│   │   ├── feedbackEngine.ts / feedbackReasoning.ts
│   │   ├── feedbackTemplates.ts      # Coaching cue library
│   │   └── confidenceCalculator.ts   # Observation confidence
│   ├── core/                         # Movement-agnostic schemas (M3)
│   │   ├── confidence.ts             # Confidence value/level/basis
│   │   ├── provenance.ts             # Capture source, model, filter variant
│   │   ├── metric.ts                 # MetricDefinition / MetricResult (+ exclusions)
│   │   ├── protocol.ts               # ProtocolDefinition, status, NotImplementedError
│   │   └── finding.ts                # Finding (observation-language insight)
│   ├── protocols/                    # Protocol engine (M5, M10)
│   │   ├── registry.ts               # getProtocol / listProtocols / analyze entry point
│   │   ├── squat/                    # Protocol #1 — available
│   │   ├── hipHinge/  jump/  sprint/ # Planned stubs — metadata only, analyze throws
│   │   └── types.ts                  # Protocol = definition + MovementProfile
│   ├── metrics/                      # Metric registry (M6)
│   │   ├── registry.ts               # Definitions by protocol (incl. excluded metrics)
│   │   └── squatMetrics.ts           # SetMetricsSummary → MetricResult[]
│   ├── findings/                     # Finding engine (M7)
│   │   ├── engine.ts                 # Abstain-aware dispatch by protocol
│   │   └── squatRules.ts             # Squat rules → Finding[] + coaching cues
│   ├── session/
│   │   ├── types.ts                  # SessionResult shape
│   │   ├── setQualityGate.ts         # valid/questionable/invalid + full abstain
│   │   └── buildSessionResult.ts     # Assemble results payload
│   ├── storage/                      # Local history (M9)
│   │   ├── sessionStore.ts           # Versioned records; IndexedDB or memory adapter
│   │   └── historyView.ts            # History rows + hedged observation line
│   ├── export/                       # Report artifact (M33)
│   │   ├── sessionReport.ts          # Versioned ExportedSessionReport JSON + download
│   │   └── sessionReportHtml.ts      # Self-contained offline HTML rendering
│   ├── camera/                       # Pluggable camera sources (autonomous testing)
│   │   ├── cameraSource.ts           # CameraSource interface
│   │   ├── sources/                  # realCameraSource / poseTapeCameraSource
│   │   └── fixtures/                 # Deterministic pose-tape fixtures for e2e
│   ├── eval/                         # Replay/eval harness (pose tapes)
│   └── test/                         # Fixtures, simulations, helpers
├── package.json
└── vite.config.ts                    # Includes COOP/COEP headers for MediaPipe
```

### Why this structure
- **`cv/`** isolates the pose estimation dependency so it can be swapped later
- **`analysis/`** contains pure functions — no UI, no side effects
- **`scoring/`** is separate from analysis so thresholds and weights are configurable
- **`feedback/`** is separate from scoring so language and cue selection are independently testable
- **`screens/`** represent full views; **`components/`** are reusable pieces
- **`utils/`** holds shared math and constants used across modules

---

## 3. System Data Flow

```
Camera (getUserMedia)
  │
  ▼
Frame Capture (requestAnimationFrame loop)
  │
  ▼
MediaPipe Pose Estimation
  │ Output: 33 landmarks with confidence scores
  ▼
Landmark Extraction
  │ Output: structured object with key joint positions
  ▼
Temporal Smoothing
  │ Output: smoothed landmark positions
  ▼
Joint Angle Calculations
  │ Output: knee angle, hip angle, trunk lean (per frame)
  ▼
Phase Detection (state machine)
  │ Output: current phase (standing/descending/bottom/ascending)
  ▼
Rep Counter
  │ Output: rep count, per-rep metrics snapshot
  ▼
Metric Collector (after set completion)
  │ Output: per-rep depths, averages, consistency, asymmetry values
  ▼
Set Quality Gate
  │ Output: valid / questionable / invalid — invalid ⇒ FULL ABSTAIN downstream
  ▼
Metric Registry (M6)
  │ Output: MetricResult[] — value (or null = abstain) + confidence + provenance + tier
  ▼
Finding Engine (M7)
  │ Output: Finding[] (observation language) + derived coaching cues
  ▼
Scoring Engine
  │ Output: per-component evidence (no composite total or bands)
  ▼
Results Screen (M8: Summary / Evidence / Expert tabs)
  │ Optional, explicit user action:
  ▼
Session Store (M9: IndexedDB, local-only, delete-all control)
```

---

## 4. Frontend Modules

### Screens

| Screen | Purpose | Key state |
|--------|---------|-----------|
| LandingScreen | Explain the app, provide "Start" button | None |
| CameraScreen | Live preview, skeleton overlay, rep counting, analysis | Camera stream, landmarks, phase, rep count |
| ResultsScreen | Display score, feedback, asymmetry, confidence, disclaimer | Computed results object |

### Screen routing
React Router with five routes: `/` (Landing, incl. protocol picker), `/camera`, `/upload`, `/results` (tabbed report), `/history` (local saved sessions). `AppShell.tsx` wraps all routes with the navbar and layout container.

### Components

| Component | Purpose |
|-----------|---------|
| SkeletonOverlay | Draw skeleton on a `<canvas>` overlaid on the video element |
| RepCounter | Display current rep count during analysis |
| SetupGuide | Show positioning guidance before analysis starts |
| ScoreDisplay | Render visual score (arc or ring chart) |
| FeedbackCard | Display a single coaching cue with confidence |
| ConfidenceBadge | Show High/Medium/Low confidence indicator |
| DisclaimerBanner | Persistent safety disclaimer text |

---

## 5. Computer Vision Module (`cv/`)

### poseEngine.ts
- Initialize MediaPipe Pose Landmarker
- Accept video element as input
- Return raw landmark results per frame
- Expose `initialize()`, `detect(videoFrame)`, `destroy()` methods
- Handle loading errors gracefully

### landmarkFilter.ts
- Temporal landmark filtering (one-euro live variant; raw preserved in tapes)
- The filtering variant applied is recorded in `Provenance.filterVariant`
- An upgrade of the live filtering stack is gated on a replay-harness
  benchmark (M27) — do not swap filters without tape evidence

### landmarkQuality.ts / captureReadiness.ts
- Per-frame landmark quality scoring (M26): visibility/coverage flags that
  feed metric confidence
- Capture-readiness v2 (M25): camera geometry checks before a set starts;
  thresholds are provisional pending real-tape validation (M44–M45)

---

## 6. Biomechanics Analysis Module (`analysis/`)

### angleCalculator.js
- `calculateAngle(pointA, pointB, pointC)` — returns angle at B in degrees
- `calculateTrunkLean(shoulder, hip)` — returns angle from vertical
- All functions are pure — input landmarks, output numbers

### phaseDetector.js
- State machine with states: `STANDING`, `DESCENDING`, `BOTTOM`, `ASCENDING`
- Transitions based on knee angle thresholds and frame persistence
- Expose `update(kneeAngle)` → returns `{ phase, transitioned }`
- Configurable thresholds via constants

### repCounter.js
- Listens for full phase cycle completions
- Snapshots per-rep metrics at rep completion (depth, trunk lean, etc.)
- Expose `update(phase, metrics)` → returns `{ repCount, repData[] }`

### asymmetryDetector.js
- Compare left vs. right hip height, shoulder height, knee angle at bottom
- Compute hip shift as horizontal pelvis midpoint offset from foot midpoint
- Return asymmetry values and direction

### metricCollector.js
- After set completion, aggregate all per-rep data
- Calculate averages, min/max, coefficient of variation
- Return a structured metrics summary object

---

## 7. Scoring Engine Module (`scoring/`)

### scoringEngine.ts
- Input: metrics summary from metricCollector
- Output: **per-component evidence only** — `ComponentScores` for depth,
  trunkControl, kneeTracking, consistency, symmetry
- **There is no composite total and no band.** The composite 0–100 score was
  deleted by doctrine (claims-policy: permanent prohibition); components
  survive purely as evidence inputs for findings

### scoringConfig.ts
- Define per-component thresholds and ranges
- Single source of truth for scoring parameters
- Easy to tune without touching scoring logic

---

## 8. Feedback Engine Module (`feedback/`)

### feedbackEngine.js
- Input: scoring results
- Select top 1–2 lowest-scoring components
- Look up coaching cue from feedbackTemplates
- Attach confidence from confidenceCalculator
- Output: array of feedback objects `{ issue, cue, confidence, note }`

### feedbackTemplates.js
- Map of issue keys to human-readable coaching cues
- Each template includes: observation text, cue text, and confidence note
- Plain language, no medical terminology

### confidenceCalculator.js
- Input: landmark confidence history, frame count, landmark completeness
- Output: overall session confidence (High / Medium / Low)
- Rules: if critical landmarks below threshold for >20% of frames → Low

---

## 9. State and Data Management

### State approach
Use React `useState` and `useRef` hooks. No external state management library needed for Layer 1.

### Key state objects

| Owner | State | Type |
|-------|-------|------|
| App | `currentScreen` | string: 'landing' / 'camera' / 'results' |
| CameraScreen | `cameraStream` | MediaStream ref |
| CameraScreen | `isAnalyzing` | boolean |
| CameraScreen | `currentPhase` | string |
| CameraScreen | `repCount` | number |
| CameraScreen | `repData` | array of per-rep metric snapshots |
| ResultsScreen | `results` | object: { score, components, feedback, confidence } |

### Data lifetime
Session data lives in React state and is gone when the tab closes — unless the
user explicitly taps "Save to history", which writes one versioned record to
local IndexedDB (see §10). Nothing is ever written silently, and nothing is
sent anywhere.

---

## 10. Storage Assumptions

**Local, opt-in only (M9).** Saving a session is an explicit user action on the
results screen; records go to IndexedDB (`storage/sessionStore.ts`) as
versioned `{schemaVersion, protocolId, timestamp, SessionResult, provenance}`
documents. The History screen lists saved sessions and provides a delete-all
control. There are no cookies, no server, no sync — nothing leaves the device.

Still explicitly out of scope (see `docs/doctrine/deferred-scope.md`):
- Server-side storage or accounts of any kind
- Cross-device sync
- Automatic/silent persistence of any session data

---

## 11. Component Boundaries

### What talks to what

```
poseEngine → landmarkExtractor → smoother → angleCalculator
                                           → phaseDetector → repCounter
                                           → asymmetryDetector
                                                    ↓
                                           metricCollector
                                                    ↓
                                           scoringEngine
                                                    ↓
                                           feedbackEngine → UI
```

### Rules
- **cv/** modules never import from **analysis/**, **scoring/**, or **feedback/**
- **analysis/** modules never import from **scoring/** or **feedback/**
- **scoring/** modules never import from **feedback/**
- **feedback/** modules never import from **cv/** or **analysis/**
- **components/** never contain business logic — they receive props and render
- **screens/** orchestrate components and connect to logic modules
- **utils/** is imported by anyone but imports nothing from the app

---

## 12. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | camelCase.js / PascalCase.jsx | `angleCalculator.js`, `ScoreDisplay.jsx` |
| React components | PascalCase | `SkeletonOverlay` |
| Functions | camelCase | `calculateAngle()` |
| Constants | UPPER_SNAKE_CASE | `MIN_CONFIDENCE_THRESHOLD` |
| CSS classes | kebab-case | `.score-display` |
| State variables | camelCase | `repCount`, `currentPhase` |
| Module folders | lowercase | `pose/`, `analysis/`, `scoring/` |

---

## 13. What Belongs Where

| If you need to... | Put it in... |
|--------------------|-------------|
| Initialize or run pose estimation | `cv/poseEngine.ts` |
| Filter noisy landmark data | `cv/landmarkFilter.ts` |
| Score per-frame landmark quality | `cv/landmarkQuality.ts` |
| Check camera geometry before a set | `cv/captureReadiness.ts` |
| Calculate a joint angle | `analysis/angles.ts` / `analysis/geometry.ts` |
| Detect squat phases | `analysis/phaseDetector.ts` (thresholds evidence-gated) |
| Count reps | `analysis/repCounter.ts` (gates evidence-gated) |
| Compare left vs. right sides | `analysis/asymmetryDetector.ts` |
| Aggregate metrics after a set | `analysis/metricCollector.ts` |
| Add a movement-agnostic schema | `core/` |
| Register or define a protocol | `protocols/` |
| Define a metric or build `MetricResult`s | `metrics/` |
| Write a finding rule | `findings/` |
| Compute per-component evidence (no composite) | `scoring/scoringEngine.ts` |
| Generate coaching feedback | `feedback/feedbackEngine.ts` |
| Classify set quality / abstain | `session/setQualityGate.ts` |
| Compare against the athlete's own history | `session/baseline.ts` + `session/changeDetection.ts` |
| Persist or list saved sessions | `storage/sessionStore.ts` |
| Export a session report artifact | `export/sessionReport.ts` |
| Add a camera source or test fixture | `camera/` |
| Record/replay pose tapes | `eval/` |
| Render full-screen views | `screens/` |
| Render reusable UI elements | `components/` |

---

## 14. What Should NOT Be Added Yet

| Do not add | Why |
|-----------|-----|
| Redux, Zustand, or other state libs | useState/useRef is sufficient |
| Backend server or API routes | Fully client-side |
| Server-side database or ORM | Persistence is local-only IndexedDB (M9), opt-in, on-device |
| Authentication (Clerk, Auth0, etc.) | No user accounts |
| Docker or containerization | Vercel deployment only |
| Storybook | No component library needed yet |
| Analytics or telemetry | No data collection |
| Internationalization (i18n) | English only for now |
| PWA/service worker | Not needed yet |
| Multiple pose models | MediaPipe only first |

**Already adopted (were previously deferred):** React Router, TypeScript, Vitest test suite, video upload/playback (`/upload`).
