# M33 — Local Session Report Export

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

A shareable, local-only audit artifact for a finished session: a versioned
JSON document and a fully self-contained HTML page, both generated in the
browser with no backend, no network requests, and no external assets.

New module `export/sessionReport.ts` (pure logic + download side effects):

- `ExportedSessionReport` — versioned schema (`REPORT_SCHEMA_VERSION = 1`,
  `kind: 'kinematiciq.session-report'`) carrying app version, claims-policy
  version (`CLAIM_POLICY_VERSION`), generation time, protocol id, provenance
  (from the metric results, falling back to a live-capture default), the full
  `SetQualityAssessment`, session confidence, per-rep audit rows, and — only
  when the recording earned one — the movement report block (metrics summary,
  keyed `MetricResult`s, findings, feedback, posture, baseline, root causes).
- **Full abstain preserved:** an invalid recording exports `movement: null`.
  Only quality reasons, capture fixes, untrusted-rep details, and the rep
  audit survive — exactly mirroring the rendered report (claims-policy).
- Raw pose frames are never included; the pose tape keeps its own separate
  export (`eval/downloadTape.ts`).
- `serializeReport` (stable 2-space JSON), `reportFilename`
  (`kinematiciq-report-<protocol>-<date>.<ext>`), `downloadReportFile`
  (blob + anchor, object URL revoked, no upload).

New module `export/sessionReportHtml.ts`:

- `renderReportHtml` — single-file HTML with inline CSS, no scripts, no
  external fonts/images/links; opens identically offline. All dynamic text is
  HTML-escaped. Sections: disclaimer (verbatim `DisclaimerBanner` copy),
  quality verdict/reasons/fixes, findings with evidence chains and confidence,
  metric table with per-metric validation tier plus the tier-language note,
  baseline comparison with the M32 change chips, rep audit, and a provenance
  footer (model, filter, capture source, app/schema/claims-policy versions).

Wiring:

- `ResultsScreen` gains `Export report HTML` and `Export report JSON` buttons
  in the results actions row; the export reuses the already-computed M31
  baseline. No CSS changes were needed.

## Tests (`export/sessionReport.test.ts`, 14 tests)

- Schema: valid / questionable / invalid sessions — versioning, provenance
  fallback, questionable observations retained, invalid `movement: null` with
  rep audit kept, JSON round-trip stability.
- Copy policy: forbidden clinical terms (`diagnos`, `injur`, `patholog`,
  `dysfunction`, `risk`) absent from rendered HTML; disclaimer and validation
  tier note present; abstain state rendered for invalid sets.
- Self-containment: no `<script>`, no `http(s)://`, no `src=`, no `<link>`.
- Escaping: injected markup in finding text is neutralized.
- Download helper: object URL created + revoked, anchor clicked and removed.

## Quality gates

- `npm run build` — clean (tsc + vite).
- `npm test` — 56 files, 353 tests passing.
- `npm run test:e2e:camera` — 3/3 passing (clean-squat fixture reaches the
  results screen with the export buttons wired).

## Deliberately not done (roadmap "Do not do")

No PDF generation, no cloud sharing, no auth, no FHIR. `APP_VERSION` is a
manual constant matching `web/package.json` until the M46 version registry
provides a single build-time source.
