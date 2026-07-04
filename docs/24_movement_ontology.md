# Movement Ontology — The Conceptual Model of KinematicIQ

**Status:** Canonical (M19 Phase 0, rev 2 — user-reviewed). This document defines what KinematicIQ believes human movement *is*, what questions it is allowed to answer, and what conclusions it must never draw. Every engine type must trace to a definition here; every definition here must name the TypeScript type or module that embodies it. No definition without a type; no type without a definition.

**Relationship to other canonical docs:**
- [strategy/safety-claims.md](strategy/safety-claims.md) — language rules; the forbidden-conclusions list below restates it at the *reasoning* level.
- [strategy/posture-metric-model.md](strategy/posture-metric-model.md) — the concept glossary; those concepts become *evidence*, not outputs, under this ontology.
- [strategy/movement-expansion.md](strategy/movement-expansion.md) — the MovementProfile architecture; this document sits one layer above it.
- [strategy/validation-strategy.md](strategy/validation-strategy.md) — how conclusions earn trust.

---

## 1. Core principles

**P1 — Questions, not measurements.** KinematicIQ does not report measurements. It answers coach questions with verdicts supported by evidence, at a stated confidence, or it abstains and says why. A measurement with no question is not a feature.

**P2 — Abstention over speculation.** When evidence is insufficient, the system abstains rather than extending conclusions beyond what the observed data supports. Abstention is a correct output, not an error state. The system's credibility is spent on what it commits to; disciplined silence protects it.

**P3 — Observable movement only.** The camera sees kinematics — positions, angles, timing. KinematicIQ describes observable movement and never infers underlying physiology (see §6, forbidden conclusions).

**P4 — Movement is not performance.** *Movement execution* (how the body organized the task) and *athletic performance* (the task outcome — height jumped, load lifted, time run) are different domains. KinematicIQ analyzes execution. Outcome measures may appear as observations in future sport-specific work, but they never blend into movement verdicts and there is no composite across the two domains.

**P5 — Separate the movement from how it is observed.** A movement definition is protocol-independent; *what can be observed about it* is protocol-dependent. The same movement will eventually support multiple validated observation protocols (front, side, 45°, multi-camera). Consequence: **validation is scoped to (question, protocol) pairs** — a verdict validated on front-view footage is unvalidated on side-view footage until it passes the bar there too.

## 2. The pipeline

System layers (module boundaries):

```
Tracking                 cv/poseEngine.ts → cv/landmarkFilter.ts
→ Reconstruction         analysis/frameTrace.ts + analysis/posture/postureFrame.ts
→ Movement definition    analysis/movement/ (profiles: what the movement IS)
→ Observation protocol   analysis/protocol/ (how we are watching it; gates evidence availability)
→ Coach questions        analysis/questions/ (registry: what the analysis is FOR)
→ Reasoning chain        analysis/evidence/ → analysis/verdict/ → analysis/recommendations/
```

The reasoning chain separates observation from interpretation — five distinct stages, each a distinct type:

```
Observation       a measured fact, no meaning        "trunk angle increased 18° between 60–100% of descent"
→ Evidence        observations aggregated into a     "progressive trunk flexion after 60% descent,
                  question-relevant pattern            consistent across 5 of 6 reps"
→ Interpretation  the meaning assigned to the        "posture organization deteriorated late in the descent"
                  pattern, in observation language
→ Verdict         a label from the question's        progressive-collapse (@ ~60% depth)
                  closed vocabulary, or abstention
→ Recommendation  safe-language coaching suggestion  "focus on holding trunk position through the
                  keyed to the verdict                 second half of the descent — in this set"
```

Validation targets the *whole chain*: a verdict is only correct if its interpretation direction and its evidence survive replay, perturbation, and the labeled clip set. A single measurement crossing a threshold is never a conclusion. A conclusion with no evidence chain is a bug.

## 3. Definitions

Each entry: definition → embodied by → honest limits.

### 3.1 Movement
A goal-directed, time-bounded reorganization of the body. Two granularities:
- **Movement pattern** — a family with shared structure (squat, hinge, lunge, push, pull, rotation, gait).
- **Movement instance** — one recorded set/session of one pattern.

**Embodied by:** `MovementProfile` (`analysis/movement/types.ts`) defines the pattern; `SessionResult` (`session/types.ts`) records the instance.
**Limits:** the system observes kinematics only — never kinetics.

