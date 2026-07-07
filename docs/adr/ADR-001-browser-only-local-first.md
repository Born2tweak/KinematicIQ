# ADR-001 — Browser-only, local-first: no backend, no accounts, no uploads

**Status:** accepted
**Date:** 2026-07-06 (decision predates; recorded at M37)
**Sources:** R08 §9 (local-first flavor), R10 (do-not-build list), `docs/doctrine/deferred-scope.md`
**Enforced by:** `web/src/storage/sessionStore.ts` (IndexedDB only),
`web/src/export/sessionReport.ts` + `web/src/eval/downloadTape.ts`
(client-side blob downloads, no upload path), absence of any network layer;
`web/vite.config.ts` COOP/COEP headers exist for MediaPipe WASM, not for API calls.

## Context

Movement recordings are sensitive personal data. A backend would create
account, security, retention, and regulatory surface the product does not
need to deliver its value, and would undercut the on-device privacy
positioning (R10 names browser AI / on-device privacy as an investment
area). The owner constraint from the start of the platform build is
browser-only.

## Decision

Everything runs client-side: pose estimation, analysis, findings, report
rendering, persistence, and export. Persistence is **opt-in** (explicit
"Save to history"), local-only (IndexedDB), versioned, and fully deletable.
Export artifacts (session report HTML/JSON, pose tapes) are client-side file
downloads. No accounts, no telemetry, no cloud sync, no server rendering.

## Consequences

- Positive: no data leaves the device; trivially honest privacy story; no
  auth/backend attack surface; offline-capable artifacts (M33 report opens
  with networking disabled).
- Negative: no cross-device history; validation datasets must be collected
  by explicit user export, not passive telemetry; "share with coach" is
  file-based.
- Gate to revisit: a full backend/security scope change recorded in the
  deferred ledger — not reachable by incremental drift.

## References

`docs/doctrine/deferred-scope.md` (enterprise/backend row);
`docs/implementation/progress/M33-local-report-export.md` (offline artifact);
M9 progress notes (opt-in persistence).
