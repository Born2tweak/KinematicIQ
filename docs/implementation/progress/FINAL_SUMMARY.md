# Implementation run — final summary

Executed per `docs/implementation/IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md`
against the 11 source specs in `docs/research/`. All milestones M0–M11
completed; none skipped or blocked. Squat analysis remained green end-to-end
at every commit (build + full vitest suite, including replay-parity and the
M2 tape regression net).

## Milestones and commits

| Milestone | Commit | Message |
|---|---|---|
| Pre-M0 | `29f38ef` | docs(research): add 11 movement-intelligence source specs + implementation plan |
| M0 | `3b6b2e5` | docs(m00): repo audit and integration map — baseline 30 files / 180 tests confirmed |
| M1 | `9700ec0` | docs(m01): doctrine — movement ontology, claims policy, deferred-scope ledger |
| M2 | `bfd89e8` | test(m02): tape regression net + widened coverage scope |
| M3 | `a68f423` | feat(m03): core schemas — confidence, provenance, metric, protocol, finding |
| M4 | `5b51547` | feat(m04): scored capture readiness model + pre-capture checklist UX |
| M5 | `0e638e6` | feat(m05): protocol engine v1 — squat as protocol #1, registry, protocolId on SessionResult |
| M6 | `70b59a1` | feat(m06): metric registry v1 — keyed MetricResult[] dual-written with legacy summary |
| M7 | `ce0fba0` | feat(m07): finding engine v1 — evidence-chained findings, cues derived from findings |
| M8 | `ee67f92` | feat(m08): progressive-disclosure results tabs with finding cards |
| M9 | `a6acb96` | feat(m09): local opt-in session history with IndexedDB store |
| M10 | `3d7aee5` | feat(m10): planned protocol stubs (hip hinge, jump, sprint) with honest picker UI |
| M11 | (this commit) | docs(m11): README + architecture doc sync, final summary |

## Test counts

| Point | Test files | Tests |
|---|---|---|
| Baseline (pre-M0) | 30 | 180 |
| After M2 | 31 | 182 |
| After M3 | 36 | 202 |
| After M4 | 37 | 206 |
| After M5 | 38 | 211 |
| After M6 | 39 | 219 |
| After M7 | 41 | 225 |
| After M8 | 42 | 231 |
| After M9 | 43 | 239 |
| Final (M10/M11) | 43 | 240 |

Coverage gate (vite.config.ts): scope `src/cv`, `src/analysis`, `src/session`,
`src/eval`; thresholds lines/statements/branches 75, functions 80.

## Constraint/spec conflicts logged

- **Composite score**: research doc #8 sketches a `CompositeScore` type; the
  hard constraint (no composite 0–100 score, ever) won — omitted from
  `core/metric.ts` and from all UI (M3, M8 notes).
- **Backend persistence**: research doc #8 §9 describes backend entities and
  sync; only the local-first flavor was implemented (M9 note;
  `docs/doctrine/deferred-scope.md`).
- **Exports (C3D/OpenSim/FHIR/Parquet)**, 3D avatars, wearables, embeddings,
  enterprise: all deferred per plan — ledger in `deferred-scope.md`.

## Deliberately not touched

- Rep-counting gates and phase-detector thresholds (validation findings #5/#6
  remain intentionally open).
- Pose-tape format (`eval/poseTape.ts`) — no version bump was needed; all
  tapes in `eval-tapes/` remain replayable.
- MediaPipe pose engine.
- Quality-gate abstain behavior, confidence gating, DisclaimerBanner copy —
  preserved byte-identical (cues verified against pre-M7 output).

## Open items for the owner

- `SessionResult.baseline` (`SessionBaseline`) still null — populate from
  saved history once a report-level consumer exists (M9 note).
- Legacy `SetMetricsSummary` retained as the stored serialization surface
  (plan's open question resolved as "keep, versioned").
- Validation findings #5/#6 (rep gates / phase thresholds) still open —
  require new tape data, not code.
- The M2 tape regression test skips when the local 10MB session-c tape is
  absent (tape is gitignored); regression protection is local-machine only.
