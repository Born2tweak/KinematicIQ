# Architecture Decision Records

Durable records of the decisions that make KinematicIQ trustworthy and that
constrain future work. An ADR is written when a decision is (a) hard to
reverse, (b) load-bearing for trust/safety, or (c) likely to be re-litigated
by a future agent who lacks the context.

## Rules

- **ADRs record settled decisions; they do not reopen them.** Superseding an
  `accepted` ADR requires a new ADR that names the evidence that changed,
  and — where the decision is marked *permanent* — is simply not available.
- Ids are sequential (`ADR-NNN`) and never reused.
- Every ADR cites its research sources (R-ids per `docs/research/INDEX.md`)
  and the source files that enforce it.
- Status values: `proposed` · `accepted` · `superseded by ADR-NNN`.

## Template

```markdown
# ADR-NNN — Title

**Status:** accepted
**Date:** YYYY-MM-DD
**Sources:** R-ids + doctrine docs
**Enforced by:** source files / tests

## Context
## Decision
## Consequences
## References
```

## Index

| Id | Title | Status |
|---|---|---|
| [ADR-001](ADR-001-browser-only-local-first.md) | Browser-only, local-first — no backend | accepted |
| [ADR-002](ADR-002-verdict-or-abstain.md) | Verdict-or-abstain — invalid recordings fully abstain | accepted |
| [ADR-003](ADR-003-no-composite-score.md) | No composite movement-quality score, ever | accepted (permanent) |
| [ADR-004](ADR-004-pose-tape-as-audit-artifact.md) | Pose tape is the audit artifact — additive changes only | accepted |
