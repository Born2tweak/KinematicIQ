# M53 — Evidence table and CSV export

**Status:** Complete (2026-07-07)

## What was built

A local, client-side CSV export of the set's metric evidence for coaches and
biomechanists — metrics with confidence, validation tier, and full capture
provenance. No pose frames, no composite grade, no normative score.

- `web/src/export/metricCsv.ts`:
  - `METRIC_CSV_COLUMNS` — stable order: protocolId, metricId, label, value,
    unit, confidence, validationTier, captureSource, modelVersion,
    filterVariant, not_readable.
  - `buildMetricCsv(results)` — RFC 4180 escaping (comma/quote/newline),
    CRLF row separator; null values export as a blank `value` flagged
    `not_readable` (never zero, never dropped — mirrors verdict-or-abstain);
    float values trimmed to 6 significant figures.
  - `metricCsvFilename(protocolId, isoDate)` →
    `kinematiciq-metrics-<protocol>-<yyyy-mm-dd>.csv` (falls back to `session`).
- `web/src/export/metricCsv.test.ts` — header stability, provenance columns,
  null→not_readable, RFC 4180 escaping, float-noise trimming, filename.
- `web/src/screens/ResultsScreen.tsx` — Expert-tab-only "Export metrics CSV"
  button; `handleExportCsv` runs over ALL `result.metricResults` (so abstained
  rows are included) and downloads via the existing `downloadReportFile` Blob
  helper — no upload.

## Scope guards honored

- No composite score / normative grade exported (columns are evidence only).
- Export control gated to the Expert tab.
- Local-only: reuses the DOM Blob download; no network path.

## Verification (this session)

- `npm run build` clean (tsc + vite).
- `npm test` — 70 files, 457 tests passing (was 69/451; +6). Claims copy audit
  (which scans `export/`) still passes.

## Not verified this session

- **Browser click (ladder rung 5):** the Expert-tab button was not clicked in
  a live preview (needs a `SessionResult` in router state). The CSV builder,
  escaping, and filename are fully unit-tested; the button wiring is
  typechecked.
- No-cloud-upload is inherent to the Blob download path (no fetch/XHR in the
  export code); documented here per roadmap step 5.
