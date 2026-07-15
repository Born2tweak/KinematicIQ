# Inline-Lunge Evidence Update

> **Repository-status reconciliation (2026-07-15):** This report's original repository observations were correct for commit `8d8a77d`. The later Phase 3 implementation at `f49558e` supersedes its "no implementation exists" conclusion. Phase 3 provides an unavailable experimental research seam in `web/src/protocols/inlineLunge/index.ts` and `segmenter.ts`, with six ordered states and synthetic tests in `inlineLunge.test.ts` and `web/src/eval/inlineLungeEvaluation.test.ts`. Real-participant validity, synchronized criterion evidence, live/upload/session/results integration, coaching authority, and public availability do not exist. Squat remains the only available protocol. The research findings and validation requirements below remain applicable. `inlineLunge` references are preserved only as historical repository or source-native terminology; the approved identity is **Forward lunge with stride and return**.
**Date:** 2026-07-14

**Decision status:** Research-only evidence update; no implementation or availability authorization

**Repository baseline:** `master` inspected in this research session

**Confidence vocabulary:** High = directly observed in the repository or consistently established by directly inspected primary sources; Medium = supported by relevant primary evidence but not validated for KinematicIQ's exact task/camera/population; Low = hypothesis requiring target-protocol data.

## 1. Executive decision summary

KinematicIQ is **not ready to field-test an inline-lunge runtime**. It is ready to design a governed capture-and-label study after the protocol identity is resolved and dataset access is separately approved.

