# ADR-004 — The pose tape is the audit artifact: additive changes only

**Status:** accepted
**Date:** 2026-07-06 (discipline in force since M2/M12–M16; recorded at M37)
**Sources:** R05 (benchmark harness, dataset QA, provenance-scoped claims),
R06 (model-swap benchmarking discipline), R08 (versioning),
`docs/doctrine/deferred-scope.md` ("extend only additively, with a version bump")
**Enforced by:** `web/src/eval/poseTape.ts` (versioned format,
serialize/deserialize round-trip), `web/src/eval/replayHarness.ts`
(live/replay parity), round-trip tests in `downloadTape.test.ts` and the
tape regression suite; labeled ground truth stored additively in
`meta.truth` (M15–M16 labeling CLI, `web/scripts/labelTape.ts`).

## Context

Every trust claim the platform makes ultimately reduces to "replay the tape
and check." Tapes recorded in 2026 must still replay, byte-for-meaning,
against future analysis versions — otherwise the labeled ground-truth suite
(9/9 exact since M16), the regression harness, and the eventual reliability
studies (M49) all silently rot. A format break is not a refactor; it is
evidence destruction.

## Decision

The pose tape is the immutable audit artifact of a capture:

1. **Recorded frames are never rewritten.** Labels, diagnostics, and other
   enrichment attach additively (e.g. `meta.truth`), leaving frames and
   format version untouched.
2. **Schema changes are additive-only with a version bump.** Readers check
   the version and must handle (or explicitly refuse) older tapes — never
   misread them.
3. **Analysis changes are validated by replay.** Any change to filtering,
   gates, or the pose model must run the replay harness against the labeled
   tape suite before it lands (this is the M27 gate and the pose-model-swap
   gate in the deferred ledger).
4. Tapes stay local and are exported only by explicit user action
   (ADR-001); derived artifacts like the session report (M33) deliberately
   exclude raw frames.

## Consequences

- Positive: recordings retroactively benefit from every future analysis
  improvement; validation claims stay reproducible; regressions are caught
  against ground truth instead of vibes.
- Negative: the format accumulates optional fields over time; readers carry
  version-check code forever — accepted cost of a durable evidence chain.
- Constraint on future work: no milestone may "clean up" the tape format,
  re-serialize old tapes, or drop fields. Compatibility breaks require a new
  major format version plus a migration story for the labeled suite.

## References

`docs/implementation/progress/M15-M16-labeled-ground-truth.md`;
`docs/implementation/progress/M12-M14-batch-eval-driven.md`;
`docs/doctrine/deferred-scope.md` (pose-tape row, pose-model-swap row).
