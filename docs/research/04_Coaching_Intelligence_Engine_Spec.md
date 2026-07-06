# KinematicIQ Coaching Intelligence Engine

Graduate-level specification for coaching intelligence, movement interpretation, and decision support.

Date: 2026-07-05  
Source prompt: `Research_05_Coaching_Intelligence_and_Decision_Support.md`

## 1. Executive Summary

The Coaching Intelligence Engine should not behave like a fault detector. It should behave like a careful interdisciplinary coach: measure what can be measured, infer only what the evidence supports, explain uncertainty, prioritize the few changes most likely to matter, recommend appropriate coaching cues and interventions, and retest the same measurable signals after a defined practice interval.

The recommended architecture is a hybrid reasoning system:

1. Browser-based motion capture produces objective measurements and measurement-quality metadata.
2. A metric layer derives task-specific variables such as depth, joint angles, tempo, asymmetry, phase timing, frontal-plane projection, stability, and compensation indicators.
3. A pattern layer detects observable movement patterns, such as limited squat depth, dynamic knee valgus, trunk sway, early heel rise, asymmetrical loading, or fatigue drift.
4. A root-cause layer estimates plausible contributors using rule-based evidence, Bayesian-style confidence updates, historical context, and safety constraints.
5. A priority layer ranks recommendations by severity, confidence, trainability, user goal, safety risk, and implementation cost.
6. A coaching layer generates explanations, external-focus cues, targeted interventions, and reassessment metrics.
7. A validation layer tracks whether the recommendation changed the intended metric and whether unintended compensations appeared.

The system should clearly label:

| Category | Meaning | Example |
|---|---|---|
| Objective measurement | Directly estimated from video or sensor input | "Peak knee flexion was 68 degrees." |
| Derived measurement | Computed from multiple measurements | "Left/right depth asymmetry was 9%." |
| Inference | Probabilistic interpretation | "Limited ankle dorsiflexion may be contributing." |
| Coaching heuristic | Practical rule with weaker evidence | "Use one primary cue per set." |
| Evidence-supported intervention | Intervention backed by systematic review, trial, or consensus | "Use neuromuscular training for landing mechanics." |
| Open research question | Plausible but not validated enough for strong claims | "Whether single-camera sagittal data can infer tissue-specific injury risk." |

## 2. Evidence Strength Framework

Every engine rule should carry an evidence grade and a confidence score. Evidence grade describes the literature. Confidence describes whether the current user's data supports this specific conclusion.

| Grade | Definition | Engine Behavior |
|---|---|---|
| A | Multiple systematic reviews, meta-analyses, strong prospective evidence, or strong clinical consensus | Can drive high-priority recommendations when user data quality is adequate |
| B | Controlled trials, consistent observational evidence, or validated clinical tools with known limitations | Can recommend with moderate language and clear retest |
| C | Cross-sectional, mechanistic, or mixed evidence | Present as plausible contributor, not as cause |
| D | Expert opinion, coaching convention, early feasibility evidence | Use as heuristic only; never overstate |
| Research | Emerging or unresolved | Mention only in clinician/researcher views or roadmap |

Evidence summary used in this document:

| Domain | Strength | Practical Interpretation |
|---|---:|---|
| External-focus cues vs internal-focus cues | A | Prefer external effects of movement for most skill coaching. |
| Augmented visual feedback | B | Useful, especially when paired with simple actionable cues; dosing matters. |
| Movement screening as injury prediction | C | Useful for describing movement, weak as standalone injury predictor. |
| Dynamic knee valgus root causes | B/C | Modifiable but multifactorial; hip strength, ankle mobility, trunk control, fatigue, and task demand interact. |
| Neuromuscular training for ACL risk reduction | A | Strong support for structured programs, especially with compliance. |
| Markerless/browser pose estimation | B/C | Feasible for screening and coaching, but device, camera, model, task, and calibration affect validity. |
| Explainable clinical decision support | B | Transparency, human factors, and evaluation are central adoption requirements. |
| AI safety and uncertainty governance | B | Use NIST-style risk management, audit logs, and non-diagnostic language. |

## 3. How Experts Interpret Movement

### 3.1 Strength & Conditioning Coaches

Definition: Practitioners who translate movement observations into training decisions for performance, resilience, and skill development.

Scientific rationale: They focus on modifiable performance variables such as strength, rate of force development, coordination, capacity, fatigue tolerance, and technical consistency.

Coaching rationale: Their question is usually, "What cue or training exposure will improve this athlete's movement today without derailing the larger program?"

Clinical rationale: They should avoid diagnosis and refer when pain, red flags, or post-injury restrictions appear.

Evidence strength: B for neuromuscular and strength training effects; C/D for many exercise-selection heuristics.

Inputs: Sport, position, training age, load, readiness, technique video, asymmetry, session goal, prior injuries where available.

Decision logic: Identify the biggest performance-limiting pattern, choose the least intrusive intervention, cue one change, and retest.

Priority rules: Safety first, then task outcome, then transfer to sport, then efficiency.

Limitations: Coaches may overweight visible technique and underweight pain, tissue capacity, or clinical history.

Confidence handling: Use strong language for observable facts, moderate language for root-cause theories.

Pseudocode:

```ts
if (painReported || postOpFlag) referOrConstrain();
pattern = highestImpactTrainablePattern(session.metrics, athlete.goal);
cue = selectCue(pattern, { preferExternal: true, maxCues: 1 });
plan = chooseIntervention(pattern, athlete.trainingAge, loadContext);
retest(pattern.primaryMetric);
```

Browser feasibility: High for visible joint angles, tempo, depth, and asymmetry; moderate for force-related conclusions.

Implementation recommendations: S&C view should emphasize "what to do next," load modification, and progress tracking.

### 3.2 Sports Scientists

Definition: Practitioners who quantify performance and interpret variability, reliability, and adaptation.

Scientific rationale: They prioritize valid measurement, longitudinal signal, smallest worthwhile change, and measurement error.

Coaching rationale: They help coaches distinguish meaningful adaptation from noise.

Clinical rationale: They can flag workload, fatigue drift, and asymmetry trends that may justify clinical review.

Evidence strength: B for monitoring frameworks; C for many athlete-specific prediction models.

Inputs: Repeated sessions, device metadata, measurement confidence, training load, readiness, performance outcome.

Decision logic: Estimate reliability, compare against individual baseline, and avoid overreacting to a single noisy test.

Priority rules: Individual change over population norms; repeated trend over single frame; data quality before interpretation.

Limitations: Strong metrics can still have weak causal meaning.

Confidence handling: Report confidence intervals, test-retest error, and "insufficient signal" states.

Pseudocode:

```ts
change = current.value - athlete.baseline.mean;
meaningful = Math.abs(change) > max(metric.SEM, metric.smallestWorthwhileChange);
confidence = combine(metric.quality, session.repeatability, sampleSizeWeight);
```

Browser feasibility: High for repeated standardized tasks; lower for uncontrolled sport-specific environments.

Implementation recommendations: Store baselines by task, device, camera setup, and movement phase.

### 3.3 Physical Therapists

Definition: Clinicians who interpret movement in relation to symptoms, function, tissue tolerance, and rehabilitation goals.

