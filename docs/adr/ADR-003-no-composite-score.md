# ADR-003 — No composite movement-quality score, ever

**Status:** accepted — **permanent; not supersedable**
**Date:** 2026-07-06 (decision locked at the 2026-07-03 design review; recorded at M37)
**Sources:** R01 §4.4 (composite scores hide context), R03 (no-composite
philosophy), R10 (do-not-build), `docs/doctrine/claims-policy.md` (forbidden
conclusions), `docs/doctrine/deferred-scope.md` (marked "Never")
**Enforced by:** `web/src/core/metric.ts` (no composite type exists by
design — stated in the module header), `web/src/scoring/` (emits
per-component evidence only; no total, no band), `web/src/session/types.ts`
(`ComponentScores` carries five evidence inputs, no aggregate field),
copy tests that reject grade language.

## Context

A single 0–100 "movement quality" number is the most requested and most
dishonest feature in this category: it hides which component drove the
number, erases uncertainty, invites cross-athlete comparison the data cannot
support, and converts observations into implied judgments. Competitors ship
it; R09 positions KinematicIQ as the honest evidence-first alternative.

## Decision

No composite score, aggregate grade, band, letter, percentile, or
cross-movement roll-up exists anywhere: not in types, not in UI, not in
exports, not in history trends. Component-level evidence (depth, trunk
control, knee tracking, consistency, symmetry) survives strictly as inputs
to findings. Deltas against history are self-referenced and MDC-hedged
(M32) — never a progress score.

This is a **permanent prohibition**, not a deferral. There is no gate to
reconsider. An ADR proposing to supersede this one is out of order by the
terms of `docs/adr/README.md`.

## Consequences

- Positive: every claim stays attached to its evidence and confidence; the
  product cannot quietly drift into grading people.
- Negative: no single headline number for marketing or gamification —
  accepted cost; the report's findings carry the narrative instead.
- Constraint on future work: any PR introducing an aggregate quality number
  in any layer is a doctrine violation regardless of intent (including
  "internal-only" composites that would leak into copy).

## References

Design review 2026-07-03 (score deleted entirely — user-accepted);
`docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` (rejected row,
tier "never"); scoring module comments.
