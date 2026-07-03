# KinematicIQ — Build Plan (Layer 1 MVP)

> **Note (2026-07-02):** Milestones 1–17 are complete. The technology constraints embedded in these milestones (no TypeScript, no React Router, no tests) are **superseded** — the shipped app uses TypeScript, React Router, and Vitest; see the revision note in `docs/08_ai_rules.md`. Current roadmap: `docs/strategy/execution-roadmap.md`. This document is retained as historical reference for how Layer 1 was built.

Work through milestones 1–15 in order. Complete each one fully before starting the next. Verify acceptance criteria after every milestone.

**Before every milestone:** Read `docs/06_prd.md`, `docs/07_architecture.md`, and `docs/08_ai_rules.md`.

---

## Milestone 1: App Shell

**Goal:** Create the Vite + React project scaffold with three empty screens and state-based routing.

**Why it matters:** Everything builds on this foundation. If the shell is wrong, every subsequent milestone fights the structure.

**Files likely affected:**
- `web/package.json`
- `web/vite.config.js`
- `web/public/index.html`
- `web/src/index.jsx`
- `web/src/app/App.jsx`
- `web/src/app/App.css`
- `web/src/screens/LandingScreen.jsx`
- `web/src/screens/CameraScreen.jsx`
- `web/src/screens/ResultsScreen.jsx`

**Steps:**
1. Initialize a Vite React project in `web/` using `npx -y create-vite@latest ./ --template react`.
2. Clean out default boilerplate files.
3. Create `src/app/App.jsx` with a `currentScreen` state variable and conditional rendering.
4. Create three screen components that each render a placeholder heading.
5. Add basic dark-theme CSS in `App.css` (background, text color, font).
6. Verify the app runs with `npm run dev` and all three screens are reachable via state changes.

**Acceptance criteria:**
- `npm run dev` starts without errors.
- App renders LandingScreen by default.
- State changes switch between all three screens.
- Dark theme is applied.

**Manual test:** Open browser → see Landing screen → use React DevTools or a temp button to switch screens.

**Common failures:** Vite template includes files you don't need (App.tsx, etc.) — delete them. Don't install React Router.

**Do not build yet:** Camera access, pose estimation, any analysis logic.

**Agent prompt:**
> Read docs/07_architecture.md for folder structure. Initialize a Vite + React project in web/. Create App.jsx with state-based routing between LandingScreen, CameraScreen, and ResultsScreen. Each screen is a simple component with a heading. Add dark-theme base CSS. Verify npm run dev works and all three screens render. Do not add React Router. Do not add any libraries beyond what Vite + React provides. Do not create files outside the screens listed above.

---

## Milestone 2: Camera Permission and Live Preview

**Goal:** Request camera access and display a live video preview on CameraScreen.

**Why it matters:** Camera access is the first real user interaction and the input source for everything downstream.

**Files likely affected:**
- `web/src/screens/CameraScreen.jsx`
- `web/src/screens/LandingScreen.jsx`

**Steps:**
1. Add a "Start" button to LandingScreen that transitions to CameraScreen.
2. On CameraScreen mount, request camera via `navigator.mediaDevices.getUserMedia({ video: true })`.
3. Attach the MediaStream to a `<video>` element using a ref.
4. Handle permission denied with a clear error message.
5. Handle no camera available.
6. Style the video element to fill the screen area responsively.

**Acceptance criteria:**
- Clicking "Start" on Landing navigates to Camera screen.
- Browser prompts for camera permission.
- Granting permission shows live video preview.
- Denying permission shows a helpful error message.
- Video fills the available space without distortion.

**Manual test:** Click Start → grant camera → see yourself. Deny camera → see error message.

**Common failures:** Forgetting `autoplay` and `playsInline` attributes on video element. Not handling the permission-denied case. Video element sizing issues on mobile.

**Do not build yet:** Pose estimation, skeleton overlay, setup guide, analysis.

**Agent prompt:**
> Read docs/07_architecture.md. On LandingScreen, add a "Start" button that navigates to CameraScreen. On CameraScreen, request camera permission via getUserMedia and display the live video feed in a video element. Handle permission denied gracefully with an error message. Style the video responsively. Do not add pose estimation or any analysis logic yet.

