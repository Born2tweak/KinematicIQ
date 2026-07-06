# M32 — Trend Reporting with MDC-Aware Change Detection

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

Local history interpretation upgraded from raw deltas to conservative,
noise-aware change classification (`docs/research/05` SEM/MDC, "Is a change
real?").

New pure module `session/changeDetection.ts`:

- `HEURISTIC_CHANGE_THRESHOLDS` — per-metric noise thresholds for all 14
  included squat metrics, in display units, chosen ~2–4× plausible
  session-to-session single-RGB noise so "possible change" under-triggers.
  Every threshold is marked `basis: 'heuristic'` and the copy says
  "provisional heuristics, not validated reliability data".
- `classifyMetricChange(metricId, delta, {sessionCount, currentConfidence})`
  → `within-noise` | `possible-change` | `insufficient-history`:
  - fewer than `MIN_TREND_SESSIONS` (3) baseline sessions → abstain;
  - current set at Low camera confidence → abstain;
  - metric with no established threshold → abstain;
  - |delta| < threshold → within noise; otherwise possible change with
    hedged copy ("a possible change, not a confirmed one").

Wiring:

- `session/baseline.ts` attaches an optional `change: ChangeAssessment` to
  every `BaselineMetricDelta` (additive on `session/types.ts`; raw
  `delta`/`baselineValue`/`currentValue` remain untouched and inspectable in
  the Evidence-tab panel — M32 step 6).
- `storage/historyView.ts` `historyObservation` now uses the depth heuristic
  threshold (8°) instead of a hardcoded ±3°: sub-threshold deltas read
  "similar bottom depth … within measurement noise, not a change"; larger
  deltas read "a possible difference … not a trend claim or a progress
  grade". Same-protocol comparison requirement unchanged (M32 step 4).
- `ResultsScreen` baseline panel intro discloses the provisional-threshold
  basis and each row gets a classification chip ("within noise" /
  "possible change" / "not judged") with the full hedged copy as its title;
  chip styling added to `index.css`.

Deliberately absent (acceptance criteria): no progress score, no normative
comparison, no certainty language — "possible change" is the strongest
phrasing anywhere.

## Files changed

- Created: `web/src/session/changeDetection.ts`, `web/src/session/changeDetection.test.ts` (7 tests)
- Modified: `web/src/session/types.ts` (optional `BaselineMetricDelta.change`),
  `web/src/session/baseline.ts` (+2 baseline tests), `web/src/storage/historyView.ts`
  (+1 history test), `web/src/screens/ResultsScreen.tsx`, `web/src/index.css`

## Quality gates

| Gate | Result |
|---|---|
| `npm run build` | Pass |
| `npm test` | 53 files, **313 passed, 0 failed** (+9 tests) |
| `npm run test:coverage` | Pass — 87.49% stmts (up from 87.29%) |

## Acceptance criteria check

- ✅ Baseline under three sessions remains null (existing M31 test untouched).
- ✅ Invalid sessions remain excluded (existing test untouched).
- ✅ Small depth deltas classify as within noise (unit + baseline + history tests).
- ✅ Large deltas classify as possible change with hedged copy; copy-policy
  assertions forbid improve/progress/confirmed language.
- ✅ No progress score or normative comparison introduced.
- ✅ Thresholds documented as provisional in code, copy, and this note.

## Fitness delta

- Files: 2 created, 5 modified; diff ≈ +260 lines.
- Tests: +9 (7 unit, 1 baseline, 1 history view).
- Bundle: negligible; no new dependencies.
- Type health: no casts; new `ChangeAssessment`/`ChangeClassification` contracts;
  `classifyMetricChange` takes scalars so `session/types.ts` imports the type
  without a cycle.

## Chief Architect review

1. **What the roadmap had wrong/incomplete:** Nothing material. The
   `historyView` hardcoded ±3° depth wobble was an undocumented duplicate
   threshold (architectural-smell watchlist: duplicate thresholds) — now
   centralized in `changeDetection`.
2. **Milestones to split/merge/reorder:** None. M49 (reliability calculator)
   is the designated path to replace these heuristics with measured SEM/MDC;
   M48's validation status board should list `HEURISTIC_CHANGE_THRESHOLDS`
   as provisional entries.
3. **Simpler architecture discovered:** Scalar-based `classifyMetricChange`
   keeps the module dependency-free and lets both baseline and history-view
   consumers share one threshold registry.
4. **Assumptions validated:** The baseline structure from M31 accepted the
   additive classification without schema or storage changes.
5. **Assumptions invalidated:** None; thresholds are untested against real
   test-retest data by definition.
6. **Same design today?** Yes.
7. **New risks:** Users may still read "possible change" as confirmation;
   mitigated by chip + title copy and the panel intro. Watch in user testing.
8. **Risks less important:** "Copy drifts into progress claims" for history —
   both surfaces now share centralized hedged phrasing.
9. **Debt introduced:** Threshold values live in code, not yet in the metric
   registry/definitions — when M48 builds the validation status board, move
   or mirror them there.
10. **Debt eliminated:** Duplicate depth threshold in `historyView`.
11. **Research questions more important:** Actual test-retest SEM per metric
    from the two-session-per-athlete protocol (`docs/25` §3) — feeds M49.
12. **Less important:** None changed.
13. **Validation/claims posture:** Strengthened — change language is now
    systematically capped at "possible" and gated on history size + confidence.
14. **Dependency graph/critical path:** M32 complete unblocks M49 as planned.
    Next actionable milestone: **M33 (local session report export)** — M27
    still awaits a filter candidate with benchmark evidence, and M28-M30
    remain blocked on the protocol runtime (M39-M43).