Scientific rationale: PTs integrate biomechanics, pain science, motor control, range of motion, strength, and functional limitation.

Coaching rationale: They seek movement options that reduce symptoms and restore function.

Clinical rationale: They must distinguish coaching advice from clinical assessment and stay within scope.

Evidence strength: B for functional assessment and exercise intervention in many conditions; C for video-only causal attribution.

Inputs: Pain, history, irritability, range of motion, strength tests, functional tasks, surgical status, clinician notes.

Decision logic: Determine whether movement is limited by mobility, strength, coordination, pain response, fear, or task exposure.

Priority rules: Symptom irritability, red flags, medical restrictions, then function.

Limitations: Browser video cannot diagnose pathology or replace hands-on exam.

Confidence handling: Use "may be consistent with" and recommend clinician evaluation for pain-linked or high-risk findings.

Pseudocode:

```ts
if (redFlags || severePain || neuroSymptoms) return clinicalReferral();
contributors = estimateContributors(metrics, history, painResponse);
recommend = selectLowestIrritabilityIntervention(contributors, goals);
```

Browser feasibility: Moderate; strong for standardized functional screens, weak for tissue diagnosis.

Implementation recommendations: Clinical mode should include disclaimers, referral triggers, and symptom response tracking.

### 3.4 Athletic Trainers

Definition: Sports medicine professionals who manage prevention, acute care, rehabilitation coordination, and return-to-play workflows.

Scientific rationale: They integrate movement screens with injury history, workload, symptoms, and sport participation constraints.

Coaching rationale: They translate clinical constraints into field-ready modifications.

Clinical rationale: They are often the bridge between coach, athlete, physician, and therapist.

Evidence strength: B for injury-prevention program implementation; C for screen-only risk estimates.

Inputs: Injury history, exposure, compliance, sport demands, pain, swelling, return-to-play status.

Decision logic: Flag risk-relevant patterns, compare to plan restrictions, and recommend escalation or modification.

Priority rules: Medical restriction, acute symptoms, return-to-play criteria, then performance.

Limitations: Video metrics are adjuncts, not clearance tools.

Confidence handling: Require stronger evidence for return-to-play claims than for practice cues.

Pseudocode:

```ts
if (!clearedForTask(task, athlete.RTPStage)) blockTask();
if (movementRegression && symptomsIncreasing) notifyClinicalTeam();
```

Browser feasibility: High for remote monitoring; moderate for clearance decisions.

Implementation recommendations: Add role-based reports for ATs with compliance, trend, and symptom flags.

### 3.5 Orthopedic Clinicians

Definition: Physicians and surgical clinicians who interpret movement in medical, structural, and post-operative context.

Scientific rationale: They connect function to injury mechanism, tissue status, imaging, and surgical precautions.

Coaching rationale: They need concise functional status and trend information, not verbose coaching detail.

Clinical rationale: The system must avoid diagnosis and preserve clinician authority.

Evidence strength: B for some functional tests; C for video-only clinical inference.

Inputs: Diagnosis, procedure, healing timeline, restrictions, pain, swelling, range of motion, strength, functional progression.

Decision logic: Determine whether movement data supports progression, caution, or referral back to care.

Priority rules: Contraindications, post-op stage, worsening symptoms, objective regression.

Limitations: Cannot infer internal tissue healing from camera kinematics.

Confidence handling: Use conservative thresholds and make evidence traceable.

Pseudocode:

```ts
if (postOp && taskDemand > protocol.allowedDemand) return contraindicated();
if (objectiveRegression && symptomFlag) return clinicianReview();
```

Browser feasibility: Moderate for functional milestones; low for structural status.

Implementation recommendations: Build "clinician summary" outputs with observed metric, trend, confidence, and escalation reason.

### 3.6 Biomechanists

Definition: Specialists who analyze motion, forces, moments, and mechanical constraints.

Scientific rationale: They prioritize measurement validity, coordinate systems, task standardization, kinetics, and modeling assumptions.

Coaching rationale: They prevent false mechanical explanations from weak data.

Clinical rationale: They help distinguish observed kinematics from unmeasured loading or tissue stress.

Evidence strength: A for lab measurement principles; C for many single-camera mechanical inferences.

Inputs: Camera calibration, landmark confidence, task phase, anthropometrics, force plate or surrogate data, sampling rate.

Decision logic: Validate signal quality, compute metrics with known assumptions, expose uncertainty.

Priority rules: No quality, no conclusion; no kinetics, no definitive load claim.

Limitations: Browser pose alone cannot reliably estimate joint moments in most consumer setups.

Confidence handling: Penalize occlusion, off-plane motion, poor lighting, low frame rate, missing landmarks, and short trials.

Pseudocode:

```ts
quality = assessCaptureQuality(frames, calibration, task);
if (quality < metric.requiredQuality) suppressMetric(metric);
metric.ci = estimateMeasurementUncertainty(metric, quality, modelError);
```

Browser feasibility: High for 2D screening and some 3D landmark estimates; moderate-to-low for kinetic interpretation.

Implementation recommendations: Separate biomechanics facts from coaching implications in data models.

### 3.7 Performance Directors

Definition: Leaders who convert movement intelligence into program strategy, staffing, and athlete-management decisions.

Scientific rationale: They care about repeatable systems, compliance, athlete availability, and return on training investment.

Coaching rationale: They need aggregation without losing individual context.

Clinical rationale: They need escalation workflows and auditability.

Evidence strength: C for many organizational decision rules; B for compliance importance in prevention programs.

Inputs: Team dashboards, readiness, injury history, compliance, trend distributions, coach adherence.

Decision logic: Identify team-wide patterns, resource needs, and at-risk workflows.

Priority rules: High-confidence repeated trends, high-impact athletes/groups, compliance gaps.

Limitations: Population dashboards can hide individual context and fairness issues.

Confidence handling: Show group confidence and data completeness, not just scores.

Pseudocode:

```ts
teamPattern = aggregatePatterns(roster, minSessions=3);
if (teamPattern.prevalence > threshold && confidence > 0.7) recommendProgramBlock();
```

Browser feasibility: High for dashboards; moderate for large-scale validity without standardized capture.

Implementation recommendations: Include cohort-level trend views and drill-down to individual evidence.

### 3.8 Where Expert Opinions Differ

| Question | Coaches | Clinicians | Biomechanists | Recommended Engine Stance |
|---|---|---|---|---|
| Is visible valgus always bad? | Often cue it quickly | Depends on pain/history | Depends on task/load/plane | Treat as pattern, not diagnosis |
| Should movement be normalized to textbook form? | Sometimes | Rarely | Context-dependent | Normalize to task goal and individual constraints |
| Can a screen predict injury? | Often used that way | Cautious | Skeptical | Avoid standalone injury prediction |
| How many cues? | Practical preference | Patient-specific | N/A | One primary cue plus optional secondary |
| What matters most: mobility or strength? | Depends on training block | Depends on impairment | Depends on measured constraint | Use differential reasoning and retest |

Shared principles:

- Good interpretation begins with task context.
- Observed movement is not automatically pathology.
- Single metrics rarely imply single causes.
- The best recommendation is specific, measurable, safe, and retestable.
- Uncertainty should be displayed, not hidden.

