# M83 — Squat Runtime Adapter and Golden Parity

**Status:** verification blocked — implementation complete
**Date:** 2026-07-12
**Change class:** additive runtime adapter

## Implementation

- Added a runtime-owned adapter from existing squat reps/rejections to the M82
  neutral outcome envelope.
- Completed reps remain completed repetition trials; rejected attempts retain
  their exact frame range and reason.
- Trial order is deterministic and validated.
- Existing segmentation, `SessionResult`, pose-tape, export, and storage shapes
  are unchanged; no phase, rep, filter, or capture threshold changed.

## Verification

- Golden/runtime/cyclic tests: 3 files / 23 tests passed.
- `npm run eval:tapes`: passed, 11 tapes / 0 errors and 9/9 labeled exact rep
  counts.
- `npm run build`: passed, 714 modules transformed.
- Coverage/full unit: 81 files / 544 tests passed; 86.29% statements, 81.62%
  branches, 92.14% functions, and 87.58% lines.
- `git diff --check`: passed with line-ending conversion warnings only.
- Camera E2E: Chromium and Firefox paths passed. The eight-worker run suffered
  browser process/page-setup exhaustion. A one-worker rerun reached 18/20, but
  the clean-squat flow remained nondeterministic in desktop WebKit and once in
  iPhone WebKit. A focused retry passed iPhone WebKit but failed desktop WebKit
  three times at different lifecycle points (no rep or disabled Finish button).

## Blocker

M83 is not marked complete because its declared camera gate is not fully green.
The failing path predates and does not call the new outcome adapter, while unit,
tape, Chromium, and Firefox evidence show no squat-output change. Resume by
diagnosing the existing WebKit pose-tape scheduling/lifecycle instability; do
not weaken assertions or accept the adapter until that gate passes.
