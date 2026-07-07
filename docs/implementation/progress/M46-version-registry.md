# M46 — Model and Algorithm Version Registry

**Date:** 2026-07-07
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/core/versioning.ts`** (new, dependency-free) — THE single source
for behavioral version identifiers (R05 version tracking, R08 artifact
versioning, R03 metric provenance): `APP_VERSION` (test-pinned to
`web/package.json`), `POSE_MODEL_VERSION`, `ANALYSIS_ALGORITHM_VERSION`,
`CLAIM_POLICY_VERSION`, `FILTER_VARIANTS`, and a `VERSIONS` snapshot.
Schema-version constants for stored shapes deliberately stay with their
readers (a reader must own the version it checks); the registry owns the
behavioral identifiers.

Wiring — every producer now reads the registry:

- `core/provenance.ts` — `makeProvenance` defaults `modelVersion`,
  `appVersion`, AND `algorithmVersion` from the registry (previously app/
  algorithm were usually absent). Explicit caller values still win.
  `DEFAULT_MODEL_VERSION` kept as a re-export for existing imports.
- `session/sessionArtifact.ts` — its interim local constant replaced by a
  registry import + re-export (the M40 note's "until M46" is now resolved;
  `storage/sessionStore` continues to work through the re-export).
- `export/sessionReport.ts` — local `APP_VERSION`/`CLAIM_POLICY_VERSION`
  constants replaced by registry re-exports; the M33 export tests pass
  unchanged.
- `eval/poseTape.ts` — `createTape` additively stamps `appVersion` +
  `algorithmVersion` (new optional meta field) with caller values winning.
  **Old tapes are never required to have the new fields** (roadmap "do not
  do"): deserialize/serialize round-trips a pre-M46 tape byte-equal, and a
  test proves it.

## Tests (`core/versioning.test.ts`, 7 tests)

- All registry identifiers non-empty; `APP_VERSION` equals
  `package.json` name@version (drift now fails CI instead of rotting).
- Provenance defaults from registry; explicit overrides win.
- New tapes stamped; legacy tape JSON round-trips with no injected fields.
- Report export re-export equals the registry value.

## Quality gates

- `npm run build` — clean.
- `npm test` — 65 files / 423 tests passing (416 + 7 new). Tape round-trip
  + regression suites green (ADR-004 compatibility preserved).
