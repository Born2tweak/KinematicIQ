# M00 — Repo Audit & Integration Map

Date: 2026-07-05. Docs-only milestone: verify `IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md` Section A against the live tree before any code changes.

## Baseline gate (verified)

From `web/`: `npm install` clean, `npm run build` (tsc + vite) zero errors, `npm test` = **30 files / 180 tests, all passing**. Matches the plan's stated baseline exactly.

## Tree verification

`web/src/` contains exactly the folders the plan maps: `analysis/` (+ `movement/`, `movement/profiles/`, `posture/`), `cv/`, `eval/`, `feedback/`, `scoring/`, `session/`, `screens/`, `components/` (+ `landing/`, `replay/`, `report/`), `hooks/`, `test/` (+ `fixtures/`, `helpers/`). 110 TS/TSX files total. Repo-root `src/` and `tests/` confirmed as `.gitkeep`-only scaffolds — unused, will not be touched.

`eval-tapes/live-session-2026-07-05.posetape.json` exists as described. `docs/strategy/`, `docs/validation/session-log.md`, and the numbered doctrine docs (`24_movement_ontology.md`, `25_capture_protocol_front_squat.md`) all present. The 11 research specs are now in-repo at `docs/research/01..11_*.md` (committed `29f38ef`) — these supersede the old absolute Codex paths listed in Section C of the plan.

## Squat-coupling map — confirmed

Section A's coupling list is accurate as-found:

- `analysis/movement/registry.ts` — `getActiveProfile()` hardcodes `SQUAT_PROFILE`; `MovementId` union already declares `'squat' | 'hipHinge' | 'jump' | 'sprint'` and `MovementKind = 'cyclic' | 'ballistic' | 'gait'` (good — M5/M10 extend, not invent).
- `session/types.ts` — `SetMetricsSummary` uses squat field names; `ComponentScores` is a fixed 5-key shape. Confirmed target for M6 dual-write.
- `scoring/scoringConfig.ts`, `feedback/feedbackTemplates.ts`, `phaseDetector`/`repCounter` defaults — squat-tuned, injected via profile.
- `screens/ResultsScreen.tsx` + `components/report/verdictEvidence.ts` + `FeedbackCard` read squat metric fields directly (M8 surface).
- `test/squat*` fixtures and `components/landing/` squat demos — squat-only by design; stays.

## Deltas from the plan (minor, none blocking)

1. `analysis/metricCollector.ts` and `analysis/stats.ts` have **no colocated tests** today (covered indirectly via `videoAnalyzer.test.ts` / `squatRegressions.test.ts`). M6 will add direct tests when `MetricResult[]` emission lands.
2. `feedback/feedbackEngine.ts`, `feedback/confidenceCalculator.ts`, `feedback/feedbackTemplates.ts` also lack colocated tests (`feedbackReasoning.test.ts` is the only feedback test file). Relevant to M2 coverage-scope decisions and M7.
3. Section C of the plan lists the research specs at absolute Codex paths; the in-repo `docs/research/` copies are the source of truth per owner instruction. Logged here so later milestones don't chase dead paths.
4. Working tree has untracked agent-tooling files (`.agent/`, `.claude/`, `.cursor/`, `bootstrap.ps1`, `START-HERE.txt`, `INSTALL-NOW.cmd`, `JULES_REPORT.md`, `AGENT-BOOTSTRAP.md`, `docs/review/`, `scripts/remove-duplicate-clones.ps1`, `start-claude-*`), confirming the explicit-path-staging rule. `master` is ahead of `origin/master` (nothing will be pushed).

## Invariants re-confirmed for later milestones

- `eval/replayParity.test.ts` + `eval/replayHarness.ts` reuse `runPipelineOnFrames` from `analysis/videoAnalyzer.ts` — the live/replay parity invariant is live and must survive every refactor.
- `session/setQualityGate.ts` full-abstain behavior present with observation-language comments.
- Coverage thresholds (80%) currently scoped to `src/cv/**` only in `web/vite.config.ts` — M2 must measure before widening.

## Test counts

Before: 30 files / 180 tests. After: unchanged (no source changes).
