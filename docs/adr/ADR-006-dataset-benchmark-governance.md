# ADR-006: Dataset and Benchmark Governance

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

KinematicIQ needs public datasets to diagnose tracking, validate kinematics, test camera/view robustness, and develop protocols. Most useful datasets are large, restricted, research-only, registration-gated, or licensed separately from their code. Existing pose tapes provide deterministic regression evidence but not independent biomechanical ground truth.

## Decision

Create a metadata-first dataset registry and benchmark system. Raw external data is local-only and ignored. Git tracks manifests, source/version URLs, checksums, skeleton mappings, license/access classification, preprocessing versions, redacted CI fixtures, benchmark configurations, and aggregate outputs that contain no participant media.

Tracking filters, MediaPipe configuration, model choice, rep gates, phase gates, and confidence thresholds may change only after a saved baseline and a candidate report show no unacceptable per-dataset regression. Aggregate improvement cannot hide a failed tape, camera view, or protected failure mode.

Automated tooling must not bypass registration, click-through agreements, credentials, consent restrictions, or non-commercial terms. Those remain manual approval checkpoints.

## Alternatives considered

1. Commit selected public datasets: rejected for size, rights, privacy, and provenance risk.
2. Download everything immediately: rejected because most data is irrelevant to current deterministic evaluation and creates legal/storage debt.
3. Continue only with local pose tapes: rejected because they cannot independently validate anatomical angles or cross-dataset robustness.

## Consequences

- M61-M64 precede evidence-based tracking changes.
- Public data can be metadata-only, evaluation-only, research-only, legally pending, or future-ML-only.
- CI uses synthetic or explicitly redistributable redacted samples; full benchmarks run locally.
- Every benchmark result identifies dataset version, adapter, skeleton mapping, MediaPipe/model/filter/algorithm versions, device/runtime, and exclusions.

## Revisit when

A dataset receives a new license, a commercial data partnership exists, or the product scope adds model training.