## 4. Reasoning Pipeline: Metrics to Meaning

ASCII architecture:

```text
Video / Sensors / History
        |
        v
Capture Quality Gate
        |
        v
Raw Metrics -> Derived Metrics -> Pattern Detection
                                  |
                                  v
                         Root-Cause Hypotheses
                                  |
                                  v
                         Priority & Safety Ranking
                                  |
                                  v
       Explanation -> Cue -> Intervention -> Retest Metric
                                  |
                                  v
                        Longitudinal Learning Loop
```

### 4.1 Raw Metrics

Definition: Direct outputs from pose estimation, sensors, or user input.

Scientific rationale: Interpretation quality is bounded by measurement validity.

Coaching rationale: Raw metrics give objective anchors for feedback.

Clinical rationale: Raw metrics reduce vague labels such as "bad form."

Evidence strength: B/C for markerless pose depending on task, camera, and validation context.

Inputs: Landmarks, frame timestamps, visibility scores, camera metadata, user-reported pain, task protocol.

Decision logic: Accept, suppress, or downgrade metrics based on quality.

Priority rules: Do not derive high-stakes conclusions from low-quality inputs.

Limitations: Landmark estimates are model outputs, not anatomical gold standards.

Confidence handling: Attach per-frame and per-metric quality.

Pseudocode:

```ts
for (const frame of frames) {
  landmarks = poseModel.detect(frame);
  quality.frame = scoreLandmarkVisibility(landmarks) * scoreLighting(frame);
}
rawMetric.confidence = aggregateQuality(quality.frames, metric.requiredLandmarks);
```

Browser feasibility: MediaPipe and similar models can run in-browser and output 2D/3D landmarks, but browser performance varies.

Implementation recommendations: Persist model version, browser, device, frame rate, resolution, and camera orientation.

### 4.2 Derived Metrics

Definition: Computed variables built from raw measurements, such as joint angles, range, tempo, asymmetry, displacement, or variability.

Scientific rationale: Derived metrics map raw landmarks to biomechanical constructs.

Coaching rationale: They become coach-friendly targets: depth, alignment, balance, control.

Clinical rationale: They support function tracking without diagnosing tissue state.

Evidence strength: B for validated 2D/3D angles in standardized tasks; C for complex uncalibrated estimates.

Inputs: Cleaned landmarks, anthropometric scaling, phase labels, protocol metadata.

Decision logic: Compute only when required landmarks and phases meet quality thresholds.

Priority rules: Prefer robust metrics over fragile metrics for automated recommendations.

Limitations: 2D angles can misrepresent 3D motion when the athlete rotates or camera alignment is poor.

Confidence handling: Combine landmark quality, protocol quality, and known metric error.

Pseudocode:

```ts
angle = computeJointAngle(hip, knee, ankle);
metric = withUncertainty(angle, {
  landmarkQuality,
  cameraPlaneError,
  publishedSEM: metricRegistry.kneeFlexion.sem
});
```

Browser feasibility: High for simple angles and timing; moderate for out-of-plane movement.

Implementation recommendations: Each metric definition should include required landmarks, smoothing, phase, units, validity notes, and suppression thresholds.

### 4.3 Pattern Recognition

Definition: Detection of meaningful observable movement patterns from derived metrics.

Scientific rationale: Patterns represent clusters of objective observations, not causes.

Coaching rationale: Coaches think in patterns such as "knees cave," "heels rise," or "trunk collapses."

Clinical rationale: Patterns can guide further assessment without implying diagnosis.

Evidence strength: B/C depending on pattern and task.

Inputs: Derived metrics, normative ranges, baseline, phase, sport/task.

Decision logic: Compare to individualized baseline first, then task-specific reference ranges.

Priority rules: High magnitude + repeated + modifiable + relevant beats isolated deviation.

Limitations: Normal movement variability can be useful and individual-specific.

Confidence handling: Pattern confidence requires metric confidence plus repeatability.

Pseudocode:

```ts
pattern.confidence = min(metric.confidence, repeatabilityScore, protocolScore);
pattern.present = metric.value > threshold && pattern.confidence >= 0.55;
```

Browser feasibility: High for visible pattern screening.

Implementation recommendations: Store pattern definitions separately from intervention rules.

### 4.4 Root-Cause Analysis

Definition: Probabilistic estimation of contributors that may explain a pattern.

Scientific rationale: Similar movement patterns can arise from different constraints.

Coaching rationale: Better root-cause hypotheses produce better interventions.

Clinical rationale: Overconfident causal claims can mislead users and create safety risk.

Evidence strength: B/C for common contributors, C/D for video-only causality.

Inputs: Pattern set, history, task constraints, symptoms, fatigue indicators, prior sessions, optional manual test data.

Decision logic: Use a hybrid of rules, Bayesian-style updates, and clinician/coach constraints.

Priority rules: Root causes with direct confirmatory tests outrank speculative causes.

Limitations: Browser motion data often cannot identify tissue-specific causes.

Confidence handling: Root-cause confidence must be lower than or equal to the evidence quality and measurement confidence.

Pseudocode:

```ts
posterior = priorFromPopulation(contributor, athleteContext);
for (const observation of observations) {
  posterior *= likelihood(contributor, observation);
}
confidence = calibrate(posterior, evidenceGrade, dataQuality);
```

Browser feasibility: Moderate for hypothesis generation; low for definitive diagnosis.

Implementation recommendations: Output "likely contributors to check" rather than "the cause is."

### 4.5 Priority Ranking

Definition: Ordering recommendations by impact, confidence, safety, trainability, and user goal.

Scientific rationale: Humans can change only a small number of variables per session.

Coaching rationale: Prioritization prevents cue overload.

Clinical rationale: Safety-sensitive patterns should surface even if performance impact is uncertain.

Evidence strength: C/D for exact ranking formulas; A/B for avoiding excessive feedback load and respecting safety constraints.

Inputs: Pattern severity, confidence, evidence grade, symptoms, history, goal, trainability, retest metric.

Decision logic: Compute score; apply hard safety gates.

Priority rules: Safety gate > high confidence > goal relevance > trainability > ease.

Limitations: Ranking is partly a product decision and must be validated with users.

Confidence handling: Do not rank low-confidence hypotheses above high-confidence observations unless safety requires.

Pseudocode:

```ts
score =
  0.25 * severity +
  0.20 * confidence +
  0.20 * goalRelevance +
  0.15 * evidenceWeight +
  0.10 * trainability +
  0.10 * retestability;
if (safetyFlag) score += safetyBoost;
```

Browser feasibility: High.

Implementation recommendations: Make weights configurable and auditable.

## 5. Root-Cause Concept Cards

### 5.1 Limited Ankle Mobility

Definition: Insufficient ankle dorsiflexion or poor ankle strategy for the task.

Scientific rationale: Restricted dorsiflexion can alter squat and landing mechanics, including reduced knee flexion, earlier heel rise, altered trunk position, and sometimes greater dynamic valgus. Evidence supports an association, but not a universal causal pathway.

Coaching rationale: Ankle constraints are often trainable and easy to retest with squat, lunge, or landing tasks.

