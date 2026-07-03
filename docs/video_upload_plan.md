# Video upload support — planning document (M15A)

**Status:** ✅ Implemented (shipped as Milestone 17, June 2026 — `/upload` route, `analysis/videoAnalyzer.ts`, `cv/videoFrameSource.ts`). This document is retained as the design reference.  
**Constraints:** Browser-only, client-side, no backend, no cloud storage, no server upload.

This document describes how KinematicIQ could add **pre-recorded squat video analysis** while reusing the existing MediaPipe pose engine, analysis pipeline, scoring, and results UI.

---

## Goals

- Let users pick a local video file (phone export, screen recording, etc.) instead of using the live webcam.
- Run the **same** rep detection, metrics, scoring, and coaching logic already used on `/camera`.
- Land on the **same** `/results` screen with a `SessionResult` payload.
- Keep all bytes on the device (File API + in-memory processing only).

## Non-goals (for first implementation)

- Server upload, transcoding, or persistence across sessions.
- Multi-person videos, non-squat movements, or trim/edit UI beyond simple start/end (optional later).
- Offline PWA packaging changes (WASM/model CDN still required on first load).

---

## 1. How video upload would work in the browser

### File selection

- Use `<input type="file" accept="video/*">` (optionally `capture` for mobile, but primary path is gallery/files).
- Read the file as a **blob URL**: `URL.createObjectURL(file)` — no server round-trip.
- Attach the blob URL to a hidden or visible `<video>` element:
  - `video.src = objectUrl`
  - `video.muted = true` (required for programmatic play in many browsers)
  - `video.playsInline = true` (iOS)
  - Wait for `loadedmetadata` to know `duration`, `videoWidth`, `videoHeight`.

### Validation before analysis

| Check | Suggested limit (MVP) | User-facing message |
|-------|------------------------|---------------------|
| File type | `video/mp4`, `video/webm`, `video/quicktime` (where supported) | “Use MP4 or WebM” |
| Duration | 15–90 s for a single set | “Clip should be one set (under 90s)” |
| Resolution | Warn if &gt; 1080p | “Large videos may be slow — 720p works best” |
| File size | Warn &gt; 50–100 MB | “File is large; analysis may take a while” |

Reject or warn only — do not block silently.

### Playback modes

Two implementation options (recommend **A** for MVP):

**A. Offscreen / paused stepping (recommended)**  
- Do **not** require real-time playback for analysis.
- Seek the video frame-by-frame or in small time steps (`video.currentTime = t`), wait for `seeked`, then call pose detection.
- Show a **progress bar** (“Analyzing… 42%”) instead of live preview during processing.

**B. Real-time playback analysis**  
- `video.play()` at 1× while running `requestAnimationFrame` and `detectForVideo` each frame.
- Simpler mentally but harder to pause/resume, easier to drop frames on slow devices.

### Cleanup

- `URL.revokeObjectURL(url)` when leaving the screen or starting a new file.
- Cancel in-flight analysis via `AbortController` if the user navigates away.

---

## 2. Passing uploaded video frames into the existing pose engine

### Current state (already favorable)

`web/src/cv/poseEngine.ts` already:

- Initializes MediaPipe `PoseLandmarker` with `runningMode: 'VIDEO'`.
- Exposes `detect(videoElement, timestamp, frameIndex)` which calls `detectForVideo(videoElement, timestamp)`.

The live camera loop in `CameraScreen.tsx` passes the **webcam** `<video>` element and monotonic timestamps (`performance.now()`). For uploaded video, the **same API** applies: any `HTMLVideoElement` with a decoded frame at `currentTime` is valid input.

### Timestamp rules for `detectForVideo`

MediaPipe expects **monotonically increasing** timestamps in milliseconds, typically aligned to frame time:

```text
timestampMs = Math.round(currentTime * 1000)   // from video.currentTime
frameIndex  = Math.floor(currentTime * targetFps) // optional bookkeeping
```

Do **not** use `performance.now()` for file analysis — use video timeline time so seeking backward would require resetting the landmarker session (see risks).

### Suggested adapter module (future)

Add something like `web/src/cv/videoFrameSource.ts` (name TBD):

```text
interface VideoFrameSource {
  load(file: File): Promise<{ duration: number; width: number; height: number }>
  seekTo(seconds: number): Promise<void>
  getVideoElement(): HTMLVideoElement
  dispose(): void
}
```

`poseEngine.detect()` stays unchanged; the upload flow owns seek + timing.

### Canvas / overlay (optional)

- Skeleton overlay can reuse `SkeletonOverlay` + `drawSkeleton` by drawing on a canvas sized to the video’s displayed dimensions.
- During offline analysis, overlay may be **post-process only** (show on preview after analysis) to save work in MVP.

---

## 3. Reusing the rep counting and analysis pipeline

### What can be shared unchanged

These modules are **input-agnostic** — they consume `PoseFrame`, angles, and phase transitions, not the camera itself:

