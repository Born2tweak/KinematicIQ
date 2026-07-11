# Camera Page UX Review — Phase 1 (Pre-Push)

**Reviewer role:** Senior UX + biomechanics software  
**Date:** 2026-07-04  
**Repo:** `C:\Users\acetu\KinematicIQ` (7 unpushed local commits)  
**Scope:** Read-only. No implementation changes.

**Source recordings:**
- `chrome_ygbtf6NBTd.mp4` — normal + analyst flow during active set
- `chrome_aepoE3wvN6.mp4` — setup, analyst toggles, expanded 3D

---

## Annotated Screenshots

| File | What it shows |
|------|----------------|
| `annotated-01-waiting-hierarchy.png` | WAITING phase — hierarchy, text-only guidance, amber border |
| `annotated-02-analyst-clutter.png` | Analyst + DBG + 3D during ACTIVE — overlay competition |
| `annotated-03-trust-desync.png` | Trust failures: DBG desync, gate FAIL vs counted reps, unlabeled sparkline |
| `annotated-04-active-normal-clean.png` | ACTIVE without DBG/3D — comparatively clean normal mode |
| `annotated-05-3d-expanded-takeover.png` | Expanded PoseScene3D occludes capture stage |
| `annotated-06-setup-3d-default.png` | Default-size 3D during WAITING — low incremental value |

Raw extracted frames: `v1_*.png`, `v2_*.png` in this folder.

---

## 1. Visual Hierarchy

### First open (WAITING, normal mode)
**Eye path:** Global navbar → status chip (“Step into frame”) → amber border on feed → rep counter “0” → bottom action bar → disclaimer.

**What works**
- Rep counter is correctly secondary to setup guidance (`RepCounter` top-right, `SessionStatusCard` top-left via `cameraSessionUi.ts`).
- Phase-driven copy in `getSessionStatusCopy()` gives one imperative + one context line — good Kinect principle.

**What competes**
- **Navbar always visible** (`AppShell.tsx` `navbar--overlay`) — “KinematicIQ / Home / Camera / Upload / Results” splits attention before the capture task. Not truly immersive.
- **Three glass layers** at once: chip, subtitle card, disclaimer pill, action bar (`index.css` `.camera-hud--*`). Each has border + blur — visual noise stacks.
- **Analyst toggle always exposed** (`CameraScreen.tsx` L720–728) even when off — signals “there is another UI” and invites accidental power-user mode.
- **Amber capture border** (`drawCaptureStateBorder`) is the only spatial cue; it glows across the entire frame and competes with the status chip for “am I ready?” signal.

**Simplification opportunities (document only)**
- Collapse subtitle into chip during WAITING; show disclaimer only on first visit.
- Hide global nav links during capture; keep a single “exit” affordance.
- Make rep counter visually quieter until ACTIVE (smaller, muted border).

---

## 2. Camera Cleanliness

### Normal mode (Analyst off, DBG off, 3D off)
**Production-adjacent.** Vignette gradients (`camera-stage__vignette`), floating HUD, and phase copy feel intentional. ACTIVE frames (`annotated-04-active-normal-clean.png`) are usable.

### Remaining cleanliness issues

| Issue | Severity | Evidence |
|-------|----------|----------|
| Cyan skeleton + white joint dots | High | `drawSkeleton.ts` L4–7 — classic pose-demo palette; reads “MediaPipe underneath” |
| Skeleton always on | Medium | `CameraScreen.tsx` L402–404 — not gated behind Analyst |
| Multiple bordered glass cards | Medium | chip + subtitle + action bar + rep counter |
| Capture border glow | Low–Med | `captureGuidance.ts` L154–157 — shadow blur reads as effect, not product chrome |
| Lens flare / exposure | Env | Recordings show blown highlights; no UI guidance for lighting |
| `missingJoints` hint never shown in compact HUD | Med | `SessionStatusCard` supports `missingJoints` (L68–72) but `CameraScreen.tsx` L698–704 does **not** pass it |
| Responsive rep counter vs 3D | Med | At narrow widths, 3D panel (`min(46%, 320px)`) + rep counter share right edge |

### MediaPipe-era artifacts removed (credit)
- Static head box / feet line / center line removed (`drawCalibration.ts` L38–39).
- Dynamic guidance replaces static overlays (`captureGuidance.ts` header).

### MediaPipe-era artifacts still visible
- 33-landmark stick figure aesthetic.
- Normalized `HIP Y` in debug (`drawDebugOverlay.ts` L140–141).
- Landing page still markets “33 landmarks” (`LandingScreen.tsx`).

