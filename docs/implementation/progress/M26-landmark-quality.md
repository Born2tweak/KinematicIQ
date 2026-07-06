# M26 — Per-Frame Landmark Quality Scoring

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

Confidence now has per-frame evidence lineage. Every frame the analysis
pipeline consumes gets a `LandmarkQualityFrame` measuring what the tracker
could actually vouch for:

| Field | Meaning |
|---|---|
| `visibilityCoverage` | Fraction of all 33 landmarks at/above the visibility threshold |
| `criticalCoverage` | Fraction of the 8 critical landmarks at/above threshold |
| `missingCritical` | Coach-readable names of critical landmarks below threshold |
| `maxCriticalSpeed` | Fastest critical-landmark motion vs the previous comparable frame (normalized units/s); null on first frame or across gaps > 500 ms |
| `implausibleJump` | Motion exceeded 4 units/s — likely a tracking glitch, not movement |

Design decisions:

- **Strictly observational.** Quality never gates, filters, or feeds the FSM;
  no metric or finding becomes stronger because quality exists (M26 acceptance).
- **The interface lives in `cv/types.ts`** next to `PoseFrame` (avoids even a
  type-only import cycle); compute logic lives in the new pure module
  `cv/landmarkQuality.ts` (`assessLandmarkQuality`, `assessSequenceQuality`,
  `summarizeLandmarkQuality`).
- **`PoseFrame.quality` is additive and optional.** `runPipelineOnFrames`
  attaches it to a copy of each consumed frame (inputs are never mutated) and
  returns the stream as `landmarkQuality`. Raw substrate frames — pose tapes
  and `rawFrames` — deliberately stay quality-free: quality is derived, so
  persisting it would bloat the audit artifact with redundant data. Old tapes
  deserialize unchanged.
- **No judging across gaps.** Frames more than 500 ms apart report null speed
  rather than inventing motion (M26 "do not silently fill long gaps").
- **Plausibility threshold (4 normalized units/s)** is deliberately loose:
  squat-speed critical landmarks stay well under ~1.5 units/s; tracking
  glitches teleport landmarks at ≥ ~5 units/s. Only landmarks visible in both
  frames count — coordinates of an invisible landmark are not evidence.

Path coverage:

- **Upload:** `runVideoAnalysis` returns `landmarkQuality` in `VideoAnalysisResult`.
- **Replay/eval:** `replayTape` returns the stream (`ReplayTapeResult.landmarkQuality`);
  batch eval rows (`TapeEvalRow.landmarkQuality`) carry a serializable
  `LandmarkQualitySummary` and the report line appends `critCov=…% [jumps=n]`.
- **Live:** live sessions derive quality from the session pose tape at results
  time — the tape is the live path's frame record, so the Expert tab's new
  **Capture quality** panel (`components/report/CaptureQualityPanel.tsx`,
  rendered inside the pose-tape section) covers live and upload uniformly
  without touching the stored `SessionResult` schema (deferred to M40/M46 by
  design — `buildSessionResult` was inspect-only for this milestone).
