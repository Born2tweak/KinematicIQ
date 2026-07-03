# Execution Roadmap — Posture-First Reposition + Movement Expansion

**Status:** Canonical, condensed for agents. Full strategy: `product-direction.md`. Written 2026-07-02.
**Directive:** finish polishing the UI first, then expand beyond squats (hip hinge, jumping, sprinting).

---

## Phase 0 — Doc & strategy truth alignment ✅ (2026-07-02)

Fixed stale docs (`08_ai_rules`, `07_architecture`, `06_prd`, `video_upload_plan`, `09_build_plan` annotated; context pack regenerated). Authored `docs/strategy/*`. **Don't** rewrite the research-grade docs (`10_`, `11_`) — they're fine.

## Phase 1 — UI polish & reposition (squat, demo backbone)

Bring Camera, Upload, Results up to the Landing page bar; reframe content posture-first. Milestones:

- **M1.0 System fixes:** per-route layout in `AppShell.tsx` (camera full-bleed; upload/results wider container); kill inline `style={{}}` layout blocks; shared glass HUD/stat-pill/report CSS primitives.
- **M1.1 Camera immersive stage** *(headline fix)*: full-viewport `100dvh` feed, `object-fit: cover`, skeleton overlay, **no dashed border/letterbox**; floating glass HUD (status pill + calibration top-left, rep counter top-right, action bar bottom-center, analyst toggles corner, center countdown); "Reps so far" moves to Results.
- **M1.2 Upload cinematic redesign:** real drag-and-drop hero zone; framed preview + stat pills; analyzing state = landing-style pipeline steps lighting up.
- **M1.3 Results report + Posture Profile:** `analysis/posture/postureConcepts.ts` derives P1 concepts from `SetMetricsSummary` → `components/PostureProfile.tsx` chips (✓/⚠ + confidence) as report hero above the score ring; `components/RepTimeline.tsx` replaces text rep rows.
- **M1.4 Analyst mode:** persisted `useAnalystMode` hook; normal = concepts + score + cues (no raw angles); analyst = angles, `PoseScene3D`, `DepthSparkline`, rep detail.
- **M1.5 Copy reposition:** movement-agnostic strings; landing repositioned to movement intelligence (performance, not injury); `DisclaimerBanner` on camera; `safety-claims.md` checklist on all changed strings.

**Acceptance:** camera is the centerpiece (full-bleed + HUD); upload/results match landing quality; results lead with posture concepts; no raw angles in normal mode; no stray "squat" copy; build + tests pass; verified in browser preview. **Don't** touch phase/rep detection logic or remove the numeric score.

## Phase 2 — Posture interpretation depth (consume 3D)

- **M2.1** Wire `worldLandmarks` (`cv/pose3d.ts`) into new `analysis/posture/postureFrame.ts`: hinge-vs-squat ratio, trunk-angle-through-rep stability.
- **M2.2** `analysis/posture/smoothness.ts`: normalized jerk of hip/COM per rep.
- **M2.3** Within-set deviation flag (most-deviant rep) + `baseline` seam in `SessionResult`.

**Acceptance:** new concepts render only at adequate confidence; unit tests on synthetic frames; graceful degradation — 2D remains the floor. **Don't** claim force/power/torque or gate results on 3D.

## Phase 3 — MovementProfile abstraction (behavior-preserving)

`analysis/movement/types.ts` + `profiles/squat.ts`; parameterize `phaseDetector`, `repCounter`, `autoStart`, `autoFinish`, `setActivation`, `scoringConfig`, `feedbackReasoning`; cyclic/ballistic/gait engine seam. **Acceptance:** squat scores identically; all existing tests green. Design: `movement-expansion.md`.

## Phase 4 — Hip hinge (first expansion)

`profiles/hipHinge.ts`; movement selection UI on camera + upload; hinge-specific concepts/cues. **Acceptance:** a hinge clip produces hinge-appropriate output, not squat cues.

## Phase 5 — Jump/landing (ballistic) + sprint (gait), time-boxed

Jump: takeoff/landing, absorption timing, stiff-vs-absorbed (performance framing). Sprint: stride segmentation, arm clearance, trunk through stride. **Fallback:** ship jump only.

## Phase 6 — Explicitly NOT now

Backend, longitudinal deviation DB, context integration (workload/sleep), team dashboards, exports, auth, multi-camera, instrumented validation studies. Named so they don't creep in.

---

## Verification (every phase)

- `npm --prefix web run test` (Vitest) and `npm --prefix web run build`.
- Browser-preview walkthrough of changed screens.
- Copy audit against `safety-claims.md` checklist.

## Demo path (Magic-ready)

Phase 1 on squat (immersive camera + report-grade results + posture profile) → Phase 2 depth → Phase 4 hip hinge as the second movement. That demonstrates: polished coach-facing surface, posture metrics, movement-specific reads, honest confidence, deviation framing.
