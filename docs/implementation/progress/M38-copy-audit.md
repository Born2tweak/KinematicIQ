# M38 — Claims-Policy Automated Copy Audit

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

**`web/src/test/claimsForbiddenTerms.ts`** — the scannable subset of the
claims policy (R05 responsible communication, R07 guardrails,
`docs/doctrine/claims-policy.md`):

- `FORBIDDEN_PHRASES` — injury risk, diagnosis/diagnose(d), pathology,
  abnormal, dysfunction, damaged, torque, joint load, force measured,
  muscle activation, weak glutes, readiness/return-to-play; each tagged with
  the policy it protects. `diagnostics` is deliberately NOT matched —
  engineering vocabulary (tape diagnostics ledger), not a clinical claim.
- `NEGATION_CONTEXT_PATTERNS` — a line naming a forbidden concept passes
  when it is a not-measured/not-claimed statement (not / never / no /
  forbids / without / avoid), per roadmap step 3.
- `DOCUMENTED_EXCEPTIONS` — file+phrase-scoped holes, kept short with stated
  reasons. One entry: `metrics/squatMetrics.ts` × "joint load" — the
  `SQUAT_EXCLUDED_METRICS` catalog entry whose label/description name the
  excluded concept while `exclusionReason` carries the negation (R03 §12
  kept-for-the-record discipline).

**`web/src/test/claimsCopyAudit.test.ts`** — the audit (4 tests):

- Recursively scans the copy-bearing modules (`feedback/ findings/ screens/
  components/ session/ export/ storage/ scoring/ metrics/ cv/`), excluding
  `.test.` files and stripping comments first. Research docs are not scanned
  (roadmap "do not do" — sources, not copy).
- Fails with a file:line report on any un-negated forbidden phrase.
- Blindness guard: asserts >30 files scanned so a folder rename can't
  silently disable the audit.
- Positive control (self-test): a synthetic affirmative "injury risk" line
  is shown to trip the matcher.
- Safe-exclusion regression: `squatMetrics.ts` still contains its
  "not defensible" exclusion copy AND audits clean.
- Header comments state this is a heuristic guardrail, not a parser or a
  legal/clinical review (roadmap step 4).

## What the audit caught while landing

First run flagged real text: the `Knee joint load` excluded-metric label
(resolved via the documented-exceptions mechanism, above) and four
`diagnostics` false positives (resolved by tightening the stem to actual
clinical inflections). The guardrail demonstrably fires on unsafe copy.

## Quality gates

- `npm run build` — clean.
- `npm test` — 57 files / 357 tests passing (353 + 4 new).
- `npm run test:coverage` — passing with thresholds.
