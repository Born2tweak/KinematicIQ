# Forward-Lunge Sample Size and Capture Schedule

> **Canonical reconciliation (2026-07-15):** Original repository-status observations below refer to the audited `8d8a77d` snapshot unless a later commit is named. Phase 3 at `f49558e` superseded the no-implementation conclusion with an unavailable experimental six-state seam (`web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, and `inlineLunge.test.ts`). It did not provide human labels, criterion validity, reliability, live/upload/session/results integration, coaching authority, or public availability. The approved identity is **Forward lunge with stride and return**; `inlineLunge` is historical pending P4-M01. Squat remains the only available protocol. This specification authorizes no collection, acquisition, threshold change, activation, or claim.
**Protocol:** forward lunge with stride and return (`flsr-v0`)  
**Purpose:** statistical planning only; no participant data are collected or authorized by this document  
**Status:** approved scenario-planning input only; not a recruitment commitment, locked gate, or activation authorization
**Prepared:** 2026-07-14

## Decision summary

The proposed Phase 4 registry contains no approved numeric `G_*` values. Therefore, this plan supplies three executable candidate registries rather than asserting one invented sample size. The locked study size is the maximum required by (a) zero-observed false-completion upper bounds, (b) invalid-case abstention precision, (c) subject-level count-MAE precision, and (d) device-stratum floors.

| Planning scenario | Field development | Rater qualification subset* | Locked validation | Synchronized subset invited / usable* | Reliability subset invited / complete* | Device-held-out subset* |
|---|---:|---:|---:|---:|---:|---:|
| Low-variance / feasibility | 24 | 16 | **60** | 34 / 30 | 45 / 40 | 60 (3 x 20) |
| Expected | 40 | 24 | **120** | 59 / 50 | 71 / 60 | 120 (4 x 30) |
| High-variance / stringent | 60 | 36 | **310** | 107 / 80 | 120 / 90 | 160 (4 x 40) |

\*These are nested subsets, not additional unique participants. Rater-training/qualification subjects come only from field development. Reference, reliability, and device-held-out subjects remain in their original development or locked role and never cross roles.

**Working recommendation:** budget the expected scenario (40 development and 120 untouched locked subjects), but authorize locked recruitment in waves only after the development pilot replaces the assumed ICC, unusable rate, prevalence, and count-MAE SD. If the signed registry adopts a 1% false-completion upper bound or the high count-MAE variance, the expected scenario is insufficient; the high scenario requires 310 locked subjects.

## 1. Protocol assumptions

### 1.1 Independent unit, clustering, and analysis populations

- Subjects are independent units; the subject is the independent sampling unit. All sessions, sides, repetitions, devices, and derived files for a subject remain in one split.
- Trials are clustered within subjects. Primary CIs use a subject-clustered bootstrap (resample subjects with all their records) or an approved clustered model; trial-level resampling is prohibited.
- Every initiated target or negative movement remains in the attempted denominator. `missing`, `ambiguous`, `abstained`, `not_applicable`, and permitted study-level `excluded` states remain separate.
- The locked set is untouched by threshold choice, camera-band choice, filter tuning, rater examples, and rater qualification.
- The schedule deliberately assigns cases; “prevalence” below is design prevalence, not a claim about real-world prevalence. A prevalence-weighted field analysis may be secondary only after an external target-use prevalence is justified.

### 1.2 Per-participant capture package

Each first session contains **13 source recordings and 14 attempted trial intervals**:

| Recording family | Recordings | Attempted trials | Allocation |
|---|---:|---:|---|
| Setup/calibration | 1 | 0 | Bilateral stable standing, mirror/orientation and framing check |
| Standard single-trial positives | 6 | 6 | 3 left lead, 3 right lead |
| Multi-trial count recordings | 2 | 4 | 2 trials/recording; one left-lead set and one right-lead set |
| Readable negative/wrong movement | 2 | 2 | Two assigned subtypes, counterbalanced |
| Deliberately invalid capture | 2 | 2 | Two safe, assigned capture defects; movement need not be completed |
| **Total** | **13** | **14** | 10 target-positive and 4 challenge trials |

Thus the assigned trial mix is 71% target-positive, 14% readable negative, and 14% capture-invalid. Both lead sides contribute five target attempts. The two invalid trials are assigned one declared lead side each. Side-bearing wrong-movement variants are balanced left/right across subjects; non-side-bearing variants such as squat are `not_applicable` for lead side. Negative and invalid families rotate across subjects using a balanced incomplete-block assignment so no subject performs the full adversarial matrix.

No participant is asked to induce pain or unsafe movement. Invalid-capture cases are created through camera/framing/timing/metadata conditions, not hazardous participant behavior.

### 1.3 Candidate uncertainty scenarios

Because no lunge pilot estimates exist, the following are sensitivity inputs, not empirical estimates:

| Input | Low | Expected | High | Use |
|---|---:|---:|---:|---|
| Within-subject ICC, binary endpoints | 0.05 | 0.15 | 0.30 | Cluster inflation for 4 challenge trials/subject |
| Unusable or lost endpoint allowance | 5% | 10% | 20% | Inflates captures/subsets; attempted cases remain in flow report |
| Count-MAE subject-level SD | 0.15 | 0.25 | 0.40 counts | Precision scenarios where no pilot SD exists |
| Count-MAE CI half-width | 0.05 | 0.05 | 0.05 counts | Candidate desired precision |
| Invalid-abstention expected sensitivity | 0.90 | 0.95 | 0.95 | Binomial precision planning value |
| Invalid-abstention CI half-width | 0.08 | 0.05 | 0.035 | Candidate desired precision |
| Readable bottom-event prevalence among assigned positive attempts | 90% | 80% | 65% | Converts attempted positives to analyzable event denominators |
| Bottom-event recall planning value / CI half-width | 0.95 / 0.08 | 0.90 / 0.05 | 0.85 / 0.035 | Candidate recall precision inputs |
| False-completion one-sided 95% upper bound, if zero observed | 5% | 2.5% | 1% | Candidate safety-weighted gate |
| Device classes / minimum subjects each | 3 / 20 | 4 / 30 | 4 / 40 | Prespecified named device strata |
| Repeat-session attrition | 10% | 15% | 25% | Inflates invitations to complete target |
| Reference synchronization loss | 10% | 15% | 25% | Inflates reference invitations |

The statistician must replace or approve every candidate numeric value before the locked manifest opens.

## 2. Formulas and executable method

### 2.1 Rare false completion

For zero observed false completions among `n_eff` independent-equivalent negative/invalid cases, the exact one-sided 95% binomial upper limit is

`U = 1 - alpha^(1 / n_eff)`, with `alpha = 0.05`,

so the conditional zero-event requirement is

`n_eff = ceiling(log(alpha) / log(1 - U_target))`.

This gives 59, 119, and 299 independent-equivalent negative/invalid cases for upper bounds of 5%, 2.5%, and 1%, respectively. This is a conditional precision statement, not assurance that zero events will occur.

### 2.2 Binomial sensitivity/recall precision

Initial sizing uses

`n_eff = ceiling(z_0.975^2 * p * (1-p) / h^2)`,

where `h` is CI half-width. Locked reporting uses a subject-clustered interval; Wilson or exact binomial intervals may be shown only as nonclustered sensitivity analyses. Invalid-abstention inputs above yield 55, 73, and 149 independent-equivalent invalid cases.

### 2.3 Cluster and unusable-data inflation

For `m` repeated cases per subject and exchangeable ICC `rho`,

`DE = 1 + (m - 1) * rho`,

`n_raw = ceiling(n_eff * DE / (1-u))`,

`N_subjects = ceiling(n_raw / m)`,

where `u` is the unusable/loss fraction. False completion uses `m=4` assigned challenge trials per subject; invalid-abstention sensitivity uses only the `m=2` deliberately invalid trials. This design-effect calculation is an initial approximation. The development pilot must replace it with simulation using the observed cluster-size distribution and subject heterogeneity.

### 2.4 Subject-level count MAE

With one subject-level summary per person, assumed SD `sigma_MAE`, and desired half-width `h_MAE`,

`N = ceiling((z_0.975 * sigma_MAE / h_MAE)^2 / (1-u))`.

For SDs 0.15, 0.25, and 0.40 counts and half-width 0.05, this requires 37, 107, and 308 subjects after inflation. The high scenario is rounded to 310.

### 2.5 Bottom-event error quantiles and all clustered endpoints

No distribution is invented for the bottom-event 95th-percentile absolute error. After development labeling, run this prespecified simulation for candidate `N` values:

1. Resample development subjects with replacement, preserving every trial and condition.
2. Within each simulated study, impose the planned device/condition allocation and sampled unusable pattern.
3. Compute exact count agreement, count MAE, bottom recall/F1, median and 95th-percentile absolute error, completion metrics, and abstention metrics.
4. Form 95% subject-clustered bootstrap CIs using at least 10,000 resamples; use a bias-corrected method only if approved before lock.
5. Repeat at least 5,000 simulated studies per candidate `N` and record the fraction meeting every CI-width and gate rule.
6. Choose the smallest `N` with at least 90% simulated probability of meeting all precision rules, then apply device floors and loss inflation.

For tail estimation, require at least **60 usable independent subjects and 200 matched completed events** even if another calculation is smaller. If the 95th-percentile bootstrap interval is unstable or its half-width exceeds the signed target, expand under Section 8.

For the binary bottom-recall precision screen, the scenario inputs give 29, 139, and 400 independent-equivalent readable events. Applying the 10 positive attempts per subject, scenario-specific event prevalence, loss, and `DE = 1 + 9*rho` requires 5, 46, and 285 subjects. The 60-subject tail-estimation floor controls the low scenario; the device floor controls the expected scenario; count-MAE precision still controls the high scenario.

The arithmetic is reproduced by `work/sample_size_scenarios.py` in the planning workspace. Exact binomial limits follow the NIST exact-binomial definition; the simple cluster inflation follows the standard `1 + (m-1)rho` design effect. Repeated-measures agreement must use a repeated-measures Bland-Altman method rather than treating trials as independent.

## 3. Locked-validation derivation

| Requirement | Low | Expected | High |
|---|---:|---:|---:|
| False-completion independent-equivalent cases | 59 | 119 | 299 |
| Cluster design effect for 4 challenge cases | 1.15 | 1.45 | 1.90 |
| Raw challenge cases after ICC/loss inflation | 72 | 192 | 711 |
| Subjects required for false completion | 18 | 48 | 178 |
| Subjects required for invalid-abstention precision | 31 | 47 | 122 |
| Subjects required for bottom-recall precision | 5 | 46 | 285 |
| Subjects required for count-MAE precision | 37 | 107 | **308** |
| Device-stratum floor | **60** | **120** | 160 |
| **Maximum; rounded locked target** | **60** | **120** | **310** |

The most demanding endpoint is therefore scenario-dependent: the device floor controls the low and expected scenarios, while count-MAE precision controls the high-variance scenario. If the signed registry changes any CI target, rerun the calculation; do not retain these totals by convention.

## 4. Capture volumes and unusable-data allowance

| Cohort/scenario | Participants | First-session recordings | Attempted trials | Expected unusable recordings allowance |
|---|---:|---:|---:|---:|
| Development—low | 24 | 312 | 336 | 16 |
| Development—expected | 40 | 520 | 560 | 52 |
| Development—high | 60 | 780 | 840 | 156 |
| Locked—low | 60 | 780 | 840 | 39 |
| Locked—expected | 120 | 1,560 | 1,680 | 156 |
| Locked—high | 310 | 4,030 | 4,340 | 806 |

“Unusable” is an allowance for precision and operational budgeting, not permission to delete. All attempted recordings remain in the manifest and flow diagram. A technically unreadable endpoint may still contribute to invalid-case abstention and failure-rate endpoints.

### Device-held-out robustness

- Assign device class before capture and record model/browser/OS without serial identifiers.
- Hold at least one named device class completely out of development/tuning; it appears only in locked validation.
- Low: 3 classes x 20 subjects = 60. Expected: 4 x 30 = 120. High: 4 x 40 = 160. Balance lead-side first order within each class.
- Device-held-out results are a required stratum and cannot rescue an overall failure. A held-out class with fewer than its floor after permitted loss is inconclusive and triggers expansion with new untouched subjects on that class.

## 5. Field-development pilot

The development pilot is sequential and never contributes to locked acceptance:

1. **Operational shakedown:** first 8 subjects, reviewed only for consent flow, capture duration, safety, schema/tool defects, synchronization, and missing metadata.
2. **Variance block:** continue to 24 subjects (low minimum), balanced across sides and available devices. Estimate ICC, cluster sizes, endpoint prevalence, count-MAE SD, unusable reasons, labeling time, and event-error distribution.
3. **Expected block:** continue to 40 if any estimate's interval spans the expected scenario or if the planned device/condition cells are incomplete.
4. **High block:** continue to at most 60 under this protocol version if ICC >0.20, unusable >15%, event-tail estimates remain unstable, or required failure families lack readable examples.

At 60 subjects, unresolved definition, rater, tool, or synchronization defects block the locked study; more development capture is not an automatic remedy.

## 6. Rater training and qualification pilot

Use only approved real development recordings; synthetic cases may teach tooling but cannot qualify.

| Scenario | Development subjects represented | Double-labeled qualification recordings | Approximate attempted trials |
|---|---:|---:|---:|
| Low | 16 | 128 (8/subject) | 144–160 |
| Expected | 24 | 192 (8/subject) | 216–240 |
| High | 36 | 288 (8/subject) | 324–360 |

Packets must cover both sides, clean positives, shallow/aborted/incomplete cases, wrong movements, invalid captures, bottom plateaus, occlusion, timestamp defects, mirror/side conflict, and multiple device classes. Raters work independently and never see predictions.

Candidate qualification rule, subject to biomechanics/statistics approval: each rater completes one training packet with feedback, then two blinded qualification packets. Qualification requires the signed category/lead-side agreement threshold, signed bottom-event tolerance threshold, no critical anatomical-side inversion, no deletion of attempted trials, and complete reason/confidence fields. Failure leads to retraining and a new development packet; the failed packet is retained. Qualification thresholds must be signed before the first qualification packet opens.

## 7. Optional reference and repeat-session subsets

### 7.1 Synchronized motion-capture subset

| Scenario | Usable subject target | Invite/capture target | Approx. paired target trials (10/usable subject) |
|---|---:|---:|---:|
| Low | 30 | 34 | 300 |
| Expected | 50 | 59 | 500 |
| High | 80 | 107 | 800 |

Select subjects across device, body-presentation, lead side, tempo/excursion, and capture-quality strata; do not select based on algorithm error. The subset may support projected lead-knee angle and event-reference analyses only when the modality, calibration, projection, and synchronization residual satisfy the frozen reference contract. Motion capture does not replace human truth for task category, visible plant, or stable return.

Reference sizing is provisional because no difference SD or limits-of-agreement tolerance exists. After the first 20 usable synchronized subjects, the statistician must simulate repeated-measures Bland-Altman CI width using observed between- and within-subject variance. Expand from 30 to 50 or 80 usable subjects if the signed LoA CI-width target is not reached. Do not label a 30/50/80 feasibility result a validation pass without that calculation.

### 7.2 Repeat-session reliability subset

| Scenario | Completed two-session target | Invite target | Second-session recordings / completed trials |
|---|---:|---:|---:|
| Low | 40 | 45 | 280 / 240 |
| Expected | 60 | 71 | 420 / 360 |
| High | 90 | 120 | 630 / 540 |

The second session contains 1 calibration plus 6 standard single-trial recordings (3/side), uses the same frozen setup and device, and repeats after a preregistered interval. Randomize lead-side order independently at session 2. Reliability is analyzed only for metrics that first pass validity and missingness gates.

Specify the exact ICC model (occasion, single/average measurement, absolute agreement/consistency) before analysis. Report its CI, within-subject error, SEM, MDC, bias, and limits of agreement. If the balanced two-session design or complete target is not achieved, report descriptive repeat differences and do not claim ICC reliability.

## 8. Stopping and expansion rules

### Before locked capture

- **Stop/block:** protocol identity, consent/privacy, capture manual, labeling handbook, rater independence, device access, reference synchronization, or signed numeric registry is absent.
- **Revise before lock:** development reveals a definition/tool/capture defect. Increment versions, retrain/relabel as required, and rerun the development precision simulation.
- **Select N:** use the maximum endpoint-specific requirement, round up to complete device/condition blocks, then freeze the subject IDs and analysis bundle.

### During locked capture—blinded operational monitoring only

- Monitor consent withdrawals, corruption, missing files, device/condition cell counts, and aggregate unusable rate without viewing algorithm predictions or outcome-specific performance.
- If permitted study-level loss exceeds the scenario allowance or a device floor will not be met, add untouched subjects using the prespecified allocation until the floor and calculated usable target are restored.
- Stop a participant session immediately on request, discomfort, unsafe environment, equipment hazard, or operator concern. Retain only what consent permits.
- Do not stop early for apparent success and do not expand in response to observed algorithm accuracy.

### After the locked set opens

- Any primary gate failure is a fail; do not tune and rerun on the same locked set.
- A CI wider than the signed precision target, insufficient usable sample, unstable 95th-percentile CI, or an underfilled prespecified stratum is **inconclusive**, not pass.
- Expansion after lock is allowed only if its blinded operational trigger was prespecified. Otherwise, freeze the report and collect a new independently locked cohort under a signed amendment; label pooled and new-cohort analyses separately.
- A prohibited failure such as silent wrong-side inversion or false completion of a readable wrong movement is a fail regardless of aggregate metrics.

## 9. Estimated labeling and review burden

Planning-time assumptions: 4 minutes per source recording per independent rater; adjudication for 20% of recordings at 3 minutes each; 10% QC/administration overhead. Replace these with observed development times.

| Work package | Low | Expected | High |
|---|---:|---:|---:|
| Development initial single pass | 23 h | 38 h | 57 h |
| Qualification incremental second-pass/adjudication | 11 h | 16 h | 24 h |
| Locked A/B labels + expected adjudication + QC | 123 h | 246 h | 636 h |
| Reference-system processing allowance (12 min x paired trial) | 60 h | 100 h | 160 h |
| Reliability session-2 A/B labels + adjudication + QC | 44 h | 66 h | 99 h |

These are labor hours, not elapsed calendar time. They exclude consent, capture, data custody, synchronization setup, statistician analysis, and biomechanics review.

## 10. One-page operational capture schedule

**Target session length:** about 30–35 minutes, including rest; stop sooner on request or concern. One operator reads cues; another may manage reference equipment. Predictions remain hidden.

| Elapsed | Activity | Order/fatigue control |
|---:|---|---|
| 0–5 min | Consent confirmation, stop rule, clothing/footwear and assigned-condition check; assign pseudonymous IDs | No movement judgment or health questions outside approved consent |
| 5–8 min | Camera/reference setup and synchronization; recording 1 calibration | Record orientation, mirror, distance/height, device, fps/timestamps; no algorithm overlay |
| 8–10 min | Standardized demonstration and up to 2 unrecorded familiarization attempts, one/side | Demonstrator order is counterbalanced by subject; neutral cue, no “good form” coaching |
| 10–16 min | Standard block A: 3 single-trial recordings on first assigned side | First side randomized 1:1 within device; 20–30 s between attempts; retain false starts if recording began |
| 16–18 min | Seated/standing rest as preferred | Operator checks only file integrity/metadata, never predictions |
| 18–24 min | Standard block B: 3 single-trial recordings on opposite side | Same cue/rest; block order reverses across participants |
| 24–26 min | Count block: one 2-trial recording per side | Side order opposite initial standard order; 30–45 s rest between recordings |
| 26–29 min | Challenge block 1: one readable negative and one invalid-capture condition | Latin-square/balanced incomplete-block order; operator changes only assigned factor |
| 29–31 min | Rest and technical check | No repeat for algorithm failure; repeat only prespecified acquisition failure, retaining both files |
| 31–34 min | Challenge block 2: second negative and second invalid-capture condition | Reverse negative/invalid order for alternating participants; no unsafe movement |
| 34–35 min | Neutral standing closeout, participant stop/withdrawal reminder, file/hash completeness | End after stable return/closeout; document deviations and reasons |

Randomization is generated before arrival in permuted blocks stratified by device: first lead side, negative/invalid order, assigned negative subtype, and assigned invalid-capture subtype. Consecutive deep target attempts are capped at three; multi-trial count recordings occur only after a rest. Repeat-session subjects receive the opposite first-side order when feasible, with a newly randomized within-session sequence.

## 11. Statistician approval block

No locked capture may begin until this block and the associated hashed registry are complete.

| Approval item | Entry |
|---|---|
| Selected scenario or recalculated N | ______________________________ |
| Numeric gate-registry version and SHA-256 | ______________________________ |
| Primary estimands and analysis populations approved | Yes / No |
| False-completion upper bound and CI method | ______________________________ |
| Invalid-abstention sensitivity target/precision | ______________________________ |
| Count-MAE and bottom-event CI-width targets | ______________________________ |
| ICC/cluster-size assumptions replaced by pilot estimates | Yes / No; values: __________ |
| Unusable/loss and prevalence assumptions approved | ______________________________ |
| Device strata and minimum per stratum approved | ______________________________ |
| Reference LoA simulation and tolerance approved | Yes / No / N/A |
| Reliability ICC model and precision target approved | Yes / No / N/A |
| Multiplicity and subgroup policy approved | ______________________________ |
| Blinded operational expansion rule approved | Yes / No |
| Statistician name/signature/date | ______________________________ |
| Biomechanics lead name/signature/date | ______________________________ |
| Product/claims owner name/signature/date | ______________________________ |
| Engineering owner name/signature/date | ______________________________ |

## References

- KinematicIQ, *Forward-Lunge Field-Validation Protocol*, `flsr-v0`, 2026-07-14.
- KinematicIQ, *Forward-Lunge Dataset and Capture Specification*, `flsr-v0`, 2026-07-14.
- KinematicIQ, *Forward-Lunge Event Labeling Handbook*, `flsr-v0`, 2026-07-14.
- [NIST/SEMATECH exact binomial confidence limits](https://www.itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm).
- Pilz M. [Sample size calculation for one-armed clinical trials with clustered data and binary outcome](https://doi.org/10.1002/bimj.202300123). *Biometrical Journal*. 2023.
- Bland JM, Altman DG. [Measuring agreement in method comparison studies](https://doi.org/10.1177/096228029900800204). *Statistical Methods in Medical Research*. 1999.
- Carkeet A. [Confidence and coverage for Bland-Altman limits of agreement and their approximate confidence intervals](https://pubmed.ncbi.nlm.nih.gov/27587594/). *Optometry and Vision Science*.
