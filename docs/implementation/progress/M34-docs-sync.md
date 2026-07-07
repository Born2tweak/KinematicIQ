# M34 — Docs, Doctrine, and Architecture Sync for M12–M33

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was synced

**`docs/00_context_pack.md`** — full hand rewrite. The old file was
auto-generated 2026-07-02 against the pre-platform milestone model (old
M1–M18) and stated "no persistence", "squat only", and "no backend/auth/
storage" as unqualified rules. Now: current routes, module map, program
status table (M00–M26 + M31–M33 done; M27 and M28–M30 blocked with stated
gates), key contracts, doctrine pointers, a "do not refactor yet" table
(roadmap step 4), and agent rules.

**`scripts/generate-context-pack.ps1`** — deprecated with a guard: it now
prints a deprecation error and exits 1 before writing, because its template
hardcodes the stale milestone model and would overwrite the hand-maintained
pack (roadmap risk: "generated context docs can overwrite hand edits").

**`README.md`** — status updated through M33; layer table gains `camera/`
and `export/`; repository layout gains both; e2e command documented; status
section now points at the master roadmap as program source of truth.

**`docs/07_architecture.md`** — revision header updated to M34/M33 state;
folder structure gains `export/` and `camera/`; §5 stale `.js` module specs
(`landmarkExtractor.js`, `smoother.js`) replaced with the real
`landmarkFilter.ts` / `landmarkQuality.ts` / `captureReadiness.ts` and their
evidence gates; §7 scoring **no longer describes `totalScore`/`band`** —
per-component evidence only, composite prohibition stated; §11 boundary rules
renamed `pose/` → `cv/`; §13 "what belongs where" table rewritten with
current TypeScript paths including core/protocols/metrics/findings/session/
storage/export/camera; §14 "Database or ORM — no persistence needed" now
correctly qualifies local-only opt-in IndexedDB.

**`docs/implementation/NEXT_20_MILESTONES.md`** — superseded banner added;
execution status reconciled: M15–M26 + M31–M33 done (56 files / 353 tests at
M33), M27 and M28–M30 carried into the master roadmap with their blocking
gates.

**`docs/doctrine/deferred-scope.md`** — three new ledger rows: PDF/cloud
report sharing (M33 decision), build-time app-version injection (gated on
M46), live filtering stack upgrade (gated on the M27 benchmark).

**Research docs untouched** — `docs/research/` remains immutable per the
roadmap's "do not do".

## Acceptance criteria check

- README and architecture doc match live code: module lists verified against
  `web/src/` (`ls` of `cv/`, `camera/`, `export/` this session).
- No unqualified "no persistence" or "squat only" statement remains in the
  synced docs: context pack rewritten, architecture §10/§14 qualified,
  README already framed persistence as opt-in local.

## Quality gates

Docs-only change; gates run anyway per roadmap:

- `npm run build` — clean.
- `npm test` — 56 files, 353 tests passing.
