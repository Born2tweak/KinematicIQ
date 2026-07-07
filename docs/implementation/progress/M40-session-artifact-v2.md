# M40 — SessionResult Protocol Artifact v2

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/session/sessionArtifact.ts`** (new) — the versioned artifact
layer (R08 artifact strategy/versioning, R03):

- `SessionArtifact` = schemaVersion + `algorithmVersion` + protocol +
  createdAt + result. `ANALYSIS_ALGORITHM_VERSION = 'squat-pipeline-v1.m33'`
  is the interim pipeline identifier until the M46 registry becomes the
  single source; pre-versioning records surface `unversioned-legacy` rather
  than a guess.
- `toSessionArtifact(record)` — the READ adapter: presents any readable
  stored record (v1 or v2) as a well-formed artifact. **No on-disk migration
  happens anywhere** — v1 records stay byte-identical and are normalized in
  memory only. This is the deliberate answer to the roadmap risk ("storage
  migration bugs can hide user history"): we don't migrate storage at all.
- `metricResultsForArtifact` / `legacyMetricResults` — adapter from the
  legacy `SetMetricsSummary` to keyed `MetricResult[]` for pre-dual-write
  records (delegates to `buildSquatMetricResults`; non-squat protocols and
  empty sets return `[]`, never invented data; existing keyed results are
  returned untouched).

**`web/src/storage/sessionStore.ts`** — schema v2, compatibility-first:

- `SESSION_STORE_SCHEMA_VERSION = 2`; new records carry `algorithmVersion`.
- `READABLE_SCHEMA_VERSIONS = {1, 2}` — `isReadableRecord` now accepts both;
  unknown versions are still skipped, not guessed at. **No saved session
  becomes unreadable** (acceptance criterion).

**`web/src/session/types.ts`** — `SessionResult.metrics` documented as the
LEGACY summary (roadmap step 2): kept because the report UI reads it;
removal requires a dedicated storage-migration milestone with UI tests
(roadmap step 5 / "do not do").

## Tests (`sessionArtifact.test.ts`, 11 tests)

- Fresh artifact carries current schema + algorithm versions.
- New stored records are v2 with `algorithmVersion`; v1 AND v2 readable,
  v3 skipped; memory store lists mixed v1+v2 newest-first.
- v1 normalization stamps `unversioned-legacy` and leaves the record object
  untouched; v2 passes through.
- Keyed metric results survive JSON serialization round-trip.
- Legacy adapter derives squat results for empty-`metricResults` records,
  returns existing results untouched, and never invents results for
  non-squat/empty sets.
- `buildHistoryRows` renders mixed v1+v2 records (UI-compatibility check).

Existing `sessionStore.test.ts` (9 tests) passes unchanged — the v2 bump is
additive.

## Quality gates

- `npm run build` — clean.
- `npm test` — 59 files / 378 tests passing (367 + 11 new).
- `npm run test:coverage` — passing with thresholds.

## Traceability

`RESEARCH_TO_CODE_TRACEABILITY.md` row "SessionResult assembly (dual-write
legacy + keyed results)" status `partial (v2 = M40)` → the artifact wrapper
now exists; the row's remaining gap (report reading keyed results as
primary) belongs to the M51+ experience wave.
