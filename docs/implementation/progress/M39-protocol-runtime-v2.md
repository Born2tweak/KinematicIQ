# M39 — Protocol Runtime Contract v2

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/protocols/runtime.ts`** (new) — the pluggable runtime contract
(R01 §6.3 movement-agnostic/-specific split, R08 §3 plugin contracts):

- `ProtocolRuntime` with the five stages from the roadmap: `segmentFrames`
  (frames → reps + per-frame streams), `collectMetrics`, `deriveFindings`
  (abstain-aware), `assessQuality`, `buildReportMetadata` (protocol label +
  verdict-aware headline). Input/output types reuse the existing shapes —
  `SegmentationOutput` is literally `ReturnType<typeof runPipelineOnFrames>`,
  so the contract cannot drift from the pipeline.
- `SQUAT_RUNTIME` — pure delegation: every method is a one-line call into
  the module the pipeline already uses (`runPipelineOnFrames`,
  `collectSetMetrics`, `deriveCoaching`, `assessSetQuality`,
  `buildResultsSummary`). No thresholds or logic live in the adapter, so
  outputs are identical by construction (and parity-tested).
- `getProtocolRuntime(id)` — squat returns the runtime; planned protocols
  (hipHinge/jump/sprint) throw `NotImplementedError` (same safety rule as
  `getProtocolProfile`); unregistered ids throw via `getProtocol`. Lives in
  `runtime.ts`, not `registry.ts`, to avoid an import cycle through
  `session/buildSessionResult`.

Deliberately NOT done (roadmap steps 3/5, "do not do"): no call sites were
migrated — CameraScreen/videoAnalyzer/replayHarness still consume the
profile/pipeline directly until M43; `MovementProfile` compatibility is
untouched (`Protocol.profile` remains, with a doc note).

Pointer edits only in `protocols/types.ts` (type re-export + compat note),
`protocols/registry.ts` (where-the-runtime-lives note), `core/protocol.ts`
(contract cross-reference; module stays types-only).

## Tests (`protocols/runtime.test.ts`, 10 tests)

- Registry: squat resolves; each planned protocol throws
  `NotImplementedError`; unknown id throws.
- Adapter parity on the deterministic clean-squat fixture tape (the
  autonomous-camera fixture, reps > 0 asserted so parity is meaningful):
  `segmentFrames` ≡ `runPipelineOnFrames`, `assessQuality` ≡
  `assessSetQuality`, `collectMetrics` ≡ `collectSetMetrics`.
- `buildReportMetadata` carries the definition label and exactly
  `buildResultsSummary(result)`.
- `deriveFindings` fully abstains on an invalid verdict (ADR-002 preserved
  through the new contract).

## Quality gates

- `npm run build` — clean.
- `npm test` — 58 files / 367 tests passing (357 + 10 new).
- No UI behavior changes (acceptance criterion — no screen/component files
  touched).

## Traceability

`RESEARCH_TO_CODE_TRACEABILITY.md` row "Shared cyclic segmentation engine"
remains `planned` (M42); this milestone adds the contract layer only.
