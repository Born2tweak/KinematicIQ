# M12–M14 — Batch-eval-driven milestones (2026-07-06)

## Evidence source

Nine freshly captured upload tapes (Pexels/stock squat clips, saved from the
app's analyst-mode download on 2026-07-06) plus the session-c live regression
tape were replayed through the production pipeline. Raw reports live outside
the repo (session scratchpad); the tapes remain in `C:\Users\acetu\Downloads`.

Batch results before these milestones:

| Tape | Reps | Verdict | Why |
|---|---|---|---|
| 15079385 | 2 | invalid | too-few-trusted-reps |
| 4838220 | 2 | invalid | too-few-trusted-reps |
| 4921644 | 2 | invalid | too-few-trusted-reps |
| 6454275 | 1 | invalid | too-few-trusted-reps |
| 6980032 | 2 | invalid | too-few-trusted-reps |
| Best Squats Videos | 7 | valid | — |
| stock-download (1) | 8 | invalid | standing-reps-counted, artifact-heavy-set |
| stock-download (2) | 3 | valid | — |
| stock-download | 5 | valid | — (but 61° knee-asymmetry coached at High confidence) |
| live-session-2026-07-05 | 12 | invalid | (regression anchor — unchanged) |

## M12 — Batch tape eval harness

`npm run eval:tapes [-- <dir> [<report.json>]]` (web/scripts/evalTapes.ts →
src/eval/batchEval.ts). Replays every `.posetape.json` in a directory through
`replayTape` + `buildSessionResult`, prints one verdict line per tape,
compares against `meta.truth` when present, writes a JSON report. Default
directory: `<repo>/eval-tapes`.

## M13 — Small-sample verdict tier

Five of nine upload tapes were clean 1–2-rep clips (High confidence, zero
untrusted reps) branded "we could not produce a trustworthy report" by the
`too-few-trusted-reps` full abstain. The gate conflated "too few reps for a
SET pattern" with "untrustworthy recording". Now: a short set that is clean
(trusted reps ≥ 1, no other quality reasons) gets `questionable` with new
reason `small-sample` — per-rep observations render, set-pattern coaching
still abstains, capture fix suggests 3+ reps. Short sets that are short
BECAUSE of artifacts (or churn-heavy) stay `invalid`. Session-c regression
verdict unchanged.

## M14 — Knee-asymmetry plausibility guard

A valid tape coached a 61° average L/R bottom-knee difference at High
confidence — a viewing-angle artifact (far knee foreshortened through the
near leg), not movement the camera can vouch for. New
`KNEE_ASYMMETRY_IMPLAUSIBLE = 45°` (scoringConfig): at or above it, the
knee-tracking cue reframes as a camera-setup check at Low confidence with a
re-record suggestion; the derived finding inherits the downgrade.

## Post-milestone batch results

Same tapes after M13/M14: the five clean short clips → `questionable
[small-sample]`; artifact tapes still `invalid`; valid tapes unchanged; the
61° asymmetry now surfaces as a Low-confidence capture observation.

## Deferred (open findings)

- **Upload cold-start standing reps** — stock-download (1) counted 8 reps
  with 4 standing-bottoms at clip start (bottoms at frames 7/21). Rep-gate
  changes stay blocked on labeled data per the quality-gate contract
  (findings #5/#6). Unblocker: hand-label `meta.truth` on the Downloads
  tapes and check them into `eval-tapes/` — M12 already reports
  repCountError and bottom-frame MAE once labels exist.
- All upload tapes replay at `fps: 15` regardless of source frame rate
  (upload analyzer sampling); worth revisiting with the phase-threshold
  findings.

Gate: `npm run build` clean, `npm test` 44 files / 250 tests green after each
milestone (baseline 43/240).
