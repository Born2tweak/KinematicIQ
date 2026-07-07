# Validation Corpus (M44)

How the local tape corpus is tracked without committing athlete motion data
(R05 dataset design; ADR-004 pose-tape audit discipline).

## The rule

**No pose tape enters git, ever.** `.gitignore` blocks `eval-tapes/*` except
the README and the redacted `MANIFEST.example.json`. Tapes are athlete
motion data; they live in `eval-tapes/` locally and are backed up with the
source recordings (`docs/validation/session-log.md`).

## The manifest

- `eval-tapes/MANIFEST.example.json` — committed, athlete-free example of
  the schema (`web/src/eval/corpusManifest.ts`, `manifestVersion: 1`).
  A test parses it on every run so the example can never drift invalid.
- `eval-tapes/MANIFEST.json` — your real local manifest (gitignored). Copy
  the example and describe each local tape: stable `id`, bare `file` name
  (no paths — local layout stays out of git), `protocolId`, `source`
  (live/upload/stock-video), `hasTruth` (+ `truthRepCount`), `consent`
  (owner/public-stock/unknown), `validationUse`
  (regression/benchmark/exploratory), `notes` for edge cases.

## What a fresh clone sees

Real-tape assertions self-skip when the tapes are absent:

- `web/src/eval/tapeRegression.test.ts` and `replayParity.test.ts` use
  `it.skipIf(!available)` around the session-c tape and print a skip
  message pointing here. **This is expected on a fresh clone** — the rest
  of the suite (synthetic fixtures, labeled-suite logic, unit tests) runs
  fully without any local tapes.

To enable the real-tape assertions: obtain the tapes from the owner's
backup, drop them in `eval-tapes/`, and re-run `npm test` from `web/`.

## Batch evaluation

```bash
cd web
npm run eval:tapes     # replays every eval-tapes/*.posetape.json, compares
                       # against meta.truth where present, writes
                       # eval-tapes/batch-eval-report.json (gitignored)
```

Keep `MANIFEST.json` in sync with what the report covers — the manifest is
the human index; the report is the machine output. Labeling workflow and
the current labeled-suite table: `eval-tapes/README.md`.