### 3.2 Movement definition vs observation protocol
The **movement definition** states what the movement is: its phases, its progress signal, its completion standard, its applicable questions. The **observation protocol** states how it is being watched: viewpoint, framing, distance, compliance rules — and therefore which evidence is *available* at what confidence. One movement : many protocols. Unsupported evidence under the achieved protocol is hidden, never estimated.

**Embodied by:** `MovementProfile` (definition) and `CaptureProtocol` (`analysis/protocol/types.ts`, Phase 1) with `metricAvailability`; `MovementProfile.protocols` + `defaultProtocolId` (Phase 2); `validationTier` scoped per (question, protocol) in `analysis/verdict/verdictConfig.ts` (Phase 3–4).
**Limits:** protocol compliance is itself an inference from landmarks (advisory yaw estimates, framing checks) and feeds `capture-quality` evidence rather than hard-blocking.

### 3.3 Movement phase
A contiguous interval of an instance with a distinct mechanical purpose. Phases are the *addressing scheme* for all evidence: every observation says *when* it happened. Phase families follow the segmentation kind: cyclic (standing/descending/bottom/ascending), ballistic (takeoff/flight/landing), gait (stride windows).

**Embodied by:** the cyclic FSM in `analysis/phaseDetector.ts` (`SquatState`, `CyclicPhaseConfig`); `FrameTraceSample.phase` (`analysis/frameTrace.ts`, Phase 1); `Observation.phase` (`analysis/evidence/types.ts`, Phase 3).
**Limits:** phases are inferred with hysteresis; boundary frames are uncertain, so observations avoid claims that hinge on exact phase-boundary frames.

### 3.4 Posture
The instantaneous configuration of body segments — joint angles plus segment orientations — with per-angle tracking confidence attached. Posture is a snapshot; it carries no judgment.

**Embodied by:** `JointAngles` + `JointAngleConfidences` (`analysis/angles.ts`); `PostureFrame` (`analysis/posture/postureFrame.ts`, 3D); `FrameTraceSample` (Phase 1, the 2D time-series form).
**Limits:** no segmental spine resolution (thoracic honesty); z is the noisiest channel; front-view forward-lean is weakly observable in 2D.

### 3.5 Organization
The degree to which posture is *maintained and controlled through a phase*, relative to the athlete's own baseline within the set. Organization is about trajectories, not snapshots. Always self-referenced — there is no absolute "good posture."

**Embodied by:** trajectory descriptors in `analysis/evidence/generators/postureOrganization.ts` (Phase 3) over `FrameTraceSample` + `PostureFrame` series.
**Limits:** organization claims require dense phase coverage; sparse or low-confidence frames force abstention, not interpolation.

### 3.6 Movement strategy
The characteristic way an athlete distributes motion across joints and segments to accomplish the movement. **A strategy is a description, not an error.** Whether a strategy is desirable is a coaching judgment; the system may note when a strategy differs from the movement's stated intent (hip dominance is the *point* of a hinge) but does not judge normatively.

**Embodied by:** `QuestionVerdict` for `strategy-selection` (`analysis/verdict/types.ts`, Phase 3); every strategy label bound by the verdict label contract (§7).
**Limits:** strategy classification needs ≥3 usable reps and cross-rep agreement; single-rep strategy claims are forbidden by the evidence bar.

### 3.7 Variability
The dispersion of a posture or strategy descriptor across repetitions or windows within a session. Low = repeatable; high = mixed or changing. Variability is evidence, never a verdict by itself — it distinguishes "consistent shift left" (a strategy) from "inconsistent reads" (an abstention).

**Embodied by:** the `variability` evidence category; `depthCV` (`eval/metrics.ts`); per-rep spreads in `analysis/metricCollector.ts`.
**Limits:** with 3–10 reps, variability estimates are coarse; they gate conclusions rather than star in them.

### 3.8 Adaptation
A *directional* change in strategy or organization across the session. In M19, within-set only (rep 1 vs rep N). Adaptation describes the kinematic trend — it never attributes the trend to fatigue or any physiological state (§6).

**Embodied by:** trend descriptors inside evidence generators (Phase 3); `SessionExport` (`session/exportSession.ts`, Phase 5) preserves data for future longitudinal work.
**Limits:** within-set trends over few reps are suggestive, not conclusive; a trend must survive perturbation stability before shipping as evidence.

### 3.9 Observation
A single measured fact about the movement instance: value, unit, and location (phase, rep(s), progress window), with confidence. **An observation carries no meaning** — "trunk angle increased 18° between 60% and 100% of descent" is an observation; "posture deteriorated" is not.

