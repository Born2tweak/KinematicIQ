# M51 — Quality review / retake screen model

**Status:** Complete (2026-07-07)

## What was built

An explicit accept/retake recovery step between analysis and the movement
report, as a pure model plus a light in-place Summary-tab panel (rather than a
separate route — smaller blast radius, no router-state plumbing).

- `web/src/session/qualityReview.ts` — `reviewSetQuality(SetQualityAssessment)`
  → `QualityReview` with `decision` (`show-results | recommend-retake |
  block-report`), an observation-language `headline`, `retakeGuidance`
  (the gate's capture fixes), `retakeRecommended`, and `allowInspection`
  (always true — abstaining from claims never hides the evidence).
- `web/src/session/qualityReview.test.ts` — valid → results; questionable →
  retake + observations kept; invalid → report blocked, fixes carried, audit
  still reachable; headlines checked against the project's real
  `FORBIDDEN_PHRASES` (not a divergent list).
- `web/src/screens/ResultsScreen.tsx` — renders a retake panel on the Summary
  tab when `retakeRecommended`, with a "Record again" CTA. Guidance list is
  suppressed for full-invalid sets because the existing "Why there is no
  movement report" block already itemizes the same fixes (no duplication).
- `web/src/index.css` — `.quality-review__guidance/__fix` mirror the existing
  abstain-list styling for visual consistency.

## Scope guards honored

- Invalid full abstain unchanged — the existing invalid/questionable blocks and
  their gating (`isInvalidSet`, `isQuestionableSet`) are untouched.
- No pose tapes discarded; `allowInspection` is always true.
- No report claim shown earlier than the quality gate allows — the panel only
  adds a recovery CTA and (for non-invalid) the capture fixes.

## Verification (this session)

- `npm run build` clean (tsc + vite) after the final wiring edit.
- `npm test` — 68 files, 444 tests passing (was 67/440; +4 qualityReview).
- Diff re-read (ladder rung 6): caught and removed a capture-fix duplication
  between the new panel and the existing invalid block.

## Not verified this session

- **Visual render (ladder rung 5):** the questionable/invalid Summary state
  was not screenshotted. Reaching it in the browser needs a crafted
  bad-capture `SessionResult` in router state (the `/results` route otherwise
  shows the "No session yet" fallback) or a live low-quality recording.
  Logic and copy are unit-tested; pixel layout is unconfirmed.
