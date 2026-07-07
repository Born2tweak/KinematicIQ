# M36 — Research-to-Code Traceability Matrix

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

`docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` (new) — the living
matrix answering "which code implements this research concept?":

- Status vocabulary defined: `implemented` / `partial` / `planned` /
  `deferred` / `rejected` (roadmap step 1).
- Eight themed tables (core schemas, perception, analysis, metric engine,
  coaching intelligence, session/quality/history, validation, experience,
  strategy) with columns: concept → R-id source (M35 convention) → code
  files → milestones → status → validation tier.
- **Rejected ideas are explicit rows, not omissions** (acceptance
  criterion): kinetics/force/torque, muscle activation, diagnosis/injury
  risk, composite score (marked *never*), backend/FHIR; deferred rows for
  pose-model swap, filter upgrade (M27 gate), embeddings, sensor fusion.
- Every `web/src/core/` type has a row (testing requirement): confidence,
  provenance, metric, protocol, finding — verified against `ls web/src/core`.
- All `implemented` rows carry file references (roadmap "do not do": no
  status claims without files); file paths verified against `ls` output of
  `cv/`, `camera/`, `export/`, `analysis/`, `metrics/`, `findings/`,
  `session/`, `protocols/` this session.
- **Maintenance rule stated as binding:** any milestone changing source
  behavior updates affected rows in the same commit; a stale row is a
  defect (addresses the roadmap risk of performative traceability).

## Quality gates

Docs-only; gates run per roadmap: `npm run build` clean, `npm test` passing.