**Embodied by:** `Observation` (`analysis/evidence/types.ts`, Phase 3): `{ metric, value, unit, phase?, progressWindow?, repNumbers, confidence }`.
**Limits:** every observation's metric must exist in the metric catalog (§5).

### 3.10 Evidence
Observations aggregated into a **question-relevant pattern** — e.g., "progressive trunk flexion after 60% descent, consistent across 5 of 6 reps." Evidence belongs to exactly one coach question and one category:

| Category | What it captures | Example measurements |
|---|---|---|
| `kinematic-geometry` | angles, positions, ratios at defined moments | hinge ratio at bottom, signed hip offset, min knee angle |
| `temporal` | durations, timing, tempo | descent time, bottom pause, phase-duration ratios |
| `variability` | rep-to-rep dispersion | depth CV, trunk-drift spread |
| `laterality` | left/right comparisons | knee L/R asymmetry, shoulder level, per-side repeatability |
| `capture-quality` | how trustworthy the recording is | per-angle confidence coverage, protocol compliance, jitter |

Multiple evidence items support each verdict; categories are deliberately cross-cutting so no verdict rests on one kind of signal.

**Embodied by:** `EvidenceItem` + `EvidenceCategory` (`analysis/evidence/types.ts`, Phase 3): `{ question, category, pattern, observations: Observation[], confidence }`.

### 3.11 Interpretation
The meaning assigned to evidence within the movement's context — what the pattern suggests about organization or strategy, stated in observation language ("posture organization deteriorated late in the descent"). Interpretation is the bridge between evidence and verdict, and it is stored separately from both so validation can check that the *direction of meaning* is right even when a label is arguable.

**Embodied by:** `QuestionVerdict.interpretation` (`analysis/verdict/types.ts`, Phase 3), distinct from `label` and from the evidence list.
**Limits:** interpretations obey the same allowed/forbidden lists as verdicts; an interpretation may never smuggle in a forbidden conclusion.

### 3.12 Confidence
A bounded estimate of how much an observation, evidence item, or verdict should be trusted — derived from landmark visibility, protocol compliance, sample coverage, and internal agreement (2D/3D cross-checks). Confidence **gates** conclusions; it can silence the system but never strengthen a claim.

**Embodied by:** `JointAngleConfidences` (`analysis/angles.ts`); `PoseFrame.poseConfidence` (`cv/types.ts`); per-item confidence on `Observation`/`EvidenceItem`; per-question gates in `analysis/verdict/verdictEngine.ts`; session tier in `feedback/confidenceCalculator.ts`.
**Limits:** confidence is heuristic, not calibrated probability; the validation pyramid (Phase 4) is what turns "the system is confident" into "the system deserves confidence."

### 3.13 Coach question
The unit of product value: a question a performance coach would actually ask, with a defined evidence requirement and a **closed verdict vocabulary**. Features begin here.

**Embodied by:** `MovementQuestion` (`analysis/questions/types.ts`, Phase 2): `{ id, coachPhrasing, appliesTo, evidenceRequirements, verdictVocabulary, recommendationKeys }`; `analysis/questions/registry.ts`.

### 3.14 Verdict
The system's answer to a coach question: **either** a committed label from that question's closed vocabulary — with interpretation and supporting evidence attached — **or** an abstention. Verdicts carry a `validationTier` (`provisional` → `validated`) **scoped to the observation protocol the session used** (P5).

**Embodied by:** `QuestionVerdict` discriminated union (`analysis/verdict/types.ts`, Phase 3); per-(question, protocol) tiers in `analysis/verdict/verdictConfig.ts`.

### 3.15 Abstention
A first-class outcome, not a failure state (P2). An abstention names its reason and the concrete capture fix. Enumerated reasons: `too-few-reps`, `low-coverage`, `mixed-pattern`, `sensor-disagreement` (2D/3D cross-check failed), `protocol-noncompliance`.

**Embodied by:** the `abstain` arm of `QuestionVerdict`; `AbstainReasonId` (`analysis/verdict/types.ts`).
**Design intent:** coaches trust tools that know when they don't know. Frequent trunk abstention from the front view is correct behavior, not a defect.

### 3.16 Recommendation
A safe-language coaching suggestion keyed to a **verdict** — never directly to a metric. Follows finding → interpretation → suggestion → confidence and obeys every rule in safety-claims.md. Recommendation maps are per-movement (universal vocabulary, movement-specific meaning — §9 Finding 2).

