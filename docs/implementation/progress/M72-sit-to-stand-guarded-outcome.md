# M72 — Sit-to-stand guarded implementation outcome

**Status:** Complete as a guarded no-activation decision (2026-07-11).

Implemented only the reversible research boundary:

- `sitToStand` is a typed protocol ID with `kind: transition`;
- its definition owns side-view research setup and required landmarks;
- it is registered `planned` with no profile/runtime, no input modes, no
  thresholds, no metrics, no findings, and no coaching;
- runtime and protocol-aware analysis tests require `NotImplementedError`.

The final availability switch was not made because M71 hard gates failed:
there are no approved local sit-to-stand files, independent event labels,
predeclared numeric acceptance criteria, or reliability result. The picker may
name the research item as unavailable; no capture or report can start.

Rollback is removal of the additive planned registry entry. Existing squat
artifacts/readers are unchanged.

