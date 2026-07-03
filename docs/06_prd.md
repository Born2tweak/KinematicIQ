# KinematicIQ — Product Requirements Document

> **Revised 2026-07-02.** Video upload (`/upload`) shipped in Milestone 17 and is now in scope (originally a non-goal). The product direction has evolved from "squat analyzer" to a posture-first, movement-specific movement-intelligence layer — see `docs/strategy/product-direction.md`. Squat remains the reference movement; hip hinge, jump/landing, and sprint are planned expansions.

## 1. Product Summary

KinematicIQ is a browser-based movement analysis tool that uses a device camera and on-device pose estimation to evaluate bodyweight squat quality and provide human-readable feedback. Layer 1 delivers a single-movement, single-camera, single-user experience — no accounts, no backend, no hardware integration.

The user opens the app, performs a set of bodyweight squats in front of their camera, and receives a movement quality summary with actionable coaching cues, confidence indicators, and basic asymmetry observations.

---

## 2. User Problem

Athletes and fitness enthusiasts have no accessible, low-friction way to get objective movement feedback without expensive lab equipment, wearable sensors, or an in-person professional. Existing apps are either too simplistic (rep counting only) or too clinical (lab-grade motion capture). There is no middle ground that gives useful, honest, camera-based movement observations with appropriate confidence messaging.

---

## 3. Target User

**Primary:** Self-training athletes and fitness-conscious individuals who want objective feedback on their squat form.

**Secondary:** Coaches and trainers who want a quick visual tool to screen basic movement quality.

**Assumptions:**
- Has a modern device with a camera (laptop, phone, tablet)
- Comfortable using a browser-based tool
- Performs bodyweight squats regularly or as part of training
- Understands basic fitness language (squat, depth, knees, trunk)

---

## 4. MVP Scope

### In scope
- Browser-based web app (no install required)
- Camera permission request and live video preview
- On-device pose estimation via MediaPipe Pose
- Real-time skeleton overlay on video feed
- Landmark extraction for key joints
- Joint angle calculations (knee, hip, trunk lean)
- Squat phase detection via state machine
- Rep counting
- Basic movement metrics (depth, trunk lean, knee tracking proxy)
- Simple movement quality score (rule-based, explainable)
- Basic left-right asymmetry observations
- Human-readable feedback (1–2 coaching cues)
- Confidence and limitations messaging
- Results display after completing a set
- Pre-recorded video upload and offline analysis (`/upload`) — shipped M17; all bytes stay on device

### Non-goals
- User accounts, authentication, or profiles
- Backend server or database
- Video storage or persistence (upload is analyze-in-memory only)
- Movement types beyond the current roadmap phase (squat now; hinge/jump/sprint per `docs/strategy/execution-roadmap.md`)
- Custom ML model training
- Medical claims, injury prediction, or diagnosis language
- Force estimation, load calculations, or true 3D biomechanics
- Wearable/sensor/hardware integration
- Multi-person or multi-camera support
- Payment, subscription, or monetization
- Mobile native app (browser only)
- Longitudinal tracking or session history
- Readiness or fatigue scoring
- Coach/athlete dashboards or API endpoints

---

## 5. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a user, I want to open the app and see a clean start screen so I know what the app does. | P0 |
| US-02 | As a user, I want to grant camera permission and see a live video preview. | P0 |
| US-03 | As a user, I want to see setup guidance so I know how to position my camera. | P0 |
| US-04 | As a user, I want to see a skeleton overlay on my body in real time. | P0 |
| US-05 | As a user, I want the app to count my reps automatically. | P0 |
| US-06 | As a user, I want to see my movement quality score after completing a set. | P0 |
| US-07 | As a user, I want 1–2 specific coaching cues so I know what to improve. | P0 |
| US-08 | As a user, I want a confidence indicator so I know how trustworthy results are. | P0 |
| US-09 | As a user, I want a disclaimer that this is not medical advice. | P0 |
| US-10 | As a user, I want to be told if my camera setup is poor. | P1 |
| US-11 | As a user, I want basic asymmetry observations. | P1 |
| US-12 | As a user, I want to repeat a set without refreshing the page. | P1 |

