# M58 — Safe functional assessment track

**Status:** Complete (2026-07-08). Docs-only.

## What was written

- `docs/domain/FUNCTIONAL_ASSESSMENT_BOUNDARIES.md` — safety boundaries for any
  functional-assessment protocol:
  - **Allowed** observation-grade language (completion, timing, consistency,
    symmetry, screening-grade range, within-athlete trend).
  - **Forbidden** clinical claims (diagnosis, fall risk, frailty, impairment,
    return-to-play, clinical score, injury risk) — extends the global
    claims-policy list with `fall risk` / `frailty` / `impairment`.
  - Validation gates for any normative comparison (reliability estimate,
    population-matched context only, quality-gate abstain, confidence gating).
  - Sit-to-stand linkage requirements (first functional module, `next`).
  - A pre-ship checklist every functional protocol must pass.

Grounded in R07 Part 4 (functional modules, e.g. TUG/5xSTS not standalone
fall-risk classifiers), the Validation Handbook medical boundaries, and
claims-policy.

## Scope guards honored

- Docs-only; no normative tables added.
- Boundary doc is linked from the M57 backlog and deferred-scope so it is not
  orphaned.

## Verification (this session)

- Docs-only; no code touched. Shared M57–M59 docs-wave gate green (72 files /
  472 tests).
