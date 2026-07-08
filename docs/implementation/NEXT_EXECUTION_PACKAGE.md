# Next Execution Package (post-M60, 2026-07-08)

The M25-M60 roadmap wave is complete (see
`KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` §2A). This package is the actionable
remaining work for the next agent, ordered by leverage. It carries forward the
open/blocked items rather than inventing new scope.

## Invariants (unchanged, non-negotiable)

- Browser-only, local-first: no backend, no accounts, no uploads.
- Verdict-or-abstain; **no composite 0–100 score** (ADR-003, permanent).
- Full abstain on invalid capture; observation language only.
- Stored/exported shapes are `schemaVersion`-stamped; bump on change.
- Every milestone: `cd web && npm run build && npm test` green; one progress
  note in `docs/implementation/progress/`; update traceability in the same
  commit.

## Priority 1 — Turn provisional thresholds into validated ones

The single highest-leverage gap: squat thresholds and baseline noise bands are
still **heuristic/provisional**. M48/M49 shipped the metric-validation status
board and the reliability-study calculator templates, but no study has been
run.

- **Task:** capture a real repeated-measures dataset (same athlete, multiple
  sessions/days) and run the M49 reliability calculator to produce SEM/MDC for
  the squat metrics.
- **Unlocks:** replacing "provisional / heuristic, not validated" copy with
  real reliability language; promoting metrics from `experimental` toward
  `production` validation tier.
- **Guard:** until then, do not strengthen any claim (claims-policy).

## Priority 2 — M27 live-filter benchmark

- **Task:** name a filter candidate (e.g. a Butterworth offline vs. the current
  one-euro live variant) and benchmark it on the replay harness against the
  labeled tape suite.
- **Gate:** only swap if it shows improvement on the tape suite (deferred-scope
  live-filter row). No swap without benchmark evidence.

## Priority 3 — First new protocol (governed by M57/M58)

- **Candidate:** sit-to-stand — classified `next` in
  `docs/domain/DOMAIN_MODULE_BACKLOG.md`.
- **Path:** reuse the cyclic engine (M42) + protocol runtime (M39); do NOT
  hand-code a new FSM.
- **Hard gate:** must pass the `FUNCTIONAL_ASSESSMENT_BOUNDARIES.md` checklist —
  completion/timing/consistency only; **no** fall-risk, frailty, impairment, or
  clinical-score language; every threshold validated or labeled provisional.
- **Data first:** needs labeled sit-to-stand tapes + a reliability estimate
  before any threshold copy ships.

## Priority 4 — Maintenance

- Dependency hygiene: address `npm audit` findings as an isolated maintenance
  milestone (no product behavior change).
- Optional design-system follow-up: reconcile the confidence progress-bar
  gradient (`.confidence__fill--*`) to the `--confidence-*` tokens (M56 noted
  this as deferred to avoid a visual change).

## Explicitly NOT next (still deferred/rejected)

Per `docs/doctrine/deferred-scope.md` and the M57/M59 backlogs: pose-model
swap without benchmark, kinetics/force/torque from single RGB, injury/fall-risk
prediction, composite scores, clinical diagnosis, backend/auth/cloud, digital
humans beyond inspection, sensor fusion, embeddings/foundation-model builds.
Each is gated; listing is not permission.

## How to start

1. Read `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` §2A (status) + the relevant
   progress notes.
2. Pick the highest-priority item whose gate you can actually meet with
   available data.
3. If a gate needs data you don't have (e.g. reliability capture), say so and
   pick the next item — do not fabricate validation.