**Embodied by:** `analysis/recommendations/` (Phase 3), superseding the lowest-2-components selection in `feedback/feedbackEngine.ts` for question-covered findings.

## 4. The universal coach questions (v1 registry)

Four questions, movement-generic by construction. Squat is the first instantiation; the same questions re-instantiate for other patterns with different evidence generators, thresholds, and completion standards.

| Question ID | Coach phrasing | Squat v1 vocabulary | Primary evidence | Supporting evidence |
|---|---|---|---|---|
| `movement-completion` | "Was the movement successfully completed?" | completed / partial / not-completed | per-rep progress vs the profile's completion standard (working-depth band) | fraction of reps meeting standard, rep-gate outcomes |
| `strategy-selection` | "How did the athlete organize the movement?" | hip-dominant / knee-dominant / balanced | per-rep hinge ratio (3D) | phase durations, depth trajectory shape |
| `posture-organization` | "Did posture remain organized under load?" | stable / progressive-collapse / abrupt-break (@ depth %) | 3D trunk-angle-vs-progress series | 2D trunk-lean sign cross-check, rep-to-rep trunk variability |
| `load-symmetry` | "Did the athlete load both sides evenly?" | centered / shift-left / shift-right | signed hip offset at bottom (frame trace) | knee L/R asymmetry, shoulder level, cross-rep repeatability |

Notes:
- **Completion is movement-agnostic; the standard is profile-defined** (`MovementProfile.completionStandard`, Phase 2): depth band for squat, hinge range for hip hinge, lockout for push. Relation to rep gates: `repGates` decide a rep *happened*; completion decides whether it met the movement's stated standard. Completion also contextualizes other verdicts — strategy conclusions over predominantly partial reps carry reduced confidence.
- The registry is open but disciplined: a candidate fifth question, `rhythm-control` ("Did the athlete maintain rhythm and control?", smoothness/tempo as evidence), is explicitly **not in M19** — it enters only when it can pass the same validation bar.

## 5. The metric rule

**No metric exists merely because it is computable.** Every metric must be cataloged in `analysis/metricCatalog.ts` (Phase 2) with: the question it supports, its evidence category, the verdicts that consume it, and the confidence it contributes. Status per entry: `evidence` (feeds a question), `analyst-only` (visible in analyst appendix, no conclusions), or `deprecated`. A vitest test enforces catalog completeness. Existing orphans (e.g., standalone smoothness, average-trunk-angle-as-output) are demoted to `analyst-only` or absorbed as evidence — never silently deleted, never shown as primary output.

## 6. Allowed and forbidden conclusions

The language layer is governed by safety-claims.md. This section governs the layer beneath it: what the *reasoning engine* may conclude at all. Verdict vocabularies and interpretation rules are the enforcement mechanism — a conclusion outside these lists cannot be expressed because no type carries it.

### KinematicIQ MAY conclude (all confidence-qualified, self-referenced, observation-verbed):
1. **Completion descriptions** — whether reps met the movement's stated standard, in this set.
2. **Strategy descriptions** — how this athlete organized this movement, in this set, from this capture ("hip-dominant descent").
3. **Organization descriptions** — whether posture held, drifted, or broke, and where in the movement ("trunk drift began around 60% depth").
4. **Laterality observations** — direction and magnitude of side-to-side differences, as kinematic observations only.
5. **Within-set change** — rep 1 vs rep N trends in the above ("depth decayed across the set").
6. **Repeatability statements** — how consistent the pattern was across reps.
7. **Capture-quality statements and abstentions** — what the camera could and could not see, and what would fix it.

