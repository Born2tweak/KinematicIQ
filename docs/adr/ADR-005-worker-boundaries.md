# ADR-005 — Worker boundaries: pure analysis is the worker seam; instrument before moving

**Status:** accepted
**Date:** 2026-07-07 (M47)
**Sources:** R06 performance engineering, R08 worker-based compute,
`docs/architecture/PERFORMANCE_AND_WORKER_PLAN.md`
**Enforced by:** module purity the plan relies on — `analysis/`, `session/`,
`metrics/`, `findings/`, `eval/` import no DOM (vitest runs them in plain
Node paths today); `analyzeFramesForProtocol` (M43) as the designated
worker-facing API.

## Context

Heavier protocols (jump, gait) and mid-range mobile devices will pressure
the single-threaded live loop. Moving compute to workers piecemeal — or
moving MediaPipe first because it is the biggest number — risks
destabilizing the camera flow and the tape-replay evidence chain (ADR-004)
for wins nobody has measured.

## Decision

1. **The worker seam is the pure-analysis boundary**, and its API is
   `analyzeFramesForProtocol` / the M39 `ProtocolRuntime` stages —
   structured-clone-safe data in and out. UI, camera acquisition, and
   MediaPipe stay on the main thread until measurements justify otherwise.
2. **No compute moves before instrumentation exists** (Stage 0 timing
   marks). Budgets in the plan are targets; only measured violations
   schedule a migration stage.
3. **Migration follows the staged sequence in the plan** (upload/replay
   batch analysis first — zero latency risk; live tail second; MediaPipe
   last and only with `VideoFrame`/`OffscreenCanvas` support verified per
   browser and COOP/COEP preserved).
4. **Every stage passes the ADR-004 gates before landing:** replay parity
   and the labeled-corpus benchmark (M45, with a saved baseline) — a worker
   boundary must be behaviorally invisible to the pipeline.

## Consequences

- Positive: worker adoption is evidence-driven and reversible per stage;
  the pure-module discipline that makes the pipeline testable is now also
  the performance architecture.
- Negative: main-thread inference remains the ceiling on low-end devices
  until Stage 3, which is deliberately last.
- Constraint on future work: new analysis modules must stay DOM-free and
  structured-clone-friendly (no functions/DOM handles in result shapes), or
  they forfeit the seam. CameraScreen must not grow new per-frame compute —
  new per-frame work belongs in the (future-workerizable) analysis tail.

## References

`docs/architecture/PERFORMANCE_AND_WORKER_PLAN.md`;
`docs/adr/ADR-004-pose-tape-as-audit-artifact.md`;
`docs/implementation/progress/M47-performance-worker-plan.md`.
