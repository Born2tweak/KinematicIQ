# M83W — WebKit Pose-Tape Determinism Investigation

**Status:** complete
**Date:** 2026-07-12
**Change class:** debugging and verification milestone; M83 product behavior is not presumed defective

## Objective

Establish the first cross-browser divergence in the clean-squat pose-tape path,
identify its mechanism with repeatable evidence, and either make the smallest
repository-controlled deterministic fix or document a reproducible upstream
limitation. Test assertions, browser coverage, and acceptance criteria remain
unchanged.

## Initial hypotheses

| ID | Hypothesis | Discriminating observation | State |
|---|---|---|---|
| H1 | Wall-clock tape indexing skips motion frames when WebKit rAF cadence stalls | Failing runs show large rAF gaps correlated with stalled rep/phase progress while media remains attached | accepted |
| H2 | Placeholder canvas/video attach or lifecycle events reset/stall the source | Failing runs show pause/emptied/detach/visibility events or a second acquisition before divergence | rejected |
| H3 | MediaPipe timing causes the divergence | Impossible for pose-tape source if traces confirm `requiresPoseModel=false` and no model initialization | rejected |
| H4 | The M83 neutral outcome adapter changes live analysis | Impossible if no `buildTrialOutcomes` call exists on the camera path; confirm by code/search and unchanged pre-adapter behavior | rejected |
| H5 | Playwright video/trace capture induces the slowdown | Artifact-disabled WebKit should recover native rAF cadence | rejected |
| H6 | Manual finish races with the auto-finish pending state | Runs reach a rep but the visible Finish button repeatedly toggles disabled/unstable | accepted |

## Baseline evidence

- Five desktop-WebKit runs: only 63-74 rAF callbacks over the diagnostic
  interval; every gap exceeded 50 ms and 30-63 gaps/run exceeded 250 ms.
- Three artifact-disabled desktop-WebKit runs: only 37-43 callbacks in 12 s;
  32-38 gaps/run exceeded 250 ms. Playwright artifact capture is not causal.
- Three `captureStream`-disabled runs retained the same 250-500 ms cadence;
  placeholder media acquisition is not causal.
- Two Chromium runs produced 291-338 callbacks, no gap over 250 ms, and 2-3
  reps. Two Firefox runs produced 339-422 callbacks, no gap over 250 ms, and
  3 reps. Two iPhone-WebKit runs produced 38-59 callbacks and 0 reps.
- Pose-tape sources declare `requiresPoseModel=false`; the path does not load or
  invoke MediaPipe. The camera screen never calls M83 `buildTrialOutcomes`.
- A fixed-timer counterfactual made all 6 desktop/iPhone WebKit runs reach a rep.
  Three then passed end-to-end; three exposed a separate Finish-button race as
  `AUTO_FINISH_PENDING` repeatedly disabled or destabilized manual finish.

## Accepted fix direction

Use a fixture-only timer scheduler so deterministic pose-tape analysis does not
inherit headless WebKit's render cadence; retain native rAF for real cameras.
Allow manual finish in both ACTIVE and AUTO_FINISH_PENDING states. Neither
change relaxes an assertion, skips a browser, changes analysis thresholds, or
affects MediaPipe/webcam scheduling.

## Verification after fix

- Unchanged clean-squat acceptance flow: 5/5 desktop WebKit and 5/5 iPhone
  WebKit repeated runs passed with no retries.
- Full camera matrix: 20/20 passed across Chromium, Firefox, desktop WebKit,
  and iPhone WebKit.
- Full support/accessibility matrix: 56 applicable tests passed, 4 intentional
  non-Chromium fake-webcam skips.
- Unit/coverage: 81 files / 546 tests passed; coverage remained 86.29%
  statements, 81.62% branches, 92.14% functions, and 87.58% lines.
- Tape evaluation: 11 tapes / 0 errors; all 9 labeled tapes retained exact rep
  counts.
- Production build passed with the existing non-blocking chunk-size advisory.

The fix is repository-controlled. Headless WebKit's native rAF throttling is an
upstream behavior, but deterministic fixture analysis no longer depends on it.
Real-camera MediaPipe rendering still uses native rAF.
