# M25 — Capture Readiness v2: Camera Geometry Checks

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` (landed in this milestone)

## What was built

Capture readiness v1 (M4) checked body-part visibility, centering, and distance. M25 adds
five advisory **protocol geometry checks** to `assessCaptureReadiness()`, computed from
landmark geometry only, with thresholds traced to `docs/25_capture_protocol_front_squat.md` §1:

| Check | Heuristic | Statuses |
|---|---|---|
| `front-view` | max(shoulder, hip horizontal spread) ÷ nose→ankle body height; square-on ≈ 0.22–0.3, side-on < 0.08 | pass ≥ 0.14, warn ≥ 0.09, fail below |
| `camera-height` | hip vertical placement (hipY − noseY) ÷ body height ≈ 0.45 for a level hip-height lens | pass 0.36–0.60, warn otherwise — never fails (approximate hint) |
| `body-occupancy` | nose→ankle height vs the protocol's ~70–80% full-body frame-height band | pass 0.5–0.85, warn to the v1 distance band (0.4–0.92), fail beyond |
| `feet-visible` | ankles visible with floor margin (ankle y ≤ 0.96) | fail when invisible, warn when hugging the edge |
| `symmetry-visible` | all four L/R landmark pairs (shoulders, hips, knees, ankles) visible | pass/fail |

New assessment fields (additive — no existing field changed):

- `geometryChecks: GeometryCheck[]` — id, label, status (`pass`/`warn`/`fail`), observation-language reason, capture-scoped fix.
- `protocolCompliance: 'ready' | 'marginal' | 'notReady'` — roll-up (any fail → notReady, any warn → marginal).

Behavior rules, per the roadmap's over-gating risk:

- Geometry **warns never block** `ready` — they are approximate single-RGB hints.
- Only a geometry **fail** (e.g., likely side view) demotes overall `ready` → `marginal`.
- Auto-start thresholds, calibration, phase detection, and rep counting are untouched;
  a valid front-view squat still reaches ACTIVE exactly as before.
- `deriveCaptureGuidance()` remains the single-line HUD instruction, unchanged.

UI wiring:

- `CameraScreen.tsx` renders the geometry rows in the existing pre-capture checklist
  (✓ pass / ! warn / ○ fail) and includes geometry statuses in the readiness memo comparison.
- `cameraSessionUi.ts` surfaces the first hard-failing geometry fix as the WAITING
  `marginal` subtitle (e.g., "Turn to face the camera square-on…"), falling back to the
  previous generic copy.
- `index.css` gains `capture-readiness__item--warn` (amber mark).

## Files changed

- Modified: `web/src/cv/captureReadiness.ts` (v1 → v2, +~250 lines, pure/dependency-free preserved)
- Modified: `web/src/cv/captureReadiness.test.ts` (+6 geometry tests, geometry assertions on 3 existing tests)
- Modified: `web/src/screens/CameraScreen.tsx` (checklist rendering, memo comparison, geometryFix pass-through)
- Modified: `web/src/screens/cameraSessionUi.ts` (optional `geometryFix` option)
- Created: `web/src/screens/cameraSessionUi.test.ts` (4 copy tests — first tests for this helper)
- Modified: `web/src/index.css` (warn state styling)
- Created: `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` (roadmap landed as program source of truth; M25 marked complete)
- Created: this progress note

## Quality gates

| Gate | Result |
|---|---|
| `npm run build` | Pass (`tsc && vite build`; pre-existing PoseScene3D >500 kB chunk warning unchanged) |
| `npm test` | 51 files, **291 passed, 0 failed** (was 277 passed + 4 real-tape skips; the real tape exists locally so those 4 run here, +10 new tests) |
| `npm run test:coverage` | Pass — all files 86.96% stmts / 85.27% branch / 93.48% funcs; `captureReadiness.ts` 100% stmts |

## Acceptance criteria check

- ✅ Readiness v2 returns actionable geometry reasons (observation language + concrete fixes, deduped into `reasons`/`fixes`).
- ✅ Capture guidance works for all existing tests (`captureGuidance.test.ts` untouched and green; guidance logic unchanged).
- ✅ Squat recording flow still reaches ACTIVE on valid framing (auto-start path untouched; readiness is informational only).
- ✅ No calibrated-camera-pose claims — copy is capture-scoped, the camera-height check is an explicit hint that never hard-fails.

## Fitness delta

- Files: 6 modified, 3 created, 0 deleted.
- Diff: ~+420 lines (mostly `captureReadiness.ts` and tests); clarity improved — thresholds are named constants with provenance comments instead of implicit assumptions.
- Tests: +10 (6 geometry unit tests, 4 view-model copy tests); `cameraSessionUi.ts` gains its first direct coverage.
- Coverage: thresholds still pass; `cv/` folder statement coverage rose with `captureReadiness.ts` at 100%.
- Bundle: no dependency changes; CSS +8 lines; pre-existing chunk warning unchanged.
- Type health: no new casts or `any`; new exported domain types (`GeometryCheck`, `GeometryCheckId`, `GeometryCheckStatus`).
- Complexity budget: `captureReadiness.ts` is now ~430 lines (within the ≤500 preferred budget) with small single-purpose check functions.

## Chief Architect review

1. **What the roadmap had wrong/incomplete:** Nothing material for M25 itself, but the roadmap had not yet landed in the repo — `docs/implementation/` still pointed to `NEXT_20_MILESTONES.md` as the freshest plan. Landed it here so the single-source-of-truth rule is actually true.
2. **Milestones to split/merge/reorder:** None. M26 (per-frame landmark quality) remains the correct next step; the geometry checks would benefit from per-frame quality lineage, confirming M26's ordering.
3. **Simpler architecture discovered:** Yes, mildly — geometry checks composed as five small pure functions over a shared `bodyHeight` scalar, no new state machine needed. The roadmap's "protocol-compliance state" reduced to a roll-up over check statuses.
4. **Assumptions validated:** Landmark-only geometry (spread ratios, vertical placement) can distinguish front vs side views and framing violations on synthetic fixtures without touching MediaPipe.
5. **Assumptions invalidated:** None yet — but the thresholds are provisional and untested against real athlete tapes (the protocol doc itself marks its values provisional pending pilot recordings).
6. **Same design today?** Yes. The additive-fields approach preserved every existing consumer and test unchanged.
7. **New risks:** Threshold miscalibration on real footage could nag users with false warns (mitigated: warns never block; only very-low spread hard-fails). The camera-height heuristic direction is deliberately not claimed (single symmetric fix).
8. **Risks now less important:** "Camera geometry not encoded" row in the gap matrix is closed at the readiness layer.
9. **Debt introduced:** Geometry thresholds live in `captureReadiness.ts` rather than in the squat protocol definition — when M39-M43 build the protocol runtime, protocol-specific capture bands should move into the protocol contract.
10. **Debt eliminated:** `cameraSessionUi.ts` was untested; now covered.
11. **Research questions more important:** Whether ±15° yaw is detectable reliably from spread ratios on real tapes (protocol doc §6 item 2) — M44-M45 benchmark work should include geometry-check agreement.
12. **Less important:** None changed.
13. **Validation/claims posture:** Unchanged — geometry checks are capture observations, no new movement-quality claims.
14. **Dependency graph/critical path:** Unchanged. M25 now unblocks its dependents (M28-M30 capture readiness, M51 workflow) as planned; next milestone per the critical path is **M26**.
