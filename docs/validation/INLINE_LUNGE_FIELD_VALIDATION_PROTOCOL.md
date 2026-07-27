# KinematicIQ Forward-Lunge Field-Validation Protocol

**Document status:** preregistration-ready design draft; research-only
**Protocol working name:** `forward lunge with stride and return`
**Protocol version:** research definition `flsr-v0`
**Repository basis:** `master` at `8d8a77d`, inspected 2026-07-14
**Activation status:** blocked; this document authorizes neither collection, implementation, nor availability

## 1. Study purpose and activation decision

This study is designed to decide whether KinematicIQ can identify and describe a forward lunge with stride and return from one fixed, near-sagittal consumer RGB recording while abstaining when the task, view, landmarks, identity, or timestamps are not trustworthy.

The name is intentionally provisional. The repository's standing-to-step-to-return task is not the fixed narrow split-stance Functional Movement Screen (FMS) inline lunge. The owner must approve the protocol identity before capture. If the intended task is the FMS inline lunge, this protocol is invalid and must be rewritten.

Current repository authority is stricter than the supplied Phase 4 prompt: M73 and M78 keep lunge research-only, no lunge implementation exists, dataset acquisition needs separate approval, and availability is a later switch. Consequently:

1. Engineering fixtures and schemas may be designed, but production lunge code is not authorized here.
2. A locked validation study may start only after the human approvals in Section 15 are recorded.
3. Passing engineering tests cannot satisfy scientific gates.
4. Passing scientific endpoints cannot activate the protocol. Public availability requires a separate written owner decision after claims, device, usability, accessibility, and privacy review.

## 2. Scope and non-goals

### In scope

- protocol identity and setup compliance;
- complete-trial count and count error;
- declared lead-side agreement;
- frame-level step, visible plant, descent, bottom, ascent, return-initiation, and stable-return events;
- completed, shallow-excursion, aborted, incomplete-return, wrong-movement, and capture-invalid categories;
- capture-quality and abstention behavior;
- timestamp-derived durations;
- analyst-only projected lead-knee angle at adjudicated bottom in an optional synchronized reference subset;
- repeatability only for metrics whose validity and missingness gates first pass;
- device, effective frame-rate, view, lighting, clothing, body-presentation, lead-side, and failure-condition strata.

### Out of scope

- the FMS score or clinical interpretation;
- population norms, “correct/incorrect” movement, impairment, diagnosis, mobility capacity, injury risk, readiness, or a composite score;
- ground-reaction force, joint moments, load, power, muscle activation, center of mass, or tissue state;
- frontal-plane knee motion from the required side view;
- model training, model replacement, backend storage, telemetry, or silent collection;
- promotion of rear-leg, hip, ankle, trunk, or angle metrics without their own reference and reliability gates.

## 3. Protocol and preregistered endpoints

### 3.1 Task definition

From a stable bilateral standing calibration, the participant advances the declared lead foot, establishes a visible planted position, descends, reverses near maximum lead-knee flexion, ascends, and returns the lead foot to the calibrated bilateral standing region. Left- and right-lead trials are separate. A static split squat, walking lunge, reverse/lateral lunge, FMS inline lunge, or squat is not this task.

RGB labels use **visible plant** and **return initiation**, never physical contact, braking, propulsion, or toe-off. A force plate may define contact only inside an optional synchronized reference subset.

### 3.2 Analysis populations

- **Attempted trials:** every initiated target or negative movement, including rejected and unusable trials.
- **Protocol-readable trials:** attempted trials for which independent raters can determine task identity and category.
- **Algorithm-eligible trials:** trials meeting the frozen capture/temporal input contract before outcome comparison.
- **Reference-eligible measurements:** paired observations satisfying the metric-specific reference protocol.

The report must show denominators and flow between all four populations. Primary performance cannot be reported only among successful algorithm outputs.

### 3.3 Primary endpoints

| Endpoint | Unit and truth | Statistic | Primary decision |
|---|---|---|---|
| Complete-trial count | Per recording; adjudicated completed trials | Exact-count agreement with subject-clustered 95% CI; count MAE with CI | Both frozen gates `G_COUNT_EXACT` and `G_COUNT_MAE` must pass |
| Bottom event | Matched completed trial; adjudicated frame/time | Event recall/precision/F1; median and 95th-percentile absolute error in frames and ms with CIs | Recall/F1 and error gates `G_BOTTOM_*` must pass |
| Stable-return completion | Attempted trial; adjudicated completed/not completed | Sensitivity, specificity, confusion matrix, false-completion rate with CIs | False completion is safety-weighted; all `G_COMPLETE_*` gates pass |
| Invalid-capture abstention | Attempted recording/trial; adjudicated validity | Invalid-case abstention sensitivity and valid-case false-abstention rate with CIs | Both `G_ABSTAIN_INVALID` and `G_ABSTAIN_VALID` pass |