Clinical rationale: Ankle limitation can reflect joint restriction, calf stiffness, pain, prior injury, or motor strategy; video alone cannot distinguish these.

Evidence strength: B/C. Studies link dorsiflexion to squat and knee alignment, but context and task matter.

Inputs: Heel rise timing, tibial progression angle, squat depth, knee travel, trunk lean, side-to-side differences, optional weight-bearing lunge test, pain.

Decision logic: Suspect ankle contribution when shallow depth, early heel rise, reduced tibial progression, or compensatory pronation/valgus appears, especially if confirmed by a lunge screen.

Priority rules: Prioritize if the user goal requires squat depth, landing absorption, deceleration, or ankle-intensive sport positions.

Limitations: Poor depth can also come from hip mobility, motor control, fear, load, limb proportions, or task unfamiliarity.

Confidence handling: High only if video pattern plus direct mobility test agree.

Pseudocode:

```ts
ankleScore = weightedSum([
  earlyHeelRise,
  lowTibialProgression,
  reducedDepth,
  asymmetry,
  lungeTestLimited
]);
confidence = requireConfirmatoryTest ? min(videoConfidence, lungeConfidence) : videoConfidence * 0.65;
```

Browser feasibility: Moderate-to-high for heel rise and tibial progression; direct dorsiflexion needs standardized camera view.

Implementation recommendations: Ask for a weight-bearing lunge retest before strong ankle claims.

### 5.2 Hip Mobility or Hip Strength Deficit

Definition: Limited hip range, strength, or control affecting lower-extremity alignment and task execution.

Scientific rationale: Hip abductors/external rotators can influence frontal and transverse plane mechanics, but systematic reviews show task-dependent and sometimes conflicting relationships.

Coaching rationale: Hip strength and control drills are common, scalable interventions.

Clinical rationale: Hip findings can be related to pain, morphology, prior injury, or neuromuscular control; avoid simplistic claims.

Evidence strength: B/C. Stronger for single-leg ballistic tasks than double-leg tasks.

Inputs: Knee valgus, hip adduction/internal rotation proxy, pelvic drop, trunk lean, single-leg task quality, history, optional strength screen.

Decision logic: Suspect hip contribution when dynamic valgus appears in high-demand single-leg tasks with pelvic drop or poor frontal-plane control.

Priority rules: Prioritize if the sport requires cutting, landing, single-leg deceleration, or repeated frontal-plane control.

Limitations: Valgus may reflect ankle, foot, trunk, coordination, fatigue, or intentional sport strategy.

Confidence handling: Use "may contribute" unless paired with direct strength or clinician input.

Pseudocode:

```ts
if (task.isSingleLeg && valgus.present && (pelvicDrop.present || trunkLean.present)) {
  addHypothesis("hipControl", moderateConfidence);
}
```

Browser feasibility: Moderate; pelvic and transverse-plane estimates are sensitive to camera angle.

Implementation recommendations: Offer hip-control drills as a reasonable intervention, but retest alignment and task outcome.

### 5.3 Trunk Control Deficit

Definition: Inability to maintain task-appropriate trunk position and control during movement.

Scientific rationale: Trunk control influences lower-extremity mechanics and has been linked prospectively to knee injury risk in some athlete cohorts. Trunk fatigue and perturbation can alter landing mechanics.

Coaching rationale: Trunk position can often be changed through constraints, cueing, tempo, and progressive stability work.

Clinical rationale: Trunk control issues may reflect neuromuscular control, vestibular/balance, pain, fatigue, or post-concussion history.

Evidence strength: B for association and mechanistic plausibility; C for video-only root cause.

Inputs: Trunk lean, lateral flexion, pelvic drop, trunk rotation, landing/cutting phase, fatigue trend, sport.

Decision logic: Suspect trunk contribution when trunk deviation co-occurs with lower-limb alignment changes, especially under fatigue or unilateral demand.

Priority rules: Prioritize when trunk deviation is large, repeated, sport-relevant, or paired with pain/history.

Limitations: Some trunk lean is performance strategy, not fault.

Confidence handling: Compare to task requirement and athlete baseline before flagging.

Pseudocode:

```ts
if (trunkDeviation.zScore > 1.5 && repeatedAcrossTrials) {
  contributor.trunkControl = adjustForSportStrategy(baseConfidence);
}
```

Browser feasibility: High for frontal/sagittal trunk angle; moderate for rotation.

Implementation recommendations: Use task-specific wording such as "your trunk drifted left during landing" rather than "weak core."

### 5.4 Balance Deficit

Definition: Reduced ability to maintain center-of-mass control over base of support for the task.

Scientific rationale: Balance is a sensorimotor construct involving vestibular, visual, proprioceptive, strength, and strategy components.

Coaching rationale: Balance limitations can be improved through constraints, slower tempo, external targets, and progressive single-leg tasks.

Clinical rationale: Balance issues can reflect neurological, vestibular, pain, or post-injury factors and may require referral.

Evidence strength: B/C depending on population and test.

Inputs: Center-of-mass proxy sway, foot repositioning, arm strategy, failed reps, single-leg stance duration, wobble frequency.

Decision logic: Detect balance issue when instability causes loss of task outcome or repeated compensatory steps.

Priority rules: Prioritize if instability creates fall risk, pain, or prevents progression.

Limitations: Video-only center of mass is approximate.

Confidence handling: Use higher confidence when instability is obvious and repeated.

Pseudocode:

```ts
balanceScore = swayMagnitude + failedReps + footCorrections;
if (balanceScore > task.threshold) flagPattern("balanceControl");
```

Browser feasibility: Moderate-to-high for visible stability; low for sensory source.

Implementation recommendations: Recommend regressions such as support assistance, reduced range, slower tempo, and external targets.

### 5.5 Coordination or Motor-Control Issue

Definition: Poor sequencing, timing, rhythm, or intersegment coordination despite adequate apparent mobility.

Scientific rationale: Motor skill depends on perception-action coupling, practice history, feedback, task constraints, and attentional focus.

Coaching rationale: Coordination often improves with constraints, external cues, rhythm, and practice design.

Clinical rationale: Coordination deficits after injury or neurological symptoms require clinician involvement.

Evidence strength: B for motor-learning principles; C/D for automated classification.

Inputs: Phase timing, joint sequencing, rep-to-rep variability, velocity profiles, failed task constraints, training age.

Decision logic: Suspect coordination when the athlete has range but cannot sequence it consistently under task constraints.

Priority rules: Prioritize when variability is high and cue response is positive.

Limitations: High variability can be normal exploration in novices.

Confidence handling: Improve confidence after observing cue response or repeated trials.

Pseudocode:

```ts
if (rangeAvailable && highVariability && improvesWithExternalCue) {
  contributor.coordination = high;
}
```

Browser feasibility: High for timing and variability in standardized tasks.

Implementation recommendations: Add "cue response test" as a diagnostic action.

### 5.6 Fatigue

Definition: Decline in movement quality, control, or output over repeated reps or time.

Scientific rationale: Fatigue can alter lower-limb and trunk biomechanics during landing and other tasks; evidence varies by protocol, sex, task, and population.

Coaching rationale: Fatigue drift is actionable through load, rest, conditioning, or technique-under-fatigue training.

