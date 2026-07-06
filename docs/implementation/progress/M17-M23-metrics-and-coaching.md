# M17–M23 — Timestamp gates, metric expansion, coaching intelligence (2026-07-06)

Executed per `docs/implementation/NEXT_20_MILESTONES.md`. One commit per
milestone; `npm run build` + `npm test` green at every step; the labeled
9-tape suite (M15) stayed **9/9 exact (Δ0)** after every milestone.

| Milestone | What landed |
|---|---|
| M17 | Frame-count gates → milliseconds (`standingCompletionMs` 200, `seatedMinMs` 130 ≈ old behavior at 15fps). MD02: gates must not change meaning with capture rate. Debug HUD shows the hold in ms. |
| M18 | Tempo & phase timing (MD03 minimum set): per-rep duration + CV, descent/ascent split (new optional `RepMetrics.bottomTimestamp`), set cadence — four production-tier keyed metrics; informational erratic-tempo finding (CV > 40%, 3+ reps) that never displaces coaching cues. |
| M19 | ROM beyond the knee: per-rep deepest hip-flexion and ankle-dorsiflexion proxy angles (already computed per frame, never aggregated) → two experimental-tier metrics with view-dependency caveats. |
| M20 | Path & speed (display tier): per-rep hip-path length and peak hip speed from the FILTERED trajectory (MD02: no derivatives on raw pose), labeled expert-review; no cues ride on them. |
| M21 | Posture v1 (MD03 §4): forward-head angle vs trunk line + shoulder-elevation ratio from the 3D stream (ear midpoint, nose fallback; missing head never fails a sample), aggregated per rep/set, emitted with sample-coverage confidence. |
| M22 | Root-cause concept cards (MD04 §5): ankle mobility, hip mobility/strategy, trunk control, balance habit, fatigue — derived ONLY from findings that surfaced, with plausibility copy, self-check steps, fixed not-a-diagnosis framing; expert tier only; claims-policy vocabulary locked by test. M19's ROM metrics feed the mobility rules. |
| M23 | Evidence-strength ranking (MD04 §2/§4.5, design-review "delete score entirely"): findings/cues ordered by normalized threshold exceedance instead of ComponentScores; implausible asymmetry reads floored so view artifacts never lead; deterministic tie-breaks; cue copy/count unchanged. |

## State after M23

- Tests: 49 files / 277 passing (session baseline was 43/240).
- Labeled suite: 9/9 exact rep counts; session-c regression at its M16
  snapshot (14 counted / questionable), unchanged since.
- ComponentScores still exist for the "what the camera measured" copy but
  no longer drive coaching order — full retirement is follow-up scope.

## Remaining from NEXT_20_MILESTONES

M24 (coach-question report organization), M25–M27 (capture readiness v2,
per-frame landmark quality, benchmark-gated filter upgrade), M28–M30
(sit-to-stand, hip-hinge, jump protocols), M31–M33 (personal baseline,
MDC-aware trends, local report export), M34 (docs/doctrine sync).
