# KinematicIQ Research Docs — Source Specs Index

These 11 documents are the **immutable sources of truth** for the movement-intelligence platform build. Do not edit them; if implementation must deviate (constraint or validation-finding conflict), log the conflict in the relevant milestone progress note under `docs/implementation/progress/`.

| # | Document | Purpose |
|---|---|---|
| 01 | `01_Foundations_of_Human_Movement.md` | Universal movement ontology, primitives/phase hierarchy, movement-agnostic vs -specific split. |
| 02 | `02_Mathematical_Algorithmic_Biomechanics_Spec.md` | Joint-angle math, signal filtering, motion segmentation FSMs, confidence/uncertainty propagation. |
| 03 | `03_Metric_Engine_Spec.md` | Universal metric ontology, MetricResult + confidence types, single-RGB defensibility exclusions, no-composite scoring philosophy. |
| 04 | `04_Coaching_Intelligence_Engine_Spec.md` | Evidence-strength framework, metrics→meaning reasoning pipeline, findings/cue generation, explainability. |
| 05 | `05_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md` | Validation tiers, benchmark harness design, dataset/QA discipline, confidence framework. |
| 06 | `06_CV_Subsystem_Technical_Spec.md` | Capture/landmark quality scoring, camera geometry checks, robust tracking, model-swap benchmarking discipline. |
| 07 | `07_Domain_Intelligence_Spec.md` | Domain profiles (sport/clinical), functional assessment modules, guardrails (no diagnosis, no injury prediction). |
| 08 | `08_Software_Architecture_and_Engineering_Specification.md` | Module/plugin contracts, protocol engine, domain model, data flow/versioning, testing strategy. |
| 09 | `09_Competitive_Intelligence_and_Product_Strategy.md` | Positioning as honest evidence-first analyzer; feature-gap priorities; what not to clone. |
| 10 | `10_Future_of_Movement_Intelligence_Roadmap.md` | Long-horizon bets (embeddings, digital humans, sensor fusion) and the explicit do-not-build-yet list. |
| 11 | `11_Product_Experience_Bible.md` | Capture readiness UX, progressive disclosure (Summary/Evidence/Expert), finding cards, design tokens, anti-patterns. |

Implementation mapping: see `docs/implementation/IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md`, Section B.

Navigation layer with stable ids (R01–R11), theme map, and the citation
convention for progress notes: `docs/research/INDEX.md` (M35).

## Supplemental research inputs

`NEXT_PROTOCOL_PORTFOLIO.md` and `INLINE_LUNGE_PROTOCOL_RESEARCH.md` record the
M73 ordering decision and selected research-only package. They do not authorize
data acquisition or protocol implementation.

`PUBLIC_MOVEMENT_DATASET_RESEARCH.md` is a dated, source-linked research input
added after the immutable R01–R11 specification set. It does not silently
change doctrine. Its accepted engineering consequences are tracked in
`docs/implementation/PUBLIC_DATASET_RESEARCH_TO_EXECUTION_MAP.md`, ADR-006
through ADR-010, and the post-M60 master-roadmap wave. Recheck dataset access
terms at the time of use.
