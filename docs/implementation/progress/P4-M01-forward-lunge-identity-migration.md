# P4-M01 — Forward-Lunge Identity Migration

**Status:** Complete 2026-07-16.

New protocol definitions, research results, metric/rule namespaces, evaluator reports, and observation provenance use `forwardLungeStrideReturn` and `side-view-forward-lunge-stride-return-v1`. `normalizeProtocolId` and observation normalization retain read compatibility for `inlineLunge` and `side-view-inline-lunge-v1`; unknown IDs fail closed. The existing `protocols/inlineLunge/` directory remains an internal legacy module path and is not an artifact identifier.

The registry contains one planned Forward Lunge definition, with null profile and no input modes. Squat remains the only available runtime. Legacy-reader removal is prohibited until a later corpus audit proves no stored artifact, pose tape, report, manifest, or session uses it.

Verification: 59 targeted tests and production build passed; the canonical three-sequence synthetic evaluator reproduced exact-count rate 1, MAE 0, false activation 0, and dropout 0. No thresholds or segmentation behavior changed.