| Layer | Files |
|-------|--------|
| Geometry / angles | `analysis/geometry.ts`, `analysis/angles.ts` |
| Phase | `analysis/phaseDetector.ts` |
| Reps | `analysis/repCounter.ts` |
| Set activation | `analysis/setActivation.ts` |
| Metrics | `analysis/metricCollector.ts`, `analysis/asymmetryDetector.ts` |
| Scoring | `scoring/scoringEngine.ts`, `scoring/scoringConfig.ts` |
| Session | `session/buildSessionResult.ts` |
| Results UI | `screens/ResultsScreen.tsx` |

The test helper `web/src/test/squatSimulation.ts` (`runSquatPipeline`) proves the pipeline can run without a camera — uploaded video is the same idea with real `PoseFrame`s instead of synthetic ones.

### What differs from live camera

| Live (`CameraScreen`) | Upload (planned) |
|------------------------|------------------|
| `requestAnimationFrame` loop | `seek` + async loop or `for` with `await seeked` |
| Auto-start: WAITING → CALIBRATING → READY → ACTIVE | Must **define** when the “set” starts |
| Auto-finish: stand still to end | End at **video end** or last rep + N seconds |
| Continuous calibration guides | One-time calibration from first N seconds of stable standing |
| `poseConfidenceSamples` from live stream | Samples from each analyzed frame |

### Recommended analysis orchestrator (future)

Extract a shared function from `CameraScreen`’s inner loop (conceptually):

```text
processFrame(poseFrame, angles, hipY, pipelineState) → updated state, events
```

For upload, a dedicated `runVideoAnalysis(video, onProgress)` would:

1. **Warm-up / calibration window** — first ~2s of video (or until `checkCalibration` passes for 60 stable frames), same as `autoStart` CALIBRATING logic.
2. **Active window** — from first descent (or from user-defined start offset) until:
   - `video.ended`, or
   - optional: no rep activity for X seconds (reuse `autoFinish` ideas).
3. Collect `RepMetrics[]` + `poseConfidenceSamples[]`.
4. Call `buildSessionResult(reps, samples)` — identical to live finish.

### Auto-start / auto-finish policy for uploads

**MVP recommendation:**

- **Start:** Auto-detect first descent after calibration (reuse `updateAutoStart` through READY, then flip to ACTIVE on descent) *or* simpler: user taps “Start analysis from here” on a scrubber (reduces bad trims).
- **End:** Analyze until `currentTime >= duration - ε`; do not require “stand still” unless we detect finish heuristics.
- **Skip** live-only UI: finish countdown overlay, “Finish Now” (replace with “Cancel analysis”).

### Frame sampling rate

- Target **15–30 FPS** analysis, not every display frame:
  - `step = 1/15` seconds → fewer inferences, faster total time.
  - MediaPipe temporal smoothing still works if timestamps increase monotonically.
- If video is 60 FPS source, subsample by time, not by frame index.

---

## 4. UI flow

### Entry points

- **Landing / nav:** “Analyze video” alongside “Open camera”.
- **Route:** `/upload` (new) — keeps `CameraScreen` focused on live capture.

### Screen flow (four stages)

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 1. Upload   │ ──► │ 2. Preview  │ ──► │ 3. Analyze  │ ──► │ 4. Results  │
│ pick file   │     │ trim/confirm│     │ progress    │     │ /results    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

#### 1. Upload

- File picker + drag-and-drop zone.
- Show filename, duration, resolution after metadata loads.
- Primary CTA: “Continue” → Preview.
- Disclaimer: video stays on device.

#### 2. Preview

- `<video controls>` with blob URL.
- Optional MVP: simple “Set starts around” note (full video analyzed first; trim in v2).
- Secondary: thumbnail + “Side view works best” coaching (mirror `docs/scoring_notes.md` camera guidance).
- CTA: “Analyze squat” → Analysis.

#### 3. Analyze

- Non-interactive progress UI:
  - Progress bar (time processed / duration).
  - Status text: “Detecting pose…”, “Counting reps…”, “Building report…”
  - Cancel button → back to Preview (abort loop).
- On success: `navigate('/results', { state: { result } })` — same as camera.
- On failure: inline error (no poses, too dark, unsupported codec).

#### 4. Results

- Reuse `ResultsScreen` unchanged.
- Optional badge later: “From uploaded video” vs “Live camera” in summary (session metadata flag).

### Wireframe-level component map (future)

| Stage | New / changed UI |
|-------|------------------|
| Upload | `UploadScreen.tsx`, `VideoDropzone.tsx` |
| Preview | `VideoPreview.tsx` |
| Analyze | `VideoAnalysisProgress.tsx` |
| Results | `ResultsScreen.tsx` (optional source label) |

---

## 5. Technical risks

### Video size and memory

- Long 4K clips decode to large GPU/RAM pressure.
- **Mitigation:** duration cap, resolution warning, subsample FPS, revoke blob URLs promptly.

### Frame rate and timestamp monotonicity

- Seeking backward without resetting PoseLandmarker can confuse temporal mode.
- **Mitigation:** only seek forward; if user scrubs back in preview, create a **new** analysis run from scratch; document that analysis is forward-only.

### Performance (main thread)