At the original `8d8a77d` snapshot, repository authority made inline lunge research-only and contained no implementation. Phase 3 later added the unavailable experimental seam at `f49558e`; `web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, `metrics.ts`, `findings.ts`, fixtures, and tests now exist. Squat remains the only available protocol, and the Phase 4 scientific gates remain open.

The most important evidence finding is a protocol-name conflict:

- The repository hypothesis describes standing, stepping forward, descending, ascending, and returning the lead foot to the original standing region.
- The published Functional Movement Screen (FMS) inline lunge begins in a measured heel-to-toe narrow split stance, descends until the rear knee touches behind the front heel, and returns to that split stance.
- The repository hypothesis therefore most closely matches a **forward lunge with a stride and return**, not the FMS inline lunge. A split squat or FMS inline lunge is a separate task.

No universal angle, duration, step-length, or “depth” threshold is justified. Step length, trunk position, load, task, and lunge direction materially alter observed kinematics. Bottom can be operationalized for labeling as the frame of maximum lead-knee flexion within lead-foot stance, but this is a kinematic convention rather than a force-contact truth and needs a tie/plateau rule. Completion should require a stable return to the calibrated bilateral standing region, not merely knee extension.

Phase 4 decision:

1. Freeze production code and availability for this protocol under the current roadmap.
2. Resolve and rename the target task before capture: recommended working identity is `forward lunge with stride and return`.
3. After explicit dataset/capture approval, label target events independently on original-timestamp media, split by subject, and predeclare agreement and benchmark gates.
4. Treat count and timing as candidate experimental outputs. Keep joint angles analyst-only until task-specific synchronized validation exists.
5. Preserve full abstention for invalid capture and suppress coaching for questionable capture. Do not convert descriptive strategies into defects.

## 2. Scope and protocol identity

### 2.1 Variants are not interchangeable

| Variant | Operational identity in inspected evidence | Start/end state | KinematicIQ consequence |
|---|---|---|---|
| Forward/anterior lunge **with stride** | From bilateral standing, one limb steps forward, accepts stance, descends/ascends, and pushes back to the start | Bilateral standing -> lead-foot stance -> bilateral standing | Closest match to the repository hypothesis |
| Forward lunge **without stride** / split squat | Feet remain planted while the body lowers and rises | Static split stance -> split stance | Must be a negative fixture for a step-and-return protocol |
| Walking lunge | Successive forward lunges continue progression rather than returning the lead foot | Alternating progressive steps | Different completion and trial-boundary model |
| FMS inline lunge | Feet aligned heel-to-toe on a narrow line at a tibia-length spacing; rear knee lowers to the surface behind the front heel; dowel contacts are prescribed | Fixed narrow split stance -> same stance | Different setup, contact criterion, visibility needs, and claims; do not use the FMS score as truth |
| Sport/fencing/badminton lunge | Task-specific rapid approach/attack, braking, and recovery; initial contact and take-off often force-plate defined | Sport-ready stance -> attack/support -> recovery | Useful for event concepts and camera-validity bounds, not direct protocol equivalence |

### 2.2 Proposed identity decision

Before labels or code, the owner must choose one identity:

- **Recommended:** rename the research target to `forward lunge with stride and return`; keep “inline” only as a dataset activity alias where a source uses that label.
- Alternative: change the task to the actual FMS inline-lunge setup. This would remove the step and bilateral-standing-return events, add board/spacing/dowel/contact requirements, and require a new observability analysis.

This update proceeds with the recommended dynamic forward-lunge identity only as a **research hypothesis**, not an authorized product contract.

Left- and right-lead trials are operationally separate. The lead side must be declared or labeled, the camera should view the lead side, and datasets must be split by subject before any left/right comparison. Dominance is context, not a normative standard; the limited evidence does not support different product thresholds by lead side.

## 3. Repository baseline

### 3.1 Controlling state observed

| Repository evidence | Current state | Confidence |
|---|---|---|
| `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md` | “Research only; not approved for implementation or availability”; proposes side view and step/descent/bottom/ascent/return | High |
| `docs/implementation/NEXT_EXECUTION_PACKAGE.md` | M78 is a data-and-label gate requiring separate dataset approval; failure keeps lunge research-only | High |
| `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` | No second available protocol; inline-lunge availability is a later separate gate | High |
| `docs/implementation/progress/M73-next-protocol-portfolio.md` | Research milestone complete; implementation not authorized | High |
| `web/src/core/protocol.ts` | `ProtocolId` omits inline lunge; lifecycle supports only `available` and `planned` | High |
| `web/src/protocols/registry.ts` | Squat available; sit-to-stand, hip hinge, jump, sprint planned; no lunge registration | High |
| `web/src/protocols/runtime.ts` | Only `SQUAT_RUNTIME` is registered | High |
| `web/src/analysis/cyclic/cyclicEngine.ts` | Shared loop is knee-driven and emits squat-shaped `RepMetrics`; not evidence of lunge behavior | High |
| `docs/doctrine/claims-policy.md` | Invalid capture fully abstains; questionable capture does not coach; kinetics, diagnosis, injury prediction, norms, and composite scores forbidden | High |

### 3.2 Prompt/repository conflict ledger

| Supplied premise | Live repository finding | Resolution |
|---|---|---|
| Phase 3 created a deterministic synthetic-tested inline-lunge implementation | No lunge ID, directory, runtime, registration, test, or fixture exists | Treat the premise as stale/foreign; do not invent or implement it |
| Phase 4 must continue implementing/hardening lunge | Canonical M73/M78 governance authorizes research and a future approved data/label gate only | Produce research evidence only; implementation needs an explicit roadmap/owner decision after gates |
| Six-phase state machine exists | Only a prose hypothesis names phases; runtime code is squat-only | Define label candidates, not code parity requirements |
| Public activation alone is gated | Repository gates implementation/data acquisition as well as availability | Follow the narrower repository authority |

## 4. Search method and source-selection rules

Searches covered forward/anterior lunge definitions, stride versus stationary variants, inline-lunge setup, phase and event segmentation, sagittal kinematics, task modifiers, markerless/2D validity, and candidate datasets. Sources were selected in this order: peer-reviewed primary biomechanical or validation studies; peer-reviewed dataset/protocol papers; then an FMS methods paper for the named screen. Reviews and search summaries were used only to locate primary work.

Claims were not transferred when the studied task, population, sensor, camera rate, or event instrument differed from KinematicIQ. In particular:

- Force-plate contact events are reference labels, not observable facts from consumer RGB.
- Manual marker-based 2D validity does not establish MediaPipe validity.
- Fencing and badminton lunges inform event definitions and planar limitations but are not interchangeable with a controlled exercise lunge.
- Group means and laboratory thresholds are not production thresholds.
- Dataset “correct/incorrect” demonstrations and FMS aggregate scores are not biomechanical ground truth.

## 5. Study evidence table

| Source | Task / system | Decision-relevant finding | Transfer boundary | Reliability / confidence |
|---|---|---|---|---|
| Vakanski et al. (2018) | UI-PRMD; 10 participants, Vicon and Kinect; includes inline lunge | Provides timed skeleton sequences and repeated demonstrations useful for seed ontology/negative examples | Small healthy sample; imitated “incorrect” performance is not clinical truth; source rights and original files require approval | Primary dataset paper; Medium for capture planning, Low for product thresholds |
| Liao et al. (2020) | UI-PRMD assessment framework | Confirms E3 “inline lunge” and sequence-based assessment context | Model score is not an event label or biomechanical validity result | Primary methods paper; Medium for dataset identity |
| Zhou et al. (2024) | LLM-FMS fine-grained FMS dataset | May inform keyframe and reasoning-label ontology | Rater provenance, media terms, and aggregate FMS scoring require review; not product ground truth | Primary dataset paper; Medium for ontology only |
| Cook et al. (2014) | Published description of FMS inline lunge | Fixed heel-to-toe narrow stance, rear-knee touch behind front heel, return to start; front leg identifies side | Screening procedure, not validation of KinematicIQ or justification for an FMS score | Methods/clinical commentary; High for distinguishing the named task, Low for metric validity |
| Riemann et al. (2012) | Anterior lunge under four external loads; 3D motion capture | Examines ankle/knee/hip peaks during stepping-limb ground-contact interval; load changes kinetics more than peak angles | Laboratory anterior lunge; no camera validity or universal thresholds | Peer-reviewed primary biomechanics; Medium |
| Farrokhi et al. (2008) | Forward lunge with different trunk positions; kinematics, kinetics, EMG | Trunk instruction changes hip flexion and joint/muscle strategy | Descriptive strategy differences must not become “errors”; kinetics/EMG forbidden from RGB | Peer-reviewed primary biomechanics; High for strategy non-normativity |
| Escamilla et al. (2008) | Forward/side lunges, with/without stride | Stride and direction alter joint loading; task variants are materially different | Kinetic findings cannot be inferred by KinematicIQ | Peer-reviewed primary biomechanics; High for variant separation |
| Comfort et al. (2015) | Forward and reverse lunge vs single-leg squat; force plates + 3D capture | Protocol used upright standing, step to full depth with whole foot contact, and return; measured sagittal angles and valgus | Does not define RGB-observable contact or prove a “full depth” threshold | Peer-reviewed primary biomechanics; Medium |
| Chida et al. (2024) | Fencing lunge; simultaneous manual 2D side video at 120 fps and 8-camera 3D capture | Sagittal knee angles at heel-off/heel-strike correlated strongly with 3D; ankle showed material bias and rear-hip validity was poor | Skilled male fencers, high frame rate, markers/manual digitization, and endpoint events—not MediaPipe or bottom frame | Peer-reviewed primary validation; Medium for narrowing candidates, Low for MediaPipe angle claims |
| Peng et al. (2023) | Badminton forward lunges; fluoroscopy, motion capture, force plate, EMG | Defines braking from initial contact to maximum knee flexion and recovery afterward; lunge distance and foot position alter biomechanics | Sport-specific maximal lunges and instrumented contact; no direct consumer-RGB transfer | Peer-reviewed primary biomechanics; Medium for event ontology |
| Hauenstein et al. (2024) | Commercial multicamera markerless systems across movement screens | Markerless reliability varies by movement/variable; lateral-lunge measures were not uniformly excellent | Reliability is not agreement with a gold standard and system is not monocular MediaPipe | Peer-reviewed primary reliability; Medium for requiring metric-specific validation |

Evidence saturation was reached when additional studies repeated the same actionable facts: variant definition matters; initial contact/maximum flexion/take-off are common instrumented events; task constraints alter kinematics; and planar joint-angle validity is joint-, event-, and system-specific.

## 6. Current-code assumption audit

| Assumption / seam | Evidence class | Audit result | Required disposition |
|---|---|---|---|
| “Inline lunge” means step forward and return | Unsupported naming assumption | Conflicts with published FMS inline-lunge procedure | Rename/resolve before labels or code |
| Side view is appropriate | Literature-supported but task-specific | Sagittal side view is defensible for lead-knee/event research when line of progression is parallel to image plane | Calibrate view tolerance; lead side near camera; validate on consumer devices |
| Six phases are already implemented | False repository assumption | No implementation exists | Treat phases as annotation candidates only |
| A cyclic squat engine can be configured for lunge | Architectural hypothesis | Current engine tracks the minimum of bilateral knee angles and squat-shaped descent/return; it has no step/contact/lead-side state | Do not reuse without a protocol-specific design and parity/negative tests |
| Maximum knee flexion defines bottom | Literature-consistent convention | Common reversal event for stance segmentation, but plateaus and noisy local extrema remain ambiguous | Label with a deterministic window/tie rule and adjudication |
| Lead-foot contact is RGB-observable | Unsupported as physical contact | Studies define contact by force threshold; 2D visible heel strike is a proxy | Name it `visible lead-foot plant` in RGB labels; never claim force contact |
| Return to calibrated standing completes a trial | Task-definition hypothesis | Appropriate for stride-and-return lunge, not FMS inline or walking lunge | Require lead-foot return plus stable bilateral standing; validate tolerance/dwell |
| Both sides should be simultaneously visible | Conservative quality hypothesis | Helpful for identity/occlusion checks, but strict side view produces far-side overlap | Define per-event landmark sufficiency rather than one global bilateral threshold |
| Lead-knee angle at bottom is valid | Synthetic/unsupported for this system | Chida supports manual 2D knee angles only for fencing endpoints, not MediaPipe at exercise-lunge bottom | Analyst-only pending synchronized target-task validation |
| Hip/ankle angles and upright-trunk cue are valid | Contradicted/unsupported | Chida reports material ankle bias and poor rear-hip agreement; Farrokhi shows trunk position is an intentional strategy modifier | Exclude from initial product metrics/coaching |
| A shallow-trial angle threshold can be literature-derived | Unsupported | “Depth” varies with instructions, step length, and task; no transferable cutoff | Label incomplete/ambiguous behavior without a normative angle threshold |
| Left/right leads can share thresholds | Unknown | Laterality evidence is sparse and task-specific | Stratify results; do not assume equivalence or difference until data |

## 7. Phase and event model

This model applies only to the proposed **forward lunge with stride and return**.

| State / event | Human annotation definition | Candidate RGB observation | Ambiguity / fail-closed rule |
|---|---|---|---|
| Setup / stable standing | Bilateral upright stance held before movement; lead side known | Both ankles near calibrated standing anchors; knees near individual standing baselines; low landmark velocity for a declared dwell | Do not start if lead side unknown, feet cropped, or stance anchor unstable |
| Step initiation | First sustained departure of declared lead foot from its standing region | Lead ankle/heel/foot-index displacement exceeds noise band for a dwell; trailing foot remains near anchor | Heel-off alone may be hidden or misdetected; label the earliest confidently visible departure and uncertainty |
| Visible lead-foot plant | First frame the lead foot appears stably planted at the forward position | Heel/foot-index vertical velocity settles and forward ankle position stabilizes | RGB cannot establish force contact; never label as force-plate `initial contact` without synchronized force data |
| Descent start | First sustained lowering after plant | Lead-knee flexion increases and pelvis lowers for a dwell | Step and descent may overlap; allow an overlap flag rather than forcing false order |
| Bottom | Frame of maximum lead-knee flexion within the accepted planted interval | Minimum smoothed lead-knee angle, cross-checked against pelvis reversal | For plateaus, choose the temporal midpoint of frames within the predeclared tolerance of the extremum; mark unresolvable/noisy plateaus ambiguous |
| Ascent start | First sustained reversal toward extension after bottom | Lead knee extends and pelvis rises for a dwell | A bounce or secondary dip needs hysteresis and can invalidate phase timing |
| Lead-foot return initiation | Lead foot departs the forward planted region toward its calibrated anchor | Lead ankle/heel/foot-index begins sustained backward displacement | Not equivalent to force-plate toe-off |
| Stable return / completion | Both feet are back within calibrated standing regions and stable for a dwell | Bilateral ankle anchors, extended knees relative to personal baseline, low velocity | Knee extension alone does not complete; stepping past the anchor, switching lead, or clip end before dwell is incomplete |

The commonly studied stance decomposition—braking from instrumented contact to maximum knee flexion and propulsion/recovery after maximum flexion—is useful for reference labeling. KinematicIQ should not claim actual ground contact, braking force, propulsion, or take-off from RGB.

## 8. Trial validity and rejection model

### 8.1 Taxonomy

| Classification | Operational rule | Reporting behavior |
|---|---|---|
| Accepted complete | Correct declared lead; all required identity events observable; one clear bottom; lead foot returns to calibrated standing; stability dwell met; no material dropout | Count and candidate timing may enter an experimental benchmark/report |
| Shallow / limited excursion | Clear step, plant, reversal, and return but descent excursion is small relative to that subject's calibrated signal | Keep as a labeled descriptive subclass; do not call incorrect or reject solely by a population angle cutoff |
| Aborted | Step begins or foot plants, then movement reverses before a confidently labelable bottom/ascent sequence | Do not count; retain rejection reason and event evidence |
| Incomplete return | Bottom/ascent occurs but lead foot does not return to its calibrated region before clip end or next trial | Do not count as complete; preserve partial-trial label |
| Static split squat / no stride | Feet begin split and remain planted | Wrong variant negative; do not count |
| Walking lunge | Athlete progresses into the next stance rather than returning | Wrong variant negative; do not count |
| Wrong or switched lead | Observed lead differs from declaration or changes within set | Invalid trial/set depending on recoverability; prompt retake |
| Ambiguous bottom | Multiple comparable extrema, bounce, tracking jump, or occlusion prevents deterministic selection | Abstain from bottom/phase metrics; count only if the full trial boundary remains independently reliable and this policy was predeclared |
| Visibility invalid | A required landmark is cropped/occluded below the per-event sufficiency rule for longer than allowed | Reject affected trial; invalidate set when artifact fraction crosses a predeclared benchmarked gate |
| View invalid | Line of progression materially out of sagittal plane or near/far side cannot be identified | Full abstain and retake guidance |
| Interference | Bystander, camera movement, cut/edit, mirror ambiguity, or subject leaves frame | Reject interval or entire set according to predeclared recoverability rules |

### 8.2 Set-level rules

- Preserve the existing doctrine: invalid capture produces no metrics or coaching; questionable capture produces no coaching.
- Never silently discard rejected trials. Store the reason, affected frame interval, and observable evidence.
- Do not choose numeric dropout fractions, angle cutoffs, or dwell durations from literature. Predeclare provisional values for the label study, then estimate sensitivity and failure modes on development subjects before locking a subject-held-out test gate.
- Lead-side sets must not be merged before quality review. Report left and right separately; any comparison remains descriptive and self-referenced.

## 9. Landmark and camera requirements

### 9.1 Per-event landmark sufficiency

| Landmark group | Why needed | Required interval | Failure consequence |
|---|---|---|---|
| Lead shoulder, hip, knee, ankle | Lead-knee sagittal geometry and trunk/limb continuity | Plant through ascent; shoulder optional if knee-only geometry is used, mandatory for any analyst trunk proxy | Missing lead hip/knee/ankle invalidates bottom and knee metrics |
| Lead heel and foot index | Step departure, visible plant, foot-region stability, return | Setup through completion | Missing both invalidates step/return identity; one-point fallback must be separately benchmarked |
| Rear hip, knee, ankle | Rear-limb identity, split-stance evidence, occlusion diagnostics | Setup, bottom vicinity, stable return | Missing rear knee/ankle can make variant and complete-return status ambiguous |
| Rear heel and foot index | Trailing-foot anchor and return stance | Setup and completion; desirable throughout | Missing setup/completion invalidates bilateral anchor; do not infer floor contact |
| Both shoulders | View/rotation and whole-body framing checks | Setup and representative stance frames | Missing/overlap reduces view confidence; no frontal or transverse claims |

MediaPipe indices implied by the current stack are shoulders 11/12, hips 23/24, knees 25/26, ankles 27/28, heels 29/30, and foot indices 31/32. Index presence is not sufficient: per-frame visibility, temporal continuity, image margins, and near/far-side identity must be evaluated.

### 9.2 Camera protocol hypothesis

- One fixed side camera, optical axis approximately perpendicular to the line of travel; lead side nearest the camera.
- Camera near hip height is a reasonable starting hypothesis, not a validated tolerance. Chida used greater-trochanter-related camera height with high-frame-rate manual video; that does not validate KinematicIQ's consumer setup.
- Entire body and travel corridor in frame, with margin above the head, below both feet, and in front of the lead-foot destination.
- No digital zoom, camera pan, cuts, mirrors, loose garments that obscure hips/knees/feet, or bystanders in the analysis corridor.
- Record device, orientation, nominal frame rate, resolution, distance, camera height, side, lighting, clothing/occlusion notes, and dropped-frame/timestamp diagnostics.
- Capture both left- and right-lead sets by repositioning the athlete/camera so the lead side remains nearest where feasible; do not accept a systematically occluded far-side lead as equivalent without evidence.

The current squat `captureReadiness.ts` encodes a front-view protocol and therefore cannot be reused as lunge capture truth. A future lunge readiness implementation needs protocol-owned copy and geometry checks.

## 10. Metric and claim boundaries

| Candidate output | Classification | Permitted scope / reason |
|---|---|---|
| Complete trial count | **Supported experimental** after subject-held-out labels | Describes completion under the named protocol; no movement-quality judgment |
| Trial duration | **Supported experimental** after event agreement and timestamp tests | Time from step initiation to stable return, with definition/version disclosed |
| Plant-to-bottom and bottom-to-return timing | **Supported experimental** after event agreement | Use visible/kinematic event names, not force/propulsion terminology |
| Within-set duration consistency | **Supported experimental** with at least 3 accepted trials and reliability data | Self-referenced descriptive variability only |
| Lead-knee sagittal angle at bottom | **Analyst-only** | Plausible planar variable, but no direct MediaPipe/target-task/bottom validation yet |
| Normalized lead-foot displacement | **Analyst-only** | Camera geometry and perspective sensitive; useful for failure analysis, not user interpretation |
| Lead hip angle, rear hip angle, ankle dorsiflexion | **Unsupported** initially | Joint- and event-specific 2D biases; direct metric validation absent |
| “Upright trunk,” hip-dominant, knee-dominant, knee-over-toe defect | **Unsupported** as coaching judgments | Trunk and step strategies vary intentionally; no validated task-specific rule or benefit/harm threshold |
| Frontal knee valgus, foot rotation, balance/stability quality | **Unsupported from required side view** | Plane/view mismatch and contact ambiguity |
| Rear-knee floor contact | **Unsupported from ordinary monocular side RGB** unless a distinct FMS protocol validates it | Occlusion and true contact cannot be assumed |
| Force, load, torque, power, joint stress, muscle activation | **Forbidden** | Kinetics/physiology are prohibited by claims doctrine and unavailable from RGB |
| Injury risk, diagnosis, mobility capacity, motor-control deficit, normative FMS score, composite quality score | **Forbidden** | Product doctrine prohibits these conclusions |

No metric may move onto a product surface without a definition/version, required landmarks, missingness behavior, validation tier, known failure modes, evidence row, and confidence/abstention behavior.

## 11. Contradictions and conflict ledger

| Conflict | Evidence | Decision |
|---|---|---|
| Inline-lunge name vs dynamic step-return task | FMS description vs repository hypothesis | Resolve identity first; recommended rename to forward lunge with stride and return |
| Contact events are common in biomechanics but unavailable from RGB | Force thresholds define initial contact/take-off in primary studies | Use `visible plant`/`return initiation` proxy names and synchronized force reference only in validation |
| Minimum knee angle is a convenient bottom but may not equal lowest pelvis or peak force | Studies select maximum knee flexion; tasks differ in force/COM events | Use maximum lead-knee flexion for label reproducibility, preserve other extrema for analysis, and disclose definition |
| Side view favors sagittal knee geometry but hides bilateral alignment | Chida validity and monocular limitations; current research demands bilateral visibility | Lead side near camera, per-event sufficiency, explicit occlusion labels; no frontal claims |
| Literature reports many joint angles, moments, and EMG outcomes | Riemann, Farrokhi, Escamilla and sport studies | Reporting a laboratory variable does not authorize KinematicIQ to estimate it |
| Trunk, load, step length, direction, and sport change strategy | Multiple primary studies | Treat these as task/context variables, not defects; standardize or record them |
| Chida supports sagittal knee 2D validity but not KinematicIQ | Manual marked 2D at 120 fps in skilled fencers; endpoint events only | Keep MediaPipe bottom angle analyst-only pending direct synchronized validation |
| Dataset labels call performances correct/incorrect | UI-PRMD/LLM-FMS assessment framing | Use only as source annotations; independently label observable events and exclusions |
| Prompt directs continued implementation | Canonical roadmap gates implementation and data acquisition | No code changes in this research task |

## 12. Phase 4 requirements

### Required before any field capture

1. Owner records the protocol identity and name; dynamic forward-lunge and FMS inline-lunge definitions cannot coexist under one label.
2. Separate approval covers each external dataset/media source, terms snapshot, permitted purpose/output, local storage, and checksums.
3. Capture specification fixes variant, footwear/surface, external load (prefer none initially), arm instruction, pace instruction, repetitions, lead-side order, warm-up/rest, and camera metadata.
4. Label handbook defines events, plateau/tie rules, partial/aborted/ambiguous trials, occlusion, view failure, and adjudication without normative “correctness.”
5. Two independent raters label original timestamps. Agreement targets and adjudication are predeclared before examining KinematicIQ outputs.
6. Subject-held-out development/test splits prevent repetitions from one person leaking across evaluation roles.
7. Privacy, consent, retention, face handling, and derived-landmark reuse are approved before proprietary capture.

### Required before an implementation milestone

1. Data/label gate above passes and an owner explicitly authorizes implementation.
2. Protocol contracts gain a lunge identity without marking it available; lifecycle must represent research/internal status without misleading UI exposure.
3. A protocol-specific event model is designed rather than assuming squat's bilateral-minimum-knee FSM is adequate.
4. All thresholds are named, versioned, provisional, and tied to a benchmark question.
5. Negative fixtures cover adjacent movements and capture failures.
6. Live/upload/replay/session/report ownership is end-to-end and preserves squat regression behavior.

### Required before public availability

- Subject-held-out count/event/dropout gates pass against a frozen baseline.
- Direct synchronized validation and repeat-session reliability support every exposed metric.
- Device/view/lighting/clothing/anthropometry coverage and failure-stratum results are reported.
- Claims/copy review confirms observation language, tier labels, confidence, and abstention.
- A designated human authority separately approves availability. Implementation completion never implies activation.

## 13. Tests and fixtures required

### 13.1 Behavioral fixtures

- Accepted left-lead and right-lead stride-and-return trials at varied self-selected depths and tempos.
- Clean shallow-excursion trials retained as descriptive labels.
- Aborted after step, aborted after plant, incomplete ascent, incomplete return, and clip ending during return.
- Static split squat, actual FMS inline lunge, walking lunge, reverse lunge, lateral lunge, squat, step-only, and side-switch negatives.
- Multiple bottoms/bounce, pause at bottom, overlapping step/descent, step past standing anchor, extra recovery step.
- Lead-side mismatch, mirrored video metadata, far-side lead, body rotation, oblique view, camera movement, bystander.
- Cropped lead foot, cropped rear foot, lead/rear knee occlusion, foot-landmark flicker, timestamp gap, low frame rate, variable frame interval, low light, loose clothing.

### 13.2 Verification measures

- Trial count: exact-match rate and per-sequence absolute error, stratified by lead side and failure type.
- Events: frame/time error to adjudicated label with tolerance curves, not only a single pass threshold.
- Rejection: sensitivity for invalid/partial trials plus false-rejection rate for accepted trials.
- Agreement: event-label and categorical-rejection inter-rater agreement with prevalence disclosed.
- Metrics: bias, limits of agreement, heteroscedasticity, missingness, and repeat-session reliability for each candidate metric.
- Parity: identical protocol results for the same frame sequence across offline/replay paths; live equivalence tested against timestamps and activation state.
- Regression: full squat suite unchanged; planned protocols remain fail-closed; storage/export readers remain backward compatible.

## 14. Requirement-to-code-and-test map

The paths below are **future change targets, not authorization to edit them now**.

| Requirement | Existing seam / repository fact | Future code target | Required test evidence |
|---|---|---|---|
| Represent lunge lifecycle without availability | `ProtocolId` lacks lunge; status is only planned/available | `web/src/core/protocol.ts`, `web/src/protocols/types.ts` | Type/registry tests prove unavailable research protocol cannot analyze or appear available |
| Register protocol fail-closed | Registry has no lunge | Future `web/src/protocols/inlineLunge/` (or renamed forward-lunge path), `registry.ts` | Lookup/list/status tests; analyze throws until runtime/evidence gate |
| Protocol-specific capture view/copy | Current readiness is front-squat specific | Protocol definition plus protocol-aware readiness/guidance seams | Side/oblique/crop/lead-side unit fixtures and camera UI tests |
| Step/plant/bottom/return segmentation | Shared cyclic engine assumes squat-style knee phases | New lunge event segmenter or justified extension; `protocols/runtime.ts` | Synthetic edge events plus independently labeled sequences; negative movements |
| Lead-side identity | No lunge context contract | Capture/session context and protocol runtime input | Declared/observed mismatch, mirrored/far-side, left/right separation tests |
| Event labels with provenance | Benchmark schema supports generic events but current labels lack lunge handbook | `web/src/eval/benchmark/benchmarkSequence.ts`, label tooling, corpus manifest | Parser/serialization, original timestamps, rater/adjudication provenance, subject split invariants |
| Per-event landmark sufficiency | Current capture gate is global/front-view | Lunge quality assessor under protocol runtime | Occlusion/crop/dropout-by-event fixtures; full-abstain tests |
| Experimental count/timing metrics | Metric registry contains squat/posture metrics only | `web/src/core/metric.ts`, future lunge metric registry/collector | Definition/version/missingness tests; exact event arithmetic; tier remains experimental |
| No unsupported findings/coaching | Findings engine is squat-owned | Future lunge finding policy initially empty | Tests prove no angle-based defect, normative claim, or coaching on questionable/invalid capture |
| Session/report provenance | Protocol runtime/session artifact seams exist | `web/src/protocols/runtime.ts`, session artifact/export/report metadata | Protocol/version/view/lead/event-definition round trip; legacy compatibility |
| Availability is a separate switch | Squat is active/default | Registry/UI picker/routing only after human gate | E2E proves lunge absent before approval and selectable only after explicit gated change |
| Squat behavior preserved | Squat runtime is production path | No modification without parity evidence | Existing build, unit, coverage, replay/eval, and camera E2E gates |

## 15. Explicit non-actions

- No source code, protocol registration, threshold, fixture, dataset, or availability change is authorized by this document.
- Do not copy population means, FMS scores, force-plate thresholds, or laboratory angle cutoffs into product logic.
- Do not download or accept terms for UI-PRMD, LLM-FMS, or other participant data without the repository's explicit approval checkpoint.
- Do not call a visible foot plant “ground contact,” infer rear-knee contact, or infer balance from a side-view pose alone.
- Do not infer forces, loads, torques, power, muscle activity, injury risk, diagnosis, mobility capacity, or a cause of a movement strategy.
- Do not describe self-selected trunk, step-length, knee-over-toe, hip, or ankle strategies as errors without a validated task-specific outcome relationship.
- Do not expose an FMS score, “correct/incorrect” classifier, normative grade, or composite movement-quality score.
- Do not repurpose squat thresholds or its front-view readiness heuristics for lunge.

## 16. Unresolved questions and confidence assessment

| Question | Current answer | Confidence / closure evidence |
|---|---|---|
| Which task is intended? | Repository behavior says dynamic step-and-return; name says FMS inline lunge | High that there is a conflict; owner decision required |
| Can consumer MediaPipe reliably count complete trials? | Plausible, untested | Low; approved subject-held-out labeled videos |
| Can RGB identify physical contact or toe-off? | Not directly | High; use visible kinematic proxies or synchronized force validation |
| Is bottom maximum lead-knee flexion? | Reproducible candidate convention | Medium; rater agreement and plateau analysis |
| Is lead-knee angle at bottom valid? | Not established | Low; simultaneous KinematicIQ and marker-based 3D comparison at target event |
| Are hip/ankle angles usable? | Not for initial product output | Medium-high; current 2D lunge evidence shows meaningful limitations |
| Can strict side view retain bilateral landmarks? | Sometimes, with expected overlap | Medium; consumer capture observability study across bodies/clothing/views |
| Should left/right leads use one model? | Unknown | Low; stratified development/test results and interaction analysis |
| What makes shallow “invalid”? | No defensible universal angle threshold | High; treat as descriptive unless task completion itself is absent |
| What numeric gates should pass M78? | Not determined here | High that they must be predeclared after a label pilot and before held-out evaluation |

Overall confidence is **High** in the repository/governance audit and protocol-name contradiction, **Medium** in the proposed event ontology and side-view capture hypothesis, and **Low** in any KinematicIQ count, event-accuracy, joint-angle, or reliability claim until target-protocol data are collected and evaluated.

## 17. References

1. Vakanski A, Jun H-P, Paul D, Baker R. A Data Set of Human Body Movements for Physical Rehabilitation Exercises. *Data*. 2018;3(1):2. [https://doi.org/10.3390/data3010002](https://doi.org/10.3390/data3010002)
2. Liao Y, Vakanski A, Xian M, Paul D, Baker R. A Deep Learning Framework for Assessing Physical Rehabilitation Exercises. *IEEE Transactions on Neural Systems and Rehabilitation Engineering*. 2020;28(2):468-477. [https://doi.org/10.1109/TNSRE.2020.2966249](https://doi.org/10.1109/TNSRE.2020.2966249)
3. Zhou Z, et al. LLM-FMS: A fine-grained dataset for functional movement screen action quality assessment. *PLOS ONE*. 2024. [https://doi.org/10.1371/journal.pone.0313707](https://doi.org/10.1371/journal.pone.0313707)
4. Cook G, Burton L, Hoogenboom BJ, Voight M. Functional movement screening: the use of fundamental movements as an assessment of function—Part 1. *International Journal of Sports Physical Therapy*. 2014;9(3):396-409. [https://pmc.ncbi.nlm.nih.gov/articles/PMC4060319/](https://pmc.ncbi.nlm.nih.gov/articles/PMC4060319/)
5. Riemann BL, Lapinski S, Smith L, Davies G. Biomechanical analysis of the anterior lunge during 4 external-load conditions. *Journal of Athletic Training*. 2012;47(4):372-378. [https://doi.org/10.4085/1062-6050-47.4.16](https://doi.org/10.4085/1062-6050-47.4.16)
6. Farrokhi S, Pollard CD, Souza RB, Chen Y-J, Reischl S, Powers CM. Trunk position influences the kinematics, kinetics, and muscle activity of the lead lower extremity during the forward lunge exercise. *Journal of Orthopaedic & Sports Physical Therapy*. 2008;38(7):403-409. [https://doi.org/10.2519/jospt.2008.2634](https://doi.org/10.2519/jospt.2008.2634)
7. Escamilla RF, Zheng N, MacLeod TD, et al. Patellofemoral compressive force and stress during the forward and side lunges with and without a stride. *Clinical Biomechanics*. 2008;23(8):1026-1037. [https://doi.org/10.1016/j.clinbiomech.2008.05.002](https://doi.org/10.1016/j.clinbiomech.2008.05.002)
8. Comfort P, Jones PA, Smith LC, Herrington L. Joint kinetics and kinematics during common lower limb rehabilitation exercises. *Journal of Athletic Training*. 2015;50(10):1011-1018. [https://doi.org/10.4085/1062-6050-50.9.05](https://doi.org/10.4085/1062-6050-50.9.05)
9. Chida S, et al. Assessing the validity of two-dimensional video analysis for measuring lower limb joint angles during fencing lunge. *Frontiers in Sports and Active Living*. 2024;6:1335272. [https://doi.org/10.3389/fspor.2024.1335272](https://doi.org/10.3389/fspor.2024.1335272)
10. Peng Y, Mao Y, Zhang L, Yu L, Zhang Y. In vivo knee biomechanics during badminton lunges at different distances and different foot positions by using the dual fluoroscopic imaging system. *Frontiers in Bioengineering and Biotechnology*. 2023;11:1320404. [https://doi.org/10.3389/fbioe.2023.1320404](https://doi.org/10.3389/fbioe.2023.1320404)
11. Hauenstein JD, Huebner A, Wagle JP, et al. Reliability of Markerless Motion Capture Systems for Assessing Movement Screenings. *Orthopaedic Journal of Sports Medicine*. 2024;12(3):23259671241234339. [https://doi.org/10.1177/23259671241234339](https://doi.org/10.1177/23259671241234339)
