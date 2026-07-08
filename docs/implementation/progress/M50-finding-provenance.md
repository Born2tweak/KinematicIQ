# M50 — Finding rule provenance and review status

**Status:** Complete (2026-07-07)

## What was built

Every finding rule now declares where it came from and how far it has been
reviewed, parallel to `ValidationTier` for metrics.

- `web/src/core/finding.ts` — added `RuleReviewStatus`
  (`heuristic | internally-tested | expert-reviewed | validated`),
  `FindingProvenance` (rule id, source docs, review status, last-reviewed
  date), optional `Finding.provenance`, and `REVIEW_STATUS_LABEL` copy map.
- `web/src/findings/squatRules.ts` — component findings carry
  `rule.squat.<key>` ids at `internally-tested` (thresholds are unit/fixture
  tested); the authored tempo CV threshold is `heuristic`.
- `web/src/findings/rootCauses.ts` — `RootCauseCard.provenance` is required
  and permanently `heuristic`: plausibility rules cannot be promoted without
  a validation study.
- UI — `findingCardModel`/`FindingCard` take an opt-in `showProvenance`;
  ResultsScreen enables it only for the Evidence-tab coach-question cards and
  renders the status line on Expert-tab root-cause cards. Summary is untouched
  (roadmap: keep Summary uncluttered).

## Verification (this session)

- `npm run build` clean (tsc + vite).
- `npm test` — 67 files, 440 tests passing, including new tests:
  - `squatRules.test.ts` — every finding has provenance; nothing claims
    `validated`; tempo is `heuristic`.
  - `rootCauses.test.ts` — every card is `heuristic` with a `rule.<id>` id.
  - `findingCardModel.test.ts` — provenance line hidden by default, shown on
    opt-in, null-safe.

## Scope guards honored

- No cue ranking or threshold changes.
- No `validated`/`expert-reviewed` status claimed anywhere.
- Review status renders in Evidence/Expert only.
