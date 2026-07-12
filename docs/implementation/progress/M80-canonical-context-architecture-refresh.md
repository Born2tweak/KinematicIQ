# M80 — Canonical Context and Architecture Refresh

**Status:** complete
**Date:** 2026-07-12
**Change class:** documentation/governance only

## Scope

Refreshed `docs/00_context_pack.md` and `docs/07_architecture.md` against the
implemented post-M78 repository and the M79 Phase 2 decisions. No production
code, runtime behavior, protocol availability, persistence, or thresholds were
changed.

## Decisions captured

- `ProtocolRuntime` is the canonical universal extension point; Phase 2 will not
  create a parallel engine.
- Squat remains the only available protocol. Planned definitions, datasets, and
  adapters fail closed and do not confer availability.
- Phase 2 adds no persistence. Existing explicit opt-in IndexedDB history is
  retained as a compatibility surface pending a separate product decision.
- “Client-side” means no application backend or cloud inference; MediaPipe
  runtime/model assets may still be browser-fetched.
- Physical iPhone Safari/VoiceOver and Windows NVDA evidence remains pending
  human execution; automated emulation is not represented as device proof.

## Evidence refreshed

- M78 closeout baseline: 80 unit files / 533 tests.
- M78 coverage baseline: 86.29% statements, 81.62% branches, 92.14% functions,
  and 87.58% lines.
- M76 support baseline: 56 applicable tests across the four-project matrix,
  plus a separate Chromium fake-camera acquisition pass.
- M75 zero-vulnerability audit and M78 checksum-gated LLM-FMS ontology adapter.

## Verification

- `npm run build`: passed (`vite v8.1.4`, 713 modules transformed). Vite retained
  its pre-existing large-chunk advisory; the build exited 0.
- `npm test -- --run --reporter=dot`: passed, 80 files / 533 tests.
- `git diff --check`: passed; Git emitted line-ending conversion warnings only.
