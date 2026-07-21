# KinematicIQ Expanded-10 Revision 4 — Execution-Semantics Revision Report

**Date:** 2026-07-21
**Revision type:** focused correction of Revision 3 review findings
**Decision:** approve as the canonical candidate execution contract; repository integration and clean-clone evidence remain required before scheduler authority

## Executive result

Revision 4 resolves the internal contradictions that prevented Revision 3 from being handed directly to an autonomous scheduler. It does not claim that repository tooling, protocol engineering, participant studies, or scientific validation have executed.

The central correction is a three-dimensional state model:

- milestone status records whether bounded work executed correctly;
- result code records what that work found;
- protocol lifecycle records the derived product/scientific state.

This permits a correctly executed study to record a preregistered scientific failure, and permits a blocked protocol to reach an auditable terminal disposition, without either outcome qualifying for release.

## Review findings closed

| Revision 3 finding | Revision 4 correction | Evidence |
|---|---|---|
| Registry omitted its own normative fields | All 175 records now contain objective, user outcome, in/out scope, manual-gate structure, rollback/abstention, research trigger, state updates, commands, and outcome transitions | `KINEMATICIQ_MILESTONE_REGISTRY.yaml`; `KINEMATICIQ_MILESTONE_SCHEMA.yaml` |
| Acceptance was mostly prose | Records now bind artifact existence, current-commit evidence, unique outcome assertion IDs, targeted contract commands, and code regression/build predicates where applicable | Registry `acceptance` and `verification` blocks |
| Pass-only graph could not represent scientific failure/block | Dependency conditions accept explicit statuses; locked study and release disposition have separate pass, gate-fail, human-block, and external-block outcomes | Registry KQ-092/KQ-093 pattern repeated across ten protocols |
| Lifecycle conflicted with registry transitions | Milestone status, result code, protocol lifecycle, and orthogonal `DataReady` are separated; reducer precedence is specified | Master §5; execution-semantics companion |
| Seven-day plan exceeded modeled capacity | Six-package promise withdrawn; 134-hour committed planning capacity and committed/probable/stretch bands replace it | Capacity-aware forecast |
| Resource owners were only role labels | Andrian Kolliegbo is the accountable owner; each track has an execution owner, first action, due policy, approval route, escalation, and contact-log artifact | Resource registry schema v2 |
| Validation registry looked more locked than it was | Registry is explicitly a preregistration work queue; each protocol has reference justification, lock preconditions, and a future manifest path | Protocol-validation registry schema v2 |
| Equal rigor risked equal instrumentation burden | Claim-level reference justifications select the least burdensome direct criterion without weakening decision discipline | `reference_justification` per protocol |
| Research/replan failure cases were under-tested | Ten required fixtures now cover happy, scientific-fail, human/external block, technical failure, negative model decision, license rejection, contamination, public invalidation, and isolation | Execution-semantics companion |
| Cross-protocol closeout was over-centralized | Per-protocol disposition, rolling dashboard, and final Expanded-10 audit are distinct | Forecast §7 and master integration rules |

## Structural verification completed

The local bundle audit confirmed:

- 175 unique milestone records;
- 759 dependency edges;
- one root (`KQ-001`);
- no missing dependency or unlock references;
- exact dependency/unlock reversibility;
- no graph cycles;
- all required full-schema fields present in every record;
- at least three named predicates in every milestone;
- exact verification commands in every milestone;
- outcome-aware locked-study and release-decision semantics for all ten protocols;
- successful YAML parsing for the milestone, resource, protocol-validation, and schema artifacts.

The environment did not contain a general JSON Schema validation package, so the audit used an equivalent deterministic structural checker for required keys, graph structure, outcomes, commands, and release invariants. Repository integration must install or implement the canonical validator and rerun the schema plus fixtures in a clean clone.

## Deliberate remaining limits

Revision 4 remains a candidate execution contract for three honest reasons:

1. `tools/program/verify_milestone.py` and `tools/program/run_contract_checks.py` are required repository integrations; this document bundle does not prove they exist or pass in the live repository.
2. Generic contract predicate types now have exact IDs and evidence paths, but their per-node assertion implementations must be bound to real code/tests during KQ-001–KQ-015, beginning with squat and forward lunge.
3. Expected work hours remain planning estimates until live reconciliation and observed completion times regenerate the forecast.

These are integration tasks, not reasons for another conceptual rewrite.

## Canonical bundle

1. `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
2. `KINEMATICIQ_MILESTONE_SCHEMA.yaml`
3. `KINEMATICIQ_MILESTONE_REGISTRY.yaml`
4. `KINEMATICIQ_EXECUTION_SEMANTICS_AND_FIXTURES.md`
5. `KINEMATICIQ_EXECUTION_WAVES_AND_CRITICAL_PATH.md`
6. `KINEMATICIQ_RESOURCE_REGISTRY.yaml`
7. `KINEMATICIQ_PROTOCOL_VALIDATION_REGISTRY.yaml`
8. `KINEMATICIQ_RESEARCH_REPLAN_VERTICAL_SLICE.md`

Revision 3 reports remain historical review evidence and are not current scheduler authority.

## Required next execution sequence

1. Integrate the eight-file bundle on `automation/expanded-10`.
2. Implement schema/compiler, state reducer, ready-queue, and evidence-record tooling.
3. Run the ten synthetic execution fixtures.
4. Bind squat and forward lunge contracts to real repository source, test, build, replay, and artifact commands.
5. Run from a clean clone and capture actual hours.
6. Recompute the capacity forecast and expand the proven contract pattern to the remaining eight movements.
7. Continue autonomous engineering and resource acquisition while scientific gates remain fail-closed.

## Final assessment

Revision 4 is materially more honest and operational than Revision 3. It closes the schema, state, dependency, scheduling, resource, and validation-role contradictions without weakening scientific rigor or returning to short-horizon replanning.

It is ready for repository integration. It is not yet evidence that KinematicIQ's autonomous scheduler or Expanded-10 validation program has run.
