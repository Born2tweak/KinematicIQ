# Decision Log

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
