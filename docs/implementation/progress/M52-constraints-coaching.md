# M52 — Constraint-based coaching library v1

**Status:** Complete (2026-07-07)

## What was built

A small constraints-led coaching layer keyed to finding ids: one "next set"
cue per finding that changes the task or environment (box at target depth,
fixed gaze point, square camera angle, steady tempo) rather than prescribing
an exercise or naming a body part.

- `web/src/coaching/constraintsLibrary.ts` — `ConstraintCue`
  (`type: environment | task | attention | tempo`) and
  `constraintCueForFinding(findingId)`. Cues for the six squat finding ids
  (depth, trunkControl, kneeTracking, symmetry, consistency, tempo); unknown
  ids return null (zero-or-more, never invented).
- `web/src/coaching/constraintsLibrary.test.ts` — one-cue-per-finding, valid
  types, "next set" framing (not prescription), and no forbidden claim
  language (checked against the project `FORBIDDEN_PHRASES`).
- Rendering reuses the M50 opt-in pattern: `findingCardModel`/`FindingCard`
  take `showConstraint`; ResultsScreen enables it only on the Evidence-tab
  coach-question cards (`showEvidence && verdict === 'valid'`), so Summary and
  the invalid/questionable states never show constraints.
- `web/src/test/claimsCopyAudit.test.ts` — added `coaching` to the scanned
  `COPY_DIRECTORIES` so the new copy home is inside the guardrail (Art. X:
  close the gap durably, not once).
- `web/src/index.css` — `.finding-card__constraint` styling.

## Scope guards honored

- At most one extra cue per finding; Evidence only, never Summary.
- Invalid/questionable reports show no coaching constraints (Evidence
  coach-question section is valid-set-gated).
- No exercise programs, no medical/rehab language — claims audit passes over
  `coaching/`.
- Cue ranking and thresholds unchanged (finding derivation untouched).

## Verification (this session)

- `npm run build` clean (tsc + vite).
- `npm test` — 69 files, 451 tests passing (was 68/444; +7).
- New tests prove the library maps/omits correctly and stays claims-safe;
  the audit test now covers the `coaching/` directory.

## Not verified this session

- **Visual render (ladder rung 5):** the Evidence-tab constraint line was not
  screenshotted — reaching it needs a valid `SessionResult` in router state or
  a live clean recording. Copy and mapping are unit-tested; layout unconfirmed.
