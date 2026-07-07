# M47 — Performance and Worker Architecture Plan

**Date:** 2026-07-07
**Status:** Complete (docs-only by design)
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was produced

**`docs/architecture/PERFORMANCE_AND_WORKER_PLAN.md`** (new) — R06
performance engineering, R08 worker compute:

- Current main-thread responsibility table (camera loop, MediaPipe
  inference, filtering, FSMs, overlay draw, upload two-pass, React).
- Frame-budget targets at 30 fps (33 ms total: ≤20 ms inference, ≤3 ms
  analysis tail, ≤5 ms draw, ≥3 ms headroom) — explicitly labeled targets
  pending Stage 0 instrumentation, not measurements (Article III: no
  claimed numbers without evidence).
- Worker-safe module inventory: the M39–M43 pure layers (`analysis/`,
  `session/`, `metrics/`, `findings/`, `eval/`, `analyzeFramesForProtocol`
  as the worker-facing API) vs the DOM-bound remainder (poseEngine, draw*,
  screens).
- Staged migration: Stage 0 instrument → Stage 1 upload/replay batch
  analysis to worker (best ROI, zero latency risk) → Stage 2 live analysis
  tail (only if measured over budget) → Stage 3 MediaPipe-in-worker
  (VideoFrame/OffscreenCanvas + Safari support matrix + ADR-004 parity
  gate) → Stage 4 OffscreenCanvas overlay. Every stage gates on camera e2e,
  replay parity, and the M45 baseline benchmark.
- Load-bearing browser constraints: COOP/COEP (`vite.config.ts` +
  production host must mirror), tasks-vision asset URLs in workers,
  monotonic-timestamp preservation across a worker boundary
  (drop-newest backpressure, never reorder).

**`docs/adr/ADR-005-worker-boundaries.md`** (new; indexed in the ADR
README) — the decisions: pure analysis is the worker seam with
`analyzeFramesForProtocol` as its API; nothing moves before Stage 0
instrumentation exists; migration follows the staged sequence; every stage
passes the ADR-004 replay/benchmark gates. Consequence rule for future
work: analysis modules stay DOM-free and structured-clone-friendly;
CameraScreen grows no new per-frame compute.

**No worker code landed** (roadmap "do not do" — MediaPipe stays on the
main thread).

## Quality gates

Docs-only; gates run per roadmap on the current tree (which also carries
another agent's in-flight CaptureContext provenance changes, uncommitted —
not part of this milestone): `npm run build` clean, `npm test` 65 files /
429 tests passing.
