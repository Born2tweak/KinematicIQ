# M59 — Future R&D backlog ledger

**Status:** Complete (2026-07-08). Docs-only.

## What was written

- `docs/research/FUTURE_R_AND_D_BACKLOG.md` — a single living ledger of
  long-horizon research bets (motion embeddings / foundation model,
  self-supervised pretraining, GNN/transformer skeletal models, world models /
  prediction, sensor fusion, physics-informed kinetics, digital humans /
  SMPL / OpenSim, RAG/agentic reporting, WebGPU on-device inference). Each row
  carries a readiness grade (`proven | emerging | speculative | rejected`), why
  it is not current scope, a gate to reconsider, and an explicit owner decision
  point. Injury prediction and composite scores are marked permanently
  rejected.
- `docs/doctrine/deferred-scope.md` — "Governed backlogs" section (added in
  M57) links this ledger.

Grounded in `docs/research/10_Future_of_Movement_Intelligence_Roadmap.md`
(readiness taxonomy, embeddings-as-infrastructure, substrate-is-the-moat) and
the deferred-scope ledger.

## Scope guards honored

- Docs-only; no R&D features implemented.
- Future ideas made visible with per-item gates so they do not become current
  scope; `rejected` items flagged as permanent prohibitions, not deferrals.

## Verification (this session)

- Docs-only; no code touched. **Shared docs-wave gate (M57–M59):**
  `npm run build` clean (tsc + vite) and `npm test` green — 72 files, 472
  tests. Since M57–M59 add only Markdown, one gate run covers the wave; no
  source file was modified.