---

## Milestone 3: Pose Estimation Integration

**Goal:** Run MediaPipe Pose on the live video feed and log landmark data to the console.

**Why it matters:** This proves the core CV pipeline works before building any UI on top of it.

**Files likely affected:**
- `web/package.json` (add @mediapipe/tasks-vision)
- `web/src/pose/poseEngine.js`
- `web/src/pose/landmarkExtractor.js`
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Install `@mediapipe/tasks-vision`.
2. Create `poseEngine.js` with `initialize()` and `detect(videoFrame)` methods.
3. Create `landmarkExtractor.js` to extract named joint positions from raw results.
4. In CameraScreen, initialize pose engine after camera is ready.
5. Run detection in a `requestAnimationFrame` loop.
6. Log extracted landmarks to console each frame.

**Acceptance criteria:**
- MediaPipe loads without errors.
- Console shows landmark data updating every frame.
- Landmarks include hip, knee, ankle, shoulder positions with confidence.
- No visible UI change yet (landmarks are console-only).
- Frame rate stays above 15 FPS.

**Manual test:** Open browser console → stand in front of camera → see landmark coordinates logging continuously.

**Common failures:** MediaPipe model file not loading (CORS or path issues). Forgetting to wait for model initialization before starting detection. Memory leaks from not cleaning up the animation frame loop.

**Do not build yet:** Skeleton overlay, angle calculations, phase detection.

**Agent prompt:**
> Read docs/07_architecture.md. Install @mediapipe/tasks-vision. Create pose/poseEngine.js with initialize() and detect() methods that run MediaPipe Pose Landmarker. Create pose/landmarkExtractor.js to extract named joints from raw results. In CameraScreen, initialize the pose engine after camera starts, run detection in a requestAnimationFrame loop, and log landmarks to console. Do not draw anything on screen yet. Do not add angle calculations or analysis logic.

---

## Milestone 4: Skeleton Overlay

**Goal:** Draw the detected skeleton on a canvas overlay aligned with the video feed.

**Why it matters:** Visual feedback that the system is tracking the user. This is the first "wow" moment.

**Files likely affected:**
- `web/src/components/SkeletonOverlay.jsx`
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Create SkeletonOverlay component with a `<canvas>` element.
2. Position canvas absolutely over the video element, matching dimensions.
3. Draw joint dots at landmark positions (small circles).
4. Draw line segments between connected landmarks (skeleton bones).
5. Use subtle colors — thin white/cyan lines, small dots.
6. Clear and redraw each frame.
7. Handle canvas resize when video dimensions change.

**Acceptance criteria:**
- Skeleton draws on top of video in real time.
- Joint dots and bone lines are visible and correctly positioned.
- Skeleton moves smoothly with the user.
- Canvas resizes correctly with the video.
- Visual style is clean (not cluttered).

**Manual test:** Stand in front of camera → see skeleton overlay tracking your body in real time.

**Common failures:** Canvas and video dimensions out of sync. Forgetting to clear canvas between frames. Drawing coordinates not matching normalized landmark coordinates.

**Do not build yet:** Angle calculations, phase detection, rep counting, setup guide.

**Agent prompt:**
> Read docs/07_architecture.md. Create components/SkeletonOverlay.jsx that renders a canvas overlaid on the video element. Each frame, draw joint dots and bone lines from the detected landmarks. Use clean, subtle styling (thin lines, small dots, cyan/white colors). Ensure the canvas stays aligned with the video. Do not add angle calculations or analysis logic.

---

## Milestone 5: Landmark Extraction and Smoothing

**Goal:** Extract key landmarks into a clean data structure and apply temporal smoothing to reduce jitter.

**Why it matters:** Raw landmarks are noisy. Smooth data is required for stable angle calculations and phase detection.

**Files likely affected:**
- `web/src/pose/landmarkExtractor.js` (update)
- `web/src/pose/smoother.js`
- `web/src/utils/constants.js`

