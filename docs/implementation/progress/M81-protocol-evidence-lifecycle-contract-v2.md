# M81 — Protocol Evidence and Lifecycle Contract v2

**Status:** complete
**Date:** 2026-07-12
**Change class:** additive contract and governance validation

## Implementation

- Added versioned `ProtocolEvidenceMetadataV2` to every protocol definition.
- Captured research state, evidence references, dataset provenance, camera
  assumption state, validation gates, and acceptance-threshold provenance.
- Added boundary validation for contradictory availability/evidence states.
- Registry initialization and dynamic registration now validate definitions.
- Kept `status` as the only availability switch; squat remains the sole
  available protocol and every planned runtime/profile remains fail-closed.

## Compatibility

The change is additive to the in-memory protocol-definition contract. It does
not alter `SessionResult`, pose tapes, exports, stored history, analysis
thresholds, runtime outputs, or protocol IDs. Consumers that only read existing
definition fields retain the same values. TypeScript constructors of a complete
`ProtocolDefinition` must now supply the v2 governance block so incomplete new
definitions fail during development rather than appearing activatable.

## Verification

- Targeted core/registry/runtime tests: 3 files / 25 tests passed.
- `npm run build`: passed; 713 modules transformed. The pre-existing Vite
  large-chunk advisory remains non-blocking.
- Full unit suite: 80 files / 538 tests passed.
- `git diff --check`: passed with line-ending conversion warnings only.