Clinical rationale: Fatigue-related compensation may indicate inadequate capacity or return-to-play risk.

Evidence strength: B/C.

Inputs: Rep index, velocity decline, depth decline, increasing asymmetry, increasing valgus/trunk sway, RPE, session timing.

Decision logic: Compare early reps to later reps within the same protocol.

Priority rules: Prioritize if movement degrades under sport-relevant fatigue or near return-to-play.

Limitations: Warm-up effects can improve early performance; fatigue protocols are not standardized.

Confidence handling: Require enough repetitions and consistent trend.

Pseudocode:

```ts
fatigueDrift = slope(metric.value, repIndex);
if (abs(fatigueDrift) > metric.driftThreshold && reps >= minReps) flag("fatigueSensitivePattern");
```

Browser feasibility: High for repeated tasks.

Implementation recommendations: Include "fresh vs fatigued" comparison view.

### 5.7 Asymmetry

Definition: Meaningful left-right difference in movement magnitude, timing, loading proxy, or control.

Scientific rationale: Asymmetry is common; interpretation depends on magnitude, task, history, and measurement error.

Coaching rationale: Persistent asymmetry may guide unilateral strength, mobility, or skill work.

Clinical rationale: New or pain-linked asymmetry may require evaluation.

Evidence strength: C for general risk inference; B for tracking functional change in rehab contexts when standardized.

Inputs: Side-specific angles, depth, timing, contact, stability, history, limb dominance, prior injury.

Decision logic: Flag only when difference exceeds measurement error and appears across repeated trials.

Priority rules: Prioritize new, worsening, high-magnitude, pain-linked, or return-to-play-relevant asymmetry.

Limitations: Sport-specific asymmetry may be normal and useful.

Confidence handling: Compare to baseline, not just population norms.

Pseudocode:

```ts
asym = abs(left - right) / max(abs(left), abs(right));
if (asym > metric.SDD && repeated) flag("asymmetry");
```

Browser feasibility: High for visible side-to-side metrics in standardized tasks.

Implementation recommendations: Report asymmetry with direction, magnitude, and measurement-error caveat.

### 5.8 Pain-Related Compensation

Definition: Movement alteration plausibly associated with pain, threat, fear, or symptom avoidance.

Scientific rationale: Pain can change motor behavior, load distribution, range, tempo, and confidence.

Coaching rationale: Pain changes the training target from "fix form" to "find tolerable function."

Clinical rationale: Pain requires scope-aware language and referral triggers.

Evidence strength: B for pain affecting movement generally; C for video-only attribution.

Inputs: Pain location, intensity, onset, symptom behavior, range reduction, unloading, guarding, history.

Decision logic: If pain co-occurs with movement change, label compensation as possible and recommend clinical review when severe, persistent, neurological, traumatic, or worsening.

Priority rules: Pain and red flags outrank performance goals.

Limitations: Not all altered movement is caused by pain; not all pain is visible.

Confidence handling: Require self-report; video alone cannot infer pain.

Pseudocode:

```ts
if (pain.score >= 4 || pain.worsening || redFlag) routeToSafetyMessage();
else if (pain.present && alteredPattern.present) tag("possiblePainRelatedCompensation");
```

Browser feasibility: Low without self-report; moderate with integrated symptom prompts.

Implementation recommendations: Add mandatory pain prompt before high-demand recommendations.

## 6. Decision Methods

| Method | Definition | Strengths | Weaknesses | Recommended Use |
|---|---|---|---|---|
| Decision trees | Branching rules based on measurements and context | Explainable, testable, fast | Brittle if overgrown | Safety gates, simple pattern detection |
| Rule engine | Modular conditions and actions | Auditable, domain-editable | Conflict management needed | Primary v1 architecture |
| Bayesian reasoning | Updates belief from prior and evidence | Handles uncertainty well | Requires calibrated likelihoods | Root-cause confidence |
| Knowledge graph | Connected concepts, evidence, interventions, contraindications | Good for explainability and reuse | Requires governance | Evidence/intervention mapping |
| Causal inference | Formal estimation of causal effects | Rigorous | Needs data and assumptions rarely available in v1 | Validation and future personalization |
| Machine learning | Learns patterns from data | Scales with data | Can be opaque, biased, overfit | Later ranking, cue personalization, anomaly detection |
| Hybrid AI | Combines rules, graphs, statistical confidence, and ML | Balances explainability and adaptivity | More complex | Recommended long-term architecture |

Recommended v1: deterministic rules for safety and pattern detection, graph-backed intervention mapping, confidence propagation, and optional Bayesian scoring for root-cause hypotheses. Add ML only after the system has reliable labels, outcomes, and longitudinal data.

## 7. Coaching Cue Generation

### 7.1 Internal vs External Focus

Definition: Internal focus directs attention to body parts; external focus directs attention to movement effects or the environment.

Scientific rationale: Meta-analytic evidence favors external focus for motor performance and learning across many tasks.

Coaching rationale: External cues reduce overcontrol and make movement goals simpler.

Clinical rationale: External cues can be useful in rehabilitation, though pain, safety, and patient education may require body-awareness cues at times.

Evidence strength: A for general superiority of external focus; B/C for specific clinical populations and tasks.

Inputs: Movement pattern, task goal, user level, cue history, response to prior cues.

Decision logic: Generate external cue first unless the goal is anatomy education or clinician-specific instruction.

Priority rules: One primary cue; avoid correcting multiple body segments at once.

Limitations: Some users need internal cues for awareness or clinical education.

Confidence handling: Cue success is empirical: retest after cue.

Pseudocode:

```ts
cue = cueLibrary.find({
  pattern,
  focus: "external",
  complexity: user.trainingAge === "novice" ? "simple" : "moderate"
});
```

Browser feasibility: High.

Implementation recommendations: Store cue outcome: improved, unchanged, worsened, not tested.

### 7.2 Constraint-Based Coaching

Definition: Modifying task, environment, equipment, or goal so the desired movement emerges.

Scientific rationale: Ecological and motor-learning frameworks support constraints as a way to shape perception-action coupling.

Coaching rationale: Constraints can reduce verbal overload.

Clinical rationale: Constraints can scale task difficulty and symptom irritability.

Evidence strength: B/C depending on task.

Inputs: Pattern, available equipment, environment, pain, skill level.

Decision logic: Prefer constraints when the athlete does not respond to a cue or when the issue is coordination.

Priority rules: Use low-risk constraints first.

Limitations: Constraints can produce compensations if poorly chosen.

Confidence handling: Retest target and secondary compensation metrics.

Pseudocode:

```ts
if (!respondedToCue(pattern)) intervention = selectConstraint(pattern, equipment, safety);
```

Browser feasibility: High for detecting response.

Implementation recommendations: Include alternatives for no-equipment, gym, and clinician settings.

### 7.3 Visual and Augmented Feedback

Definition: Feedback beyond intrinsic sensation, including overlay, replay, target lines, scores, or auditory signals.

Scientific rationale: Augmented feedback can improve motor learning, but frequency, timing, and modality affect dependency and transfer.

Coaching rationale: Visual feedback makes invisible timing and alignment more concrete.

Clinical rationale: Feedback should not create fear or overattention to small deviations.

Evidence strength: B.