- Panel copy is neutral Expert-tab disclosure ("evidence behind confidence,
  not a movement read"), not a scare warning.

## Files changed

- Created: `web/src/cv/landmarkQuality.ts`, `web/src/cv/landmarkQuality.test.ts` (11 tests)
- Created: `web/src/components/report/CaptureQualityPanel.tsx`
- Modified: `web/src/cv/types.ts` (interface + optional `PoseFrame.quality`)
- Modified: `web/src/analysis/videoAnalyzer.ts` (+ test), `web/src/eval/replayHarness.ts`,
  `web/src/eval/batchEval.ts` (+ test), `web/src/screens/ResultsScreen.tsx`

## Quality gates

| Gate | Result |
|---|---|
| `npm run build` | Pass (main chunk 476.21 kB, +3.5 kB; pre-existing PoseScene3D warning unchanged) |
| `npm test` | 52 files, **304 passed, 0 failed** (+13: 11 quality unit tests, 1 pipeline test, 1 batch-eval test) |
| `npm run test:coverage` | Pass — 87.29% stmts overall (up from 86.96%) |

## Acceptance criteria check

- ✅ Existing tests behaviorally unchanged (all 291 prior tests pass untouched;
  the tape regression suite and real-tape parity tests lock replay outputs).
- ✅ Quality fields explain missing/low-confidence evidence: named missing
  critical landmarks, coverage means, and glitch counts in eval rows and the
  Expert panel.
- ✅ No metric or finding becomes stronger — quality is write-only output;
  nothing in `analysis/`, `findings/`, `scoring/`, or `session/` reads it.
- ✅ Old tapes need no quality field (optional, additive; deserialization untouched).
- ✅ Long gaps are never silently filled (speed is null across >500 ms gaps).

## Fitness delta

- Files: 3 created, 6 modified, 0 deleted; diff ≈ +560 lines.
- Tests: +13; `cv/` statement coverage rose (landmarkQuality.ts fully covered).
- Bundle: +3.5 kB main chunk (quality module + Expert panel); no new dependencies.
- Type health: no casts or `any`; new exported contracts (`LandmarkQualityFrame`, `LandmarkQualitySummary`).
- Complexity: all new functions well under budget; `ResultsScreen.tsx` grew by
  only 2 lines because the panel is its own component.

## Chief Architect review

1. **What the roadmap had wrong/incomplete:** The roadmap's step "populate
   quality in live, upload, and replay paths" implied instrumenting the live
   per-frame loop in `CameraScreen`. The live loop has no consumer for quality
   during capture; deriving it from the session tape at results time gives the
   same evidence without live-path cost or CameraScreen growth. Recorded as the
   intended interpretation.
2. **Milestones to split/merge/reorder:** None. M27 (benchmark-gated filtering)
   can now use quality aggregates in its comparisons; M44-M45 gain the
   serialized summary per eval row as planned.
3. **Simpler architecture discovered:** Yes — quality as a derived stream
   returned by `runPipelineOnFrames`, not a stored artifact. No storage, no
   schema version, fully reproducible from tapes.
4. **Assumptions validated:** Per-frame quality is computable pure and cheap
   (O(33)/frame) with no pipeline behavior change (rep results bit-identical in
   tests).
5. **Assumptions invalidated:** None; the 4 units/s plausibility threshold is
   untested against real glitchy footage and marked provisional.
6. **Same design today?** Yes.
7. **New risks:** Threshold miscalibration could under/over-count jumps on real
   tapes — harmless today (observational only) but must be benchmarked in
   M44-M45 before quality feeds any confidence computation.
8. **Risks less important:** "Metric confidence remains too generic" (risk
   register) now has its evidence substrate; the remaining work is lineage
   (M48), not data.
9. **Debt introduced:** Quality is computed on the frames the FSM consumes
   (post-filter on upload/replay), which slightly understates raw jitter;
   acceptable because visibility is filter-invariant and the `applied` field
   records filtering. Revisit if M27 needs raw-signal quality.
10. **Debt eliminated:** None removed, none added structurally.
11. **Research questions more important:** What real-footage distribution of
    `maxCriticalSpeed` looks like (sets the evidence-based threshold), for M44-M45.
12. **Less important:** None changed.
13. **Validation/claims posture:** Unchanged — quality is disclosed as capture
    evidence, never as a movement claim.
14. **Dependency graph/critical path:** Unchanged; M26 unblocks M27 and
    strengthens M44-M49 as planned. Next per the critical path: **M27**
    (benchmark-gated live filtering) or the M32-M34 Phase A remainder —
    M27's own gate requires benchmark evidence from real tapes, so if no new
    filter candidate is proposed, M32 (MDC-aware trend language) is the next
    actionable milestone.