---

## 6. User Flow

```
1. Open app → Landing screen with title, description, "Start" button
2. Click "Start" → Camera permission prompt
3. Grant permission → Live video preview with setup guidance
4. Position correctly → Skeleton overlay appears, "Begin" button activates
5. Click "Begin" → Analysis mode, counts reps via phase detection
6. Complete 3–5 reps → App auto-detects completion (or user clicks "Done")
7. Results screen → Score, cues, asymmetry, confidence, disclaimer
8. "Try Again" button → Returns to step 4
```

---

## 7. Functional Requirements

### Camera and Video
- Request camera permission using getUserMedia API.
- Display live video preview from device camera.
- Support front-facing and rear-facing cameras.
- Handle permission denial gracefully with a clear message.
- Target 15+ FPS for pose estimation; 24+ preferred.

### Pose Estimation
- Run MediaPipe Pose on-device in the browser.
- Extract 33 body landmarks per frame with confidence scores.
- Display skeleton overlay on the video feed in real time.
- Track landmark visibility and flag when critical joints are missing.
- Apply temporal smoothing to landmark positions.

### Movement Analysis
- Calculate knee angle from hip-knee-ankle landmarks.
- Calculate hip angle from shoulder-hip-knee landmarks.
- Calculate trunk lean angle from shoulder-hip line vs. vertical.
- Detect squat phases using threshold-based state machine on knee angle.
- Count completed reps based on full phase transitions.
- Calculate squat depth proxy from minimum knee angle per rep.
- Detect hip shift (pelvis midpoint vs. foot midpoint horizontal offset).
- Detect basic left-right asymmetry (shoulder level, hip height difference).

### Scoring
- Produce movement quality score from rule-based criteria.
- Score must be explainable — each contributing factor visible to user.
- Score range: 0–100 with labeled bands (Excellent / Good / Needs Work / Poor).

### Feedback
- Generate 1–2 primary coaching cues based on lowest-scoring factors.
- Use plain, coaching-style language (not clinical jargon).
- Include confidence level with each observation (High / Medium / Low).
- Suppress feedback when confidence is too low.
- Include persistent disclaimer.

### Results Display
- Show results screen with: overall score, breakdown, cues, asymmetry, confidence, disclaimer.
- Provide "Try Again" button to return to analysis view.
- Show rep count and per-rep depth summary.

---

## 8. Data Requirements

| Data | Storage | Privacy |
|------|---------|---------|
| Video frames | In-memory only; never stored or transmitted | No video leaves the device |
| Pose landmarks | In-memory during session | Discarded on page close |
| Computed metrics | In-memory during session | Discarded on page close |
| Score and feedback | In-memory during session | Discarded on page close |

**No data is persisted, uploaded, or transmitted in Layer 1.**

---

## 9. Movement Analysis Requirements

### Target movement: Bodyweight squat

| Metric | Definition | Source landmarks |
|--------|------------|-----------------|
| Knee angle | Angle between hip→knee and ankle→knee vectors | Hip, knee, ankle |
| Hip angle | Angle between shoulder→hip and knee→hip vectors | Shoulder, hip, knee |
| Trunk lean | Angle between shoulder→hip line and vertical | Shoulder, hip |
| Squat depth | Minimum knee angle during bottom phase | Hip, knee, ankle |
| Hip shift | Horizontal offset of pelvis midpoint from foot midpoint | Hips, ankles |
| Shoulder asymmetry | Vertical difference between left/right shoulders | Shoulders |
| Rep consistency | Coefficient of variation of depth across reps | Per-rep depth values |

### Phase detection state machine

```
STANDING (knee angle > 160°)
  → DESCENDING (knee angle decreasing, below 155°)
  → BOTTOM (knee angle reaches minimum, begins increasing)
  → ASCENDING (knee angle increasing)
  → STANDING (knee angle > 160°, rep complete)
```