**Steps:**
1. Define landmark index constants in `constants.js` (MediaPipe landmark indices for hip, knee, ankle, shoulder).
2. Update `landmarkExtractor.js` to return a structured object with named joints and confidence.
3. Create `smoother.js` with a moving-average buffer (window ~5 frames).
4. Apply smoothing to all extracted landmarks before passing to downstream modules.
5. Verify smoothed output in console — positions should be stable when standing still.

**Acceptance criteria:**
- Extracted landmarks use named keys (leftHip, rightKnee, etc.).
- Each landmark includes x, y, z, and confidence.
- Smoothed landmarks show noticeably less jitter than raw landmarks.
- Skeleton overlay uses smoothed landmarks (visually smoother).
- Constants file defines all needed landmark indices.

**Manual test:** Stand still → skeleton should be very stable (no jitter). Move slowly → skeleton follows smoothly.

**Common failures:** Smoothing buffer not resetting when landmarks disappear. Over-smoothing causing lag.

**Do not build yet:** Angle calculations, phase detection, rep counting.

**Agent prompt:**
> Read docs/07_architecture.md. Create utils/constants.js with MediaPipe landmark index constants. Update pose/landmarkExtractor.js to return named joint objects with confidence. Create pose/smoother.js with a moving-average smoother (window 5). Feed smoothed landmarks to the skeleton overlay. Verify reduced jitter in console output. Do not add angle calculations or analysis logic.

---

## Milestone 6: Joint Angle Calculations

**Goal:** Calculate knee angle, hip angle, and trunk lean from smoothed landmarks each frame.

**Why it matters:** Joint angles are the foundation of every downstream analysis feature.

**Files likely affected:**
- `web/src/utils/mathUtils.js`
- `web/src/analysis/angleCalculator.js`
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Create `mathUtils.js` with a `calculateAngle(a, b, c)` function using dot product formula.
2. Create `angleCalculator.js` with functions: `getKneeAngle()`, `getHipAngle()`, `getTrunkLean()`.
3. Each function takes the relevant landmarks and returns angle in degrees.
4. Call angle functions each frame with smoothed landmarks.
5. Display current angles as a debug overlay (small text on screen) — temporary, will be removed later.

**Acceptance criteria:**
- Knee angle reads ~170–180° when standing straight.
- Knee angle decreases as user squats down.
- Trunk lean reads near 0° when standing upright.
- Trunk lean increases when leaning forward.
- Angles update smoothly without large jumps.
- Debug overlay shows angles in real time.

**Manual test:** Stand straight → angles near 180° (knee) and 0° (trunk). Squat down → knee angle drops, trunk lean increases. Values are stable and make physical sense.

**Common failures:** Angle calculation returning NaN when landmarks overlap. Getting radians vs degrees wrong. Incorrect vector direction producing complementary angles.

**Do not build yet:** Phase detection, rep counting, scoring.

**Agent prompt:**
> Read docs/07_architecture.md. Create utils/mathUtils.js with a calculateAngle(a, b, c) function. Create analysis/angleCalculator.js with getKneeAngle, getHipAngle, getTrunkLean functions. Call these each frame from CameraScreen with smoothed landmarks. Show angles as a temporary debug overlay on screen. Verify angles make physical sense (180° standing, decreasing during squat). Do not add phase detection or rep counting.

---

## Milestone 7: Squat Phase Detection

**Goal:** Detect squat phases (standing → descending → bottom → ascending → standing) using a state machine on knee angle.

**Why it matters:** Phase detection is required for rep counting and for knowing when to snapshot per-rep metrics.

**Files likely affected:**
- `web/src/analysis/phaseDetector.js`
- `web/src/utils/constants.js` (add thresholds)
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Create `phaseDetector.js` with states: STANDING, DESCENDING, BOTTOM, ASCENDING.
2. Transition rules based on knee angle thresholds (standing > 160°, descending < 155°, etc.).
3. Require minimum consecutive frames (5) before confirming transition.
4. Expose `update(kneeAngle)` that returns `{ phase, transitioned }`.
5. Display current phase on the debug overlay.