Inputs: User preference, task, metric confidence, session goal, feedback history.

Decision logic: Use visual feedback for objective pattern awareness; fade feedback as skill improves.

Priority rules: Avoid continuous corrective noise; use bandwidth feedback for meaningful deviations.

Limitations: Real-time feedback can increase cognitive load.

Confidence handling: Only show metric overlays when measurement quality is adequate.

Pseudocode:

```ts
if (metric.confidence >= 0.75 && deviation > bandwidth) showFeedback();
else hideOrDowngradeFeedback();
```

Browser feasibility: High for overlays, replay, and simple targets.

Implementation recommendations: Support terminal feedback after sets and optional real-time cues for simple safe tasks.

### 7.4 Cue Dosing and Progression

Recommended session rules:

- Use one primary cue per set.
- Use at most two cue targets per session for novice or corrective contexts.
- Prefer external cues before internal body-part instructions.
- Use bandwidth feedback: only intervene when deviation exceeds meaningful range.
- Use terminal feedback after reps/sets for complex tasks.
- Progress from awareness -> assisted constraint -> independent execution -> load/speed/fatigue -> sport context.

Pseudocode:

```ts
sessionCueBudget = user.trainingAge === "novice" ? 1 : 2;
recommendations = rankedPatterns.slice(0, sessionCueBudget);
```

## 8. Intervention Mapping

The engine should recommend interventions as options with evidence labels, not prescriptions. Each recommendation must include target metric and reassessment interval.

| Finding | Plausible Contributors | Evidence-Supported Options | Expert-Heuristic Options | Retest |
|---|---|---|---|---|
| Early heel rise / shallow squat | Ankle dorsiflexion, limb proportions, load, motor strategy | Weight-bearing dorsiflexion mobility, squat pattern practice | Heel wedge, counterbalance squat, tempo goblet squat | Same squat, lunge test; 1-3 sessions |
| Dynamic knee valgus in landing | Hip control, ankle mobility, trunk control, fatigue, coordination | Neuromuscular training, landing technique, strengthening, plyometrics with feedback | Mini-band constraints, target landing lines | Drop landing, single-leg landing; 2-6 weeks |
| Excessive trunk lean in squat | Load strategy, ankle/hip mobility, trunk strength, task goal | Technique retraining, load modification, trunk/hip strengthening | Counterbalance, box squat, tempo pause | Same squat under same load |
| Pelvic drop in single-leg task | Hip abductor capacity, trunk control, balance | Strength and neuromuscular control work | Step-down target, wall-supported single-leg squat | Step-down/single-leg squat; 2-4 weeks |
| Poor landing stiffness / low absorption | Coordination, fear, fatigue, strength, ankle/knee/hip strategy | Neuromuscular landing programs | Quiet landing cue, depth regression | Landing contact, knee/hip flexion, stability |
| Fatigue-related drift | Capacity, conditioning, recovery, load mismatch | Conditioning and progressive exposure | Reduce volume, longer rest, technique-under-fatigue block | Early-vs-late rep trend |
| Asymmetrical depth/loading proxy | Prior injury, mobility, strength, coordination, pain | Unilateral strength/mobility when confirmed | Split squat regression, tempo unilateral work | Bilateral and unilateral retest |
| Pain-linked compensation | Pain, irritability, injury, fear | Clinical evaluation, symptom-guided loading | Range regression, isometrics where appropriate | Pain score and task quality |

## 9. Explainable AI Framework

Every recommendation should answer six questions:

1. What was observed?
2. Why might it matter?
3. What evidence supports this interpretation?
4. How confident is the conclusion?
5. What should the user do next?
6. How will success be measured?

Explanation object:

```ts
type Explanation = {
  observation: {
    measurement: string;
    value: number | string;
    comparison: "baseline" | "taskReference" | "sideToSide";
    quality: ConfidenceBand;
  };
  interpretation: {
    pattern: string;
    contributors: RootCauseHypothesis[];
    evidenceGrade: EvidenceGrade;
    uncertainty: string[];
  };
  recommendation: {
    cue?: Cue;
    intervention?: Intervention;
    loadModification?: string;
    reassessment: ReassessmentPlan;
  };
  safety: {
    disclaimer: string;
    referralTrigger?: string;
  };
};
```

Coach-facing wording:

"We observed your right knee moved inward more than your left during the landing phase. This can matter because it may reduce landing consistency and is one pattern coaches often target in deceleration training. The pattern was detected with moderate confidence from three trials. A likely next step is an external cue: 'land and push the floor apart.' Retest with the same drop landing and watch whether knee-inward motion and landing stability improve."

Clinician-facing wording:

"Observed: right FPPA increased relative to left during landing trials. Confidence: moderate; capture quality was adequate, but single-camera frontal-plane data cannot estimate joint loading or diagnose tissue pathology. Context: athlete reports no pain. Suggested action: consider further assessment of hip/trunk/ankle contributors if clinically relevant."

Athlete-facing wording:

"Your landing was a little less steady on the right side. Try landing quietly and spreading the floor apart. We will check whether the next set is steadier."

## 10. Confidence and Safety

### 10.1 Confidence Model

Confidence should combine four layers:

```text
Measurement confidence
  x Protocol confidence
  x Evidence confidence
  x Context confidence
  = Recommendation confidence
```

Confidence bands:

| Band | Score | Display Language |
|---|---:|---|
| High | 0.80-1.00 | "Strong signal" |
| Moderate | 0.60-0.79 | "Likely pattern" |
| Low | 0.40-0.59 | "Possible pattern" |
| Insufficient | <0.40 | "Not enough reliable data" |

Pseudocode:

```ts
recommendation.confidence = clamp(
  measurementConfidence *
  protocolConfidence *
  evidenceWeight *
  contextCompleteness,
  0,
  1
);
```

### 10.2 Safety Rules

The engine must:

- Avoid diagnosis.
- Avoid tissue-damage claims from kinematics.
- Avoid standalone injury-risk predictions.
- Avoid "always/never" form language.
- Ask about pain before high-demand tasks.
- Escalate when red flags appear.
- Preserve clinician override.
- Show confidence and limitations for each recommendation.
- Log rule path, source evidence, and data quality.

Referral or stop triggers:

| Trigger | Response |
|---|---|
| Severe pain, acute injury, neurological symptoms, swelling, instability | Stop and recommend medical evaluation |
| Post-operative status without clearance | Do not recommend unsupervised progression |
| Worsening pain during task | Regress or stop; advise clinician |
| Low data quality | Ask for recapture; do not infer |
| Minor discomfort with no red flags | Use symptom-guided low-irritability language |

Suggested non-diagnostic language:

- Use: "may be contributing," "is consistent with," "a pattern to investigate."
- Avoid: "you have," "this proves," "your ACL risk is," "your pain is caused by."

## 11. Personalization Framework

User-specific intelligence should change interpretation, not erase safety.

| Personalization Input | Effect on Engine |
|---|---|
| Sport | Adjust task relevance and cue vocabulary |
| Position | Prioritize sport-specific patterns |
| Age | Adjust normative assumptions and safety language |
| Training level | Adjust cue complexity and progression speed |
| Prior injury | Lower threshold for trend monitoring and referral language |
| Pain history | Require symptom prompts and cautious load progression |
| Goals | Reweight recommendation priority |
| Previous sessions | Prefer individual baseline over population norm |
| Equipment | Select feasible interventions |
| Coach/clinician role | Adjust explanation depth |