---

## 3. Capture Guidance

### Current implementation
- **Logic:** `deriveCaptureGuidance()` — single imperative, optional detail, priority chain: in frame → feet → head → body completeness → distance → centering → ok.
- **Visual:** inset rounded border, green/amber (`drawCaptureStateBorder`).
- **Copy:** wired through `getSessionStatusCopy()` WAITING branch (`cameraSessionUi.ts` L25–36).

### Critique

**Strengths**
- One instruction at a time — correct Kinect pattern.
- Actionable verbs: “Step back”, “Tilt camera down”, “Move to center”.
- Border state syncs with `guidance.ok`.

**Weaknesses**
- **Text-only for spatial tasks.** “Move to center” has no on-frame target; “Tilt camera down” has no horizon/foot marker.
- **“3–4 m away”** (`captureGuidance.ts` L18) is unrealistic for laptop webcams; will confuse dorm/bedroom users (matches recording environment).
- **No lighting/occlusion guidance** — recordings show face bloom and partial occlusion; guidance never mentions it.
- **Calibration phase** switches to static copy (“Hold still, calibrating”) with progress bar — good — but no visual “stand here” template.
- **`missingJoints` list unused** in compact card — users don’t see “Still need: Ankles/Feet”.

### First-time user clarity: **6/10**
Experienced users can succeed; first-timers must infer camera placement from text alone.

### Future milestone ideas (do not implement now)
| Idea | Purpose |
|------|---------|
| Ghost silhouette / body outline | Spatial target for framing |
| Directional arrows (in/out, left/right, tilt) | Reduce text parsing |
| Alignment region (safe rectangle) | Show acceptable body bbox, not just border color |
| Distance proxy ring at feet | Replace “3–4 m” with “fill 60–80% of frame height” |
| Setup progress stepper (1/4 framing → 2/4 hold still → …) | Onboarding without DBG |
| Lighting meter / “face overexposed” | Trust + tracking quality |
| Haptic/audio tick when `guidance.ok` | Kinect-style positive reinforcement |

---

## 4. PoseScene3D — Brutally Honest

### Does it justify screen space?
**At default size: No.** It duplicates the 2D skeleton with a smaller, harder-to-read 3D view (`annotated-06-setup-3d-default.png`). Angle labels (`pose3d-angle-label`, 10px) are illegible unless expanded.

**Expanded: Only for debugging depth drift.** `annotated-05-3d-expanded-takeover.png` covers the capture stage — unusable during live squat coaching. An NBA performance scientist would **collapse it immediately** or never open it during an athlete’s set. They might expand briefly *between sets* to inspect depth consistency — not during movement.

### Analytical value
- Hip COM trail (yellow line) — potentially useful **if labeled** and tied to depth/valgus narrative.
- Angle arcs on knees/hips — duplicate what Results/Analyst report already provides post-set.
- `DepthSparkline` — plots `hipY` normalized screen Y (`CameraScreen.tsx` L426–430, `DepthSparkline.tsx`) but **has no title, units, or axis** — decorative without training.

### Dead UI
- OrbitControls invite interaction that doesn’t affect analysis.
- “Expand/Collapse” is the only control; no link to “why should I care?”
- Badge “Depth (Z): on-device estimate — not validated” (`PoseScene3D.tsx` L312–314) is honest but **actively tells experts not to trust the panel**.

### Verdict
**Analyst decoration today, not analyst instrument.** Keep behind Analyst toggle (correct), but default-off 3D should stay off; even most analysts won’t run it expanded. Consider replacing default panel with a single labeled depth trace or removing default 3D entirely in favor of post-session 3D replay.

---

## 5. Analyst Mode vs Normal Mode

### Separation model (code)
- `useAnalystMode()` persists to `localStorage` (`kiq-analyst-mode`).
- 3D + DBG only render when `isAnalyst` (`CameraScreen.tsx` L730–757, L760–782).
- DBG draws on canvas via `drawDebugOverlay` — not DOM.

### Normal mode: **Clean enough to ship setup + ACTIVE**
- No DBG panel, no 3D panel.
- Status + reps + finish/cancel — correct coach-level surface.

### Analyst mode: **Powerful but hostile**
- DBG panel: 25–35 monospace lines, color-coded FSM (`drawDebugOverlay.ts` L107–230).
- Overlaps subject’s left side; starts at 22% viewport height to miss status card — still dominates.
- 3D panel overlaps subject’s right side and rep counter.
- **All three toggles visible** (Analyst / 3D / DBG) — good discoverability, bad accidental DBG-on-during-demo.