**Acceptance criteria:**
- Phase shows STANDING when upright.
- Phase transitions to DESCENDING when squatting down.
- Phase reaches BOTTOM at lowest point.
- Phase transitions through ASCENDING back to STANDING.
- False transitions are rare (frame persistence prevents flicker).
- Phase displayed on screen in real time.

**Manual test:** Stand → see STANDING. Squat slowly → see DESCENDING → BOTTOM → ASCENDING → STANDING. Do 3 squats → phases cycle correctly each time.

**Common failures:** Thresholds too tight (never triggers) or too loose (triggers from noise). No frame persistence causing rapid phase flicker.

**Do not build yet:** Rep counting, metrics, scoring.

**Agent prompt:**
> Read docs/07_architecture.md. Create analysis/phaseDetector.js with a state machine (STANDING, DESCENDING, BOTTOM, ASCENDING). Transitions are based on knee angle thresholds with 5-frame persistence. Add threshold constants to utils/constants.js. Display current phase on the debug overlay. Verify phases cycle correctly during a squat. Do not add rep counting or scoring.

---

## Milestone 8: Rep Counting

**Goal:** Count completed squat reps and snapshot per-rep metrics at rep completion.

**Why it matters:** Rep counting is user-visible value and provides the data structure for per-rep analysis.

**Files likely affected:**
- `web/src/analysis/repCounter.js`
- `web/src/components/RepCounter.jsx`
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Create `repCounter.js` that tracks full phase cycles (STANDING → ... → STANDING = 1 rep).
2. At each rep completion, snapshot: min knee angle (depth), avg trunk lean, hip shift at bottom.
3. Create RepCounter component that displays current rep count.
4. Add "Begin Set" and "Done" buttons to CameraScreen to start/stop analysis mode.
5. Style the rep counter to be visible but not intrusive.

**Acceptance criteria:**
- Rep count increments by 1 after each complete squat cycle.
- Rep count displays on screen during analysis.
- Per-rep data is captured (depth, trunk lean).
- "Begin Set" starts counting. "Done" ends counting.
- Partial reps (not returning to standing) do not count.

**Manual test:** Click Begin → do 3 full squats → see counter go 1, 2, 3. Stop halfway through a squat → count stays the same. Click Done → counting stops.

**Common failures:** Counting during initial standing as a rep. Double-counting from noisy transitions. Not resetting between sets.

**Do not build yet:** Metrics aggregation, scoring, feedback, results screen.

**Agent prompt:**
> Read docs/07_architecture.md. Create analysis/repCounter.js that counts full squat phase cycles and snapshots per-rep metrics. Create components/RepCounter.jsx to display the count. Add Begin/Done buttons to CameraScreen to control analysis mode. Verify reps count correctly and partial reps are ignored. Do not add scoring or feedback logic.

---

## Milestone 9: Movement Metrics

**Goal:** Aggregate per-rep data into set-level movement metrics after the user clicks "Done."

**Why it matters:** Set-level metrics (averages, consistency, asymmetry) are the input to the scoring engine.

**Files likely affected:**
- `web/src/analysis/metricCollector.js`
- `web/src/analysis/asymmetryDetector.js`
- `web/src/screens/CameraScreen.jsx`

**Steps:**
1. Create `metricCollector.js` that takes per-rep data and computes: avg depth, avg trunk lean, depth CV (consistency), min/max values.
2. Create `asymmetryDetector.js` that computes: hip shift average, shoulder level difference at bottom position.
3. After user clicks "Done," run metric collection and log the summary to console.
4. Pass the metrics summary to the results screen via state.

**Acceptance criteria:**
- Metrics summary includes: avgDepth, avgTrunkLean, depthCV, hipShift, shoulderAsymmetry.
- CV calculation is correct (std dev / mean × 100).
- Asymmetry values are computed from left vs. right landmarks.
- Metrics log to console after set completion.
- Metrics are passed to ResultsScreen when navigating.

**Manual test:** Do 3–5 squats → click Done → check console for metrics summary. Values should match what you visually observed.

