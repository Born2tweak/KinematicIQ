# M57 — Domain module backlog and validation gates

**Status:** Complete (2026-07-08). Docs-only.

## What was written

- `docs/domain/DOMAIN_MODULE_BACKLOG.md` — governed backlog of training,
  functional, sport, and clinical-adjacent modules. Each row states required
  data, validation gate, product surface, and forbidden claims, and is
  classified `now | next | research | deferred | rejected`. Clinical-adjacent
  modules carry a hard "not a medical device" gate; injury prediction and
  composite scores are listed as permanent rejections.
- `docs/doctrine/deferred-scope.md` — added a "Governed backlogs" section
  linking this backlog (plus M58/M59) and restating that listing ≠ permission.

Grounded in `docs/research/07_Domain_Intelligence_Spec.md` (functional/sport/
clinical modules, evidence model), claims-policy, movement-ontology, and the
deferred-scope ledger.

## Scope guards honored

- No modules implemented (docs-only).
- Backlog framed as gated visibility, not commitment.
- Every row preserves verdict-or-abstain, no-composite-score, observation
  language.

## Verification (this session)

- Docs-only; no code touched. `npm run build` + `npm test` run for the M57–M59
  docs wave confirmed green (72 files / 472 tests) — see the shared gate note
  in M59's progress record.
