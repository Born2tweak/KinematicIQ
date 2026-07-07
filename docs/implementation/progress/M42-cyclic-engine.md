# M42 — Shared Cyclic Segmentation Engine

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/analysis/cyclic/cyclicEngine.ts`** (new) — the shared phase-FSM +
rep-counting loop for cyclic movements (R01 phase-aware models, R02 motion
segmentation, R08 plugin contracts):

- `CyclicEngineConfig` = `{ phase: CyclicPhaseConfig, repGates:
  RepGateConfig }` — reusing the existing config types exactly (roadmap
  step 1), no new tuning surface.
- `runCyclicPipelineOnFrames(frames, config, initial)` — the loop body
  **moved verbatim** from `videoAnalyzer.runPipelineOnFrames`, with the two
  FSM state constructors parameterized by the config. M26 quality scoring,
  posture stream, and frame trace ride along unchanged.
- `validateCyclicConfig` — structural sanity checks for new protocols
  (hysteresis ordering, EMA range, debounce ≥ 1, duration window, hip
  descent ≥ 0). Deliberately never judges tuning quality — that is a
  benchmark question (R05), not a type question.
- **The engine imports no squat profile or squat config** — the config
  object is the only coupling surface (acceptance criterion).

**`web/src/analysis/videoAnalyzer.ts`** — `runPipelineOnFrames` is now a
one-line squat-configured delegate (`SQUAT_CYCLIC_CONFIG` = the same
`SQUAT_PHASE_CONFIG` + `SQUAT_REP_GATES` objects as before; **no thresholds
retuned**, roadmap "do not do"). Signature and export unchanged — every
existing import (replay harness, tape regression, camera loop sim, runtime
adapter) is untouched (roadmap step 5).

## Tests

New `cyclic/cyclicEngine.test.ts` (5 tests):

- Config validation: squat config passes; a deliberately broken config
  reports all five violation classes.
- Golden parity: engine-with-squat-config ≡ `runPipelineOnFrames` on the
  clean-squat fixture; golden lock on the fixture segmentation (3 reps,
  numbered 1–3, per-frame streams full-length) so rep-count drift fails
  loudly (roadmap risk).
- Standalone-config test: a cyclic config with inlined values (not derived
  from the squat profile) validates and runs — proving a new cyclic
  protocol needs no squat imports.

Regression safety net, all green and unmodified: `squatRegressions.test.ts`,
`eval/` tape-regression + replay-parity suites (the labeled-tape discipline
from ADR-004), full suite 61 files / 393 tests.

## Quality gates

- `npm run build` — clean.
- `npm test` — 61 files / 393 tests passing (388 + 5 new).
- `npm run test:coverage` — passing with thresholds.

## Traceability

`RESEARCH_TO_CODE_TRACEABILITY.md` row "Shared cyclic segmentation engine"
updated `planned` → `implemented` with file references.
