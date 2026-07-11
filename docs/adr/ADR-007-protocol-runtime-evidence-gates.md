# ADR-007: Protocol Execution and Evidence Gates

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

KinematicIQ has a protocol registry, a `ProtocolRuntime`, a shared cyclic engine, and a protocol-aware offline entry point. However, live and upload screens still run squat-specific phase, rep, auto-start, auto-finish, quality, metric, finding, and report code and then stamp the selected protocol ID on the result. `SessionResult` and several UI/copy paths remain squat-shaped.

## Decision

No second protocol becomes `available` until the selected protocol owns the complete execution contract across live, upload, replay, and report assembly. The contract must cover:

- identifier/version and validation status;
- supported input modes and camera-view requirements;
- required landmarks and setup/readiness copy;
- calibration and activation;
- phase/event/trial model, without assuming cyclic repetitions;
- completion, rejection, and quality rules;
- metric eligibility/computation and confidence requirements;
- findings/coaching vocabulary and claims limits;
- report configuration, storage/version compatibility, dataset evidence, and benchmark gates.

The migration is expand-then-contract: add generic contracts, route squat through them with parity evidence, then implement protocol two. Squat thresholds remain unchanged during structural migration.

## Alternatives considered

1. Build sit-to-stand directly in `CameraScreen`: rejected; it would create a second embedded pipeline.
2. Treat all movements as cyclic profiles: rejected; jump, gait, balance, and transition trials have different event/completion semantics.
3. Rewrite the full engine first: rejected; evidence supports targeted seams, not a broad rewrite.

## Consequences

- M70 is a hard prerequisite for M71-M72.
- Live, upload, and replay parity tests become protocol-scoped.
- `ProtocolId` remains a closed union until a research package and schema migration plan exist.
- A planned stub is preferable to an unvalidated report.

## Revisit when

Two additional protocols demonstrate that the contract is too narrow or introduces repeated adapters.
