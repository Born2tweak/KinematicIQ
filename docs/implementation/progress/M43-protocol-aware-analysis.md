# M43 — Protocol-Aware Analysis Entry Point

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/analysis/analyzeProtocol.ts`** (new) — the one high-level API for
live/upload/replay analysis (R08 data flow, R11 protocol workflow):

- `analyzeFramesForProtocol(protocolId, frames, options)` →
  `{ segmentation, result }`. Resolves the protocol's M39 runtime, runs its
  `segmentFrames`, assembles the session result **under the selected id**.
- Planned protocols throw `NotImplementedError` via `getProtocolRuntime`
  **before any frame is touched**; unknown ids throw the registry error.
  Unvalidated protocols cannot be reached through this API (roadmap "do not
  do": nothing unvalidated enabled by default).

**Protocol id threading (roadmap step 4):**

- `ProtocolPicker` passes `{ state: { protocolId } }` when navigating to
  `/camera` (only available protocols are clickable — unchanged).
- `CameraScreen` reads the id from route state (squat default), holds it in
  a ref for the finish callback, and passes it to `buildSessionResult`.
- `UploadScreen` reads the id from route state (squat default) and passes it
  through its analyze callback (dependency array updated).

**`buildSessionResult` fix (roadmap step "avoid defaulting to active"):**
provenance now stamps `getProtocol(protocolId)`'s observation protocol
instead of unconditionally using `getActiveProtocol()` — an explicit id is
never silently overridden. Squat default parameter unchanged.

## Tests (`analyzeProtocol.test.ts`, 8 tests)

- Squat path unchanged: `analyzeFramesForProtocol('squat', frames)` equals
  the direct `runPipelineOnFrames` + `buildSessionResult` composition on the
  clean-squat fixture (acceptance criterion), with reps present.
- `result.protocolId` equals the selected id (roadmap step 5); metric-result
  provenance carries the protocol's observation protocol.
- Each planned protocol (hipHinge/jump/sprint) blocks with
  `NotImplementedError`; unknown ids throw.
- Explicit-id builder test.

## Quality gates

- `npm run build` — clean.
- `npm test` — 62 files / 401 tests passing (393 + 8 new).
- `npm run test:e2e:camera` — 3/3 passing (Camera + Upload screens touched;
  default-squat live flow confirmed behavior-preserving).

## Traceability

`RESEARCH_TO_CODE_TRACEABILITY.md` "Protocol-aware analysis entry point" row
added as implemented (was the M43 `planned` gap under protocol expansion).
The M28–M30 protocol milestones are now unblocked from the runtime side
(M39–M43 complete); they still require their own validation evidence.