Personalization pseudocode:

```ts
const context = buildUserContext(profile, history, goals);
const baseline = getTaskBaseline(userId, taskId);
const ranked = rankRecommendations(patterns, {
  sportWeights: context.sport.demands,
  goalWeights: context.goals,
  injuryCaution: context.history.priorInjury ? 1.2 : 1.0,
  baseline
});
```

Limits:

- Do not use personalization to make unsupported medical claims.
- Do not compare youth athletes to adult norms without labeling uncertainty.
- Do not penalize body size, sex, disability, or sport-specific style unless evidence supports the task-specific interpretation.

## 12. UX and Reporting

### 12.1 Information Hierarchy

Athlete view:

1. Top action: one cue or drill.
2. Simple observation.
3. Confidence as plain language.
4. Retest target.

Coach view:

1. Ranked patterns.
2. Cue and intervention.
3. Evidence grade.
4. Trend and response.
5. Exportable plan.

Clinician view:

1. Objective measurements.
2. Measurement quality.
3. Symptom context.
4. Hypotheses and limitations.
5. Referral/progression flags.

Researcher view:

1. Raw and derived metrics.
2. Protocol metadata.
3. Model version.
4. Confidence components.
5. Export and reproducibility.

### 12.2 Progressive Disclosure

Default card:

```text
Pattern: Right knee moved inward on landing
Confidence: Moderate
Action: Land quietly and push the floor apart
Retest: 3 more landings
```

Expanded card:

```text
Observed metrics:
- Right FPPA exceeded left by 8 degrees
- Pattern appeared in 3/4 trials
- Capture quality was adequate

Interpretation:
- This is an observable frontal-plane pattern
- Possible contributors include hip/trunk control, ankle mobility, fatigue, or coordination
- This is not a diagnosis or injury prediction
```

### 12.3 Confidence Visualization

Recommended display:

- Use labels: High, Moderate, Low, Insufficient.
- Show why confidence is reduced: camera angle, occlusion, inconsistent reps, weak evidence, missing pain history.
- Avoid fake precision such as "83.2% sure."

## 13. TypeScript Decision Architecture

### 13.1 Module Boundaries

```text
src/
  capture/
    PoseAdapter.ts
    CaptureQuality.ts
    Calibration.ts
  metrics/
    MetricRegistry.ts
    AngleMetrics.ts
    TemporalMetrics.ts
    AsymmetryMetrics.ts
  phases/
    PhaseDetector.ts
    TaskProtocol.ts
  patterns/
    PatternRegistry.ts
    PatternDetector.ts
  reasoning/
    EvidenceGraph.ts
    RootCauseEngine.ts
    ConfidenceModel.ts
    PriorityRanker.ts
    SafetyGate.ts
  coaching/
    CueLibrary.ts
    InterventionMapper.ts
    ExplanationBuilder.ts
    ReassessmentPlanner.ts
  personalization/
    AthleteProfile.ts
    BaselineStore.ts
    ContextWeights.ts
  reporting/
    AthleteReport.ts
    CoachReport.ts
    ClinicianReport.ts
    ResearchExport.ts
  validation/
    RuleTrace.ts
    OutcomeTracker.ts
    TestFixtures.ts
```

### 13.2 Core Types

```ts
type EvidenceGrade = "A" | "B" | "C" | "D" | "Research";
type ConfidenceBand = "high" | "moderate" | "low" | "insufficient";

type Metric = {
  id: string;
  taskId: string;
  phase: string;
  value: number;
  unit: string;
  confidence: number;
  qualityNotes: string[];
  evidenceGrade?: EvidenceGrade;
};

type Pattern = {
  id: string;
  label: string;
  observations: Metric[];
  severity: number;
  confidence: number;
  limitations: string[];
};

type RootCauseHypothesis = {
  id: string;
  label: string;
  probability: number;
  confidence: number;
  evidenceGrade: EvidenceGrade;
  supportingObservations: string[];
  contradictingObservations: string[];
  confirmatoryTests: string[];
};

type Recommendation = {
  id: string;
  patternId: string;
  priorityScore: number;
  confidence: number;
  evidenceGrade: EvidenceGrade;
  cue?: Cue;
  interventions: Intervention[];
  reassessment: ReassessmentPlan;
  safetyNotes: string[];
  explanation: Explanation;
};
```

### 13.3 Rule Example

```ts
const dynamicKneeValgusRule: PatternRule = {
  id: "pattern.dynamic_knee_valgus.single_leg",
  taskIds: ["single_leg_squat", "single_leg_landing"],
  requiredMetrics: ["fppa", "pelvic_drop", "landmark_quality"],
  detect(ctx) {
    const fppa = ctx.metric("fppa");
    if (fppa.confidence < 0.65) return noPattern("insufficient FPPA confidence");

    const repeated = ctx.repeatedTrials((trial) => trial.metric("fppa").value > ctx.threshold("fppa"));
    if (!repeated) return noPattern("not repeated");

    return pattern({
      id: "dynamic_knee_valgus",
      severity: severityFromDeviation(fppa),
      confidence: combineConfidence(fppa.confidence, ctx.protocolConfidence, ctx.repeatability),
      limitations: [
        "2D frontal-plane metrics do not directly estimate knee joint loading.",
        "This pattern is not an injury diagnosis."
      ]
    });
  }
};
```

### 13.4 Root-Cause Rule Example

```ts
const ankleMobilityHypothesis: RootCauseRule = {
  id: "root.ankle_mobility",
  supports: ["early_heel_rise", "limited_tibial_progression", "shallow_squat"],
  contradicts: ["normal_lunge_test", "full_depth_no_heel_rise"],
  estimate(ctx) {
    const support = ctx.supportingEvidence(this.supports);
    const contradiction = ctx.contradictingEvidence(this.contradicts);
    const directTest = ctx.optionalMetric("weight_bearing_lunge");

    let probability = 0.35 + 0.12 * support.length - 0.18 * contradiction.length;
    if (directTest?.value < ctx.threshold("ankle_dorsiflexion")) probability += 0.25;

    return hypothesis({
      id: this.id,
      probability: clamp(probability, 0, 0.9),
      confidence: directTest ? 0.75 : 0.45,
      evidenceGrade: directTest ? "B" : "C",
      confirmatoryTests: ["weight-bearing lunge test"]
    });
  }
};
```

### 13.5 Priority Formula

```ts
function rankRecommendation(input: RankInput): number {
  if (input.safetyGate === "stop") return Number.POSITIVE_INFINITY;
  return (
    0.25 * input.patternSeverity +
    0.20 * input.recommendationConfidence +
    0.15 * evidenceToWeight(input.evidenceGrade) +
    0.15 * input.goalRelevance +
    0.10 * input.trainability +
    0.10 * input.retestability +
    0.05 * input.userPreferenceFit
  );
}
```

### 13.6 Knowledge Representation

Use a versioned evidence graph:

