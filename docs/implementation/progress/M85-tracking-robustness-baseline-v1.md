# M85 — Tracking Robustness Baseline v1

**Status:** complete
**Date:** 2026-07-12

## Scope

Version and save per-tape and aggregate raw-versus-One-Euro tracking evidence:
jitter, implausible jumps, missingness/dropout/recovery, frame intervals,
critical-landmark coverage, rep parity, and paired bottom-event timing.

The evaluator reuses production filters, quality functions, and runtime
segmentation. It changes no filter parameter, landmark threshold, rep gate,
protocol definition, or user-facing claim.

## Corpus limitations

The baseline must explicitly report unavailable OCHuman raw data, the amount of
rep/event labeling actually present, and that the tape corpus is not population
or clinical validation.

## Verification

- Targeted evaluator tests: 2 files / 10 tests passed; build passed.
- Baseline: 11 tapes / 3,332 frames; mean critical coverage 94.94%; raw jitter
  0.01160 versus One-Euro 0.00799; raw/filtered jump frames 12/8; rep parity
  11/11.
- Nine tapes have rep-count labels; zero have bottom-event labels. OCHuman raw
  data remains unavailable, so occlusion stress evidence is explicitly absent.
- `eval:tapes`: 11/11 processed, 9/9 labeled exact counts.
- UI-PRMD dataset evaluation regenerated successfully.
- `git diff --check` passed with line-ending warnings only.