### Overlap / clipping / guessing issues
| Issue | Detail |
|-------|--------|
| DBG `REPS(disp)` stale | `useEffect` deps `[isLoading, isModelLoading, error, showDebug]` — **missing `repCount`** (`CameraScreen.tsx` L630 vs L566) → analyst sees `REPS(state) 18` / `REPS(disp) 0` while UI shows 18 (`annotated-03-trust-desync.png`) |
| Expanded 3D z-index 15 | Covers action bar partially on some aspect ratios |
| No “Analyst mode on” banner | Persisted preference — user may forget they’re in power UI |
| DBG gate failures invisible in normal mode | User sees rep count increment; rejections only in DBG |
| Finish countdown duplicated | Chip title + `camera-finish-countdown` (`CameraScreen.tsx` L712–717) + status copy |

### Recommendation direction (document only)
- Normal: skeleton optional or subtle; zero monospace telemetry.
- Analyst: move DBG to DOM sidebar (scrollable) or collapsible sections; never canvas-over-video.
- Persist Analyst off by default for new users; show one-time “You’re in Analyst mode” chip.

---

## 6. Remaining MediaPipe Assumptions

| Artifact | Location | Notes |
|----------|----------|-------|
| 33-landmark skeleton overlay | `drawSkeleton.ts`, `PoseScene3D` `JOINT_COUNT = 33` | Product face is still “pose graph demo” |
| `visibility` threshold gating | `captureGuidance.ts`, `drawCalibration.ts` | Correct technically; exposes MP semantics in DBG |
| Normalized image coords (0–1) | `captureGuidance`, debug HIP Y | Expert sees MP coordinate space |
| Hip-centered world coords + ground hack | `PoseScene3D.tsx` L68–71, L120–138 | Visualization-only anchoring — fine if labeled |
| Hardcoded landmark indices in 3D arcs | `PoseScene3D.tsx` L38–43 (`23, 25, 27`…) | MP topology leakage |
| `poseConfidence` monolithic % | DBG L144, `PoseFrame` | Claim-specific confidence not surfaced on camera HUD |
| Tape stores “exactly what MediaPipe produced” | `CameraScreen.tsx` L497–498 | Internal comment; fine |
| Landing “33 landmarks” marketing | `LandingScreen.tsx` | Consumer-facing MP framing |

---

## 7. Trust

### Would this camera experience increase trust in the analysis?

**Partially.** Phase copy, auto-start/auto-finish, and removal of static guides are trust-positive. Skeleton + hidden rejection logic are trust-negative.

### Everything still reducing confidence

**High impact**
1. **Rep rejections invisible in normal mode** — DBG shows `REJECTIONS: 8`, `MISSED: Bottom not held long enough` while user only sees rep count (`annotated-03-trust-desync.png`).
2. **Gate FAIL alongside counted reps** — e.g. `FEET STABLE: FAIL` while `LIVE REPS: 18` — undermines biomechanical rigor if user later enables DBG.
3. **DBG `REPS(disp)` desync** — analysts lose faith in tooling (`CameraScreen.tsx` effect deps).
4. **PoseScene3D “not validated”** badge — correct legally, harmful perceptually during live capture.
5. **Cyan skeleton** — looks like unfinished CV demo, not clinical instrument.

**Medium impact**
6. Disclaimer hidden during ACTIVE (`CameraScreen.tsx` L797) — limits transparency mid-set.
7. No on-camera claim-specific confidence (only in Results posture chips).
8. `3–4 m` setup guidance wrong for typical webcam distance.
9. No feedback when pose confidence drops mid-rep (DBG: `MISSED: Pose confidence dropped` in v1 recording).
10. Analyst mode persists silently — accidental power UI in demos.
11. Unlabeled depth sparkline — implies precision without definition.
12. `missingJoints` not shown in HUD — user doesn’t know *what* is missing.

**Low impact**
13. Finish countdown triplicated in copy.
14. `FRONT_CAMERA_MIRROR = false` — if users expect mirror, orientation feels “wrong” (product choice, not bug).

---

## Ranked UX Issues

