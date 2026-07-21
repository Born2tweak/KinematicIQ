# Decision Log

## 2026-07-21: Restrict negative-decision skips to typed conditional nodes

- Status: accepted for the Revision 4 repository control kernel.
- Decision: only KQ-042, KQ-054, and KQ-168 may produce `SkippedByDecision`; only edges explicitly typed `conditional_decision` may consume it. Mandatory safety, privacy, validation, reproducibility, and release edges require their declared passed or owned blocker dispositions.
- Evidence: `docs/program/milestone_schema.yaml`, `docs/program/milestone_registry.yaml`, `docs/program/predicate_catalog.yaml`, and the ten execution fixtures.
- Consequence: a negative challenger, hybrid, or optional multi-protocol decision can preserve baseline progress without creating a general gate bypass.
- Revisit when: the registry adds another genuinely optional implementation whose absence is an intended evidence-backed outcome.


## 2026-07-15: Reconcile Phase 3 and approve the Phase 4 identity contract

- Status: accepted for P4-M00 documentation; code migration remains pending P4-M01.
- Decision: the movement is user-facing `Forward Lunge`, scientifically `Forward lunge with stride and return`, with future canonical ID `forwardLungeStrideReturn`, task version `forward-lunge-stride-return-v1`, and observation protocol `side-view-forward-lunge-stride-return-v1`.
- Compatibility: `inlineLunge` becomes a deprecated historical/read-compatible alias and may remain only when a source-native dataset label is explicitly qualified.
- Runtime/ontology separation: the Phase 3 six-state runtime and Phase 4 human-label event ontology are related but not interchangeable.
- Bottom construct: compare pelvis-drop and maximum lead-knee-flexion candidates during development; do not change thresholds or runtime events in P4-M00.
- Availability: squat remains the only available protocol. Forward Lunge remains planned, experimental, unavailable, and non-actionable.
- Evidence: ADR-011 through ADR-015; `web/src/protocols/inlineLunge/index.ts`; `segmenter.ts`; `inlineLunge.test.ts`; implementation commit `f49558e`.

## 2026-07-15: Fast-forward the authoritative frontier

- Status: accepted.
- Context: `origin/master` was `8d8a77d`; `f49558e` was pushed on `origin/agent/phase2-runtime-and-validation`; `master` had no unique commits and was an ancestor of the Phase 3 tip.
- Decision: establish `f49558e` as the authoritative implementation frontier using fast-forward integration; preserve all five intervening commits.
- Consequences: Phase 4 documents must qualify their original `8d8a77d` observations and cite the superseding Phase 3 source and tests.

## 2026-07-10: Use an Aurelian compatibility layer

- Status: accepted.
- Context: KinematicIQ already has mature doctrine, architecture, roadmap, progress, ADR, research, validation, UX, and governance documents.
- Decision: add only a Codex loader and Aurelian state/evidence/decision/resource/traceability indexes; do not copy the generic Aurelian project-bible document set.
- Alternatives: full template install; no project integration.
- Evidence: `docs/adr/ADR-009-aurelian-compatibility-layer.md`.
- Consequences: one canonical project system; Aurelian agents can orient without duplicating truth.
- Revisit when: canonical project docs are consolidated or materially removed.

## 2026-07-10: Benchmark before tracking changes

- Status: accepted.
- Decision: tracking/filter/model/gate changes require a versioned benchmark baseline and per-failure-mode evidence; public data may be evaluation-only and stays outside git.
- Evidence: `docs/adr/ADR-006-dataset-benchmark-governance.md`.

## 2026-07-10: Finish the protocol execution seam before protocol two

- Status: accepted.
- Decision: route state and result IDs are insufficient; live, upload, replay, quality, metrics, findings, completion, and report configuration must run through the selected protocol contract before another protocol is marked available.
- Evidence: `docs/adr/ADR-007-protocol-runtime-evidence-gates.md`.

## 2026-07-10: Visualizations must answer a named question

- Status: accepted.
- Decision: add charts only when a validated metric and explicit user/expert question justify them; provide text/table alternatives and performance limits.
- Evidence: `docs/adr/ADR-008-results-visualization-evidence-policy.md`.

## 2026-07-10: Public data is evidence, proprietary data is the moat

- Status: accepted.
- Decision: use public datasets for metadata, evaluation, protocol research, or future ML according to license; build a consented proprietary consumer-video plus lab/expert corpus for commercial validation.
- Evidence: `docs/adr/ADR-010-public-vs-proprietary-data.md`.