**Common failures:** Division by zero when computing CV with 1 rep. Not capturing asymmetry at the right phase (bottom, not standing).

**Do not build yet:** Scoring, feedback, results UI.

**Agent prompt:**
> Read docs/07_architecture.md. Create analysis/metricCollector.js to aggregate per-rep data into set-level metrics (averages, CV, min/max). Create analysis/asymmetryDetector.js to compute hip shift and shoulder asymmetry. After Done is clicked, compute metrics and log to console. Pass metrics to ResultsScreen state. Do not build scoring or feedback yet.

---

## Milestone 10: Basic Scoring Engine

**Goal:** Convert movement metrics into a 0–100 score with component breakdowns and band labels.

**Why it matters:** The score is the user's primary summary of movement quality.

**Files likely affected:**
- `web/src/scoring/scoringEngine.js`
- `web/src/scoring/scoringConfig.js`
- `web/src/screens/CameraScreen.jsx` (pass score to results)

**Steps:**
1. Create `scoringConfig.js` with thresholds, weights, and band definitions per the PRD.
2. Create `scoringEngine.js` that takes a metrics summary and returns: totalScore, component scores, band label.
3. Each component (depth, trunk, knee tracking, consistency, symmetry) scores 0–100 within its range.
4. Total = weighted sum of components.
5. Band labels: Excellent (80–100), Good (60–79), Needs Work (40–59), Poor (0–39).
6. Log scoring results to console and pass to ResultsScreen.

**Acceptance criteria:**
- Score is a number 0–100.
- Each component score is individually computed and visible.
- Weights match the PRD (depth 30%, trunk 25%, knee 20%, consistency 15%, symmetry 10%).
- Band label matches the total score.
- Good squats produce high scores; poor squats produce low scores.

**Manual test:** Do good squats (deep, controlled) → score should be 70+. Do shallow, sloppy squats → score should be lower. Check that component breakdown makes sense.

**Common failures:** Inverted scoring (deeper squat = lower angle but should be higher score). Weights not summing to 100%.

**Do not build yet:** Feedback engine, results UI.

**Agent prompt:**
> Read docs/07_architecture.md and docs/06_prd.md scoring section. Create scoring/scoringConfig.js with thresholds and weights from the PRD. Create scoring/scoringEngine.js that converts metrics into a total score (0–100), component scores, and band label. Verify scoring produces sensible results. Do not build feedback or results UI yet.

---

## Milestone 11: Feedback Engine

**Goal:** Generate 1–2 human-readable coaching cues based on scoring results.

**Why it matters:** Feedback is what makes the app useful — a score without a cue is just a number.

**Files likely affected:**
- `web/src/feedback/feedbackEngine.js`
- `web/src/feedback/feedbackTemplates.js`
- `web/src/feedback/confidenceCalculator.js`

**Steps:**
1. Create `feedbackTemplates.js` with a map of issue keys to coaching cue objects (observation, cue, note).
2. Create `confidenceCalculator.js` that computes session confidence from landmark quality history.
3. Create `feedbackEngine.js` that takes scoring results, selects the 1–2 lowest components, looks up cues, attaches confidence.
4. Output: array of `{ issue, cue, confidence, note }` objects.
5. Log feedback to console.

**Acceptance criteria:**
- 1–2 coaching cues are generated per set.
- Cues correspond to the worst-scoring components.
- Language is plain and coaching-oriented (no medical jargon).
- Confidence level (High/Medium/Low) is attached to each cue.
- If all confidence is Low, output is "insufficient data" instead of cues.

**Manual test:** Do squats with intentionally poor depth → feedback should mention depth. Do squats with excessive lean → feedback should mention trunk.

**Common failures:** Selecting cues that don't match the actual lowest component. Using medical or anatomical language in templates.

**Do not build yet:** Results screen UI.

**Agent prompt:**
> Read docs/07_architecture.md and docs/06_prd.md feedback section. Create feedback/feedbackTemplates.js with coaching cue templates per the PRD. Create feedback/confidenceCalculator.js to compute session confidence. Create feedback/feedbackEngine.js to select top 1–2 cues from lowest-scoring components. Use plain coaching language. Attach confidence levels. Do not build the results UI yet.

