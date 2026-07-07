# M48 - Metric Validation Status Board

**Date:** 2026-07-07
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What changed

Created `docs/validation/METRIC_VALIDATION_STATUS.md` as the living board
for metric tiers, evidence, required landmarks, known failure modes, excluded
metrics, and promotion criteria. The board currently covers every emitted
squat metric from `web/src/metrics/squatMetrics.ts`, posture proxy metrics
from `web/src/metrics/postureMetrics.ts`, and the single-RGB metrics that
remain excluded by doctrine.

Updated `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` to make the
board part of the required maintenance loop: any metric add, exclusion, or
tier change updates the board in the same commit.

## Guardrails tightened while landing the board

The board surfaced two claim-creep risks from the live validation evidence:

- Abstaining metric rows now carry zero confidence instead of inheriting the
  session confidence chip.
- Capture provenance now threads through camera, upload, replay, and protocol
  analysis so exported metrics do not claim a fake live/raw source.
- The report-level quality gate now names impossible left/right knee
  asymmetry and mostly one-sided knee visibility, keeping left/right
  comparisons from silently looking trustworthy when one knee was unreadable.

These are report-trust changes only; they do not retune rep counting or
movement thresholds.

## Verification

- Targeted Vitest:
  `npm test -- setQualityGate squatMetrics buildSessionResult`
  (38 tests passed in this session before the note was written).
- Full milestone gates are required before commit:
  `npm run build`
  `npm test`

## Not done

No validation tier was upgraded by assertion alone. The `research` and
`clinical` tiers remain unavailable for current product claims.