`G_*` values are not filled from literature. Development data estimate variance and operational cost; a statistician, biomechanics lead, product/claims owner, and engineering owner approve the numeric registry before the locked set is opened. The signed registry and its hash are part of preregistration.

### 3.4 Secondary endpoints

- step, visible-plant, descent-onset, ascent-onset, return-initiation, and stable-return precision/recall/F1 and absolute error;
- lead-side raw agreement and confusion matrix;
- shallow/aborted/incomplete-return/wrong-movement/capture-invalid confusion matrices;
- duration MAE/bias for matched trials;
- missingness and failure rate by event, landmark dependency, and reason;
- per-subject distributions and worst-case recordings;
- performance by lead side, device class, effective frame-rate band, lighting, clothing/occlusion, body-presentation, view perturbation, and negative type;
- algorithm-versus-adjudicated-rater agreement, kept separate from rater-versus-rater agreement;
- optional projected lead-knee angle agreement against synchronized reference;
- optional test-retest reliability after validity gates pass.

No secondary endpoint rescues a failed primary endpoint. Multiplicity, exploratory subgroup analyses, and any post hoc threshold must be labeled exploratory.

## 4. Participant and trial design

### 4.1 Sampling frame

Recruit adults under an approved consent/privacy plan. The sampling matrix must span the body presentations and capture challenges relevant to consumer video without claiming population representativeness. Record only study-relevant strata; do not collect diagnoses, injury history, medication, exact address, or other unnecessary health/identity data.

Balance or deliberately cover:

- left- and right-lead performance;
- a range of statures, limb proportions, body presentations, skin/background contrast, and clothing silhouettes;
- device/browser/OS classes named before recruitment;
- portrait/landscape modes if both are intended;
- standard and deliberately perturbed view/framing/lighting conditions;
- valid target trials and assigned negative/adversarial trials.

Report recruitment source and convenience-sample limits. Do not call the sample representative.

### 4.2 Trial schedule

For the provisional field-development schedule, each participant performs:

1. one setup/calibration recording;
2. at least three attempted standard-condition trials with the left lead;
3. at least three attempted standard-condition trials with the right lead;
4. assigned negative/adversarial recordings from the matrix in the dataset specification;
5. a second standardized session for the reliability subset, separated by the preregistered interval.

Three trials allow a within-set dispersion estimate but do not establish reliability. The final repetitions, rest, order randomization, familiarization, stopping rules, and retest interval must be frozen in the capture manual before collection. Participants may stop for any reason; no discomfort or safety interpretation is requested from KinematicIQ.

### 4.3 Sample-size rule

No universal participant count is declared. Before locked collection, calculate sample size from the primary endpoint that demands the largest sample:

- binomial precision for exact-count, event recall, false-completion, and abstention rates;
- precision of subject-clustered count MAE;
- confidence-interval width for event-error quantiles;
- confidence-interval width for Bland-Altman limits when a continuous reference endpoint is included;
- precision of the selected ICC model only if the repeated-measures design supports it.

Use field-development estimates, inflate for clustering and expected unusable/missing recordings, and preserve a minimum number of independent subjects per declared device/condition stratum. A statistician signs the assumptions and executable calculation. More trials from one participant do not replace independent participants.

## 5. Capture conditions and equipment

The standard hypothesis is one fixed phone camera, lead side nearest, optical axis approximately perpendicular to travel, near hip height, with the entire body, both feet, and forward travel corridor visible from setup through stable return. No reviewed evidence supports a universal numeric yaw, pitch, height, distance, occupancy, frame-rate, or visibility tolerance.

Before the locked study:

- field development sweeps yaw, pitch/height, roll, distance/occupancy/lens, crop, occlusion, mirroring, frame rate/gaps, lighting, and clothing;
- the accepted standard range and rejection boundaries are frozen as versioned capture-contract values;
- actual frame dimensions, orientation, mirror transform, nominal and effective fps, timestamp gaps, device/browser/OS, camera placement measurements, zoom changes, and condition labels are recorded;
- no camera moves, pans, rotates, or changes zoom within a standard trial;
- source video retains original timestamps; derived frames do not replace the source record.

