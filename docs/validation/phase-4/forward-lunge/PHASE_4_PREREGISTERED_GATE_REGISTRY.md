# Phase 4 Preregistered Acceptance-Gate Registry

> **Canonical reconciliation (2026-07-15):** Original repository-status observations below refer to the audited `8d8a77d` snapshot unless a later commit is named. Phase 3 at `f49558e` superseded the no-implementation conclusion with an unavailable experimental six-state seam (`web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, and `inlineLunge.test.ts`). It did not provide human labels, criterion validity, reliability, live/upload/session/results integration, coaching authority, or public availability. The approved identity is **Forward lunge with stride and return**; `inlineLunge` is historical pending P4-M01. Squat remains the only available protocol. This specification authorizes no collection, acquisition, threshold change, activation, or claim.
**Registry version:** `flsr-gates-v0.1` (**human-authority decision**; identifier, not validation evidence)  
**Status:** approved only as provisional development input; not scientifically validated and not ready to freeze for locked validation  
**Protocol:** forward lunge with stride and return, research definition `flsr-v0`  
**Repository reconciliation basis:** KinematicIQ `master` commit `8d8a77d` (identifier, not a numerical criterion), inspected in the supplied reconciliation  
**Locked-results boundary:** no locked results were opened or analyzed in preparing this registry

## 1. Decision boundary

This registry replaces the research documents' placeholder `G_*` names with proposed, auditable gates. It does not authorize participant collection, implementation, metric promotion, coaching, or public availability. The original `8d8a77d` snapshot had no lunge implementation; the later `f49558e` seam remains unavailable and research-only. Protocol identity, collection, implementation, and activation remain separate human decisions.

The numerical values below are design proposals. None is presented as scientifically validated. Literature informs what must be measured and warns against transfer, but the reviewed literature does not supply transferable KinematicIQ thresholds for this task, camera, browser pipeline, or population.

### Number-origin labels

Every quantitative proposal is labeled inline with one of the required origins:

- **literature-derived** — directly taken from cited literature. No acceptance cutoff in this registry has this status.
- **product-risk-derived** — chosen from the consequence of a false result or unusable product behavior.
- **engineering invariant** — deterministic behavior that must hold exactly.
- **provisional pending pilot** — a starting value that must be reviewed using field-development data before lock.
- **human-authority decision** — a governance or analysis choice that named people must approve.

Numerals appearing only in IDs, versions, filenames, section citations, hashes, or source titles are identifiers, not scientific quantities. The registry uses a two-sided **95% confidence level** (**human-authority decision**) unless a one-sided safety bound is explicitly named. The proposed **10,000 subject-level bootstrap resamples** (**provisional pending pilot**) must be replaced by exact/clustered-model inference when bootstrap validity or the number of independent subjects is inadequate.

## 2. Binding analysis rules

1. **Independent unit and clustering.** The subject is the independent sampling unit. All trial-, event-, and recording-level intervals resample subjects with every eligible observation from the sampled subject retained. Treating trials as independent is prohibited.
2. **Performance and precision.** A gate passes only when both its point-estimate criterion and its confidence-bound criterion pass. A favorable point estimate with an imprecise interval is `inconclusive`, not `pass`.
3. **Populations.** Report attempted, protocol-readable, algorithm-eligible, and reference-eligible populations and the flow between them. Accuracy among successful outputs never substitutes for attempted-case performance.
4. **Unsuccessful and ineligible trials.** Report every shallow, aborted, incomplete-return, false-start, wrong-movement, capture-invalid, ambiguous, missing-event, algorithm-abstained, device-failed, and otherwise ineligible trial by subject and reason.
5. **Permitted exclusions.** Pre-analysis exclusion is limited to withdrawn consent, corrupted/unreadable source, operator-assigned wrong protocol, synchronization failure for the reference-only endpoint, or duplicate acquisition. Exclusions remain in the audit flow when consent permits. Algorithm failure, poor tracking, ambiguous events, a poorly performing device, and adverse results are outcomes, not exclusions.
6. **Missingness.** Preserve `missing`, `ambiguous`, `abstained`, `not_applicable`, and `excluded` as distinct states. No zero fill, last observation carried forward, contralateral substitution, event interpolation, or complete-case-only primary analysis is allowed. Report reason-specific missingness with subject-clustered intervals and prespecified worst-case sensitivity analyses.
7. **No rescue.** Secondary endpoints, subgroup results, tolerance curves, an optional angle result, or post hoc thresholds cannot rescue any failed primary gate. All applicable primary gates must pass conjunctively.
8. **Prohibited failures.** Any observed wrong-movement false completion, silent anatomical lead-side inversion, phase/event advancement across an invalid timestamp discontinuity, completion through a critical gap, cross-subject split leak, checksum/source mismatch, or locked-code/gate-hash mismatch automatically fails the applicable gate and the run regardless of its aggregate rate.
9. **Strata.** Report point estimates and subject-clustered intervals for every prespecified device/browser, route, lead-side, effective-frame-rate, gap, yaw/roll, crop, occlusion, lighting, and clothing stratum. A pooled result cannot hide a failed required stratum.
10. **Lock discipline.** Freeze and hash this registry, capture contract, label handbook, subject split, algorithm/model/filter versions, matching rules, sample-size calculation, and executable analysis before any locked predictions are opened. A post-lock change invalidates the confirmatory run.

## 3. Source ledger

| Code | Supplied evidence source | Registry use |
|---|---|---|
| `SRC-REC` | `README.md` and `INLINE_LUNGE_EVIDENCE_UPDATE.md`, especially repository baseline, Phase 4 requirements, fixtures, and unresolved questions | Current repository reconciliation; research-only status; no validated lunge thresholds or implementation |
| `SRC-PRO` | `INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md`, especially analysis populations, endpoints, statistical plan, missingness, authority, and failure rules | Primary estimands, subject clustering, CI/precision requirement, exclusions, authority |
| `SRC-DAT` | `INLINE_LUNGE_DATASET_AND_CAPTURE_SPEC.md`, especially perturbations, split rules, labels, rejection, and readiness | Required data, strata, provenance, leakage and schema invariants |
| `SRC-LAB` | `INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`, especially qualification, glossary, event rules, agreement, and adjudication | Rater gates, event truth, ambiguity, lead side, `G_SHORT`/`G_LONG` |
| `SRC-OBS` | `SINGLE_CAMERA_LUNGE_OBSERVABILITY_REVIEW.md`, especially geometry, occlusion, sensitivity experiments, and activation evidence | Camera/occlusion robustness; angle restriction; no transferable tolerances |
| `SRC-TMP` | `TEMPORAL_TRACKING_FAILURE_AND_RECOVERY_REVIEW.md`, especially failure taxonomy, recovery state model, perturbations, and diagnostics | Gap/fps/discontinuity invariants and recovery policy |

## 4. Retired placeholder mapping

| Retired placeholder | Concrete registry record(s) |
|---|---|
| `G_COUNT_EXACT` | `ALG-COUNT-EXACT-v0.1` |
| `G_COUNT_MAE` | `ALG-COUNT-MAE-v0.1` |
| `G_BOTTOM_*` | `ALG-BOTTOM-PRF-v0.1`, `ALG-BOTTOM-MED-v0.1`, and `ALG-BOTTOM-P95-v0.1` |
| `G_COMPLETE_*` | `ALG-COMP-SENS-v0.1`, `ALG-COMP-SPEC-v0.1`, and `ALG-FALSE-COMP-v0.1` |
| `G_ABSTAIN_INVALID` | `ALG-ABSTAIN-INVALID-v0.1` |
| `G_ABSTAIN_VALID` | `ALG-FALSE-ABSTAIN-v0.1` |
| `G_SHORT` | `TMP-SHORT-v0.1` |
| `G_LONG` | `TMP-LONG-v0.1` |

The wildcard placeholders are retired; locked preregistration must cite the concrete IDs and exact registry hash.

## 5. Rater gates

All rater gates are study-readiness gates. Their analysis population is protocol-readable field-development material from subjects absent from locked validation. Agreement is computed before adjudication. Unless stated otherwise, CIs use subject-clustered resampling and must pass in the pooled qualification set and separately for left- and right-lead cases when estimable.

### `RAT-CATEGORY-v0.1` — trial-category agreement

- **Endpoint / population:** A/B agreement on the single primary category for every protocol-readable target and negative attempt in qualification packets.
- **Proposed numerical criterion:** raw agreement at least **0.90** (**provisional pending pilot**) and prevalence-adjusted chance-corrected agreement at least **0.80** (**provisional pending pilot**); full category confusion matrix required.
- **CI rule:** lower **95%** bound (**human-authority decision**) at least **0.85** for raw agreement and **0.70** for the chance-corrected coefficient (both **provisional pending pilot**).
- **Rationale / evidence:** category truth controls every downstream endpoint; prevalence and marginals must remain visible. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** high—corrupt reference categories and biased validity. Pass requires rater coordinator, biomechanics lead, and statistician.
- **Data required / status / autonomy:** two immutable blind labels across completed, shallow, aborted, incomplete-return, false-start, wrong-movement, capture-invalid, and ambiguous cases. **Blocked pending real development examples and pilot. Autonomous passage: no.**

### `RAT-EVENT-v0.1` — event-frame agreement

- **Endpoint / population:** A/B absolute time difference for step initiation, visible plant, bottom, ascent onset, return initiation, and stable return in independently matched readable trials.
- **Proposed numerical criterion:** median absolute difference at most **33 ms** and **1 frame** (both **provisional pending pilot**); **95th percentile** at most **100 ms** and **3 frames** (all **provisional pending pilot**); within **67 ms** agreement at least **0.90** (**provisional pending pilot**).
- **CI rule:** upper **95%** bounds for the median and **95th percentile** must not exceed **50 ms / 2 frames** and **133 ms / 4 frames**, respectively; lower bound for within-tolerance agreement at least **0.85** (all thresholds **provisional pending pilot**; confidence level **human-authority decision**).
- **Rationale / evidence:** original timestamps and plateau/ambiguity rules bound attainable event truth; both frames and milliseconds are needed under variable cadence. `SRC-PRO`, `SRC-LAB`, `SRC-TMP`.
- **Failure cost / authority:** high—no defensible event reference. Pass requires biomechanics lead, rater coordinator, and statistician.
- **Data required / status / autonomy:** original frame-steppable RGB, timestamps, event intervals/plateaus, two blind label files, and subject IDs. **Blocked pending pilot and event-tolerance approval. Autonomous passage: no.**

### `RAT-LEAD-v0.1` — lead-side agreement

- **Endpoint / population:** A/B raw agreement over `left/right/ambiguous/conflict/not_applicable` for every protocol-readable qualification attempt.
- **Proposed numerical criterion:** raw agreement at least **0.99** (**product-risk-derived**) and **0 observed clear left/right inversions** (**engineering invariant**).
- **CI rule:** lower **95%** bound at least **0.97** (**provisional pending pilot**); any clear inversion automatically fails (**engineering invariant**).
- **Rationale / evidence:** anatomical side is distinct from screen direction and mirroring; wrong side contaminates all lead-chain endpoints. `SRC-LAB`, `SRC-OBS`, `SRC-TMP`.
- **Failure cost / authority:** critical—systematic anatomical mislabeling. Pass requires biomechanics lead and rater coordinator, with statistician confirming precision.
- **Data required / status / autonomy:** balanced declared left/right trials, mirrored/raw-display cases, far-side and side-conflict cases. **Blocked pending pilot. Autonomous passage: no.**

### `RAT-CAPTURE-v0.1` — capture-validity agreement

- **Endpoint / population:** A/B classification of setup/capture validity and reason over all qualification recordings, including deliberate failures.
- **Proposed numerical criterion:** raw valid/invalid agreement at least **0.90** and chance-corrected agreement at least **0.80** (both **provisional pending pilot**), with reason-specific confusion matrices.
- **CI rule:** lower **95%** bounds at least **0.85** and **0.70**, respectively (both **provisional pending pilot**; confidence level **human-authority decision**).
- **Rationale / evidence:** invalid-capture abstention can only be evaluated against reproducible capture labels; capture invalid must not be collapsed with wrong movement. `SRC-PRO`, `SRC-DAT`, `SRC-LAB`.
- **Failure cost / authority:** high—unreliable abstention truth. Pass requires biomechanics, engineering, and rater-coordination leads plus statistician.
- **Data required / status / autonomy:** frozen capture contract and yaw/roll/crop/occlusion/timing/metadata failure examples. **Blocked pending capture-band pilot. Autonomous passage: no.**

### `RAT-AMBIG-v0.1` — ambiguity frequency

- **Endpoint / population:** subject-weighted proportion of required primary labels remaining `ambiguous` or `missing` before adjudication, reported by event/category/reason.
- **Proposed numerical criterion:** no more than **0.10** overall and no more than **0.15** for any required primary label (both **provisional pending pilot**).
- **CI rule:** upper **95%** bounds no more than **0.15** overall and **0.20** per primary label (both **provisional pending pilot**; confidence level **human-authority decision**).
- **Rationale / evidence:** high agreement obtained by widespread unrateability is not useful truth; ambiguity must remain preserved rather than coerced. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** high—insufficient readable truth and biased complete-case evaluation. Pass requires biomechanics lead, rater coordinator, and statistician.
- **Data required / status / autonomy:** all attempted qualification labels, including low-confidence and unusable cases, with reason codes. **Blocked pending pilot. Autonomous passage: no.**

### `RAT-QUAL-v0.1` — rater qualification

- **Endpoint / population:** each proposed locked-study rater's independent performance against adjudicated qualification packets composed only of approved development subjects.
- **Proposed numerical criterion:** each rater passes `RAT-CATEGORY`, `RAT-EVENT`, `RAT-LEAD`, and `RAT-CAPTURE` on **2 non-overlapping qualification packets** (**provisional pending pilot**) and scores at least **0.90** on the handbook terminology/mirror-state check (**human-authority decision**).
- **CI rule:** every component's subject-clustered CI rule must pass in the combined packets; no averaging across a failed component or rater (**engineering invariant**).
- **Rationale / evidence:** synthetic examples teach tooling but cannot establish real-video qualification. `SRC-PRO`, `SRC-LAB`, `SRC-DAT`.
- **Failure cost / authority:** high—unqualified labels undermine all locked outcomes. Pass requires rater coordinator and biomechanics lead; statistician confirms agreement calculation.
- **Data required / status / autonomy:** approved real development packets excluded from lock, training record, immutable submissions, adjudication, and qualification version. **Blocked pending examples and pilot. Autonomous passage: no.**

## 6. Algorithm gates

Algorithm gates use the untouched, subject-held-out locked validation set. Rates use all applicable attempted cases; matched-event error summaries additionally use one-to-one matched pairs, while unmatched truth/prediction events remain false negatives/positives in `ALG-BOTTOM-PRF`. All primary algorithm gates below must pass; none may rescue another.

### `ALG-COUNT-EXACT-v0.1` — exact count agreement

- **Endpoint / population:** proportion of locked recordings whose predicted completed-trial count exactly equals adjudicated count, including recordings with unsuccessful and negative attempts.
- **Proposed numerical criterion:** at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** lower subject-clustered **95%** bound at least **0.90** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** count is a primary candidate outcome; exact agreement prevents favorable MAE from hiding miscounted recordings. `SRC-PRO`, `SRC-REC`.
- **Failure cost / authority:** high—incorrect session summary. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** all locked recordings, adjudicated trial categories/counts, predictions, subject IDs, exclusions and abstentions. **Blocked: no authorized implementation or locked study. Autonomous passage: no.**

### `ALG-COUNT-MAE-v0.1` — count MAE

- **Endpoint / population:** subject-weighted recording-level absolute completed-count error over the same population as exact count.
- **Proposed numerical criterion:** MAE at most **0.10 trials/recording** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** upper subject-clustered **95%** bound at most **0.20 trials/recording** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** quantifies error magnitude without replacing the exact-count gate. `SRC-PRO`.
- **Failure cost / authority:** high—systematic over/under-counting. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** signed and absolute count errors for every locked recording. **Blocked. Autonomous passage: no.**

### `ALG-BOTTOM-PRF-v0.1` — bottom-event precision, recall, and F1

- **Endpoint / population:** one-to-one temporally matched bottom predictions versus adjudicated bottom events in all applicable locked completed/shallow-complete trials; unmatched events remain errors.
- **Proposed numerical criterion:** precision, recall, and F1 each at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** lower subject-clustered **95%** bound for each metric at least **0.90** (**product-risk-derived; provisional pending pilot**). All three pass conjunctively.
- **Rationale / evidence:** matched-pair timing error alone hides missing and extra events. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** high—wrong event anchors invalidate downstream timing/angle. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** frozen matching window, adjudicated event intervals, all predictions and abstentions, subject IDs. **Blocked. Autonomous passage: no.**

### `ALG-BOTTOM-MED-v0.1` — median bottom error

- **Endpoint / population:** median absolute source-timestamp and frame-index error among the locked matched pairs from `ALG-BOTTOM-PRF`.
- **Proposed numerical criterion:** at most **33 ms and 1 source frame** (both **product-risk-derived; provisional pending pilot**).
- **CI rule:** upper subject-clustered **95%** bound at most **50 ms and 2 source frames** (both **provisional pending pilot**). Both units pass.
- **Rationale / evidence:** timestamps are primary under variable frame rate; frames retain interpretability for labeling resolution. `SRC-PRO`, `SRC-TMP`.
- **Failure cost / authority:** high—biased event-aligned measurements. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** matched event timestamps/frames, effective cadence, ambiguity and missingness. **Blocked. Autonomous passage: no.**

### `ALG-BOTTOM-P95-v0.1` — 95th-percentile bottom error

- **Endpoint / population:** subject-weighted **95th percentile** absolute error (**human-authority decision**) among the same locked matched bottom pairs.
- **Proposed numerical criterion:** at most **100 ms and 3 source frames** (both **product-risk-derived; provisional pending pilot**).
- **CI rule:** upper subject-clustered **95%** bound at most **133 ms and 4 source frames** (both **provisional pending pilot**).
- **Rationale / evidence:** tail error prevents a good median from hiding large, consequential misalignment. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** high—unreliable worst-case timing. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** sufficient independent subjects for quantile precision and every matched-pair error. **Blocked. Autonomous passage: no.**

### `ALG-COMP-SENS-v0.1` — stable-return sensitivity

- **Endpoint / population:** sensitivity for adjudicated completed or shallow-complete target attempts among all protocol-readable locked target attempts.
- **Proposed numerical criterion:** at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** lower subject-clustered **95%** bound at least **0.90** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** valid completed trials should be retained without hiding failures through abstention. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** medium-high—poor usefulness and biased successful-case reporting. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** full completion confusion matrix, including abstentions as non-completions. **Blocked. Autonomous passage: no.**

### `ALG-COMP-SPEC-v0.1` — stable-return specificity

- **Endpoint / population:** specificity for non-completion over aborted, incomplete-return, false-start, and other applicable non-complete target attempts.
- **Proposed numerical criterion:** at least **0.98** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** lower subject-clustered **95%** bound at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** knee extension alone cannot establish stable return; both feet and dwell are required. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** critical—declares an unfinished attempt complete. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** deliberately enriched incomplete-return/aborted cases plus ordinary attempts. **Blocked. Autonomous passage: no.**

### `ALG-FALSE-COMP-v0.1` — false-completion rate

- **Endpoint / population:** proportion of all adjudicated non-complete attempted target trials labeled complete by the algorithm.
- **Proposed numerical criterion:** **0 observed false completions** (**engineering invariant; product-risk-derived prohibited-failure policy**).
- **CI rule:** one-sided upper **95%** subject-clustered bound no greater than **0.01** (**product-risk-derived; provisional pending pilot**). Any observed case fails regardless of interval.
- **Rationale / evidence:** false completion is explicitly safety-weighted and a prohibited failure. `SRC-PRO`, `SRC-LAB`.
- **Failure cost / authority:** critical. Pass requires biomechanics and statistics leads; no waiver from a favorable pooled metric.
- **Data required / status / autonomy:** all non-complete attempts, including incomplete returns and clip-edge cases. **Blocked. Autonomous passage: no.**

### `ALG-ABSTAIN-INVALID-v0.1` — invalid-case abstention sensitivity

- **Endpoint / population:** proportion of adjudicated capture-invalid attempted recordings/trials on which all affected outputs are withheld.
- **Proposed numerical criterion:** at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** lower subject-clustered **95%** bound at least **0.90** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** invalid capture must fully abstain; questionable evidence cannot produce coaching. `SRC-PRO`, `SRC-OBS`, `SRC-TMP`.
- **Failure cost / authority:** critical—unsupported output from invalid evidence. Pass requires biomechanics, engineering, and statistics leads.
- **Data required / status / autonomy:** all prespecified capture-invalid reasons and output-withholding records. **Blocked. Autonomous passage: no.**

### `ALG-FALSE-ABSTAIN-v0.1` — valid-case false-abstention rate

- **Endpoint / population:** proportion of adjudicated capture-valid, algorithm-eligible target trials for which the algorithm withholds the primary count/completion result.
- **Proposed numerical criterion:** at most **0.05** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** upper subject-clustered **95%** bound at most **0.10** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** an always-abstaining system is safe-looking but unusable; false abstention is not allowed to disappear from denominators. `SRC-PRO`, `SRC-OBS`.
- **Failure cost / authority:** medium-high—unusable product and selective accuracy. Pass requires biomechanics, product, and statistics leads.
- **Data required / status / autonomy:** capture-valid eligible trials, abstention reasons, per-subject and per-stratum results. **Blocked. Autonomous passage: no.**

### `ALG-WRONG-MOVE-v0.1` — wrong-movement false completion

- **Endpoint / population:** all protocol-readable locked wrong-movement and well-tracked negative attempts.
- **Proposed numerical criterion:** **0 observed target completions** (**engineering invariant; product-risk-derived prohibited-failure policy**).
- **CI rule:** one-sided upper **95%** subject-clustered bound no greater than **0.01** (**product-risk-derived; provisional pending pilot**). Any observed case automatically fails.
- **Rationale / evidence:** squat, split squat, FMS inline lunge, walking/reverse/lateral lunge, step-only, and side-switch are negatives, not acceptable variants. `SRC-REC`, `SRC-DAT`, `SRC-LAB`, `SRC-TMP`.
- **Failure cost / authority:** critical—task identity corruption. Pass requires biomechanics and statistics leads.
- **Data required / status / autonomy:** every named negative subtype with balanced subjects/sides. **Blocked. Autonomous passage: no.**

### `ALG-SIDE-INVERT-v0.1` — silent lead-side inversion

- **Endpoint / population:** all locked attempts with adjudicated anatomical lead side, including mirrored, far-side, and declaration-conflict cases.
- **Proposed numerical criterion:** **0 silent left/right inversions** (**engineering invariant; product-risk-derived prohibited-failure policy**); declared/observed conflict must abstain or surface a conflict.
- **CI rule:** one-sided upper **95%** subject-clustered bound no greater than **0.005** (**product-risk-derived; provisional pending pilot**). Any observed silent inversion automatically fails.
- **Rationale / evidence:** mirroring is a display transform, not anatomical identity. `SRC-PRO`, `SRC-LAB`, `SRC-OBS`, `SRC-TMP`.
- **Failure cost / authority:** critical—wrong-limb metrics presented as lead side. Pass requires biomechanics, engineering, and statistics leads.
- **Data required / status / autonomy:** left/right, raw/display mirrored, orientation-change, side-conflict, and L/R swap cases. **Blocked. Autonomous passage: no.**

### `ALG-TIME-DISC-v0.1` — timestamp-discontinuity handling

- **Endpoint / population:** all deterministic discontinuity fixtures plus every locked equal, reversed, non-finite, large-gap, stale-backlog, orientation-epoch, and recovery-quarantine case.
- **Proposed numerical criterion:** **100% detection**, **0 event/FSM advances across invalid time**, **0 completions through a critical discontinuity**, and **100% reset/quarantine behavior matching the frozen policy** (all **engineering invariants**).
- **CI rule:** deterministic fixtures require exact passage and have no sampling CI (**engineering invariant**); locked field detection/abstention additionally requires a lower subject-clustered **95%** bound of **0.99** (**product-risk-derived; provisional pending pilot**). Any prohibited failure automatically fails.
- **Rationale / evidence:** time cannot be silently clamped and no interpolated observation may create an event. `SRC-TMP`, `SRC-DAT`, `SRC-LAB`.
- **Failure cost / authority:** critical—fabricated timing, identity, or completion. Engineering automation may report fixture conformance, but locked passage requires engineering, biomechanics, and statistics leads.
- **Data required / status / autonomy:** raw timestamp domains, callbacks/inference/result age, quality events, gaps, reset trace, fixtures, and locked failure cases. **Blocked: contract not implemented or validated. Autonomous passage: development fixtures yes; locked gate no.**

## 7. Robustness gates

Robustness gates compare each prespecified condition with the frozen standard condition using paired subject-level contrasts when the same subject supplies both. Every supported in-range stratum must still pass every applicable absolute algorithm gate. In addition, the upper **95% CI** (**human-authority decision**) on degradation must stay within the stated non-inferiority margin. Unless a gate says otherwise, the common margins are: no more than **0.03 absolute loss** in exact-count agreement, bottom F1, completion sensitivity/specificity, or invalid-abstention sensitivity; no more than **33 ms** increase in median bottom error; no more than **0.05 absolute increase** in valid false abstention (all **product-risk-derived; provisional pending pilot**). These margins are not evidence that the conditions are equivalent.

### `ROB-FPS-v0.1` — effective frame-rate degradation

- **Endpoint / population:** core performance across measured effective-cadence bands in locked algorithm-eligible trials.
- **Proposed numerical criterion:** candidate supported band is at least **24 effective frames/s** (**provisional pending pilot**); each supported band passes all absolute gates and common margins. Below **24 frames/s** (**provisional pending pilot**), capture must abstain unless a separately frozen lower band passes the same rules.
- **CI rule:** common paired subject-clustered rule; lower bound for correct below-band abstention at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** nominal fps is insufficient; cadence and gaps must use timestamps and task bandwidth. `SRC-PRO`, `SRC-DAT`, `SRC-OBS`, `SRC-TMP`.
- **Failure cost / authority:** high—cadence-dependent missed/shifted events. Pass requires biomechanics, engineering, statistics, and device owners.
- **Data required / status / autonomy:** measured p50/p95 cadence, downsampled development tapes, real-device locked strata, gaps and result age. **Blocked pending sweep and frozen band. Autonomous passage: no.**

### `ROB-GAP-v0.1` — inserted gaps

- **Endpoint / population:** immutable development tapes perturbed with gaps plus naturally occurring locked gaps, stratified by phase and elapsed duration.
- **Proposed numerical criterion:** gaps shorter than `TMP-SHORT` and outside critical event windows obey common margins; every gap at or above `TMP-LONG`, and every gap crossing step/bottom/return regardless of duration, causes **0 event advances** and **100% reject/reset or endpoint abstention** (both **engineering invariants**).
- **CI rule:** exact on deterministic fixtures; lower locked-field **95%** bound for required abstention at least **0.99** (**product-risk-derived; provisional pending pilot**), with any completion/event through a prohibited gap an automatic fail.
- **Rationale / evidence:** elapsed time and phase consequence, not frame count, govern recovery. `SRC-TMP`, `SRC-LAB`.
- **Failure cost / authority:** critical—events fabricated across missing evidence. Pass requires engineering, biomechanics, and statistics leads.
- **Data required / status / autonomy:** phase-positioned gap sweeps, natural gaps, quality-state traces, timestamps. **Blocked pending pilot. Autonomous passage: development fixtures yes; locked gate no.**

### `ROB-YAW-v0.1` — camera yaw

- **Endpoint / population:** valid target and negative trials across frozen measured yaw bands, with declared supported range and out-of-range cases.
- **Proposed numerical criterion:** no universal degree cutoff is asserted; development must freeze a supported range (**human-authority decision**) whose every locked band passes all absolute gates and common margins. Out-of-range yaw abstention sensitivity at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** common paired rule; lower subject-clustered **95%** bound for out-of-range abstention at least **0.90** (**provisional pending pilot**).
- **Rationale / evidence:** lunge errors are view-dependent and the reviewed literature does not transfer a KinematicIQ tolerance. `SRC-OBS`, `SRC-PRO`, `SRC-DAT`.
- **Failure cost / authority:** high—projection error and side/occlusion failures. Pass requires biomechanics, engineering, statistics, and device owners.
- **Data required / status / autonomy:** measured real multi-yaw captures; synthetic projection proxies are engineering-only. **Blocked pending measured sweep. Autonomous passage: no.**

### `ROB-ROLL-v0.1` — camera roll

- **Endpoint / population:** locked trials across the frozen supported measured roll range plus out-of-range/orientation-change cases.
- **Proposed numerical criterion:** supported range selected after development (**human-authority decision**) must pass absolute gates/common margins; within-trial roll/orientation change yields **100% new-epoch rejection/reset** (**engineering invariant**); out-of-range abstention sensitivity at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** common paired rule and lower subject-clustered **95%** abstention bound at least **0.90** (**provisional pending pilot**).
- **Rationale / evidence:** roll rotates image vertical and contaminates screen-plane geometry. `SRC-OBS`, `SRC-TMP`, `SRC-DAT`.
- **Failure cost / authority:** high. Pass requires biomechanics, engineering, statistics, and device owners.
- **Data required / status / autonomy:** measured roll metadata/captures and orientation-epoch fixtures. **Blocked pending sweep. Autonomous passage: no.**

### `ROB-FOOT-CROP-v0.1` — foot cropping

- **Endpoint / population:** lead-foot, rear-foot, and travel-margin crop cases at setup and each trial phase.
- **Proposed numerical criterion:** **100% abstention/rejection** when the cropped foot is required for setup, step, lead verification, return, or stable completion (**engineering invariant**); no false completion; valid uncropped controls obey common margins.
- **CI rule:** lower subject-clustered **95%** bound for required abstention at least **0.95** (**product-risk-derived; provisional pending pilot**); any false completion automatically fails.
- **Rationale / evidence:** both feet and the travel corridor are hard observability dependencies. `SRC-DAT`, `SRC-LAB`, `SRC-OBS`.
- **Failure cost / authority:** critical at return/completion; otherwise high. Pass requires biomechanics, engineering, and statistics leads.
- **Data required / status / autonomy:** controlled crop variants by foot/phase and ordinary framing controls. **Blocked pending capture dataset. Autonomous passage: no.**

### `ROB-REAR-OCC-v0.1` — rear-leg occlusion

- **Endpoint / population:** rear hip/knee/ankle/heel/foot visibility loss at step, bottom, ascent, and return.
- **Proposed numerical criterion:** **100% endpoint-specific abstention** whenever the frozen dependency is unavailable and **0 inferred/substituted rear-chain observations** (both **engineering invariants**); unaffected valid outputs may continue only if predeclared and common margins pass.
- **CI rule:** lower subject-clustered **95%** bound for required abstention at least **0.95** (**product-risk-derived; provisional pending pilot**); any completion without required return evidence automatically fails.
- **Rationale / evidence:** plausible model coordinates under self-occlusion are not observed truth. `SRC-LAB`, `SRC-OBS`, `SRC-TMP`.
- **Failure cost / authority:** critical for stable return; high for other dependencies. Pass requires biomechanics, engineering, and statistics leads.
- **Data required / status / autonomy:** real clothing/body-overlap occlusions and controlled perturbations with RGB truth. **Blocked pending capture dataset. Autonomous passage: no.**

### `ROB-LIGHT-v0.1` — lighting

- **Endpoint / population:** prespecified usable-lighting strata and deliberately out-of-range low/backlit/high-contrast cases across subjects/devices.
- **Proposed numerical criterion:** every supported lighting stratum passes absolute gates/common margins; out-of-range invalid-capture abstention sensitivity at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** common paired rule; lower subject-clustered **95%** bound for out-of-range abstention at least **0.90** (**provisional pending pilot**).
- **Rationale / evidence:** lighting/body-background contrast is a required field stratum, but no transferable lux cutoff exists. `SRC-PRO`, `SRC-DAT`, `SRC-OBS`.
- **Failure cost / authority:** high—silent tracking degradation or excessive false abstention. Pass requires biomechanics, engineering, statistics, and device owners.
- **Data required / status / autonomy:** frozen non-identifying lighting classes, measured values when feasible, same-subject controlled comparisons. **Blocked pending pilot. Autonomous passage: no.**

### `ROB-CLOTHING-v0.1` — clothing

- **Endpoint / population:** prespecified fitted, loose, low-contrast, and self-occluding clothing silhouettes without normative judgments.
- **Proposed numerical criterion:** every supported class passes absolute gates/common margins; unsupported dependency-obscuring class abstention sensitivity at least **0.95** (**product-risk-derived; provisional pending pilot**).
- **CI rule:** common paired rule; lower subject-clustered **95%** abstention bound at least **0.90** (**provisional pending pilot**).
- **Rationale / evidence:** clothing changes landmark observability and must be recorded, not judged. `SRC-PRO`, `SRC-DAT`, `SRC-OBS`.
- **Failure cost / authority:** high—unequal or silent performance failure. Pass requires biomechanics, engineering, statistics, product, and device owners.
- **Data required / status / autonomy:** approved clothing-class matrix across body presentations and contrast levels. **Blocked pending pilot. Autonomous passage: no.**

### `ROB-DEVICE-v0.1` — device/browser strata

- **Endpoint / population:** every named supported device/browser/OS/orientation stratum with the subject allocation frozen before lock.
- **Proposed numerical criterion:** each required stratum independently passes all absolute primary gates; no pooled compensation (**product-risk-derived**). Between-stratum degradation also stays within common margins (**provisional pending pilot**).
- **CI rule:** every required stratum satisfies the original CI precision rules; an underpowered stratum is `inconclusive`, not pass (**human-authority decision**).
- **Rationale / evidence:** device-held-out analysis is additional to subject holdout and cannot be replaced by a pooled convenience sample. `SRC-PRO`, `SRC-DAT`, `SRC-OBS`.
- **Failure cost / authority:** high—unsupported device exposure. Pass requires named device owner, engineering, biomechanics, and statistics leads.
- **Data required / status / autonomy:** named hardware/browser/OS matrix, effective fps/gaps, enough independent subjects per sample-size plan. **Blocked pending device matrix and power calculation. Autonomous passage: no.**

### `ROB-PARITY-v0.1` — live/upload/replay parity

- **Endpoint / population:** identical source frame/timestamp sequences executed through upload and replay, plus timestamp-aligned live captures under the same frozen algorithm and activation state.
- **Proposed numerical criterion:** upload and replay produce identical count, category, abstention, event order, and event source timestamps (**engineering invariant**); live paired disagreement rate at most **0.01** (**product-risk-derived; provisional pending pilot**) after accounting only for preregistered capture-delivery differences.
- **CI rule:** deterministic upload/replay comparison is exact with no sampling CI; upper subject-clustered **95%** bound for live disagreement at most **0.02** (**product-risk-derived; provisional pending pilot**).
- **Rationale / evidence:** route ownership must preserve timestamps and activation state; parity is not inferred from shared code. `SRC-REC`, `SRC-PRO`, `SRC-DAT`.
- **Failure cost / authority:** high—route-dependent scientific result. Engineering automation may report deterministic parity; locked passage requires engineering, biomechanics, statistics, and device owners.
- **Data required / status / autonomy:** route-tagged executions, identical immutable tapes, live timestamp trace, algorithm/config hashes. **Blocked: lunge routes do not exist. Autonomous passage: development deterministic check yes; locked gate no.**

## 8. Temporal classification parameters replacing `G_SHORT` and `G_LONG`

These records are operational classifier parameters, not permission to interpolate or scientific performance gates. A gap crossing step, bottom, return initiation, stable return, identity, camera/orientation epoch, or trial boundary is protocol-critical regardless of duration.

### `TMP-SHORT-v0.1` — temporary-dropout ceiling

- **Endpoint / population:** elapsed duration of an isolated missing critical-chain interval in development perturbations and field captures.
- **Proposed numerical criterion:** candidate `temporary` ceiling **67 ms** (**provisional pending pilot**), provided both endpoints are trusted, the gap is interior/non-critical, identity and geometry are stable, and no event is created or timed through it (**engineering invariant**).
- **CI rule:** this is a frozen classifier parameter, so it has no CI; adoption requires `ROB-GAP` and every affected absolute algorithm gate to pass with their CIs (**human-authority decision**).
- **Rationale / evidence:** starting sweeps may use missing samples, but production classification must use elapsed milliseconds and context. `SRC-TMP`, `SRC-LAB`.
- **Failure cost / authority:** high if overlong gaps are joined. Pass authority for adoption: engineering, biomechanics, and statistics leads.
- **Data required / status / autonomy:** cadence-stratified gap sweep at all phases plus natural gaps. **Proposed, blocked pending pilot. Autonomous passage: no.**

### `TMP-LONG-v0.1` — long-dropout floor

- **Endpoint / population:** elapsed missing/uncertain interval after which the same active trial can never resume.
- **Proposed numerical criterion:** candidate `long` floor **250 ms** (**product-risk-derived; provisional pending pilot**); any protocol-critical gap is treated as long by consequence even below the floor (**engineering invariant**).
- **CI rule:** classifier parameter has no CI; adoption requires **100%** reset/reject behavior on deterministic fixtures (**engineering invariant**) and `ROB-GAP` locked precision.
- **Rationale / evidence:** long dropout requires filter/FSM reset, readiness, and calibration rather than seamless recovery. `SRC-TMP`, `SRC-LAB`.
- **Failure cost / authority:** critical—identity-free trial continuation. Pass authority for adoption: engineering, biomechanics, and statistics leads.
- **Data required / status / autonomy:** elapsed gaps swept through multi-second cases, phase/identity/camera changes, quarantine traces. **Proposed, blocked pending pilot. Autonomous passage: development fixtures yes; locked adoption no.**

Intervals between the two candidate cutoffs are `indeterminate/reject-current-endpoint` until the pilot freezes a complete policy; they are not silently treated as recoverable.

## 9. Conditional angle gate

No hip, ankle, rear-leg, trunk, frontal-knee, center-of-mass, kinetic, muscle, clinical, normative, or composite angle/biomechanical gate is included. Those endpoints remain withheld. The following gate exists only if a synchronized, rights-approved reference subset is available and its sample-size, projection, alignment, synchronization, and missingness plan is frozen before lock.

### `ANG-LEAD-KNEE-v0.1` — projected lead-knee angle at adjudicated bottom

- **Endpoint / population:** paired KinematicIQ projected lead-knee included angle and synchronized marker-based 3D angle projected into the camera plane, or a separately validated manual 2D reference, at the adjudicated bottom among reference-eligible locked measurements.
- **Proposed numerical criterion:** MAE at most **5 degrees**, absolute signed bias at most **3 degrees**, and **95% limits of agreement** contained within **±10 degrees** (all **product-risk-derived; provisional pending pilot**). Missingness no more than **0.10** (**provisional pending pilot**).
- **CI rule:** upper subject-clustered **95%** bound for MAE at most **7.5 degrees**; the entire **95% CI** for bias within **±5 degrees**; outer confidence bounds for both limits of agreement within **±15 degrees**; upper missingness bound no more than **0.15** (all **provisional pending pilot**; confidence level **human-authority decision**).
- **Rationale / evidence:** the reviewed literature supports knee angle as the narrowest candidate but shows large task/view/model-dependent errors and does not validate KinematicIQ. Correlation/ICC or small bias alone cannot pass. `SRC-PRO`, `SRC-OBS`, `SRC-REC`.
- **Failure cost / authority:** high—misleading analyst measurement. Pass requires biomechanics lead, statistician, and synchronized-reference lead. Even a pass authorizes analyst-only use, not coaching or public claims.
- **Data required / status / autonomy:** synchronized target-task reference, calibration/projection, source-frame alignment, paired raw data, heteroscedasticity and repeated-measures analysis, reason-specific missingness, rights approval. **Blocked; no synchronized target-task data are available in the supplied materials. Autonomous passage: no.**

If synchronized reference data are unavailable, this gate is `not_applicable` and the angle remains withheld. An unavailable or failed angle gate cannot rescue or be rescued by count/event performance.

## 10. Global decision and authority

### Field-development readiness

Field development may begin only after human approval of protocol identity, consent/privacy/license/retention, capture contract, real rater examples, and the development-only analysis plan. Development outcomes may revise provisional thresholds through a versioned, signed amendment before the locked set opens. They cannot be reported as confirmatory validation.

### Locked-validation pass

A locked run is `pass` only when:

- all rater-readiness gates passed before locked labeling;
- all applicable algorithm and robustness gates pass both performance and CI rules;
- every required stratum has adequate precision;
- no prohibited failure or data/provenance invariant violation occurs;
- missingness, unsuccessful/ineligible trials, exclusions, and abstentions are completely reported;
- named authorities sign the exact report, registry version/hash, and limitations.

Any primary miss or prohibited failure is `fail`. Insufficient CI precision, insufficient usable/reference-eligible subjects, or an underpowered required stratum is `inconclusive`. Missing identity, consent/license, rater independence, synchronization, device access, frozen artifacts, or authority is `blocked`.

No scientific, robustness, angle, implementation, claims, accessibility, privacy, or public-activation gate permits autonomous passage. Automation may only report exact engineering-fixture conformance where explicitly stated; it cannot sign the locked decision. Passing this registry still does not activate the protocol. Public availability requires a later, separate written owner decision after claims, device, usability, accessibility, privacy, and roadmap review.

## 11. Registry-wide current status

**Blocked.** The supplied reconciliation reports no authorized lunge implementation, approved target-task corpus, completed rater pilot, frozen capture bands, signed sample-size calculation, synchronized angle reference, or untouched locked validation execution. Consequently, every numerical cutoff in this document remains a proposal for human review; none is a scientifically validated KinematicIQ acceptance threshold.