### KinematicIQ MUST NEVER conclude (at any confidence, in any phrasing, in any layer — verdicts, interpretations, evidence patterns, recommendations, or copy):
1. **Injury risk or injury prediction** — in any form.
2. **Diagnosis or pathology** — "abnormal," "dysfunctional," "damaged," or any medical framing.
3. **Tissue or joint health states** — not observable from video.
4. **Kinetics** — force, load, torque, power, joint stress "measured" from video.
5. **Muscle activation** — which muscles fired, how hard, in what order.
6. **Anatomical cause attribution** — "weak glutes," "tight ankles." The camera sees *what* changed, never *why* anatomically.
7. **Fatigue state** — "the athlete was fatigued." The kinematic trend ("depth decayed across the set") is allowed; the physiological state attribution is not.
8. **Mobility limitations** — "limited ankle dorsiflexion capacity." Observed range in this set is allowed; capacity claims are not.
9. **Motor control deficits** — any claim about the quality of the athlete's motor control system.
10. **Compensation causes** — describing an observed pattern is allowed; claiming it is a compensation *for* something is cause attribution.
11. **Neurological impairment** — in any form.
12. **Readiness / return-to-play judgments** — staff decisions, not software.
13. **Normative comparisons** — measuring an athlete against a "healthy" or population standard; all deviation is self-referenced.
14. **Segmental spine claims** — trunk-level drift only, always sub-high confidence (thoracic honesty).
15. **Cross-domain and cross-movement composites** — no universal movement score, no movement-quality number spanning patterns, no blending of execution and performance (P4), and no composite score within a pattern.

The unifying rule behind 5–11: **the camera describes observable movement; it never infers underlying physiology.**

## 7. The verdict label contract

Every label in every verdict vocabulary must eventually carry seven fields. A label's `validationTier` cannot flip to `validated` for a protocol until all seven are populated for that (label, protocol) pair:

| Field | Content | Where it lives |
|---|---|---|
| **Operational definition** | the formula: signals, thresholds, progress-signal reference, aggregation rule | `analysis/verdict/verdictConfig.ts` (per-label spec) |
| **Observable evidence** | which evidence categories and cataloged metrics may support it | `verdictConfig.ts` + `analysis/metricCatalog.ts` |
| **Confidence requirements** | the bars to speak: min reps, coverage, agreement fraction, cross-check rules | `verdictConfig.ts` evidence bars |
| **Validation dataset** | the labeled clips it was tuned on (`tune`) and proven on (`holdout`), with date and numbers | `web/eval-clips/manifest.json` + provenance comment in `verdictConfig.ts` |
| **Known counterexamples** | clips/conditions that fool it, documented honestly | `eval-clips/README.md` counterexample log |
| **Decision consequence** | the coaching decision this label changes when emitted — including "confirms current programming, no change." A label that changes no decision does not enter the vocabulary | `verdictConfig.ts` (per-label spec) + the recommendation map |
| **Counterfactual** | what evidence pattern would have flipped this verdict to a different label in the same vocabulary, stated concretely enough to test | `verdictConfig.ts` (per-label spec); rendered with the verdict in analyst mode |

This is what "scientifically defensible" means operationally: for any verdict the system emits, a technical reviewer can be shown its definition, its evidence, its bars, its dataset, its known failure modes, the decision it informs, and what would have changed the system's mind.

**Counterfactual principle.** A label whose counterfactual cannot be written is a label that cannot be validated: the counterfactual *is* the decision boundary between two labels, stated in evidence terms — which is exactly what a labeled dataset tunes and an inter-rater study tests. Writing it is therefore a precondition for collecting validation data for the label, not documentation added afterward. If two raters cannot agree on the counterfactual, the label is ill-posed and must be redefined before any thresholds are chosen.

## 8. Seven-pattern roadmap (paper level — no implementation before validation of the previous pattern)

How the universal questions instantiate across the foundational patterns. `movement-completion` applies to all patterns via each profile's completion standard and is omitted from the columns. Kind selects the segmentation engine per movement-expansion.md.

| Pattern | Kind | `strategy-selection` asks… | `posture-organization` asks… | `load-symmetry` asks… | Protocol notes |
|---|---|---|---|---|---|
| **Squat** (v1) | cyclic | hip- vs knee-dominant descent | trunk line through descent | lateral settle at bottom | front-view v1; side-view unlocks trunk |
| **Hip hinge** | cyclic | hip dominance achieved? (dominance is the *intent*) | spine line through the hinge | even hip loading | side view primary — trunk is the star signal |
| **Lunge** | cyclic (alternating) | step strategy (stride length/tempo per side) | pelvis/trunk control on single-leg base | **the star question** — per-leg comparison needs per-side rep attribution | front or 45°; per-side rep bookkeeping is the new machinery |
| **Push** (push-up/press) | cyclic | elbow-path / body-line strategy (landmark-limited) | hip sag / trunk line — the star | even arm drive | side view for body line; wrist/elbow confidence matters |
| **Pull** (row/pull-up) | cyclic | same trio; equipment occlusion is the constraint | trunk/swing control | even pull | hardest capture protocol; defer until protocol system matures |
| **Rotation** (chop/rotational throw prep) | cyclic/ballistic | proximal→distal sequencing — needs richer temporal evidence than v1 has | trunk control through rotation | side dominance | hardest analytically from one camera; explicitly last |
| **Gait/sprint** | gait | stride strategy, arm clearance | trunk through stride | L/R stride symmetry | window-based, no reps; stride segmentation replaces rep FSM |