- `detectForVideo` + seek is CPU/GPU heavy; blocking the main thread causes frozen UI.
- **Mitigation:**
  - `requestIdleCallback` / chunked processing with `await` yields between frames.
  - `scheduler.postTask` or Web Worker only if we move WASM (hard) — unlikely for v1.
  - Cap analyzed duration and FPS.

### Pose confidence

- Uploaded clips may have motion blur, poor lighting, or non-side angles → lower `poseConfidence`, suppressed coaching (existing behavior).
- **Mitigation:** show confidence warning on results (already in M14C); pre-flight “quality hints” on preview if average confidence on first 30 frames is low.

### Mobile browser limits

- iOS Safari: memory kills on large files; `video/quicktime` support varies; autoplay rules less relevant if stepping with seek.
- Android Chrome: generally better, still risk OOM on 100MB+ files.
- **Mitigation:** conservative file size warnings; test on iOS 17+ and mid-tier Android.

### Codec support

- Some `.mov` / HEVC files fail to decode in `<video>` depending on OS.
- **Mitigation:** clear error message; suggest re-export as H.264 MP4.

### Calibration / auto-start on edited videos

- User may upload mid-set or with walk-in/out → false rep boundaries.
- **Mitigation:** v2 trim handles; v1 document “clip should start standing, one set only”.

### Legal / privacy (product, not technical)

- Client-side only is a strength — state clearly in UI copy.

---

## 6. Files likely to change later

| Area | Files | Nature of change |
|------|--------|------------------|
| Routing | `web/src/App.tsx` | Add `/upload` route |
| New screen | `web/src/screens/UploadScreen.tsx` (or split Upload / Preview / Analyze) | New UI flow |
| Live camera | `web/src/screens/CameraScreen.tsx` | Optional: extract shared `processAnalysisFrame` helper; link to upload from nav |
| Session UI copy | `web/src/screens/cameraSessionUi.ts` | N/A for upload; maybe shared `analysisSessionUi.ts` |
| Pose | `web/src/cv/poseEngine.ts` | Possibly `reset()` for new video session; optional `detect` batch helper |
| Video I/O | **New** `web/src/cv/videoFrameSource.ts`, `web/src/analysis/videoAnalyzer.ts` | Seek loop, progress callbacks |
| Pipeline | `web/src/analysis/autoStart.ts`, `autoFinish.ts` | Upload-specific entry/exit policies or flags |
| Types | `web/src/session/types.ts` | Optional `source: 'live' \| 'upload'` on `SessionResult` |
| Results | `web/src/screens/ResultsScreen.tsx` | Optional source label; otherwise unchanged |
| Landing / nav | `web/src/screens/LandingScreen.tsx`, `AppShell` / navbar | Link to upload |
| Docs | `docs/scoring_notes.md` | Note upload-specific camera assumptions |
| Tests | `web/src/analysis/videoAnalyzer.test.ts` | Mock video element or reuse `squatSimulation` patterns |

**Should not need changes for MVP:** scoring config, feedback engine, rep counter core logic, metric collector (if rep list is produced correctly).

---

## Recommended implementation order

Phased delivery keeps risk low and reuses existing results.

| Phase | Scope | Outcome |
|-------|--------|---------|
| **P0 — Spike** | Hidden dev route; hard-coded test video; forward-only seek @ 15 FPS; log rep count | Validates MediaPipe + pipeline on file without UI polish |
| **P1 — Upload + analyze** | `/upload` minimal: file pick → progress → `buildSessionResult` → `/results` | End-to-end MVP |
| **P2 — Preview + validation** | Preview player, duration/size checks, cancel, error states | Usable product |
| **P3 — Refactor shared loop** | Extract frame processor from `CameraScreen`; unit tests with synthetic + short fixture video | Less duplication, easier maintenance |
| **P4 — UX polish** | Trim handles, “from video” badge, quality pre-check, landing CTA | Completes MVP feel |
| **P5 — Performance** | Chunked yielding, adaptive FPS, optional downscale via canvas draw | Mobile reliability |

Do **not** start with backend, storage, or multi-file libraries.

---

## Open decisions (team input)

1. **Trim required for v1?** — Full-file analysis is simpler; trim reduces false reps.
2. **Manual “set start” button** vs fully automatic auto-start on file?
3. **Maximum duration** — 60s vs 90s vs unlimited with warning?
4. **Analyze audio track?** — No; ignore for pose.
5. **Same PoseLandmarker instance** after live camera then upload without reload? — Call `initialize()` once; add `resetVideoSession()` if MediaPipe exposes need between files.

---

## Success criteria (when implemented)

- User can select a local squat video and receive the same `SessionResult` shape as live camera.
- No network upload of video bytes.
- `npm run build`, `tsc`, and existing Vitest suite still pass.
- Results screen works without knowing the source medium (optional label only).

---

## Related docs

- [scoring_notes.md](./scoring_notes.md) — camera angle and confidence assumptions apply equally to uploaded clips.
- [00_context_pack.md](./00_context_pack.md) — product context (update when upload ships).

---

*Document version: M15A planning — 2026-05-28. No application code changed.*
