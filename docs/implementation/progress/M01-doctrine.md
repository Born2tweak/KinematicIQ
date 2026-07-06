# M01 — Doctrine Docs

Date: 2026-07-05. Codify the non-negotiables so later code reviews have a written standard.

## What changed

Created three doctrine docs under `docs/doctrine/`:

- `movement-ontology.md` — distilled from research MD #1 Part 6 + existing `docs/24_movement_ontology.md`. Multi-axis ontology, movement-agnostic vs -specific split (the architectural bet), the 8 design principles, the representation hierarchy mapped to module layers, and the four universal coach questions. Cross-references `docs/strategy/product-thesis.md` and `movement-expansion.md`; defers to `docs/24` on reasoning-layer detail.
- `claims-policy.md` — consolidated from `docs/strategy/safety-claims.md`, `docs/24` §6, MD #5 (validation tiers + communication safety), MD #7 (domain guardrails). Allowed/forbidden conclusion lists, tier→language table, structural requirements (confidence chip, disclaimer, full abstain, thoracic honesty, self-reference, no composite), copy-review checklist.
- `deferred-scope.md` — the "do not build (yet)" ledger from MD #10 "What KinematicIQ Should Not Build" + Section E constraints: model swap, SMPL, OpenSim/kinetics, FHIR, injury prediction, wearables, enterprise/backend, embeddings; plus the not-refactored list (rep gates, phase thresholds, tape format, MediaPipe) and open findings #5/#6.

## Files touched

- `docs/doctrine/movement-ontology.md` (new)
- `docs/doctrine/claims-policy.md` (new)
- `docs/doctrine/deferred-scope.md` (new)

## Decisions / conflicts

- Each doc explicitly cites its source MDs and cross-references (does not contradict) existing `docs/strategy/` and `docs/24`. Where the distilled summary and the fuller canonical docs differ in detail, the canonical docs govern — stated in each doc's status line to avoid drift.
- No spec-vs-constraint conflicts surfaced; the research docs and existing doctrine already align on no-composite, observation-language, and abstention.

## Tests

Docs-only. Gate re-run anyway: `npm run build` clean, `npm test` = 30 files / 180 tests. Before/after unchanged (180).
