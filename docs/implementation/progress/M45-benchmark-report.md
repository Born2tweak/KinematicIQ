# M45 — Benchmark Report Generator

**Date:** 2026-07-07
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/eval/benchmarkReport.ts`** (new, pure) — R05 benchmark protocol,
R06 model-change discipline:

- `buildBenchmarkSummary` — tape/error counts (+error file list), labeled
  count, exact rep-count rate, mean bottom-frame MAE, verdict distribution.
- `buildBenchmarkReport(current, baseline?)` — optional baseline comparison
  with **per-tape** regression rows (rep count was exact → now off; verdict
  changed; newly errors). Per-tape listing is deliberate: the roadmap risk
  is an aggregate that hides individual failures.
- Acceptance gates for filter/model/rep-gate changes: exact-rate held,
  bottom-MAE within ±2 frames, no new errors → `acceptable`. Without a
  baseline the gates are `null` and the markdown says "no baseline given",
  never a fake PASS.
- `formatBenchmarkMarkdown` — concise report for terminals/progress notes.

**`web/scripts/evalTapes.ts`** — prints the benchmark markdown after the
per-tape rows, writes `benchmark-report.json` next to the outcomes file,
adds optional `--baseline <prev-report.json>`, and exits non-zero when
acceptance fails. Positional args unchanged (backward-compatible).
**Analysis behavior untouched** (roadmap "do not do") — the module only
reads outcomes.

## Verification

- 8 new tests: synthetic-summary math, all-error batch does not crash,
  rep-count regression → acceptance FAIL, verdict-change detection, new
  errors → gate FAIL, within-tolerance PASS, null gates without baseline,
  markdown rendering.
- **Live end-to-end run** on the local 11-tape corpus with the previous
  `batch-eval-report.json` as baseline: 9/9 labeled exact (100%), all three
  gates PASS, `Acceptable: YES`, benchmark JSON written. (Note: the suite
  now reads 9/9 exact — better than the 6/9 recorded in
  `eval-tapes/README.md` at labeling time; the M16–M17 gate fixes landed in
  between. README table is historical, per its own header.)

## Quality gates

- `npm run build` — clean.
- `npm test` — 64 files / 416 tests passing (408 + 8 new).

A future agent's acceptance command:

```bash
cd web
npm run eval:tapes -- ../eval-tapes ../eval-tapes/batch-eval-report.json --baseline <saved-baseline.json>
```