Reference subsets may add synchronized marker-based motion capture for angles/events and force plates for physical contact events. Force plates do not authorize kinetic product outputs. Ordinary event/count truth requires synchronized original RGB reviewed by independent raters, not motion capture.

## 6. Ground-truth hierarchy

| Endpoint | Required truth | Permitted reference | Not sufficient |
|---|---|---|---|
| Trial count/category/lead side | Two independent blinded labels plus adjudication | Original timestamped RGB; pose landmarks may be a secondary view after RGB decision is recorded | Algorithm output, dataset “correct” label, FMS score |
| Visible events | Two independent frame labels plus adjudication | Frame-steppable original RGB; synchronized high-rate reference video when available | Smoothed KinematicIQ trace alone |
| Physical contact event | Instrumented synchronized reference | Force plate or validated contact sensor | Visible foot position alone |
| Projected lead-knee angle | Paired target-frame reference | Calibrated marker-based 3D projected into camera plane or validated manual 2D protocol | MediaPipe world landmarks as their own truth |
| Capture validity/occlusion | Two independent labels using frozen capture contract | RGB plus recorded camera metadata | MediaPipe visibility alone |
| Reliability | Repeated valid measurements under a frozen protocol | Same participant across specified sessions; reference repeated where validity is assessed | Multiple repetitions from one session only |

Adjudication creates the evaluation reference but never overwrites Rater A or B. If adjudication cannot resolve an event, the reference remains `ambiguous` or `missing`; it is not coerced to a frame.

## 7. Dataset partitions and leakage controls

1. **Synthetic regression:** generated coordinates/pose tapes testing deterministic state and failure behavior. May pass engineering gates only.
2. **Field development:** approved participant/source recordings used for schema debugging, labeling qualification, threshold selection, filter experiments, and error discovery.
3. **Locked subject-held-out validation:** subjects never used for design, tuning, qualification examples, or threshold choice. Manifest, labels, analysis plan, code version, and gate registry are frozen before algorithm execution.
4. **Optional external/reference subset:** synchronized reference measurements. Subjects are assigned to development or locked roles and may not cross them.

Split by stable pseudonymous `subjectId` before trial processing. Every session, left/right trial, derived pose tape, label, and reference artifact for a subject inherits that split. The validator rejects cross-split subject IDs, duplicate IDs, missing subject IDs, or a locked artifact whose source hash is absent. Device-held-out analysis is additional; it never weakens subject holdout.

Thresholds freeze after field development and before any locked predictions are viewed. A necessary post-lock change invalidates the run, increments the protocol/algorithm/analysis version, records the reason, and requires a new untouched locked set or an explicitly labeled exploratory rerun.

## 8. Rater blinding and adjudication

- Two trained raters receive independently generated packets with randomized IDs and no algorithm predictions, diagnostics, confidence, or other rater labels.
- Qualification uses real field-development recordings not present in the locked set. Synthetic examples may teach tooling but cannot qualify a rater.
- Raters use the labeling handbook's playback speeds, frame rules, ambiguity states, confidence scale, and comments.
- Independent label files are append-only and separately hashed. Packet assignment and submission timestamps are logged.
- Agreement is calculated before adjudication.
- A third authorized adjudicator sees the source and both submitted labels, records a resolution and rationale, and cannot edit the originals.
- Any relabeling round receives a new label version; the prior version remains addressable.

## 9. Statistical analysis plan

### 9.1 General rules

- Unit of independent sampling is the subject; trials are clustered within subject.
- Report numerator, denominator, point estimate, and 95% CI for every primary endpoint.
- Use subject-clustered bootstrap intervals or an explicitly justified clustered model. Resampling individual trials as independent is prohibited.
- Show per-subject results, aggregate results, distribution plots/tables, worst cases, and all prespecified strata.
- Report missingness and algorithm abstentions before accuracy among readable cases.
- Correlation is not agreement and cannot satisfy a gate.

### 9.2 Counts and categorical endpoints

