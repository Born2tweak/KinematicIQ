# Domain Module Backlog (M57)

**Status:** Canonical governance doc. A backlog is **not a commitment to
build** — every module below is gated on evidence and doctrine. No module here
may be implemented before its stated data + validation gates are met and its
forbidden-claims row is enforced in copy.

Sources: `docs/research/07_Domain_Intelligence_Spec.md` (movement demands,
functional/sport/clinical modules), `docs/research/10_Future_of_Movement_Intelligence_Roadmap.md`,
`docs/doctrine/claims-policy.md`, `docs/doctrine/deferred-scope.md`,
`docs/doctrine/movement-ontology.md`. Update
`docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md` when any module moves
status or ships.

## Classification legend

| Status | Meaning |
|---|---|
| `now` | Shipped or actively in the current milestone set |
| `next` | Approved to build once its data + validation gates are met |
| `research` | Needs a validation study / labeled data before product surface |
| `deferred` | Out of scope this build; gated on a scope change (see deferred-scope) |
| `rejected` | Permanently out of product claims (doctrine prohibition) |

Every module observes the platform invariants: **verdict-or-abstain, no
composite 0–100 score, full abstain on invalid capture, observation language
only** (movement-ontology, claims-policy). These are not repeated per row.

## Training / strength modules

| Module | Status | Required data | Validation gate | Product surface | Forbidden claims |
|---|---|---|---|---|---|
| Back/front squat | `now` | Single-RGB side/front; existing tape suite | Shipped with quality gate + provisional heuristics; M27 filter + reliability study still open | Squat report (M8) | Injury risk, diagnosis, kinetics, composite score |
| Hip hinge / deadlift pattern | `next` | Side-view RGB; labeled hinge tapes | Labeled ground-truth for hinge angle + a reliability study before any threshold copy | Hinge report reusing cyclic engine (M42) | Load/spine-safety claims, "correct/incorrect", injury risk |
| Countermovement jump | `next` | Sagittal RGB; jump-height proxy validation | Jump-height proxy validated vs. a reference; trend-only until then (R07 §Evidence) | Jump metrics as trends, within-athlete | Absolute performance grades, readiness-to-play, ACL risk |
| Single-leg squat / step-down | `research` | Frontal + sagittal RGB; labeled valgus proxy | Frontal-plane reliability; valgus proxy is screening-grade only | Movement observation vector | Knee valgus → injury-risk diagnosis |

## Functional assessment modules (see M58 boundaries doc)

| Module | Status | Required data | Validation gate | Product surface | Forbidden claims |
|---|---|---|---|---|---|
| Sit-to-stand (5xSTS / 30s) | `next` | Full-body sagittal RGB; rep timing | Timing/rep reliability; **no fall-risk or frailty output** (M58) | Completion, timing, consistency observations | Fall risk, frailty, impairment, clinical score |
| Timed Up and Go | `research` | Full-path capture; room-scale calibration | Path/turn segmentation validated; standalone fall-prediction explicitly disclaimed (R07) | Timing segments as observations | Fall-risk classification, diagnosis |
| Y-Balance / SEBT-style reach | `research` | Floor calibration + limb-length; frontal | Reach reliability; population-specific interpretation required (Powden/Gribble/Ko) | Reach distance + asymmetry, within-athlete | Normative cutoffs, injury prediction |
| Gait / run screen | `research` | Full-path or treadmill RGB; cadence | Temporal-gait metric validation | Cadence, symmetry, stride-time variability trends | Pathological-gait labels, diagnosis |
| Landing mechanics (LESS-style) | `research` | Frontal + sagittal RGB | Frontal-plane validity; LESS licensing if used verbatim | Landing observation vector | ACL-risk score, injury prediction |

## Sport-specific modules

| Module | Status | Gate |
|---|---|---|
| Jump/cut athletes (volleyball, basketball, soccer) | `deferred` | Requires the functional + jump modules validated first |
| Overhead athletes (throwing/hitting; hip-shoulder separation) | `deferred` | Multi-view capture + validation; single-RGB out-of-plane is weak |
| Running/track gait profiles | `deferred` | Follows gait-screen research track |
| Para-sport (wheelchair propulsion) | `deferred` | Dedicated capture + validation program |

## Clinical & clinical-adjacent modules — extra gates

Any clinical-adjacent module (PT, ortho, neuro, geriatrics, pediatrics, occ
health, post-op rehab from R07 Part 3) is **`deferred` at minimum** and carries
a hard gate:

- **Not a medical device.** No diagnosis, no clinical score, no return-to-play,
  no fall-risk/frailty/impairment classification, ever, at any confidence
  (claims-policy; deferred-scope FHIR/clinical row).
- **Gate to even pilot:** a regulatory pathway decision **and** clinical
  validation for the specific population + endpoint, plus clinician-configured
  restrictions. Until then these stay documentation only.

## Permanently rejected (not deferrals)

| Item | Why |
|---|---|
| Injury-risk / injury-prediction scores for any module | High false-positive science; forbidden conclusion (deferred-scope, claims-policy) |
| Composite 0–100 "movement quality" per module | Permanent prohibition (ADR-003, ontology §6) |
| Diagnosis / pathology labels | Not a medical device |

## How a module advances

1. Enter as `research` with its data + validation gate written here.
2. Meet the gate (labeled data + reliability/validity study) → move to `next`.
3. Implement reusing the cyclic engine (M42) / protocol runtime (M39) — never a
   hand-coded FSM per movement.
4. Enforce the forbidden-claims row in copy; the M38 claims audit must pass.
5. Update traceability in the same commit.
