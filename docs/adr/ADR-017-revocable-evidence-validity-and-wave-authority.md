# ADR-017: Separate immutable evidence from revocable current validity

**Status:** Accepted  
**Date:** 2026-07-24

## Context

Phase A evidence records were immutable, but the controller also treated Passed
milestones as permanently valid. Declared `evidence_inputs` were not hashed,
ancestor commits were accepted without an implementation-scope check, and the
checkpoint trusted historical pass flags without live reverification. The Wave 1
forecast also described unslotted work as probable while prose selected KQ-016.

## Decision

- Preserve legacy evidence unchanged and write new evidence as immutable schema-v2
  records identified by milestone and subject commit.
- Generate current validity from an append-only event log. Execution status and
  evidence validity are independent.
- Require current dependency evidence, canonical input/output hashes, exact subject
  commit/tree identity, and an explicit validity scope.
- Consume only `ACTIVE_WAVE.yaml` for mutation authority. Dependency readiness does
  not itself authorize execution.
- Fail checkpoints, clean clones, and CI when completed evidence is not currently
  valid or when generated authority drifts.

## Consequences

All 15 Phase A milestones require one v2 reverification before Phase B can start.
Later source, verifier, dataset, or scientific changes can revoke current validity
without deleting historical evidence. Wave transitions become explicit and
machine-enforced.

## Rollback

Revert the controller commits and continue reading the preserved v1 records and
Wave 1 schedule. Do not delete v2 records or validity events; they remain historical
artifacts even if the v2 controller is disabled.
