# M82 — Universal Trial/Outcome Contract

**Status:** complete
**Date:** 2026-07-12
**Change class:** additive architecture contract

## Implementation

- Added a versioned, movement-neutral outcome envelope for repetition,
  transition, ballistic-event, and stride trials.
- Modeled completed, rejected, and missing trials explicitly; missing trials do
  not fabricate frame ranges and rejected trials require a reason.
- Added validation for schema version, IDs, frame ranges, deterministic order,
  overlap, rejection reasons, and missing-event reasons.
- Re-exported the contract from the protocol public types and pointed the
  existing runtime `outcomeKinds` field at the shared kind.

## Compatibility

This module is additive and not yet used by `SessionResult`, stored history,
exports, pose tapes, squat analysis, or the live camera path. No migration or
runtime-output change occurs in M82.

## Verification

- Targeted outcome/runtime tests: 2 files / 17 tests passed.
- `npm run build`: passed after TypeScript rejected and the implementation fixed
  an unsafe discriminated-union test mutation; 713 modules transformed.
- Full unit suite: 81 files / 543 tests passed.
- `git diff --check`: passed with line-ending conversion warnings only.
