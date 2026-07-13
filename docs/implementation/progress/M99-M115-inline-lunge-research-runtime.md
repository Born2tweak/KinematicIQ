# M99-M115 — Inline-lunge research runtime and activation audit

**Status:** autonomous work complete; external gates pending
**Date:** 2026-07-13

## Outcome

Implemented the complete inline-lunge research path from standing calibration
through side-aware signals, six-event segmentation, explicit rejection,
neutral outcomes, experimental metrics, bounded findings, traceability,
offline evaluation, validation prep, and non-actionable UI registration. Squat
remains the only available protocol.

## Accepted hypotheses

- One protocol plus required `leadSide` metadata prevents duplicated engines
  while preserving LLM-FMS m05/m06 source-side meaning.
- A median standing reference plus persistent displacement/drop thresholds is
  deterministic on declared synthetic fixtures.
- Complete trial semantics require a stable return of the lead foot; an active
  stream with more than three unreadable critical frames rejects.
- The neutral `transition` outcome represents a step-to-return trial without
  changing squat or session artifacts.

These are engineering findings, not human validity evidence.

## Rejected or bounded hypotheses

- LLM-FMS aggregate/per-frame scores are not truth and were not imported.
- Synthetic exact counts do not justify availability, accuracy, biomechanical
  validity, or stronger-than-experimental copy.
- Inline lunge was not inserted into the public runtime map; doing so would
  violate planned/fail-closed lifecycle semantics.
- Implicit synthetic provenance was rejected; every research run must supply
  capture provenance for the side-view observation protocol.
- No front-view valgus, balance, rear-knee contact, pain, mobility, injury,
  kinetics, normative, or composite conclusion was added.

## Debug evidence

The first cross-browser non-actionability assertion failed because the squat
button explicitly used `role=listitem`, hiding its native button role in all
four engines. Production behavior—not the assertion—was corrected with a
list-item wrapper around the native button. The regression then passed 4/4 and
the final browser matrix passed 60 with 4 intentional skips.

## Verification

- `npm test`: 91 files / 580 tests passed.
- `npm run test:coverage`: 86.94% statements / 81.59% branches / 92.29% functions / 88.18% lines.
- `npm run build`: 720 modules transformed.
- `npm run test:e2e:support`: 60 passed / 4 intentional skips.
- `npm run eval:tapes`: 11 tapes / 0 errors / labeled counts 9 of 9 exact.
- `npm run eval:llm-fms`: 2 movements / 6 rules.
- `npm run eval:inline-lunge`: 3 synthetic sequences, exact-count rate 1, count MAE 0, false activation 0, dropout 0.
- `npm audit --audit-level=high`: 0 vulnerabilities.

Generated `web/coverage/` and `web/test-results/` remain untracked. Physical
device, screen-reader, timed dataset, rater, expert, and activation results are
pending and were not fabricated.