---

## Milestone 12: Results Screen

**Goal:** Build the results screen UI showing score, breakdown, feedback, asymmetry, confidence, and disclaimer.

**Why it matters:** This is where the user sees the value. It must be clear, scannable, and visually polished.

**Files likely affected:**
- `web/src/screens/ResultsScreen.jsx`
- `web/src/components/ScoreDisplay.jsx`
- `web/src/components/FeedbackCard.jsx`
- `web/src/components/ConfidenceBadge.jsx`
- `web/src/components/DisclaimerBanner.jsx`
- `web/src/app/App.css` (additional styles)

**Steps:**
1. Build ScoreDisplay with a visual indicator (arc, ring, or bar) showing total score and band label.
2. Build score breakdown section showing each component with its individual score.
3. Build FeedbackCard component displaying coaching cue with confidence badge.
4. Build ConfidenceBadge (High = green, Medium = yellow, Low = red).
5. Build DisclaimerBanner with safety text.
6. Show rep count and per-rep depth summary.
7. Add "Try Again" button that returns to CameraScreen.
8. Style everything for dark theme, modern look, responsive layout.

**Acceptance criteria:**
- Results screen shows: total score, band label, component breakdown, 1–2 feedback cards, rep count, confidence, disclaimer.
- Score visual is polished (not just a number).
- Feedback cards are distinct and readable.
- Disclaimer is visible but not intrusive.
- "Try Again" returns to camera view.
- Layout works on mobile and desktop.

**Manual test:** Complete a set → see results → visually review all elements. Click Try Again → return to camera. Do another set → new results appear.

**Common failures:** Results not resetting between sets. Disclaimer missing. Poor mobile layout.

**Do not build yet:** Error handling for edge cases, confidence-gated suppression.

**Agent prompt:**
> Read docs/07_architecture.md. Build ResultsScreen with ScoreDisplay (visual arc/ring), score breakdown, FeedbackCard components, ConfidenceBadge, DisclaimerBanner, rep count, and a Try Again button. Use dark theme, modern styling, responsive layout. Make the results scannable in under 10 seconds. Ensure all data from scoring and feedback engines flows to the screen correctly.

---

## Milestone 13: Confidence and Error Handling

**Goal:** Add confidence-gated feedback suppression, camera setup guidance, and graceful error handling.

**Why it matters:** Without this, the app makes false claims from bad data and crashes on edge cases.

**Files likely affected:**
- `web/src/components/SetupGuide.jsx`
- `web/src/screens/CameraScreen.jsx`
- `web/src/feedback/feedbackEngine.js` (update)
- `web/src/feedback/confidenceCalculator.js` (update)
- `web/src/screens/ResultsScreen.jsx` (update)

**Steps:**
1. Create SetupGuide component showing positioning guidance (distance, framing text/outline).
2. Show SetupGuide before analysis starts on CameraScreen.
3. Update confidenceCalculator to track per-frame landmark quality.
4. If session confidence is Low, suppress detailed feedback and show: "We couldn't get a clear enough view. Try adjusting your camera setup."
5. Handle MediaPipe loading failures with a user-friendly error screen.
6. Handle cases with 0 valid reps (no squats detected).
7. Handle cases where user walks out of frame mid-set.

**Acceptance criteria:**
- Setup guide appears before analysis mode.
- Low-confidence sessions show appropriate messaging instead of specific cues.
- MediaPipe load failure shows an error message (not a blank screen).
- 0 reps detected shows "No squats detected" message.
- App does not crash from any reasonably expected user behavior.

**Manual test:** Cover camera → results should show low confidence. Stand too far away → reduced confidence. Don't squat → "No squats detected." Block MediaPipe model URL → error message appears.

**Common failures:** Not testing the low-confidence path. Error states not styled. Forgetting to handle 0-rep case.

**Do not build yet:** Automated testing, advanced camera checks.

