# M35 — Research Index and Source Preservation

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`docs/research/INDEX.md`** (new) — navigation layer over the 11 immutable
source specs:

- Stable ids **R01–R11**, each doc listed exactly once with a one-line scope.
- Theme map (thesis, engineering constructs, product constructs, safety
  constraints, validation requirements, deferred concepts) pointing at the
  primary sources and at where each theme is implemented/enforced in the
  repo — deliberately thin summaries so the index cannot drift far from the
  sources (roadmap risk noted; "when a summary disagrees with a source, the
  source wins" is stated in the index itself).
- Source-spec vs implementation-doc distinction stated explicitly
  (acceptance criterion): `docs/research/` = source authority; doctrine/
  implementation docs = repo state.
- "Do not edit source specs" rule restated with the deviation procedure
  (log conflicts in progress notes, never amend sources).
- **Citation convention:** progress notes cite `R<id> §<section>` (e.g.
  `R03 §12`); legacy `docs/research/03 §12` / `MD #3` citations are declared
  equivalent.
- Roadmap linkage: standing anchors R05→M44–M49 validation wave,
  R08→M39–M43/M46–M47 architecture wave, R11→M51–M54 experience wave,
  R07→M55/M57–M58 domain wave.

**`docs/research/README.md`** — one pointer line added to INDEX.md; the
existing table and immutability statement kept untouched (roadmap: modify
"only if needed", do not delete).

No research source doc was edited.

## Verification

- All 11 docs listed exactly once (manual check against `ls docs/research/`).
- `npm run build` — clean; `npm test` — 353 tests passing (docs-only change;
  gates run per roadmap).
