# eval-tapes — labeled pose-tape suite

Pose tapes are athlete motion data: **every `.posetape.json` here is
gitignored** (only this README is versioned). Back tapes up with the
recordings (see `docs/validation/session-log.md`).

## Commands

```
npm run eval:tapes                 # replay + report every tape in this folder
npm run eval:label -- <tape> --reps N [--bottoms i,j,k] --by <who> --method <how> [--notes "..."]
```

Run from `web\`. `eval:tapes` compares against `meta.truth` when present and
reports rep-count error and bottom-frame MAE.

## Labeling protocol (v1, 2026-07-06)

- **`truth.repCount`** = number of distinct squat **bottoms followed by a
  return to near-standing within the clip**.
  - A clip that STARTS at/near the bottom: that bottom **counts** if the
    athlete then stands (matches live `beginSetDuringDescent` semantics).
    Note it in `notes`.
  - A descent the clip ENDS on (no ascent) does **not** count. Note it.
  - Pulses at the bottom (partial rise < halfway, then re-descend) are ONE
    rep, not two.
- **`truth.bottomFrameIndices`** (optional) = tape frame index of the deepest
  point per counted rep, in order. Only label when confidently readable.
- **Provenance is mandatory**: `--by` (who), `--method` (how, e.g.
  `video-contact-sheet-review@2fps`), plus `notes` for edge cases (second
  person in frame, clipped framing, camera angle).
- Labels come from the SOURCE VIDEO, never from pipeline output — labeling
  from the pipeline's own reps would make the benchmark circular.

## Current suite (labels of 2026-07-06)

The table below is a historical snapshot from labeling time, not the current
acceptance baseline. On 2026-07-10, `npm run eval:tapes` executed 11 tapes with
0 replay errors; all 9 labeled tapes matched exact rep count (9/9). Bottom-frame
MAE remained unavailable because the current labels do not provide enough bottom
indices, and no saved comparison baseline was present, so change acceptance was
undecided. Save a versioned benchmark report before using later results to justify
a filter, gate, threshold, or pose-model change.

| Tape | Truth reps | Pipeline (at labeling) | Notes |
|---|---|---|---|
| 15079385_1080_1920_30fps | 2 | 2 ✓ | back view, barbell |
| 4838220-uhd_2160_3840_24fps | 2 | 2 ✓ | 3rd descent cut at clip end |
| 4921644-hd_1066_1920_25fps | 2 | 2 ✓ | starts near bottom; final descent cut |
| 6454275-uhd_2160_3840_24fps | 4 | 1 ✗ | quick shallow reps rejected by bottom-hold gate |
| 6980032-uhd_2160_4096_30fps | 2 | 2 ✓ | second person in background; final descent cut |
| best-squats-videos | 5 | 7 ✗ | long bottom holds double-counted |
| squatting-stock…(1) | 4 | 8 ✗ | phantom standing reps interleaved with real ones |
| squatting-stock…(2) | 4 | 3 ✗ | clip starts at bottom; that rep missed |
| squatting-stock… | 5 | 5 ✓ | tight angled framing; knee-asymmetry artifact |
| live-session-2026-07-05 | (unlabeled) | 12 | owner's session-c regression tape |