**Agent prompt:**
> Read docs/07_architecture.md. Create components/SetupGuide.jsx with camera positioning guidance. Update confidence logic to suppress feedback when landmark quality is poor. Handle MediaPipe load failure, 0 reps, and user leaving frame. Ensure no crash from expected user behavior. Show appropriate messages for all error/edge cases.

---

## Milestone 14: Manual Testing Checklist

**Goal:** Systematically verify every feature works correctly across browsers and scenarios.

**Why it matters:** This is the quality gate before cleanup. Every acceptance criterion from milestones 1–13 must pass.

**Files likely affected:** None (testing only). May create a scratch checklist file.

**Steps:**
1. Test on Chrome, Firefox, Safari, and Edge.
2. Test on desktop and mobile (or mobile emulator).
3. Walk through the full user flow: Landing → Camera → Analysis → Results → Try Again.
4. Test each scenario below.

**Test scenarios:**

| # | Scenario | Expected result |
|---|----------|----------------|
| 1 | Grant camera permission | Live preview appears |
| 2 | Deny camera permission | Error message, no crash |
| 3 | Stand in frame, skeleton appears | Skeleton overlay tracks body |
| 4 | Perform 3 good squats | Rep count = 3, high score |
| 5 | Perform 3 shallow squats | Lower depth score, depth cue |
| 6 | Perform 3 squats with forward lean | Lower trunk score, trunk cue |
| 7 | Perform 0 squats (just stand) | "No squats detected" message |
| 8 | Cover camera during set | Low confidence messaging |
| 9 | Walk out of frame | Graceful handling |
| 10 | Click Try Again | Returns to camera, fresh state |
| 11 | Perform 5 squats | Rep count = 5, metrics reflect all reps |
| 12 | Check disclaimer on results | Disclaimer is visible |
| 13 | Check no medical language | No banned words anywhere |
| 14 | Check mobile layout | Responsive, usable on phone |

**Acceptance criteria:**
- All 14 test scenarios pass.
- No console errors during normal use.
- No crashes on any scenario.
- UI is visually consistent across browsers.

**Manual test:** Run through every scenario in the table above.

**Common failures:** Safari getUserMedia differences. Mobile viewport issues. Console errors not noticed.

**Do not build yet:** Automated tests, CI/CD.

**Agent prompt:**
> Run the app with npm run dev. Walk through every test scenario in Milestone 14's table. Report which scenarios pass and which fail. For any failures, describe what went wrong. Do not fix anything yet — just report results.

---

## Milestone 15: Cleanup and Refactor

**Goal:** Remove debug overlays, clean up code, ensure production readiness.

**Why it matters:** Ship quality. Remove development artifacts and polish the final experience.

**Files likely affected:**
- `web/src/screens/CameraScreen.jsx` (remove debug overlay)
- `web/src/app/App.css` (final polish)
- Various files (code cleanup)

**Steps:**
1. Remove the debug angle/phase overlay from CameraScreen.
2. Remove all `console.log` statements used for debugging.
3. Review all components for unused imports, dead code, or leftover TODOs.
4. Ensure CSS is consistent and clean.
5. Verify the landing screen has a polished title, description, and start button.
6. Add brief JSDoc comments to all exported functions that don't have them.
7. Run through Milestone 14's test checklist one final time.
8. Verify the app builds cleanly with `npm run build`.

**Acceptance criteria:**
- No debug overlays visible in the app.
- No console.log statements (except error handling).
- All exported functions have JSDoc comments.
- `npm run build` completes without errors or warnings.
- Full test checklist from Milestone 14 passes.
- App looks polished and professional.

**Manual test:** Full user flow on Chrome and one other browser. Visually inspect every screen. Check console for stray logs.

**Common failures:** Forgetting a console.log somewhere. Build warnings from unused variables. Debug overlay accidentally left in.

**Do not build yet:** New features, additional movements, backend, auth, deployment.

**Agent prompt:**
> Remove all debug overlays (angle/phase text) from CameraScreen. Remove all console.log statements except error handlers. Add JSDoc comments to exported functions missing them. Clean up unused imports and dead code. Ensure CSS is consistent. Run npm run build and fix any errors. Run through the Milestone 14 test checklist and confirm all scenarios pass.