- Trial count: exact-recording agreement, signed and absolute count error, MAE, error distribution.
- Events: perform one-to-one matching in temporal order within the frozen matching window; unmatched truth events are false negatives and unmatched predictions false positives. Report precision, recall, F1, and absolute error only for matched pairs. Include tolerance curves so the frozen tolerance is not the sole view.
- Completion, rejection, lead side, and validity: full confusion matrices, raw agreement, classwise sensitivity/specificity where meaningful, balanced metrics for imbalanced classes, and subject-clustered CIs.
- Inter-rater agreement: raw agreement plus an appropriate chance-corrected coefficient with CI for categorical labels; disclose prevalence and marginal distributions. Frame labels use absolute difference distributions and within-tolerance agreement. Agreement is not algorithm validity.

### 9.3 Continuous endpoints

For a suitable synchronized reference, report paired `n`, missingness, MAE, RMSE, signed bias, difference-versus-mean plot, and Bland-Altman limits of agreement with CIs. Check heteroscedasticity and repeated-measure structure; use a transformation or repeated-measures method only when prespecified and justified. Product acceptance compares the CI against a clinically/product-relevant tolerance approved before lock; a small bias alone is not a pass.

### 9.4 Reliability

Use ICC only when the design identifies the model, raters/occasions, single-versus-average measurement, and absolute-agreement-versus-consistency target. Report that exact ICC with CI, plus within-subject error, SEM, MDC at the stated confidence, and test-retest bias/limits. If the balanced repeated design is not achieved, report descriptive repeat differences and do not label the result ICC reliability. The current `web/src/eval/reliability.ts` SEM/MDC-like helpers are descriptive and cannot substitute for the preregistered analysis.

