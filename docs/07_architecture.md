# KinematicIQ — Architecture Document

> **Revised 2026-07-02.** Updated to match the shipped codebase: **TypeScript**, **React Router** (`/`, `/camera`, `/upload`, `/results`), pose code in **`cv/`** (not `pose/`), plus `session/`, `eval/`, and `test/` modules and a Vitest suite. For the always-current generated snapshot, see `docs/00_context_pack.md`.

## 1. Architecture Overview

Layer 1 is a **fully client-side** web application. There is no backend, no database, no API, and no network requests after the initial page load. All pose estimation, biomechanics analysis, scoring, and feedback run in the browser.

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
- **No data persistence** — all data is in-memory only, discarded on page close
- **Modular** — each concern (camera, pose, analysis, scoring, feedback, UI) is a separate module
- **Swappable pose engine** — MediaPipe first, but the interface allows replacing it
- **Rule-based analysis** — no ML training, no black boxes in the analysis layer

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
│   ├── session/
│   │   ├── types.ts                  # SessionResult shape
│   │   └── buildSessionResult.ts     # Assemble results payload
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
Scoring Engine
  │ Output: component scores + total score + score bands
  ▼
Feedback Engine
  │ Output: top 1–2 coaching cues + confidence levels
  ▼
Results Screen (UI)
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
React Router with four routes: `/` (Landing), `/camera`, `/upload`, `/results`. `AppShell.tsx` wraps all routes with the navbar and layout container.

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

### landmarkExtractor.js
- Take raw MediaPipe results
- Return structured object with named joints:
  ```js
  {
    leftHip: { x, y, z, confidence },
    rightHip: { x, y, z, confidence },
    leftKnee: { x, y, z, confidence },
    // ... etc
  }
  ```
- Filter out landmarks below minimum confidence threshold

### smoother.js
- Apply moving average (window size ~5 frames) to each landmark coordinate
- Maintain internal buffer per landmark
- Expose `smooth(landmarks)` that returns smoothed positions

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

### scoringEngine.js
- Input: metrics summary from metricCollector
- Apply weighted scoring rules from scoringConfig
- Output: `{ totalScore, components: { depth, trunkControl, kneeTracking, consistency, symmetry }, band }`
- Each component scores 0–100 within its defined range

### scoringConfig.js
- Define thresholds, weights, and band labels
- Single source of truth for all scoring parameters
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
All data exists only in React state. Nothing is written to localStorage, IndexedDB, cookies, or any external store. When the user closes the tab, everything is gone.

---

## 10. Storage Assumptions

**Layer 1 has no storage.** No localStorage, no IndexedDB, no cookies, no session storage, no server. All computation is ephemeral.

Future layers may add:
- localStorage for session history
- IndexedDB for landmark data
- Server-side storage for longitudinal tracking

These are explicitly out of scope.

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
- **pose/** modules never import from **analysis/**, **scoring/**, or **feedback/**
- **analysis/** modules never import from **scoring/** or **feedback/**
- **scoring/** modules never import from **feedback/**
- **feedback/** modules never import from **pose/** or **analysis/**
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
| Initialize or run pose estimation | `pose/poseEngine.js` |
| Extract specific landmarks from raw results | `pose/landmarkExtractor.js` |
| Smooth noisy landmark data | `pose/smoother.js` |
| Calculate a joint angle | `analysis/angleCalculator.js` |
| Detect squat phases | `analysis/phaseDetector.js` |
| Count reps | `analysis/repCounter.js` |
| Compare left vs. right sides | `analysis/asymmetryDetector.js` |
| Aggregate metrics after a set | `analysis/metricCollector.js` |
| Calculate movement quality score | `scoring/scoringEngine.js` |
| Change scoring thresholds or weights | `scoring/scoringConfig.js` |
| Generate coaching feedback | `feedback/feedbackEngine.js` |
| Edit feedback wording | `feedback/feedbackTemplates.js` |
| Calculate confidence levels | `feedback/confidenceCalculator.js` |
| Do vector math or angle math | `utils/mathUtils.js` |
| Define landmark indices or constants | `utils/constants.js` |
| Render full-screen views | `screens/` |
| Render reusable UI elements | `components/` |

---

## 14. What Should NOT Be Added Yet

| Do not add | Why |
|-----------|-----|
| Redux, Zustand, or other state libs | useState/useRef is sufficient |
| Backend server or API routes | Fully client-side |
| Database or ORM | No persistence needed |
| Authentication (Clerk, Auth0, etc.) | No user accounts |
| Docker or containerization | Vercel deployment only |
| Storybook | No component library needed yet |
| Analytics or telemetry | No data collection |
| Internationalization (i18n) | English only for now |
| PWA/service worker | Not needed yet |
| Multiple pose models | MediaPipe only first |

**Already adopted (were previously deferred):** React Router, TypeScript, Vitest test suite, video upload/playback (`/upload`).
