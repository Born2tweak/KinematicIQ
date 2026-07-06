# M15–M16 — Ground truth + the first evidence-backed rep-gate fixes (2026-07-06)

## M15 — Labeling workflow and labeled suite

- `npm run eval:label` (web/scripts/labelTape.ts → src/eval/labelTape.ts):
  writes `meta.truth` additively with mandatory provenance (labeledBy /
  labeledAt / method / notes). Frames untouched; input tape immutable.
- Labeling protocol in `eval-tapes/README.md` (the only versioned file
  there): a rep = distinct bottom + return to near-standing within the clip;
  clip-start bottoms count, clip-end descents don't; pulses are one rep.
- All 9 stock tapes labeled from **the source videos** (ffmpeg contact
  sheets at 2–5 fps, reviewed frame-by-frame) — never from pipeline output.

## M16 — Rep-gate fixes (findings #5/#6, unblocked by labels)

Baseline accuracy: **5/9 tapes exact** (errors −3, +2, +4, −1).
After M16: **9/9 exact (Δ0 across the labeled suite).**

Three root causes, each verified in frame traces before fixing:

1. **Mid-ascent phase jitter split slow deep-hold reps in two** (+2 on
   best-squats). During ONE monotonic ascent (knee 46°→165°) the phase FSM
   emitted STANDING at knee 81°, then DESCENDING→BOTTOM→STANDING again. Fix:
   `kneeRecoveredSinceBottom` — after a bottom, STANDING/DESCENDING
   transitions are not rep boundaries until the (raw) knee re-straightens
   past the lockout threshold.
2. **Phase-jitter "bottoms" while standing were counted as reps** (+4 on
   stock-1, interleaved with the real reps; same family as session-c reps
   1–7). Fix: `standingBottomKneeMin` (170°) — a completed candidate whose
   bottom knee never bent is rejected (`no-knee-bend` gate), not counted
   then distrusted.
3. **Quick shallow reps died on gates that never saw a bottom** (−3 on
   6454275, −1 on stock-2). The FSM never reported BOTTOM and the knee never
   crossed the 105° fallback, so real reps were rejected as "bottom not
   held". Fixes: (a) descent evidence at validation — bilateral knee bend ≤
   `avgKneeDepthThreshold` plus hip descent ≥ `minHipDescentEvidence`
   (0.01; close/front-on framing reads real shallow squats at 0.01–0.02
   normalized) counts as a bottom; (b) a new-descent boundary now runs the
   outgoing candidate through validation instead of discarding it blind;
   (c) knee recovery uses the raw knee, not the lagging EMA, so fast
   stand-ups near clip end are not lost.

### Session-c regression snapshot — deliberately updated

12 counted / verdict `invalid` / 26 phantoms → **14 counted / verdict
`questionable` / 22 phantoms**, untrusted [1, 6] (flexion + knee-less).
This matches the session log's own accounting: 25 raw − 7 standing
artifacts (now rejected upstream) − 4 flexion artifacts (still counted,
still disclosed). Standing bottoms can no longer appear as counted reps —
locked by the updated replay-parity test (`no-knee-bend` in the ledger).

### Not touched

Phase-detector thresholds themselves (jitter is handled at the counter
boundary), pose-tape format (truth extension is additive), MediaPipe, live
UX. `web/scripts/traceTape.ts` kept as the diagnostic used for the traces.

Gate: build clean; 45 files / 254 tests green; `npm run eval:tapes` Δ0 on
all 9 labeled tapes.
