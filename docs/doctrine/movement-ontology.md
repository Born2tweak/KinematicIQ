# Doctrine — Movement Ontology (distilled)

**Status:** Canonical doctrine for the platform build. Distilled from `docs/research/01_Foundations_of_Human_Movement.md` (Part 6) and the already-canonical `docs/24_movement_ontology.md`. Cross-references (does not replace) `docs/strategy/product-thesis.md` and `docs/strategy/movement-expansion.md`. Where this summary and `docs/24_movement_ontology.md` differ in detail, the fuller `24` document governs the reasoning layer; this doc is the working reference for code reviews.

## Why an ontology

A movement is not an exercise label. It is a constrained, goal-directed control problem over a body-environment system (MD #1 §5.1). KinematicIQ therefore models movement as **phase-aware, contact-aware, task-aware time-series behavior** rather than similarity to a template. This is what lets squat be "protocol #1" instead of a hardcoded pipeline.

## The multi-axis ontology (MD #1 §6.1)

Every movement is described on independent axes, not a single taxonomy tree:

1. **Action class** — locomotion, manipulation, posture, balance, transition, load management, object/athletic skill.
2. **Task goal** — move body, move object, stabilize, recover, evade, strike.
3. **Constraint profile** — individual, task, environment (Newell's model is the top-level frame).
4. **Contact/support state** — open-chain, closed-chain, mixed, impact, suspended (a knee angle means different things in each).
5. **Phase structure** — setup, preparation, execution, transition, recovery, or cyclic phases.
6. **Quality profile** — control, coordination, stability, mobility, symmetry, smoothness, efficiency, consistency, rhythm, adaptability. A **profile**, never one grade.
7. **Risk/performance domain** — balance, precision, power, endurance, reaction (observation-framed only; see claims policy).

## Movement-agnostic vs movement-specific (MD #1 §6.3)

The split is the whole architectural bet:

| Movement-agnostic (shared engine) | Movement-specific (per profile) |
|---|---|
| Pose/skeleton representation | Movement event & phase definitions |
| Segment coordinate systems | Phase segmentation thresholds |
| Contact inference framework | Success/completion criteria |
| Constraint & quality-dimension schema | Joint/segment thresholds & cues |
| Variability decomposition | Risk/performance interpretation |
| Confidence & uncertainty reporting | Sport/clinical norms |
| Longitudinal trend tracking | Equipment-specific rules |

In this codebase: the shared engine is `analysis/videoAnalyzer.ts` (`runPipelineOnFrames`) + the `core/`/`protocols/`/`metrics/`/`findings/` layers built by the milestones; the per-movement config is the `MovementProfile` / `ProtocolDefinition`.

## Design principles that bind code (MD #1 §6.4)

1. **Score task-relevant error, not template deviation** — ask what variable the mover was stabilizing first.
2. **Context precedes interpretation** — a feature without task/load/environment/user context is a measurement, not a conclusion.
3. **Quality is multidimensional** — quality profile, never a single universal grade (reinforces the no-composite constraint).
4. **Phase-aware models** — segment before applying criteria; a metric's meaning depends on phase.
5. **Separate evidence from coaching convention** — mark confidence; some cues are evidence-backed, some are heuristics.
6. **Treat variability intelligently** — variation may be harmful, neutral, adaptive, or exploratory.
7. **Constraints generate recommendations** — suggest changes to task/environment/load, not just "wrong angle."
8. **Track longitudinal adaptation** — single-session meaning is limited; trend detection is the long-term value (M9 seam).

## Hierarchy of representation (MD #1 §5.6) — maps to module layers

Level 1 pose/segments (`cv/`) → Level 2 kinematic features (`analysis/`) → Level 3 phases/events (`phaseDetector`, `frameTrace`) → Level 4 coordination/quality dimensions (`analysis/posture/`, `scoring/`) → Level 5 task outcome/constraints (protocol completion standard) → Level 6 interpretation (`findings/`, `feedback/`) → Level 7 longitudinal (M9 history).

## The four universal coach questions (from `docs/24`, §4)

`movement-completion`, `strategy-selection`, `posture-organization`, `load-symmetry` — movement-generic by construction; squat is the first instantiation. Vocabularies are per-question (universal vs pattern-scoped); interpretation/recommendation maps are per-movement. This is the target the finding engine (M7) grows toward; it is not fully built in this milestone set, but new code must not contradict it.

## Non-negotiable consequence

Movement quality is a transparent multidimensional profile with confidence and uncertainty reported. **No composite universal movement score, ever** (MD #1 §4.4, §6.1 #6; MD #10 "should not build"). See `claims-policy.md`.
