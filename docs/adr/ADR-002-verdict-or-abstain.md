# ADR-002 — Verdict-or-abstain: invalid recordings fully abstain

**Status:** accepted
**Date:** 2026-07-06 (decision from the quality-gate wave, commit `2408a58`; recorded at M37)
**Sources:** R03 (no-composite philosophy), R05 (communication safety), R04
(evidence-strength framework), `docs/doctrine/claims-policy.md` §"Structural
requirements", `docs/doctrine/movement-ontology.md` P2
**Enforced by:** `web/src/session/setQualityGate.ts` (valid / questionable /
invalid classification), `web/src/screens/ResultsScreen.tsx` (invalid ⇒ no
posture profile, no metric summary, no coaching — only reasons, fixes,
diagnostics), `web/src/export/sessionReport.ts` (invalid ⇒ `movement: null`
in the exported artifact), tests in `setQualityGate.test.ts` and
`sessionReport.test.ts`.

## Context

Validation findings #5/#6/#8 (`docs/validation/session-log.md`) showed the
pipeline can count reps that are physically impossible reads (standing
bottoms, extreme-flexion artifacts, reps with no knee data). A report built
on such a recording is fake coaching. The alternative — hedging every line —
buries the signal and trains users to ignore caveats.

## Decision

The report itself gets a verdict: **valid**, **questionable**, or
**invalid**. Invalid recordings produce a **full abstain**: zero movement
conclusions anywhere the result surfaces (screen, history, export) — only
the reasons, concrete capture fixes, and audit diagnostics. Questionable
recordings carry observations but no recommendations and never
High-confidence reads. The classification never mutates the underlying data:
counted reps and the pose tape are preserved untouched for audit.

## Consequences

- Positive: the app prefers "we cannot trust this recording" over invented
  insight — the core trust property; every downstream surface (M31 baseline,
  M33 export) inherits one rule instead of inventing its own hedging.
- Negative: users with bad capture setups get no report until they fix the
  capture; this is deliberate (capture fixes are always shown).
- Constraint on future work: **every report-path milestone must preserve
  full abstain.** Report-level trust thresholds in `setQualityGate.ts`
  classify only physically impossible reads; they are NOT rep gates and must
  not be tuned as if they were.

## References

`docs/doctrine/claims-policy.md`; quality-gate tests; M33 export abstain test
(`sessionReport.test.ts` — "fully abstains on an invalid session").