This plan follows GRRAS principles and the agreement distinction described by Bland and Altman; ICC selection must be explicit rather than generic ([GRRAS](https://doi.org/10.1016/j.jclinepi.2010.03.002), [Bland–Altman](https://doi.org/10.1177/096228029900800204), [Koo–Li](https://doi.org/10.1016/j.jcm.2016.02.012)).

## 10. Missing-data and exclusion policy

Keep every attempted recording in the flow table and immutable manifest. Permitted pre-analysis exclusions are limited to withdrawn consent, corrupted/unreadable source, wrong assigned protocol due to operator error, synchronization failure for a reference-only endpoint, or duplicate acquisition. Each needs a coded reason; excluded files remain in the audit index when consent permits.

Do not exclude because KinematicIQ failed, a movement was shallow/aborted, a landmark was missing, an event was ambiguous, a device performed poorly, or the result worsened a metric. These are outcomes.

- `missing`: the event/value is not observable.
- `ambiguous`: multiple defensible labels remain.
- `abstained`: the algorithm intentionally withheld.
- `not_applicable`: the endpoint does not apply to the case.
- `excluded`: one of the permitted study-level reasons above.

Never coerce any state to zero, last observation, contralateral value, interpolated event, or successful case. Report reason-specific missingness by subject and stratum. Sensitivity analyses may vary ambiguous-case handling but cannot replace the primary policy.

## 11. Acceptance-gate registry

| Gate family | Evidence class | Pass authority | Locked evidence | Autonomous pass allowed? |
|---|---|---|---|---|
| Schema/parser/checksum/split invariants | Engineering | Engineering owner | Deterministic tests and frozen manifests | Yes, engineering only |
| Synthetic phase/failure fixtures | Synthetic engineering | Engineering owner | Versioned fixtures and regression results | Yes, never scientific |
| Count/events/completion/rejection | Field-validation | Biomechanics + statistics leads | Locked subject-held-out report | No |
| Capture/abstention/device robustness | Field-validation + device | Biomechanics, engineering, named device owner | Locked strata and real-device evidence | No |
| Projected knee angle | External/reference validity | Biomechanics + statistics leads | Synchronized agreement analysis | No |
| Repeatability/change | Reliability | Biomechanics + statistics leads | Approved repeated-session study | No |
| Interpretation/coaching | Expert + claims | Claims owner and domain expert | Valid metric plus interpretation study/copy review | No |
| Privacy/consent/license/retention | Human/legal/privacy | Named owner(s) | Signed approvals and terms snapshot | No |
| Accessibility/usability | Human/device | Accessibility and product owners | Named-device/manual evidence | No |
| Implementation milestone | Roadmap/owner | Product/engineering owner | Prior gates plus scoped plan | No |
| Public activation | Owner | Designated KinematicIQ owner | All applicable gates and signed decision | No |

Every gate record contains ID, version, endpoint, population/setup, numeric criterion where applicable, rationale, evidence class, dataset/report hashes, status (`pending`, `pass`, `fail`, `inconclusive`, `blocked`), authority, decision date, and limitations.

## 12. Failure, inconclusive, and rollback rules

- **Pass:** every primary algorithm gate passes its predeclared CI rule and all non-statistical human gates are signed.
- **Fail:** any primary gate misses its criterion or a prohibited failure (for example, silent wrong-side inversion or wrong-movement completion) occurs. Keep research-only; do not tune on the locked set.
- **Inconclusive:** CI precision, event/rater agreement, reference quality, or usable sample is insufficient despite following protocol. Collect a newly approved sample or revise the design; do not call this pass.
- **Blocked:** protocol identity, consent/license, privacy, device access, rater independence, reference synchronization, owner authority, or frozen-registry evidence is absent.

Rollback means retain the last approved squat-only registry and baseline, keep lunge unavailable, archive the failed version/report, and revert only an isolated experimental change if one was separately authorized. Never delete unfavorable data or overwrite a prior report.

## 13. Privacy, consent, licensing, and retention

Follow `PROPRIETARY_CORPUS_GOVERNANCE.md` and `DATASET_OPERATOR_RUNBOOK.md`. Before collection, obtain written purpose, consent, privacy/legal review, named custodian/access list, pseudonymous ID process, retention/deletion plan, incident procedure, and owner approval. Raw media and participant-linked landmarks live outside git in access-controlled storage; tracked repository artifacts are schemas, synthetic/redacted fixtures, and non-identifying aggregate reports only.

The repository's proposed 90-day raw and 12-month derived retention periods remain proposals until approved. Record the actual approved periods. External datasets remain metadata-only until a human approves their terms and acquisition. Research-only or unclear licensing cannot support commercial evidence. No credentials, click-through acceptance, raw video, faces, or participant identity enter automation or source control.

## 14. Reproducibility artifacts and checksums

Freeze and hash:

- protocol/capture/label/manifest schema versions;
- subject-to-split map held by the authorized custodian;
- source and derived artifact SHA-256 values;
- label A, label B, adjudication, and agreement reports separately;
- camera/device/reference metadata and synchronization report;
- KinematicIQ commit, app/algorithm/model/filter versions and parameters;
- threshold/gate registry and sample-size calculation;
- analysis code, environment lock, command log, random seeds, and report;
- every exclusion/missingness record and amendment.

The locked report must be reproducible from authorized local inputs without modifying originals. Preserve raw pose frames and missing intervals; derived filters/perturbations are new artifacts with parent hashes.

## 15. Responsibilities and authority

| Role | Required action |
|---|---|
| Owner/product authority | Choose protocol identity; approve collection, implementation milestone, and later activation separately |
| Privacy/legal/data custodian | Approve consent, source terms, storage, access, retention, deletion, and incident handling |
| Biomechanics lead | Freeze task/events/capture and judge scientific gates |
| Statistician | Approve sample size, estimands, CIs, agreement/reliability methods, and amendments |
| Rater coordinator | Train/qualify raters, blind packets, preserve independence and originals |
| Raters A/B | Label independently without algorithm output |
| Adjudicator | Resolve where possible, preserve ambiguity and original labels, record rationale |
| Engineering owner | Freeze versions, run deterministic checks, preserve squat baseline and fail-closed behavior |
| Device/accessibility/usability owners | Execute named-device and human checks; automation cannot sign these gates |
| Claims owner/domain expert | Approve any exposed metric/interpretation/copy; none is implied by this study |

## 16. Open dependencies before execution

- [ ] Owner resolves forward-lunge versus FMS-inline-lunge identity and approves `flsr-v0` or replacement.
- [ ] Data sources and any participant collection receive explicit privacy/license/consent approval.
- [ ] Dataset/capture specification and labeling handbook are versioned and signed.
- [ ] Field-development pilot completes without using locked subjects.
- [ ] Numeric `G_*` registry and sample-size calculation are signed and hashed.
- [ ] Two raters and an adjudicator qualify on approved real development recordings.
- [ ] Named devices/reference systems and synchronization procedure are available.
- [ ] Locked subject IDs/splits, manifests, software version, and analysis plan are frozen.
- [ ] Current repository roadmap explicitly authorizes any implementation work; this protocol does not.

Until every applicable dependency is closed, the correct study status is `blocked`, and KinematicIQ remains squat-only and lunge research-only.