Require minimum 5 consecutive frames before confirming state transition.

---

## 10. Scoring Requirements

| Component | Weight | Excellent | Good | Needs Work | Poor |
|-----------|--------|-----------|------|------------|------|
| Depth | 30% | ≤ 90° | 90–110° | 110–130° | > 130° |
| Trunk control | 25% | < 30° | 30–45° | 45–60° | > 60° |
| Knee tracking | 20% | No inward drift | Minor drift | Moderate | Significant |
| Consistency | 15% | CV < 5% | 5–10% | 10–20% | > 20% |
| Symmetry | 10% | Shift < 2% | 2–5% | 5–10% | > 10% |

---

## 11. Feedback Requirements

- Maximum 2 coaching cues per set.
- Select cues from the lowest-scoring components.
- Use external-focus, action-oriented language.
- Attach confidence level to each cue.

### Feedback templates

| Issue | Cue |
|-------|-----|
| Shallow depth | "Try sitting deeper — aim to get your hips below your knees." |
| Trunk lean | "Keep your chest tall as you stand up." |
| Knee valgus | "Keep your knees tracking over the middle of your feet." |
| Hip shift | "Press evenly through both feet to keep your hips centered." |
| Inconsistency | "Try to match the same depth and tempo on every rep." |

---

## 12. UX Requirements

- Dark-themed, modern UI with clean typography.
- Landing screen explains the app in one sentence.
- Camera setup screen shows framing guidance.
- Skeleton overlay is visually clean (thin lines, joint dots, subtle color).
- Rep counter is visible during analysis.
- Results screen is scannable in under 10 seconds.
- Score uses a visual indicator (arc, bar, or ring), not just a number.
- Feedback cues are visually distinct from score breakdown.
- Disclaimer is always visible on results screen but not intrusive.
- Responsive layout for desktop and mobile browsers.
- Smooth transitions between screens.

---

## 13. Safety and Claims Boundaries

### The app MUST NOT:
- Use words: "diagnosis," "injury," "risk," "abnormal," "pathological," "dangerous."
- Claim to measure force, load, joint stress, or internal biomechanics.
- Suggest medical conditions or recommend medical treatment.
- Imply that scores predict injury.
- Use fear-based or alarmist language.

### The app MUST:
- State clearly: movement observations, not medical advice.
- Use observational language: "appears," "suggests," "relative to your set."
- Include confidence levels with every observation.
- Suppress strong claims when data quality is low.
- Encourage consulting a professional for health concerns.

---

## 14. Success Criteria

| Criteria | Target |
|----------|--------|
| Camera activates and shows live preview | Chrome, Firefox, Safari, Edge |
| Skeleton overlay tracks body in real time | Accurate at 15+ FPS |
| Rep detection counts squats correctly | ±1 rep for sets of 3–5 |
| Score produced after a set | Within 2 seconds |
| Feedback matches observed issue | Manual review passes |
| Confidence messaging works | Low-confidence → appropriate message |
| No medical claims in the app | Manual review passes |
| App runs entirely client-side | No network requests after page load |

---

## 15. Open Questions

| # | Question | Impact |
|---|----------|--------|
| 1 | Auto-detect set completion or require user click "Done"? | UX flow |
| 2 | Minimum rep count for meaningful scoring? (Recommend 3) | Scoring |
| 3 | Automated framing check or just visual guidance? | Scope |
| 4 | Fallback if MediaPipe fails to load? | Error handling |
| 5 | Show asymmetry only when confidence is High? | Feedback quality |

---

## 16. Future Scope (Not Layer 1)

- Additional movements (CMJ, single-leg squat, lunge, push-up)
- Session history and longitudinal tracking
- User accounts and profiles
- Video recording and replay
- Readiness and fatigue trend monitoring
- Multi-camera or uploaded video analysis
- Mobile native app
- Custom ML models
- Wearable/sensor integration
- Team dashboards and API
