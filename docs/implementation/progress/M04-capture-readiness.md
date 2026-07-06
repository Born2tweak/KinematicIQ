# M04 — Capture Readiness v1

Date: 2026-07-05. Turn live capture guidance into a scored readiness model + a pre-capture checklist UX, without touching autoStart thresholds.

## What changed

- **`web/src/cv/captureReadiness.ts`** (new) — `assessCaptureReadiness(frame)` → `CaptureReadinessAssessment` with `state: ready | marginal | notReady`, a per-item `checklist` (head/shoulders/hips/knees/feet/centered/distance), `reasons`, and `fixes`. Mirrors the `SetQualityAssessment` shape so pre-capture speaks the same verdict language as the post-capture report. Builds ON `deriveCaptureGuidance` (reuses it for the single HUD instruction) rather than rewriting it. Pure/deterministic. Sources: MD #6 capture quality, MD #11 §4.
- **`web/src/cv/captureReadiness.test.ts`** (new) — 4 tests against synthetic landmark fixtures: notReady with empty frame, ready for well-framed pose, marginal when off-center (whole body visible), notReady when feet out of frame.
- **`web/src/screens/cameraSessionUi.ts`** — `getSessionStatusCopy` accepts optional `readinessState`; WAITING subtitle becomes "Almost there — one small adjustment…" when `marginal`. In-set HUD copy unchanged.
- **`web/src/screens/CameraScreen.tsx`** — setup loop now calls `assessCaptureReadiness` (its `.guidance` drives the existing border + status, so guidance behavior is preserved); adds `readiness` state (change-guarded to avoid re-render churn) and renders a pre-capture checklist panel during WAITING only.
- **`web/src/index.css`** — styles for `.capture-readiness` checklist (state-colored left border, ✓/○ marks), consistent with existing camera HUD tokens; no visual rebrand.

## Files touched

- `web/src/cv/captureReadiness.ts` (new), `web/src/cv/captureReadiness.test.ts` (new)
- `web/src/screens/cameraSessionUi.ts` (modified)
- `web/src/screens/CameraScreen.tsx` (modified)
- `web/src/index.css` (modified)

## Decisions / conflicts

- **autoStart thresholds untouched** (explicit constraint). Readiness is advisory UX only; it never gates the FSM's READY→ACTIVE transition, matching the "protocol compliance feeds capture-quality evidence rather than hard-blocking" principle (docs/24 §3.2).
- Removed the now-unused direct `deriveCaptureGuidance` import from CameraScreen (readiness returns the guidance); caught by the tsc gate and fixed before commit.
- Copy uses observation language only ("not yet", "almost ready") — no fear/quality framing.
- No spec conflicts.

## Tests

Before: 36 files / 202 tests. After: **37 files / 206 tests**, all green. `npm run build` clean.
