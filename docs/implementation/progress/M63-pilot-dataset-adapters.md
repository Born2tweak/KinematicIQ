# M63 — Pilot dataset adapters and immutable benchmark baseline

**Status:** Complete with one explicitly blocked corpus (2026-07-11).

## Outcome

The user approved UI-PRMD and OCHuman for local evaluation. One reproducible
external pilot ran; the second has a tested adapter but no real-corpus result.
No product runtime behavior changed.

## UI-PRMD reduced deep-squat pilot

- Source: `avakanski/A-Deep-Learning-Framework-for-Assessing-Physical-Rehabilitation-Exercises`
  at commit `838d3a46b04467610fa07f07827bccc8f2e6cec1`.
- License evidence: the UI-PRMD data descriptor declares ODC PDDL 1.0; the
  source repository declares MIT for its contents/code.
- Local-only acquisition: five files under
  `web/eval/datasets/local/ui-prmd/reduced-deep-squat/`; all are gitignored.
- Integrity: five SHA-256 digests are recorded in the tracked registry and
  verified before every `npm run eval:datasets` run.
- Adapter: `web/src/eval/datasets/uiPrmdReduced.ts` reconstructs 90 trials per
  class from the dimension-major matrices and refuses wrong widths, row counts,
  labels, and non-finite values.
- Baseline: `web/eval/benchmark-results/m63-ui-prmd-reduced-baseline-v1.json`.

| Evidence | Result |
|---|---:|
| Trials | 90 demonstrated + 90 non-optimal |
| Dimensions / normalized samples | 117 / 240 |
| Paired normalized samples | 2,527,200 |
| Demonstrated mean temporal jitter proxy | 0.0026067 |
| Non-optimal mean temporal jitter proxy | 0.0029351 |
| Paired class waveform MAE / RMSE | 0.05668 / 0.09292 |

These are centered, scaled, linearly time-normalized values. They are not
degrees, source timestamps, MediaPipe errors, or clinical-quality thresholds.
Subject/repetition identity was removed by the published reduced format, so a
subject-independent split cannot be reconstructed.

## OCHuman status

- API source inspected at commit
  `958aa2046ba4f5760fcc94cb458da8fe72cedf4f`.
- `ochumanAdapter.ts` validates the native JSON shape and preserves visible,
  self-occluded, other-occluded, and missing states without converting those
  annotations into fake model confidence.
- The official corpus remains unavailable locally: its 667 MB download requires
  name, email, and institute fields. No identity was invented.
- Tracked status: `m63-ochuman-access-status-v1.json`. The CI fixture proves
  parser behavior only; it is not an occlusion-performance result.

## Verification

- Targeted registry, metric, UI-PRMD, and OCHuman adapter tests passed.
- `npm run eval:datasets` reproduced the tracked baseline after checksum validation.
- `npm run build` passed after the M63 code was added.
- `npm run eval:tapes`: 11 tapes, 0 errors, 9/9 labeled exact rep counts.
- `git check-ignore` confirmed the acquired UI-PRMD directory is ignored.

## Gate decision

M64 may diagnose only what these sources support. OCHuman model/occlusion
performance remains a research gap; the reduced UI-PRMD data cannot justify an
absolute-angle, event-lag, filter, or MediaPipe model decision.