### High
| # | Issue |
|---|-------|
| H1 | Skeleton overlay aesthetic = prototype pose demo, not KinematicIQ product |
| H2 | Rejection / miss reasons only in DBG — normal users can’t reconcile rep count |
| H3 | Analyst DBG `REPS(disp)` stale vs state — trust break for internal users |
| H4 | PoseScene3D default panel: low value, high occlusion, “not validated” badge |
| H5 | Expanded 3D covers capture — unusable for live coaching |
| H6 | Gate diagnostics (FAIL) can contradict user-visible rep count |

### Medium
| # | Issue |
|---|-------|
| M1 | Capture guidance text-only; no spatial affordances |
| M2 | `missingJoints` not passed to compact `SessionStatusCard` |
| M3 | `3–4 m` distance guidance mismatched to webcam reality |
| M4 | Analyst mode persists without prominent indicator |
| M5 | Too many simultaneous glass panels (chip + subtitle + disclaimer + actions) |
| M6 | DBG canvas overlay vs DOM — overlaps video, not responsive |
| M7 | Disclaimer removed during ACTIVE |
| M8 | Global nav competes on capture screen |
| M9 | Depth sparkline unlabeled |

### Low
| # | Issue |
|---|-------|
| L1 | Capture border glow heavy |
| L2 | Finish countdown duplicate surfaces |
| L3 | OrbitControls on 3D invite distraction |
| L4 | Landing page “33 landmarks” copy |
| L5 | Mobile: rep counter + 3D panel proximity |

---

## Prototype vs Production-Ready

### Feels production-ready
- Full-bleed camera stage + vignette (`camera-stage`, `camera-stage__vignette`)
- Phase state machine copy (`cameraSessionUi.ts`) — WAITING → CALIBRATING → READY → ACTIVE → AUTO_FINISH
- Auto-start on first descent / auto-finish on stand still — no manual “start set” button
- Kinect-style dynamic guidance + border (major upgrade over static MP guides)
- Analyst gating of 3D/DBG behind toggle
- Error/loading notices with retry (`camera-stage__notice`)
- Rep counter prominence during ACTIVE
- Pose tape capture for eval substrate (invisible to user — good)
- Debug overlay positioned below status card zone (`drawDebugOverlay.ts` L63–64)

### Still feels prototype
- Cyan/white skeleton on video
- Canvas DBG telemetry stack
- PoseScene3D as live picture-in-picture
- Monospace gate dump (`REACHED BTM`, `BILATERAL`, …)
- Unlabeled sparkline
- `REPS(state)` / `REPS(disp)` debug rows
- Magic landmark indices in 3D angle arcs
- “Analyst / 3D / DBG” cryptic toggle labels for non-devs

---

## Future Milestones (document only)

1. **Coach trust layer** — surface last rejection reason in normal mode (“Rep not counted — depth unclear”) without DBG.
2. **Framing UX 2.0** — ghost silhouette + alignment box + distance via body-height ratio.
3. **Skeleton brand pass** — joint style, bone weight, optional “minimal dots” mode for consumers.
4. **PoseScene3D rethink** — post-set replay or collapsible “Depth inspector” with labeled axes; remove live PiP default.
5. **Claim-specific confidence chip** on camera during ACTIVE (hip/knee/feet separately).
6. **Immersive capture** — hide nav; single exit; first-run setup wizard.
7. **Analyst console** — DOM panel, sections (Session / Rep / Gates), copy-to-clipboard trace.
8. **Lighting coach** — exposure warning when nose/shoulder blown out.
9. **Wire `missingJoints` into compact HUD** — one-line “Need: feet in frame”.
10. **Fix DBG stale state** — add `repCount` to effect deps or read ref directly.

---

## Key File References

| Area | Path |
|------|------|
| Camera screen | `web/src/screens/CameraScreen.tsx` |
| Session copy | `web/src/screens/cameraSessionUi.ts` |
| Capture guidance | `web/src/cv/captureGuidance.ts` |
| Calibration check | `web/src/cv/drawCalibration.ts` |
| Debug overlay | `web/src/cv/drawDebugOverlay.ts` |
| Skeleton draw | `web/src/cv/drawSkeleton.ts` |
| 3D scene | `web/src/components/PoseScene3D.tsx` |
| Depth sparkline | `web/src/components/DepthSparkline.tsx` |
| Status card | `web/src/components/SessionStatusCard.tsx` |
| Analyst toggle | `web/src/hooks/useAnalystMode.ts` |
| Camera CSS | `web/src/index.css` (~L994–1169, L1877–1972, L3082–3085) |
| Nav overlay | `web/src/components/AppShell.tsx` |

---

*End of review. No code, ontology, or movement reasoning changes made.*
