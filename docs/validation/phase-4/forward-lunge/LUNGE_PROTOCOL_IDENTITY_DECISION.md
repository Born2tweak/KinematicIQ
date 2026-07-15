# Lunge Protocol Identity and Naming Decision

> **Canonical reconciliation (2026-07-15):** Original repository-status observations below refer to the audited `8d8a77d` snapshot unless a later commit is named. Phase 3 at `f49558e` superseded the no-implementation conclusion with an unavailable experimental six-state seam (`web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, and `inlineLunge.test.ts`). It did not provide human labels, criterion validity, reliability, live/upload/session/results integration, coaching authority, or public availability. The approved identity is **Forward lunge with stride and return**; `inlineLunge` is historical pending P4-M01. Squat remains the only available protocol. This specification authorizes no collection, acquisition, threshold change, activation, or claim.
**Status:** Accepted for canonical documentation; additive code migration pending P4-M01
**Decision type:** Product, biomechanics, research-transfer, and architecture identity  
**Repository snapshot:** `Born2tweak/KinematicIQ`, `master` / `origin/master` at `8d8a77d8ab0a6ab0c240f8327ef51e467dfd4cc2` (verified 2026-07-14)  
**Research basis:** Completed Phase 4 package dated 2026-07-14, layered locally over the repository snapshot  
**Implementation authorization:** None. This record does not authorize code, data acquisition, locked labeling, claims, or public availability.

## Decision summary

**Recommendation:** Adopt **forward lunge with stride and return** as the canonical movement identity.

| Naming surface | Recommended value |
|---|---|
| Canonical name | **Forward lunge with stride and return** |
| Protocol ID | **`forwardLungeStrideReturn`** |
| User-facing name | **Forward Lunge** |
| Research-facing name | **Forward lunge with stride and return** |
| Dataset/task version ID | **`forward-lunge-stride-return-v1`** |
| Default observation-protocol ID, after validation | **`side-view-forward-lunge-stride-return-v1`** |
| Deprecated product/research name | `inline lunge` |
| Permitted legacy use | Source-native dataset activity alias only, with an explicit mapping to the canonical task |

This recommendation is not a silent decision. It becomes binding only when the owner-approval block at the end of this record is signed. Until then, the protocol remains research-only and the current production registry remains unchanged.

## Why this is the recommended identity

The described task starts in bilateral standing, advances one foot, descends and ascends in a forward split stance, and completes only after the advanced foot returns to the calibrated bilateral-standing region. That contract is directly represented by “forward lunge with stride and return.”

It is not the Functional Movement Screen (FMS) inline lunge. The FMS test uses a measured heel-to-toe split stance, a dowel held against the head/thoracic spine/sacrum, a prescribed rear-knee touch behind the front heel, and a return to the same split stance. The official FMS overview describes a split stance and reciprocal upper-extremity position; published FMS procedures add tibia-length spacing, dowel contacts, and rear-knee contact.[^fms-official][^fms-procedure]

“Forward lunge” and “anterior lunge” are both used in primary literature for a bilateral-standing → forward-step → lower → push backward → bilateral-standing task.[^anterior-lunge][^forward-lunge] Because the short labels are not sufficiently self-defining across datasets and exercise literature, the research-facing name and ID should retain “stride and return.”

## Verified repository behavior

### What is implemented

At the verified `8d8a77d` repository snapshot, there was **no implemented lunge protocol or lunge FSM**. Phase 3 later added the unavailable experimental seam at `f49558e`.

- `web/src/core/protocol.ts:26` defines only `squat`, `sitToStand`, `hipHinge`, `jump`, and `sprint` protocol IDs.
- `web/src/protocols/registry.ts:22-28` registers those five protocols and no lunge.
- `web/src/protocols/registry.ts:31` keeps `squat` as the active protocol.
- `web/src/protocols/runtime.ts:175-177` registers only `SQUAT_RUNTIME`.
- `web/src/analysis/cyclic/cyclicEngine.ts:75-80` drives the shared cyclic loop from the minimum bilateral knee angle; it has no lead-foot departure, planted-region, lead-side, travel-direction, or foot-return contract.
- `web/src/analysis/phaseDetector.ts:147-191` implements the squat-shaped `STANDING → DESCENDING → BOTTOM → ASCENDING → STANDING` state transitions. Standing re-entry can be established by hip or knee extension alone; it does not require bilateral foot return.
- A repository-wide search found no `inlineLunge`, `flsr-v0`, or inline-lunge term in TypeScript, JavaScript, or JSON code/tests.

For the original `8d8a77d` comparison, none of the eight candidates matched an implementation because none existed then. The later `f49558e` seam matches the stride-and-return identity but remains unvalidated and unavailable. The “matches current FSM” judgments below use two explicit columns:

1. **Implemented FSM:** always “No—none exists.”
2. **Phase 4 proposed chain:** whether the candidate matches the research/annotation hypothesis of stable bilateral standing → forward step/visible plant → descent → bottom → ascent → foot return → stable bilateral standing.

### What is proposed, but not implemented

The completed Phase 4 package consistently defines a research target:

- stable bilateral standing before the trial;
- declared anatomical lead side;
- lead-foot departure into a forward planted position;
- descent, bottom near maximum lead-knee flexion, and ascent;
- lead-foot movement back toward the calibrated standing anchor;
- completion only after both feet are stably back in their calibrated standing regions;
- one fixed near-sagittal consumer RGB camera, lead side nearest where feasible, with the full travel corridor and both feet visible;
- actual FMS inline lunge, static split squat, walking, reverse, and lateral lunges treated as wrong-movement negatives.

This is documented in:

- `docs/research/INLINE_LUNGE_EVIDENCE_UPDATE.md:11-54,128-168,184-193`;
- `docs/validation/INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md:1-35,100-155`;
- `docs/validation/INLINE_LUNGE_DATASET_AND_CAPTURE_SPEC.md:172-219`;
- `docs/validation/INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md:46-85`.

The Phase 4 materials themselves mark the identity as awaiting owner approval. They are research specifications, not verified runtime behavior.

## Formal movement definition

### Movement definition

A **forward lunge with stride and return** is a discrete, unilateral, sagittal-direction task in which a participant:

1. begins from a calibrated, stable bilateral-standing stance;
2. advances the declared lead foot anteriorly from its calibrated standing region;
3. establishes a visibly stable forward foot position while the trailing foot remains rearward;
4. lowers and reverses through a readable lunge excursion;
5. ascends;
6. moves the lead foot posteriorly toward its original standing region; and
7. re-establishes stable bilateral standing within the calibrated start regions.

The definition does **not** require a prescribed knee angle, step length, trunk angle, rear-knee contact, load, tempo, or FMS score. “Visible plant” is an RGB observation, not a claim of force contact. “Bottom” is a segmentation convention, not a normative depth judgment.

### Start definition

**Setup eligibility:** Both feet are readable inside their calibrated standing regions; declared anatomical lead side and mirror state are known; the required landmark chains are readable; timestamps are valid; and the body is stable for a versioned dwell.

**Trial start:** The first frame of sustained departure of the declared lead foot from its calibrated standing region that continues into a target attempt. Body sway, a verbal cue, heel motion that does not establish a step, and preparatory shuffling do not start a trial.

### Bottom definition

The bottom event is the frame of maximum lead-knee flexion within the readable forward planted interval, cross-checked with the movement reversal. For a single plateau, choose the temporal midpoint of frames inside the versioned extremum tolerance; retain plateau bounds. If multiple comparable extrema, bounce, occlusion, tracking discontinuity, or sampling prevent deterministic selection, mark the bottom ambiguous rather than forcing an exact frame.

This convention must not be described as “correct depth,” rear-knee contact, force-plate contact, maximum loading, or a clinical endpoint.

### Completion definition

Completion occurs at the first frame of a qualifying stable-return interval in which:

- the lead and trailing feet are both readable and inside their calibrated standing regions;
- anatomical side identity is continuous;
- the stance and required landmarks remain stable for the versioned return dwell; and
- no clip edge, next trial, camera epoch change, or unrecovered tracking gap interrupts the dwell.

The completed trial interval extends through the end of that dwell. Knee extension, upright trunk position, or ascent alone is insufficient. A trial whose ascent is readable but whose foot return is absent or unreadable is `incomplete_return`, `capture_invalid`, or `ambiguous_trial` according to the evidence.

### Expected phase and event vocabulary

Recommended movement states:

1. `SETUP_STANDING`
2. `STEPPING_FORWARD`
3. `DESCENDING`
4. `BOTTOM`
5. `ASCENDING`
6. `RETURNING`
7. `COMPLETE_STANDING`

Recommended point/interval events:

- `step_initiation`
- `visible_plant`
- `descent_onset`
- `bottom`
- `ascent_onset`
- `return_initiation`
- `stable_return`

`visible_plant` and `descent_onset` may overlap. The state model must not invent a strict order that the task definition does not require.

### Observation protocol

The movement definition and observation protocol are separate contracts, consistent with `docs/24_movement_ontology.md:66-70`.

For the proposed initial observation protocol:

- use one fixed near-sagittal camera;
- place the declared lead side nearest where feasible;
- keep the full body, both feet, forward destination, and complete return corridor in frame;
- record mirror state, orientation, dimensions, nominal/effective frame rate, timestamps, distance, camera height, and available lens/FOV/zoom metadata;
- forbid pan, digital zoom, cuts, camera motion, and unknown mirror transforms;
- treat all numeric yaw, height, distance, crop, visibility, dwell, and timing tolerances as validation outputs, not literature-derived facts.

No reviewed source directly validates browser MediaPipe Pose, one consumer camera, this exact task, these events, and the intended KinematicIQ population. The observation protocol therefore remains a field-development hypothesis.

## Candidate comparison

The camera entries below specify the minimum KinematicIQ-style view needed to distinguish the candidate and its boundaries; they are not claims that every biomechanics study must use that view.

### 1. FMS inline lunge

- **Initial stance:** Prescribed narrow heel-to-toe split stance on a line/board, spaced using tibia length; dowel contacts the head, thoracic spine, and sacrum with reciprocal hand placement.
- **Foot action:** Feet remain in the prescribed split stance; there is no forward step from bilateral standing and no return of the lead foot to a bilateral anchor.
- **Direction:** Vertical lowering/rising within an inline sagittal split stance.
- **Bottom definition:** Rear knee touches the board/ground behind the front heel while scoring criteria evaluate dowel contact, alignment, torso motion, balance, and foot position.[^fms-procedure]
- **Completion condition:** Return to the prescribed split-stance start while maintaining the test criteria.
- **Expected phases:** Split-stance setup → descent → rear-knee contact/bottom → ascent → split-stance return.
- **Required camera view:** A protocol-specific full-body scoring view that can verify feet/board alignment, rear-knee contact, dowel contacts/verticality, torso motion, and balance; the proposed single lead-side sagittal lunge view is not validated for the complete FMS score. Multi-view or a trained live evaluator is the conservative requirement.
- **Adjacent negative movements:** Dynamic forward step lunge, forward lunge without prescribed board/dowel/contact, static split squat, walking lunge, loss-of-balance/incomplete FMS attempt.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**No.** It lacks step-out and bilateral-return events and adds setup/contact/dowel requirements.

### 2. Forward lunge

- **Initial stance:** Commonly bilateral standing, but the unqualified term is not perfectly standardized across exercise and dataset sources.
- **Foot action:** One foot steps forward; after lowering/rising, the participant commonly pushes backward and returns that foot to the start.
- **Direction:** Anterior step and posterior return, primarily sagittal.
- **Bottom definition:** Study/instruction dependent; often lowest comfortable position, prescribed knee flexion, or maximum lead-knee flexion. No universal threshold transfers to KinematicIQ.
- **Completion condition:** Often return to bilateral standing, but the short name alone does not guarantee that boundary.
- **Expected phases:** Standing → forward step/plant → lowering → reversal → rising → backward return → standing.
- **Required camera view:** Fixed near-sagittal, lead side identifiable, full forward and return corridor visible.
- **Adjacent negative movements:** Walking lunge, static split squat, reverse/lateral lunge, FMS inline lunge, forward step without return.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**Conditional match.** It matches only when stride and bilateral return are made explicit.

### 3. Anterior lunge

- **Initial stance:** Bilateral standing in the primary study definition reviewed.
- **Foot action:** Step forward with the designated limb, lower, then push backward and return to full standing.[^anterior-lunge]
- **Direction:** Anterior step and posterior return, primarily sagittal.
- **Bottom definition:** Protocol dependent; the reviewed study used the lowest comfortable position, not a universal product cutoff.
- **Completion condition:** Return to full-standing start in the reviewed protocol.
- **Expected phases:** Standing → anterior step → lowering → lowest/reversal → rising → backward return → standing.
- **Required camera view:** Fixed near-sagittal with full step/return corridor; same observability problem as a forward lunge.
- **Adjacent negative movements:** Same as forward lunge, plus terminological confusion with generic “anterior” stepping tasks.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**Strong conceptual match** for the reviewed definition, but “anterior lunge” is less familiar user copy and does not remove the need to state stride/return.

### 4. Walking lunge

- **Initial stance:** Bilateral standing or an already progressing gait/lunge sequence.
- **Foot action:** Step forward, lower/rise, then bring the rear limb through into the next forward lunge; locomotion continues instead of returning the advanced foot to its original anchor.[^walking-lunge]
- **Direction:** Successive anterior progression.
- **Bottom definition:** Per-lunge reversal/maximum lead-knee flexion or a study-specific target.
- **Completion condition:** Prescribed repetitions, distance, corridor end, or final stance—not per-repetition return to the original bilateral region.
- **Expected phases:** Step/plant → descent → bottom → ascent → step-through/transfer → next opposite-side cycle.
- **Required camera view:** A travel-capable sagittal observation covering the full progression, or a separately validated moving/multi-camera setup. The proposed fixed start-region framing and completion rule are incompatible.
- **Adjacent negative movements:** Forward lunge with push-back return, alternating forward lunge that returns to start, gait, step-ups, incomplete walking sequence.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**No.** Its step-through is the target protocol’s incomplete/wrong return.

### 5. Static split squat

- **Initial stance:** Fixed staggered/split stance, normally with both feet already planted.
- **Foot action:** Feet remain planted while the body lowers and rises; no step occurs each repetition.[^split-squat]
- **Direction:** Primarily vertical lowering/rising in a sagittal split stance.
- **Bottom definition:** Maximum flexion/lowest protocol-defined position; no step or return event.
- **Completion condition:** Rise back to the initial split stance; set completion is normally prescribed repetitions or exit from stance.
- **Expected phases:** Split-stance setup → descent → bottom → ascent → split-stance top.
- **Required camera view:** Near-sagittal full-body/feet view for sagittal segmentation; no travel corridor is needed.
- **Adjacent negative movements:** Dynamic forward/reverse lunge, FMS inline lunge, Bulgarian/rear-foot-elevated split squat, walking lunge.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**No.** It omits step-out and bilateral-return identity events.

### 6. Reverse lunge

- **Initial stance:** Erect bilateral standing, commonly hip-width.
- **Foot action:** The moving limb steps posteriorly, both knees flex during lowering, then the participant rises and brings the moving foot forward to bilateral standing.[^reverse-lunge]
- **Direction:** Posterior step and anterior return, primarily sagittal.
- **Bottom definition:** Maximum descent/maximum relevant knee flexion or study-specific target.
- **Completion condition:** Moving foot returns forward to the original bilateral stance.
- **Expected phases:** Standing → backward step/plant → descent → bottom → ascent → forward return → standing.
- **Required camera view:** Fixed near-sagittal with the full rear travel and forward-return corridor visible; side/limb vocabulary must distinguish the moving limb from the stationary working limb.
- **Adjacent negative movements:** Forward lunge, static split squat, walking backward lunge, step-back without descent, curtsy/transverse lunge.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**No.** The direction and moving/stationary limb roles contradict the target identity, despite a similar abstract state shape.

### 7. Lateral lunge

- **Initial stance:** Bilateral standing.
- **Foot action:** One foot steps laterally, the stepping-side hip/knee flex while the other limb remains more extended, and the stepping foot returns to bilateral standing.
- **Direction:** Mediolateral/frontal-plane travel.
- **Bottom definition:** Maximum stepping-side flexion or lowest task-defined position; protocol-specific.
- **Completion condition:** Stepping foot returns to the bilateral start region.
- **Expected phases:** Standing → lateral step/plant → lateral descent → bottom → ascent → medial return → standing.
- **Required camera view:** Full-body frontal-plane observation with the complete lateral corridor and both feet visible; this is a different observation protocol from the target near-sagittal view.[^lateral-lunge]
- **Adjacent negative movements:** Forward/reverse lunge, side step without descent, curtsy/transverse lunge, Cossack squat, lateral squat shift without a step.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**No.** The movement plane, displacement axis, view, and landmark dependencies differ.

### 8. Forward lunge with stride and return

- **Initial stance:** Calibrated stable bilateral standing with declared anatomical lead side.
- **Foot action:** Declared lead foot advances to a visibly stable forward position, remains forward during descent/ascent, then returns to its calibrated standing region.
- **Direction:** Anterior step and posterior return, primarily sagittal.
- **Bottom definition:** Maximum lead-knee flexion within the readable forward planted interval, using the declared plateau/ambiguity rule; not a quality threshold.
- **Completion condition:** Both feet re-enter their calibrated bilateral standing regions and remain stable for the versioned dwell.
- **Expected phases:** Setup standing → stepping forward → descent → bottom → ascent → return → complete standing, with visible-plant and onset events.
- **Required camera view:** One fixed near-sagittal camera, declared lead side nearest where feasible, full body/both feet/full travel corridor visible, validated numeric tolerances still pending.
- **Adjacent negative movements:** FMS inline lunge, generic forward lunge lacking a return, walking lunge, static split squat, reverse/lateral lunge, squat, step-only, aborted trial, incomplete return, alternating/side switch.
- **FSM match:** Implemented FSM—**No at `8d8a77d`; the later `f49558e` seam is evaluated separately.** Phase 4 proposed chain—**Yes; exact identity match.**

## Positive and negative examples

### Positive target examples

A positive example must preserve task identity; it need not satisfy a normative form ideal.

- Left-lead or right-lead trial, labeled and evaluated separately.
- Self-selected short, medium, or long stride, provided the full step and return remain readable.
- Small-excursion but complete trial (`shallow_complete`), without calling it incorrect.
- Slow, moderate, or self-selected tempo.
- A single readable bottom frame or a readable bottom plateau resolved by the versioned tie rule.
- Descent beginning just before the foot fully stabilizes, retained through the allowed plant/descent overlap rule.
- A complete trial with a protocol-approved extra recovery step, if the owner explicitly chooses and versions that rule.

### Wrong-movement negatives

- Actual FMS inline lunge.
- Static split squat / lunge without a stride.
- Walking lunge or step-through lunge.
- Reverse lunge.
- Lateral lunge.
- Squat.
- Step-only movement without the descent/bottom/ascent chain.
- Alternating or lead-side-switching sequence inside a single-side set.

### Partial-target and boundary negatives

- False start or preparatory shuffle.
- Aborted trial before a defensible bottom/ascent chain.
- Incomplete ascent.
- Ascent followed by no lead-foot return.
- Lead foot moves toward the anchor but clip ends before stable-return dwell.
- Lead foot passes the original region without re-establishing the required stance.
- Next trial begins before completion can be established.

### Capture/adversarial negatives

- Wrong/unknown view, camera roll/yaw outside the eventually validated range, or far-side lead when identity/landmarks are not readable.
- Crop of the head, either foot, or travel corridor.
- Camera movement, pan, zoom, cut, orientation epoch change, or unknown mirror transform.
- Required landmark occlusion, left/right swap, coherent tracking jump, dropout/reacquisition, invalid timestamps, duplicate frames, or large gaps across an identity event.
- Bystander contamination or subject leaving/re-entering the frame.

Capture negatives are not movement-quality failures. They produce abstention/retake behavior, not “bad lunge” labels.

## Product and architecture consequences

### Why the existing cyclic FSM is not enough

The existing cyclic engine can represent a generic lowering/reversal/rising shape, but the target’s identity depends on facts outside that state space:

- declared anatomical lead side;
- lead-foot departure from a calibrated region;
- forward rather than backward or lateral displacement;
- visible planted-region stability;
- lead/rear foot identity through occlusion and mirroring;
- return initiation;
- bilateral foot-region re-entry and stable dwell;
- explicit rejection of static, walking, reverse, lateral, alternating, and incomplete-return variants.

Reusing only the current knee/hip cyclic FSM would allow high-quality wrong movements to look valid and would falsely complete a trial at knee extension. The architecture decision after owner approval should be protocol-specific event composition over shared temporal/quality primitives, not a relabeled squat configuration. That future design is outside this non-implementation task.

### Identity hierarchy

The following hierarchy prevents future naming contamination:

1. **Movement family:** `lunge`
2. **Canonical task:** `forwardLungeStrideReturn`
3. **Task definition version:** `forward-lunge-stride-return-v1`
4. **Observation protocol:** `side-view-forward-lunge-stride-return-v1`
5. **Source-native alias:** e.g. UI-PRMD `m03` / “inline lunge,” stored as provenance only
6. **Label schema:** separately versioned, currently proposed as `kinematiciq-lunge-label` v1

A source alias must never automatically select a product protocol or import the source’s scoring construct. UI-PRMD itself labels `m03` “inline lunge” while describing a forward step and knee contact, illustrating why the mapping must be explicit rather than lexical.[^uiprmd]

## Migration impact

### Current inventory

At the verified working snapshot, a case-insensitive inventory found **67 occurrences across 12 documentation files** of `inline lunge`, `inline-lunge`, or `flsr-v0`, and **zero occurrences in code or tests**.

Affected documentation surfaces:

- `docs/domain/DOMAIN_MODULE_BACKLOG.md`
- `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
- `docs/implementation/NEXT_EXECUTION_PACKAGE.md`
- `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md`
- `docs/research/INLINE_LUNGE_EVIDENCE_UPDATE.md`
- `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md`
- `docs/research/NEXT_PROTOCOL_PORTFOLIO.md`
- `docs/research/SINGLE_CAMERA_LUNGE_OBSERVABILITY_REVIEW.md`
- `docs/research/TEMPORAL_TRACKING_FAILURE_AND_RECOVERY_REVIEW.md`
- `docs/validation/INLINE_LUNGE_DATASET_AND_CAPTURE_SPEC.md`
- `docs/validation/INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`
- `docs/validation/INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md`

### Required naming changes after approval

| Surface | Required change | Compatibility rule |
|---|---|---|
| Canonical research text | Replace the project task name with “forward lunge with stride and return” | Preserve quoted source terminology and explain the alias |
| User copy | Use “Forward Lunge” | Setup/completion copy must explicitly say step forward and return to the starting stance |
| Research/dataset task ID | Replace proposed `flsr-v0` with `forward-lunge-stride-return-v1` when the task definition is locked | Retain `flsr-v0` only in historical records with `supersededBy` metadata |
| Future code protocol ID | Add `forwardLungeStrideReturn` only in an owner-authorized implementation milestone | Do not add `inlineLunge` as an alias that can reach runtime analysis |
| Observation protocol | Use `side-view-forward-lunge-stride-return-v1` after the capture contract is frozen | Do not reuse FMS or front-squat observation IDs |
| File names/headings | Rename the five `INLINE_LUNGE_*` repository files and their headings to `FORWARD_LUNGE_STRIDE_RETURN_*` | Use redirects/index notes where links may already exist |
| Validation taxonomy | Keep `fms_inline_lunge` as a wrong-movement subtype | It remains a negative label, not a deprecated spelling of the target |
| Dataset manifests | Store `sourceActivityName`/`sourceActivityId` separately from canonical `taskId` | Never infer canonical task from source label alone |
| Research citations | Retag each transferred claim by exact variant | Do not transfer FMS score, rear-knee-contact truth, walking-lunge completion, or split-squat phase definitions |
| Capture instructions | Replace generic “inline” wording with direction, start stance, lead side, visible plant, return anchor, and full corridor | No normative depth, knee-over-toe, rear-knee-contact, or trunk cue |
| Labels/fixtures | Use the canonical task ID in positive fixtures; add named negative variants | Keep partial target vs wrong movement vs capture invalid distinct |
| Reports/exports/history | Use stable protocol ID plus versioned task/observation provenance | Do not merge historical records across incompatible IDs |

### Future code and test surfaces—not currently present

Owner approval of the name does not authorize these changes, but a later implementation plan would have to cover:

- `ProtocolId` / `MovementId` vocabulary and a planned protocol definition;
- registry and runtime lookup;
- protocol-owned capture copy and observation-protocol provenance;
- lead-side declaration and mirror-state handling;
- calibrated foot-region state and direction-aware events;
- segmentation, metrics, findings, quality, report metadata, storage, export, and history scoping;
- positive parity fixtures for left/right leads and timing/bottom plateaus;
- negative fixtures for FMS inline, static split squat, walking, reverse, lateral, squat, step-only, side switch, abort, and incomplete return;
- capture/adversarial fixtures for crop, occlusion, camera movement, mirror conflicts, timestamp gaps, dropout/reacquisition, and clip edges;
- tests proving knee extension alone cannot complete a trial;
- tests proving a source-native “inline lunge” alias cannot select the canonical runtime without an approved mapping.

## Research-transfer rules

1. Every claim must be tagged with the exact lunge variant, stance, stride rule, return rule, load, direction, view, model, population, and outcome definition.
2. `forward lunge` and `anterior lunge` evidence may transfer only when their operational task matches the canonical definition.
3. FMS inline-lunge evidence may inform the negative taxonomy or a future distinct FMS protocol; it cannot define target phases, completion, scoring truth, or camera requirements.
4. Static split-squat evidence cannot establish step/return events.
5. Walking-lunge evidence cannot establish per-trial bilateral-return completion.
6. Reverse/lateral-lunge evidence cannot establish target direction, plane, view, or moving-limb semantics.
7. Force-plate contact, braking, propulsion, toe-off, loading, kinetics, injury risk, diagnosis, and clinical score claims remain unavailable under RGB-only observation.
8. No universal depth, angle, step-length, duration, dwell, or camera-tolerance threshold is adopted from the literature.

## Options considered

### Option A — Keep “inline lunge”

**Rejected as recommendation.** It conflicts with the FMS protocol, invites FMS research/scoring transfer, misstates the proposed start/end states, and makes negative examples and completion rules ambiguous.

### Option B — Rename to “forward lunge” only

**Not precise enough as the canonical research name.** It is appropriate user copy, but literature and exercise practice do not guarantee the same return boundary from the short label alone.

### Option C — Rename to “anterior lunge”

**Technically defensible but not preferred.** Primary literature uses it for a matching step-and-return protocol, but it is less familiar in product copy and still needs stride/return qualification.

### Option D — Adopt “forward lunge with stride and return”

**Recommended.** It describes the actual identity-bearing actions, distinguishes the task from the required negatives, supports honest research transfer, and encodes the completion rule that the current generic cyclic FSM lacks.

### Option E — Change the task to the actual FMS inline lunge

**Valid alternate product decision, but a different protocol.** It would remove forward-step and bilateral-return events; add measured spacing, board/line, dowel, rear-knee-contact, and balance/scoring requirements; require new capture/observability research; and invalidate the current Phase 4 target definition.

## Owner decision block

**Approval gate: OPEN — no option is approved by this document.**

The accountable product/claims owner must select exactly one identity. Biomechanics and engineering owners must confirm the operational and architecture consequences before the decision is marked accepted.

- [ ] **Approve recommendation:** Canonical identity = **forward lunge with stride and return**; protocol ID = **`forwardLungeStrideReturn`**; user-facing name = **Forward Lunge**; research-facing name = **Forward lunge with stride and return**.
- [ ] **Choose FMS alternate:** Replace the target with the actual FMS inline-lunge protocol and commission a new protocol, observability, capture, label, and claims package.
- [ ] **Choose another identity:** Attach a written movement definition covering initial stance, foot action, direction, bottom, completion, phases, view, and adjacent negatives before any naming migration.
- [ ] **Defer:** Keep all lunge work research-only; do not acquire data, lock labels, add protocol IDs, implement runtime behavior, or expose product copy.

Required sign-off:

| Role | Name | Decision/date | Required confirmation |
|---|---|---|---|
| Product / claims owner (accountable) |  |  | Canonical identity, user name, allowed claims, and activation boundaries |
| Biomechanics / research owner |  |  | Formal definition, variants, phase/events, negatives, and research-transfer rules |
| Engineering / architecture owner |  |  | Stable IDs, movement/observation separation, migration scope, and no accidental runtime alias |
| Data / validation owner |  |  | Dataset mapping, label/version migration, subject splits, and locked-gate consequences |

**Effect of approval:** Approves the identity and naming migration plan only. Dataset acquisition, locked labeling, implementation, thresholds, claims, and availability remain separate explicit gates under M78 and the master roadmap.

## Evidence limits and verification notes

- Repository facts above were verified by current-session inspection of `origin/master` and the working Phase 4 layer.
- The repository working tree already contained the Phase 4 document changes before this decision task; this deliverable did not modify the repository.
- The completed Phase 4 package is uncommitted relative to `8d8a77d`; it is treated as a separate research evidence layer, not part of the verified `origin/master` code snapshot.
- No runtime test was necessary or run because the task prohibits implementation and the central verified fact is the absence of a lunge runtime/ID/test surface.
- Literature terminology is protocol-dependent. The definitions in this record are operational product definitions, not claims of universal exercise nomenclature.

## Primary external sources

[^fms-official]: Functional Movement Systems, [“An Introduction” (official FMS overview)](https://functionalmovement.com/files/Articles/572a_FMS_Article_NoBleed_Digital.pdf), describing the Inline Lunge as a split-stance pattern with reciprocal upper-extremity positioning.
[^fms-procedure]: Lockie et al., [“Relationship of the Functional Movement Screen In-Line Lunge to Power, Speed, and Balance Measures”](https://pmc.ncbi.nlm.nih.gov/articles/PMC4000474/), including tibia-length spacing and the published FMS scoring criteria; see also the procedural description in [Cook et al., “Pre-Participation Screening: The Use of Fundamental Movements as an Assessment of Function—Part 1”](https://pmc.ncbi.nlm.nih.gov/articles/PMC2953313/).
[^anterior-lunge]: Farrokhi et al., [“Biomechanical Analysis of the Anterior Lunge During 4 External-Load Conditions”](https://pmc.ncbi.nlm.nih.gov/articles/PMC3396296/), whose protocol steps forward, lowers, and pushes backward to full-standing start.
[^forward-lunge]: Kotsifaki et al., [“Forward lunge before and after anterior cruciate ligament reconstruction”](https://pmc.ncbi.nlm.nih.gov/articles/PMC6980669/), defining a step forward followed by a push backward to the starting position.
[^walking-lunge]: Myer et al., [“Trunk and Hip Control Neuromuscular Training for the Prevention of Knee Joint Injury”](https://pmc.ncbi.nlm.nih.gov/articles/PMC2586107/), distinguishing walking lunge by stepping through with the rear limb and proceeding forward instead of returning to start.
[^split-squat]: Liang et al., [“Effects of step lengths on biomechanical characteristics of lower extremity during split squat movement”](https://pmc.ncbi.nlm.nih.gov/articles/PMC10667687/), including the “lunge without stride” / split-squat distinction; see also Krause et al., [“Balance and Lower Limb Muscle Activation Between In-Line and Traditional Lunge Exercises”](https://pmc.ncbi.nlm.nih.gov/articles/PMC6006536/), distinguishing stationary bilateral variants from lunges with leg movement.
[^reverse-lunge]: Hoffman et al., [“The Reverse Lunge: A Descriptive Electromyographic Study”](https://www.mdpi.com/2076-3417/14/24/11480), operationalizing bilateral standing, posterior step, lowering/rising, and return of the moving foot to bilateral stance.
[^lateral-lunge]: Youdas et al., [“Electromyographic Assessment of Muscle Activity Between Genders During Unilateral Weight-Bearing Tasks Using Adjusted Distances”](https://pmc.ncbi.nlm.nih.gov/articles/PMC3537460/), including a side-step lunge and return-to-start protocol; movement-plane/view requirements in this record are KinematicIQ observability inferences, not a claim made by that study.
[^uiprmd]: Vakanski et al., [“A Data Set of Human Body Movements for Physical Rehabilitation Exercises”](https://www.mdpi.com/2306-5729/3/1/2), whose UI-PRMD activity `m03` is named “inline lunge” but described with a forward step, demonstrating a source-label/canonical-task mismatch that must remain explicit provenance.
