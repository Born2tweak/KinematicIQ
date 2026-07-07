# M44 — Validation Corpus Manifest

**Date:** 2026-07-07
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

- **`web/src/eval/corpusManifest.ts`** — manifest schema v1 + strict parser
  (R05 dataset design). Entry fields: stable id, bare tape filename
  (parser REJECTS paths so local filesystem layout can never leak into
  git), protocol, source (live/upload/stock-video), `hasTruth` (+ required
  `truthRepCount`), consent (owner/public-stock/unknown), validation use
  (regression/benchmark/exploratory), notes. Unknown manifest versions are
  refused, never misread; duplicate ids rejected.
- **`eval-tapes/MANIFEST.example.json`** — committed, athlete-free example
  (placeholder `example-*` files only). `.gitignore` gains a negation for
  exactly this file; `eval-tapes/*` stays ignored — **no tape was
  unignored** (roadmap "do not do").
- **`docs/validation/validation-corpus.md`** — where local tapes live, how
  `MANIFEST.json` (gitignored) is maintained, what a fresh clone sees, how
  to enable real-tape assertions, `npm run eval:tapes` usage.
- **Skip messages** in `tapeRegression.test.ts` and `replayParity.test.ts`
  now say the skip is expected on a fresh clone and point at the corpus doc
  + example manifest (acceptance criterion).

## Tests (`corpusManifest.test.ts`, 7 tests)

- Parses the committed example on every run — the example can never drift
  invalid — and asserts every file in it is an `example-*` placeholder (no
  athlete data committed, enforced by test).
- Minimal valid manifest; version refusal; duplicate ids; path-in-filename
  rejection; truthRepCount requirement; enum validation.
- Eval suites still pass with tapes present locally AND self-skip cleanly
  without them (skip path exercised by the message change itself).

## Quality gates

- `npm run build` — clean.
- `npm test` — 63 files / 408 tests passing (401 + 7 new).