```text
Pattern -> Possible Contributor -> Confirmatory Test -> Intervention -> Cue -> Retest Metric
    |              |                     |                  |          |
Evidence       Evidence              Feasibility        Evidence   Outcome
```

Node example:

```json
{
  "id": "intervention.neuromuscular_landing_training",
  "type": "intervention",
  "targets": ["dynamic_knee_valgus", "landing_stiffness", "asymmetry"],
  "evidenceGrade": "A",
  "contraindications": ["acute_pain", "not_cleared_for_jump"],
  "reassessmentInterval": "2-6 weeks",
  "references": ["Hewett 2009", "Webster and Hewett 2018"]
}
```

## 14. Testing Strategy

Unit tests:

- Metric computations with known landmark fixtures.
- Confidence model boundary cases.
- Pattern rules for present/absent/insufficient states.
- Safety gates for pain, post-op, low quality, and red flags.
- Recommendation ranking determinism.

Golden fixtures:

- Good squat, shallow squat, early heel rise, valgus, asymmetric landing, fatigue drift, low-light capture, occlusion capture.

Property tests:

- Low measurement confidence can never produce high recommendation confidence.
- Diagnostic language never appears in generated user text.
- Safety stop recommendations outrank performance recommendations.

Integration tests:

- Full pipeline from video landmarks to report.
- Role-specific report rendering.
- Baseline comparison across sessions.

Human review tests:

- Coach review for actionability.
- PT/AT review for safety and scope.
- Biomechanist review for measurement claims.
- Athlete review for clarity and fear avoidance.

Validation methodology:

1. Technical validation against annotated video and, where possible, lab systems.
2. Reliability validation across devices, lighting, camera angles, and repeated sessions.
3. Construct validation against known movement tasks and expert ratings.
4. Recommendation validation using pre/post change in target metrics.
5. Human-factors validation for comprehension, trust calibration, and cognitive load.
6. Outcome validation only after enough longitudinal data exists; avoid injury prediction claims until prospectively validated.

Use DECIDE-AI-style reporting for live evaluation of AI decision support and TRIPOD+AI-style reporting if predictive models are introduced.

## 15. Browser Feasibility

Feasible in browser:

- Pose estimation with 2D and some 3D landmarks.
- Task phase segmentation for controlled drills.
- Joint-angle estimates with quality gating.
- Tempo, depth, range, asymmetry, variability, and fatigue drift.
- Visual overlays and terminal feedback.
- Rule-based recommendation generation.

Feasible but limited:

- Out-of-plane motion analysis.
- Pelvis/trunk rotation.
- Sport-specific cutting with unanticipated movement.
- Comparing users to normative data across uncontrolled devices.

Not appropriate from browser-only data:

- Diagnosis.
- Tissue-specific injury claims.
- Joint loading or moments without force/model assumptions.
- Return-to-play clearance.
- Definitive root-cause attribution.

Implementation recommendations:

- Use strict capture protocols with camera placement instructions.
- Require recapture when landmark quality is low.
- Store all measurement assumptions.
- Prefer within-user trend over cross-user ranking.
- Start with standardized movements: squat, single-leg squat, step-down, jump landing, hinge, lunge.

## 16. Future Roadmap

Phase 1: Explainable rule engine

- Capture quality gate.
- Metric registry.
- Pattern detector.
- Safety gate.
- Evidence graph.
- Athlete/coach/clinician reports.

Phase 2: Longitudinal intelligence

- Individual baselines.
- Cue response tracking.
- Intervention adherence.
- Trend-based confidence.
- Team dashboards.

Phase 3: Hybrid probabilistic reasoning

- Bayesian contributor scoring.
- Calibrated confidence using outcome data.
- Better personalization by sport and training age.

Phase 4: AI-assisted recommendation refinement

- LLM-assisted explanation drafting constrained by structured facts.
- ML ranking trained on expert-reviewed outcomes.
- Retrieval from evidence graph.
- Human-in-the-loop review for high-risk outputs.

Phase 5: Clinical/research validation

- External validation studies.
- Prospective implementation studies.
- Bias and subgroup performance audits.
- Regulatory review if claims enter medical-device territory.

## 17. Major Open Research Questions

- How accurately can single-camera browser pose estimate clinically meaningful lower-limb kinematics across body types, lighting, clothing, and devices?
- Which movement metrics best predict response to a specific cue or intervention?
- How should confidence be calibrated when evidence grade is high but capture quality is low?
- Which explanation formats improve user trust calibration without increasing fear?
- How can sport-specific movement variability be distinguished from maladaptive compensation?
- What is the smallest useful intervention dose for measurable movement change in remote coaching?
- How should models handle disability, adaptive movement strategies, and non-normative but functional movement?

## 18. Reference Sources

Key sources consulted for this specification:

- Chua LK et al. "Superiority of External Attentional Focus for Motor Performance and Learning." PubMed: https://pubmed.ncbi.nlm.nih.gov/34843301/
- Wulf G and Lewthwaite R. "Optimizing performance through intrinsic motivation and attention for learning." PubMed: https://pubmed.ncbi.nlm.nih.gov/26833314/
- Sigrist R et al. "The Role of Augmented Feedback on Motor Learning." PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8681883/
- "Benefits of Bandwidth Feedback in Learning a Complex Gymnastic Skill." PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC3796837/
- Moran J et al. "Meta-analysis of the effect of neuromuscular training on ACL injury prevention." PubMed: https://pubmed.ncbi.nlm.nih.gov/19760399/
- Sugimoto D et al. "Compliance with neuromuscular training and ACL injury." PubMed: https://pubmed.ncbi.nlm.nih.gov/23182020/
- Padua DA et al. movement screening / LESS reliability and validity literature. PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC7040940/
- Bahr R. "Why screening tests to predict injury do not work." Related screening evidence: https://pmc.ncbi.nlm.nih.gov/articles/PMC4832222/
- Bell DR et al. "Effect of limiting ankle-dorsiflexion range of motion on lower extremity mechanics." PubMed: https://pubmed.ncbi.nlm.nih.gov/22100617/
- Lima YL et al. "Association of ankle dorsiflexion and dynamic knee valgus." ScienceDirect summary: https://www.sciencedirect.com/science/article/abs/pii/S1466853X16301614
- Dix J et al. "Hip strength and dynamic knee valgus: systematic review." PubMed: https://pubmed.ncbi.nlm.nih.gov/29859898/
- Zazulak BT et al. "Deficits in neuromuscular control of the trunk predict knee injury risk." PubMed: https://pubmed.ncbi.nlm.nih.gov/17468378/
- Fatigue and landing biomechanics systematic review. PubMed: https://pubmed.ncbi.nlm.nih.gov/20710082/
- "Applications and limitations of markerless motion capture." PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8884063/
- MediaPipe Pose Landmarker documentation: https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker
- Google Research BlazePose overview: https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/
- FDA Clinical Decision Support Software Guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software
- NIST AI Risk Management Framework: https://www.nist.gov/itl/ai-risk-management-framework
- TRIPOD+AI reporting guideline. BMJ/PubMed: https://pubmed.ncbi.nlm.nih.gov/38626948/
- DECIDE-AI reporting guideline. Nature Medicine/PubMed: https://pubmed.ncbi.nlm.nih.gov/35584845/