## 9. Hinge paper test — first pass (M19 Phase 0)

Method: walk the hip hinge through every interface as configuration-on-paper. No hinge code ships in M19; findings below are **interface requirements** for Phases 2–3 type design.

**What holds with zero change:** the cyclic segmentation engine; the four universal questions; evidence categories; the observation→interpretation chain; verdict-or-abstain semantics; abstention reasons; the protocol registry (hinge registers a side-view protocol); the metric catalog; the validation bar and label contract.

**Finding 1 — the progress signal must be profile-selected.** Squat phase detection and "depth %" both key on knee angle + hip drop. A hinge has minimal knee bend by design; its descent is driven by trunk/hip flexion. Therefore the movement model needs a per-profile **progress signal** selector used by the phase FSM inputs, the completion standard, and the evidence generators' progress normalization. → Requirement on `MovementProfile.progressSignal` (Phase 2): evidence normalizes against the profile's progress signal, never against knee angle directly.

**Finding 2 — vocabularies are universal; interpretation maps are per-movement.** `strategy-selection` answers "hip-dominant" for both squat and hinge, but for a hinge that label confirms intent while for a squat it describes a trade-off. Vocabulary stays universal; the **interpretation and recommendation maps are per-movement** (resolved through the active `MovementProfile`). This is now reinforced by the observation/interpretation split (§3.11): the same evidence pattern can carry different interpretations per movement without touching the label.

**Finding 3 — evidence generators are per-question, parameterized by profile — not per-movement forks.** `postureOrganization` for hinge reuses the trunk-vs-progress machinery with different thresholds and progress signal; `loadSymmetry` is unchanged; `strategySelection` reuses hinge-ratio evidence with different bands; `movementCompletion` reuses the standard-vs-progress check with a hinge-range standard. This is the reuse claim, and on paper it survives.

**Finding 4 — protocol separation is what makes hinge cheap.** Because validation is scoped to (question, protocol) pairs (P5), adding hinge = one movement definition + one side-view protocol + re-running the validation pyramid. No engine changes, no revalidation of squat.

**Verdict on the interfaces:** hold, with Findings 1–2 baked into the Phase 2/3 type designs. Re-run this test against the *frozen* interfaces at the end of Phase 2.

## 10. Ontology → type map (build checklist)

| Concept | Type / module | Status |
|---|---|---|
| Movement pattern / instance | `MovementProfile` / `SessionResult` | exists |
| Phase | `SquatState`, `CyclicPhaseConfig`; `FrameTraceSample.phase` | exists / Phase 1 |
| Posture | `JointAngles`, `JointAngleConfidences`, `PostureFrame`, `FrameTraceSample` | exists (WIP) / Phase 1 |
| Observation protocol | `CaptureProtocol` (`analysis/protocol/types.ts`) + `metricAvailability` | Phase 1 |
| Coach question | `MovementQuestion`, `QuestionId` (`analysis/questions/`) | Phase 2 |
| Completion standard | `MovementProfile.completionStandard` | Phase 2 |
| Progress signal | `MovementProfile.progressSignal` (Finding 1) | Phase 2 |
| Metric rule | `MetricCatalogEntry` (`analysis/metricCatalog.ts`) + completeness test | Phase 2 |
| Observation | `Observation` (`analysis/evidence/types.ts`) | Phase 3 |
| Evidence | `EvidenceItem`, `EvidenceCategory` (`analysis/evidence/types.ts`) | Phase 3 |
| Interpretation | `QuestionVerdict.interpretation` (`analysis/verdict/types.ts`) | Phase 3 |
| Verdict / abstention | `QuestionVerdict`, `AbstainReasonId`, `ValidationTier` (per question × protocol) | Phase 3 |
| Verdict label contract | per-label spec in `verdictConfig.ts` + manifest provenance + counterexample log | Phase 3–4 |
| Recommendation | `analysis/recommendations/` | Phase 3 |
| Validation bar | `eval/verdictEval.ts`, `eval/selfConsistency.ts` | Phase 4 |
| Adaptation (longitudinal seam) | `SessionExport` (`session/exportSession.ts`) | Phase 5 |
