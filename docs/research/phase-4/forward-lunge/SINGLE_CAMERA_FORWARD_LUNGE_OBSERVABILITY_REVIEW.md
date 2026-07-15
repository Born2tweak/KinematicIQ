# Single-Camera Inline-Lunge Observability Review

> **Repository-status reconciliation (2026-07-15):** This report's original repository observations were correct for commit `8d8a77d`. The later Phase 3 implementation at `f49558e` supersedes its "no implementation exists" conclusion. Phase 3 provides an unavailable experimental research seam in `web/src/protocols/inlineLunge/index.ts` and `segmenter.ts`, with six ordered states and synthetic tests in `inlineLunge.test.ts` and `web/src/eval/inlineLungeEvaluation.test.ts`. Real-participant validity, synchronized criterion evidence, live/upload/session/results integration, coaching authority, and public availability do not exist. Squat remains the only available protocol. The research findings and validation requirements below remain applicable. `inlineLunge` references are preserved only as historical repository or source-native terminology; the approved identity is **Forward lunge with stride and return**.
**Decision date:** 2026-07-14
**Repository basis:** `master` at `8d8a77d`
**Scope:** research classification only; no data acquisition, implementation, public availability, or claims approval
**Working task identity:** forward lunge with stride and return; owner approval pending

## 1. Executive decision summary

KinematicIQ can defensibly investigate complete inline-lunge trial count, timestamp-based trial/phase timing, a projected lead-knee included angle at a labeled bottom frame, projected trunk orientation, declared lead side, foot visibility, and within-set variability from one near-sagittal consumer RGB recording. None is ready for public output. The evidence is task-, model-, view-, camera-, and population-specific; it does not validate MediaPipe Pose in KinematicIQ's browser pipeline for an inline lunge.

The narrowest promising kinematic observation is the lead-knee included angle in a near-sagittal view. A marker-based/manual-2D fencing-lunge study found strong sagittal knee agreement, but its 120 fps, controlled, marker-assisted method does not transfer directly to MediaPipe. A front-lunge OpenPose study demonstrates why transfer cannot be assumed: correlations and ICCs could look favorable while RMSE and limits of agreement remained large and camera-view dependent. Preliminary MediaPipe squat evidence also shows joint-specific systematic bias and wide limits of agreement.

At the original `8d8a77d` snapshot, the supplied prompt's implementation premise conflicted with repository authority. Phase 3 later supplied an unavailable experimental seam at `f49558e`; it is not a live or available product protocol. At that historical snapshot, `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md` made M73 research-only, `docs/research/INDEX.md` authorized neither acquisition nor implementation, `docs/implementation/NEXT_EXECUTION_PACKAGE.md` made M78 a future data-and-label gate, and no lunge protocol, runtime, metric, or quality gate existed under `web/src`. This review does not authorize production implementation or activation. Reversible research fixtures become appropriate only under their named roadmap gates.

Decision by class:

- **Research outputs:** raw trial duration and lead/rear-foot visibility diagnostics, because these can describe the recording without asserting biomechanical validity.
- **Experimental:** trial count, phase/event timing, declared-side verification, and projected trunk orientation.
- **Analyst-only:** projected lead-knee angle, image-space hip displacement/depth proxy, timing and angle variability, and rear-leg joint angles.
- **Unavailable:** frontal-plane knee motion from the side view and center of mass.
- **Forbidden:** ground-reaction force, joint moments, loading, muscle activation, and injury risk.

No numerical yaw, pitch, roll, height, distance, body-occupancy, visibility, frame-rate, or error tolerance is adopted here. The reviewed studies do not establish transferable KinematicIQ thresholds. Those values require predeclared pose-tape perturbation and synchronized reference experiments.

## 2. Repository measurement inventory

The inventory below is descriptive, not an implementation authorization.

| Existing repository surface | Current capability | Lunge-relevant limitation |
|---|---|---|
| `web/src/cv/poseEngine.ts` | MediaPipe Pose Landmarker emits normalized and world landmarks, timestamps, frame index, and a global pose-confidence average. | No lunge-specific validation; monocular world coordinates are not calibrated laboratory 3D. |
| `web/src/analysis/angles.ts` | 2D included angles for bilateral hip, knee, ankle and a projected trunk angle; per-angle confidence is minimum landmark visibility. | Functions are described as squat-relevant; no lead-side contract, camera-plane test, or lunge event window. Midpoint trunk uses both shoulders and hips, which is fragile in side view. |
| `web/src/analysis/posture/postureFrame.ts` | Experimental 3D posture samples from MediaPipe world landmarks with minimum-visibility abstention. | Requires bilateral shoulders, hips, knees, and ankles; self-occlusion in a side-view lunge can invalidate the sample. Its learned monocular depth must not be treated as reference 3D. |
| `web/src/analysis/metricCollector.ts` | Squat rep/set aggregates and timestamp-derived tempo. | Consumes squat `RepMetrics`; no inline-lunge segmentation or trial definition. |
| `web/src/cv/captureReadiness.ts` | Full-body visibility and approximate **front-squat** geometry/framing checks. | The front-view heuristic contradicts the proposed near-sagittal lunge view and must not be reused as lunge compliance evidence. Existing numerical bands are not lunge tolerances. |
| `web/src/core/confidence.ts` | Confidence basis vocabulary and multiplicative combination. | Scores are heuristic, not calibrated probabilities; no lunge validation prior exists. |
| `web/src/session/setQualityGate.ts` and `qualityReview.ts` | Squat set verdicts; invalid capture fully abstains and questionable capture suppresses coaching. | Squat plausibility and rep rules cannot be reused as lunge thresholds, but full-abstain semantics remain a binding product invariant. |
| `web/src/eval/poseTape.ts` | Raw frames, timestamps, fps, protocol metadata, truth labels, diagnostics, and additive provenance fields. | Truth currently supports rep count and bottom indices only; extending it requires a separately approved, additive schema change. |
| `web/src/eval/metrics.ts` | Count, bottom-frame, depth variability, jitter, and MAE helpers for current rep structures. | No event-level lunge truth, subject-held-out report, or angle-reference alignment. |
| `web/src/metrics/registry.ts` | Squat is the only populated metric protocol. | No lunge metric definitions or exclusions. |
| `web/src/protocols/registry.ts` | Squat, research-only sit-to-stand, and planned stubs; unavailable protocols cannot obtain a runtime profile. | No inline-lunge `ProtocolId` or registration. `rg -i lunge web/src` returns no production source match. |
| `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md` | Defines the research question, candidate outcomes, labels, negatives, and hard gates. | Explicitly says the production registry remains unchanged until all gates close. |

Existing reusable *concepts* are timestamps, raw pose tapes, metric-specific landmark visibility, quality diagnostics, null-on-abstention, validation tiers, and full report withholding. Existing squat thresholds, front-view capture checks, phases, metric definitions, and confidence cutoffs are not lunge evidence.

## 3. Research method

This was a decision-oriented review, not a systematic review or meta-analysis.

1. Repository authority was read before literature interpretation: roadmap, next execution package, research index/package, claims policy, deferred-scope ledger, architecture, and live measurement/eval code.
2. Primary peer-reviewed studies were prioritized when they compared a single RGB/manual-2D or pose-estimation method with marker-based 3D motion capture during a lunge or a comparable dynamic lower-limb task.
3. Evidence was downgraded for a different task, different model, multiple consumer cameras, manual markers, high laboratory frame rate, constrained population, non-sagittal view, or lack of subject-held-out evaluation.
4. Correlation/ICC was not treated as accuracy. Bias, RMSE/MAE, limits of agreement, event definition, filtering, and camera geometry were considered separately.
5. Missing numerical setup tolerances were converted into experiments rather than filled from convention.

Searches covered lunge, squat, gait, and landing validation for MediaPipe/BlazePose and OpenPose plus camera-view effects. The review does not claim literature completeness; it stops once every requested observation has a defensible status and abstention contract.

### How to read the reported statistics

- **MAE** averages absolute error magnitude; it hides error direction and may hide phase-specific failures.
- **RMSE** weights large errors more strongly than MAE; it does not identify systematic bias by itself.
- **Bias** is the mean signed method difference. A small bias can coexist with wide individual error because positive and negative errors cancel.
- **Bland-Altman limits of agreement** describe the expected spread of paired method differences under the studied setup. They do not prove interchangeability unless the limits were predeclared as acceptable for the product decision.
- **ICC** depends on the chosen form, population heterogeneity, and design. High ICC can coexist with systematic error and does not establish absolute accuracy.
- **SEM** estimates measurement noise in the metric's units under a reliability design.
- **MDC** is a reliability-derived threshold for change beyond measurement error at a stated confidence level. It is not a validity threshold, a meaningful coaching threshold, or transferable across populations/setups.

Accordingly, none of these statistics alone authorizes public output. KinematicIQ needs both agreement against a reference and repeatability under its intended capture conditions.

## 4. Validation evidence table

`NR` means not reported in the accessible primary-source record reviewed. “No split” means a method-comparison design applied to the study participants/trials rather than an independently trained and subject-held-out KinematicIQ-style evaluation.

| Study | Population / task | Pose method and version | Consumer camera setup | Reference | Filtering / alignment | Metrics reported | Split and applicability |
|---|---|---|---|---|---|---|---|
| Chida et al. (2024) | 22 male Japanese high-school/university fencers; 3 fencing lunges each; heel-off and heel-strike | Manual 2D digitization in Frame-DIAS 6; **not pose estimation** | Two Sony cameras, one 3 m behind and one 3 m to the side; 120 fps; height 80.5–88 cm based on greater trochanter; resolution NR | 8-camera Qualisys, 200 Hz, 50 markers | 3D: fourth-order Butterworth, residual-selected 8 Hz; visible heel event definitions; simultaneous collection | Knee `r=0.93–0.99`; ankle `r=0.82–0.84` with bias about `−4.33° to −21.31°`; rear-hip `r=0.31`, bias `−10.89°`; manual intra-rater ICC mean `0.985` | No split. Strongest task-specific evidence for sagittal knee measurement, but markers, manual digitization, 120 fps, trained fencers, fencing task, and averaged trials prevent direct MediaPipe/KinematicIQ transfer. |
| Baldinger, Reimer & Senner (2025) | 20 healthy adults recruited; 16 datasets analyzed; 6 alternating front lunges | OpenPose BODY_25; software version NR | Four synchronized 2021 iPad Pro cameras at oblique 45° intervals (front-left/right, back-left/right); 1194×834; mean 43±2.6 fps; tripod; fixed artificial light; distance/height NR | 12-camera Vicon, 200 Hz | OpenPose angles: third-order Savitzky-Golay, 15-frame window; first/last right-knee peaks synchronized; downsampled to lower rate | Knee ICC(2,1) good/excellent by view; hip moderate/excellent by view; knee RMSE `15.50°–29.44°`, hip `15.20°–25.25°`; knee bias `0.53°–6.33°`, hip `−2.31°–13.74°`; wide LoA and view-dependent peak deviations | No split. Direct lunge/HPE evidence and a strong warning: favorable ICC/bias did not prevent large RMSE/LoA. Oblique cameras do not validate a true side view or MediaPipe. |
| Ota et al. (2020) | 20 healthy young adults; bilateral squat | OpenPose; version NR in accessible record | Single standard RGB camera; view/distance/frame rate/resolution NR in accessible record | Vicon; camera count/rate NR in accessible record | Filtering/alignment NR in accessible record | Reported moderate/strong associations; later synthesis reports knee ICC about `0.80`, hip about `0.37`, and knee/hip bias roughly `5°–8°`; SEM/MDC not reported in accessible record | No split. Supports joint-specific rather than blanket validity; different task and unavailable setup details limit transfer. |
| Pereira et al. (2026), preliminary | 10 healthy active adults (5 women, 5 men); 3 squats to a maximum 90° depth | MediaPipe `0.10.26`, 2D pixel-coordinate pipeline | iPhone 8 and iPhone 11 simultaneously, one on each side, each 1.5 m lateral, hip height, sagittal alignment, full body; 30 Hz; resolution NR | 10-camera OptiTrack, 250 Hz | Markerless fourth-order Butterworth 5 Hz; marker-based 10 Hz; heel taps align start/end | Peak bias/95% LoA: right knee `−9.06° [−35.88,17.77]`, left knee `−4.63° [−24.83,15.58]`, right hip `−17.49° [−51.89,16.91]`, left hip `−13.42° [−47.21,20.37]`; no ICC/SEM/MDC reported | No split. Most model-relevant evidence, but small sample, squat rather than lunge, two phones used in collection, device auto-zoom differences, and wide LoA block public angle claims. |
| Asaeda et al. (2024) | 15 participants; 10 single-leg drop landings from 20 cm | MediaPipe Pose; version NR | Single RGB frontal recording; detailed distance/rate/resolution NR in accessible record | Vicon MX | Initial-contact normalization compared with absolute angle; further filtering/alignment NR | Absolute frontal knee-valgus error `18.83°–19.68°`; no significant validity for absolute value; change from initial contact had better reliability/concurrent validity; inter-rater ICC at least modest | No split. Different dynamic task but directly shows that an absolute frontal-plane MediaPipe angle can be biased and that normalization changes the construct; it does **not** support frontal knee motion from a side view. |
| Yamamoto et al. (2022) | 16 healthy young men; overground gait at varied speeds and foot-progression angles | OpenPose plus a foot IMU for the proposed ankle method; OpenPose-only hip/knee comparisons also reported | Single side RGB camera, 100 Hz; distance/resolution NR in reviewed lines | Optoelectronic 3D motion capture | Synchronized system; detailed filter in article; temporospatial events compared | OpenPose-only temporospatial maximum MAE: speed `0.02 m/s`, stride `0.06 m`, stance `0.01 s`, swing `0.02 s`; most peak hip/knee MAE `<5°`; ankle error exceeded `10°` with large foot progression; temporal-curve CCC `>0.70` | No split. Supports high-rate event observability and the danger of out-of-plane foot motion; gait and 100 Hz do not establish a minimum lunge frame rate or 30 fps equivalence. |

The literature reviewed does not provide a direct validation study of KinematicIQ's exact combination: browser MediaPipe Pose, one consumer phone, self-recorded near-sagittal inline lunge, the proposed events, KinematicIQ filters, and intended populations.

## 5. Camera geometry findings

### View and yaw

A near-sagittal view is required for projected lead-knee, trunk, hip-path, and rear-leg angle research. “Near” intentionally has no numeric tolerance here. Chida et al. support sagittal knee observations under a controlled setup; Baldinger et al. show large view-dependent lunge errors from oblique views; Yamamoto et al. show increasing error with out-of-plane foot progression. KinematicIQ must determine its own yaw tolerance by perturbation against labeled/reference data.

Frontal-plane knee motion cannot be recovered from this side-view contract. A second frontal protocol would be a different capture and validation question, not a low-confidence side-view output.

### Pitch, roll, and camera height

Pitch and height change perspective and the screen-plane relationship between joints. Chida et al. placed cameras near greater-trochanter height yet still identified camera position/height as unresolved for ankle angles as the athlete traveled. A phone roll directly rotates the image vertical, contaminating projected trunk orientation and any screen-axis displacement unless measured/corrected. No reviewed source establishes KinematicIQ tolerances, so compliance must be empirical and metric-specific.

### Distance, framing, lens, and body size

The task must remain fully framed from head through both feet throughout step-out and return. Chida used 3 m; the preliminary MediaPipe squat study used 1.5 m; neither distance transfers as a product rule. Distance, focal length/field of view, device auto-zoom, lens distortion, subject height, and movement travel interact. Normalized image coordinates remove pixel scale, not perspective or lens distortion. Existing front-squat occupancy bands cannot be relabeled as lunge evidence.

Pose tapes should retain actual frame dimensions, orientation, mirror state, effective fps, and—when the browser exposes them without new permissions—device/camera metadata needed to stratify experiments. Unknown intrinsics remain an explicit uncertainty.

### Mirroring and anatomical side

Mirroring is a display transform, not an anatomical-side transform. The stored raw landmark convention, declared anatomical lead side, display mirror state, and any export transform must be explicit and independently tested. A mirrored preview must not swap the declared left/right identity in analysis or labels.

Lead side should be declared before capture. The motion may verify consistency—declared-side foot advances and returns while the other remains the rear side—but must not silently overwrite the declaration. A disagreement, side switch, or alternating lunge invalidates the trial/set for this protocol.

### Temporal resolution

The reviewed lunge evidence used approximately 43 fps and 120 fps; the supporting gait study used 100 Hz; the preliminary MediaPipe squat study used 30 Hz. These establish study setups, not a universal minimum. Timestamp quantization and dropped/duplicate frames directly bound event timing. KinematicIQ must downsample synchronized labeled recordings across candidate effective rates and adopt the lowest rate only after count/event acceptance criteria pass. Nominal camera fps alone is insufficient; effective timestamp spacing and gap distribution are confidence inputs.

## 6. Landmark and occlusion findings

The expected side-view visibility hierarchy is metric-specific:

- **Lead knee angle:** declared lead hip, knee, and ankle must be visible at and around bottom. The near-side chain is the preferred research target.
- **Lead foot and events:** lead heel, ankle, and foot index are required. Heel-off/contact cannot be reduced to ankle visibility alone.
- **Rear foot visibility:** rear heel, ankle, and foot index are required across standing, step, bottom, and stable return.
- **Trunk orientation:** a side-plane definition should use a clearly specified shoulder/hip chain. The current bilateral midpoint implementation requires both shoulders and hips and is vulnerable when the far side is occluded.
- **Rear-leg angles:** rear hip/knee/ankle/heel/foot index are most vulnerable to lead-side occlusion near bottom; inferred high visibility from a pose model is not proof that the landmark is anatomically observed.
- **Lead-side identification:** declared side plus bilateral heel/foot-index/ankle trajectories across calibration, step, and return.

Self-occlusion can produce plausible but wrong landmarks rather than missing landmarks. Therefore, a visibility score alone cannot authorize a rear-leg or bilateral metric. Required checks include temporal continuity, left/right identity stability, bone-length stability in image space, no implausible jump, agreement across adjacent frames, and perturbation evidence. If the lead leg hides the rear chain during the metric window, the rear metric abstains; the model's inferred coordinate must not be presented as observed.

## 7. Required observability matrix

Evidence strength is for the exact KinematicIQ claim, not for pose estimation generally.

| Observation | Required view | Required landmarks | Evidence strength | Expected limitation | Confidence inputs | Failure / abstention rule | Phase 4 status |
|---|---|---|---|---|---|---|---|
| Trial count | Fixed near-sagittal; full step path and return visible | Bilateral hips; declared lead hip/knee/ankle/heel/foot index; rear ankle/heel/foot index | Low–moderate indirect | No KinematicIQ lunge labels; squat/gait transfer; partial/alternating/static split squats can mimic phases | Effective fps/gaps, declared-side consistency, full event chain, landmark continuity, protocol geometry, negative-class result | Do not count unless standing → step/descent → bottom → ascent → stable return is complete; exclude clip-edge, side-switch, dropout, crop, or ambiguous return | `experimental` |
| Total trial duration | Same as count | Event-support landmarks plus timestamps | Moderate for timestamp arithmetic; low for event boundary validity | Boundary error dominates arithmetic; dropped frames | Valid trial, monotonic timestamps, effective fps, start/end label confidence | Null unless both predeclared start and stable-return events are supported; never substitute clip duration | `research-output` |
| Descent, bottom, ascent, and return timing | Fixed near-sagittal | Lead hip/knee/ankle; bilateral hip trajectory; heel/foot landmarks for step/return | Low | Event definitions unvalidated; bottom can be flat/multi-frame; dynamic error and sampling matter | Per-event landmark quality, timestamp gaps, phase order, event persistence, rater agreement prior | Abstain per phase when order breaks, event window crosses a gap, multiple candidate events remain unresolved, or required chain is occluded | `experimental` |
| Bottom-frame lead-knee included angle | Fixed near-sagittal with declared lead side closest/clearly visible | Lead hip, knee, ankle | Moderate task-adjacent; low direct model/product | Manual fencing evidence does not validate MediaPipe; bias/LoA are model and view specific | Lead-side declaration, yaw compliance, three-landmark visibility/continuity, bottom-label confidence, perturbation stability, validation prior | Null if bottom is ambiguous, any landmark fails its window, side identity changes, view fails, or angle changes beyond predeclared perturbation tolerance | `analyst-only` |
| Projected trunk orientation | Fixed near-sagittal; image roll known/compliant | Defined lead shoulder and hip, or all bilateral shoulders/hips if midpoint definition retained | Low | Bilateral midpoint self-occlusion; roll/pitch contamination; not spinal posture | Required-landmark continuity, roll/yaw compliance, sample coverage, definition/version, rep stability | Null when far-side landmarks are inferred/unstable, image roll unknown/noncompliant, or sample coverage fails | `experimental` |
| Hip displacement or depth proxy | Fixed near-sagittal; unchanged camera/zoom | Explicit hip landmark or bilateral hip midpoint | Low | Image-space, scale/perspective/zoom dependent; not physical depth or COM | Camera stability, no zoom/orientation change, hip continuity, occupancy, start/bottom event confidence | Null on camera motion/zoom, crop, view failure, or hip dropout; label only “normalized image-space hip displacement” | `analyst-only` |
| Lead/rear foot visibility | Near-sagittal; both feet within frame for entire trial | Bilateral ankle, heel, foot index | Moderate as capture-quality observation | Pose visibility may remain high through inferred occlusion; floor contact is not guaranteed | Per-landmark visibility, crop margin, continuity, identity stability, image inspection label | Mark each foot/window unreadable if any required point is cropped, swapped, discontinuous, or occluded; this can invalidate dependent events without asserting contact | `research-output` |
| Lead-side identification | Near-sagittal | Bilateral hip, ankle, heel, foot index across calibration/step/return | Low–moderate for verification; declaration is authoritative | Mirroring and left/right swaps; alternating or cross-over trials | User declaration, raw/display mirror metadata, advancing-foot trajectory, identity continuity, return | Abstain entire set on declaration/trajectory conflict, side swap, alternating repetitions, or unknown mirror transform | `experimental` |
| Rep-to-rep timing variability | Same valid setup across at least the predeclared minimum complete trials | All timing-event landmarks and timestamps | Low | Event error can masquerade as human variability; no reliability/MDC | Count of valid trials, per-event confidence, effective fps, missingness, reliability prior | Null unless every included trial passes timing contracts and sample size/reliability gate; report dispersion, not “consistency quality” | `analyst-only` |
| Rep-to-rep projected-angle variability | Same fixed near-sagittal setup | Lead hip/knee/ankle at each valid bottom | Low | Tracking/view noise can dominate biological variation; no SEM/MDC | Valid angle count, angle confidence, camera stability, perturbation error, test-retest SEM/MDC when available | Null until repeat-session reliability quantifies error; never interpret a below-MDC change as athlete change | `analyst-only` |
| Frontal-plane knee motion from a side view | Side view cannot support it | Frontal-plane hip/knee/ankle geometry is not observable from this projection | None | Projection removes the required plane; monocular depth is not validated replacement | None can repair wrong view | Always withhold; require a separately validated frontal capture protocol | `unavailable` |
| Rear-leg joint angles | Fixed near-sagittal with rear chain genuinely visible | Per joint: rear shoulder/hip/knee/ankle/heel/foot index as applicable | Low | Lead-side occlusion and inferred far-side points; lunge evidence is method-specific | Full-window visibility, continuity, identity/bone-length stability, manual occlusion label, metric-specific validation | Null per joint if any defining landmark is occluded/unstable or perturbation/reference gate is absent; lead angle may survive independently | `analyst-only` |
| Center of mass | No single uncalibrated view is sufficient for product COM | Whole-body segment geometry plus anthropometry/calibration not present | None for this product setup | Landmark centroid is not COM; monocular scale/depth and segment masses unavailable | N/A | Never emit a COM value or trajectory; a named landmark/midpoint proxy must not be relabeled COM | `unavailable` |
| Ground-reaction force | Single RGB insufficient | Force plate or validated additional sensing absent | None | Kinetics cannot be observed from kinematics alone under product constraints | N/A | Never compute, infer, or imply | `forbidden` |
| Joint moments | Single RGB insufficient | External forces, segment inertial parameters, calibrated 3D kinematics absent | None | Inverse dynamics requirements are absent | N/A | Never compute, infer, or imply | `forbidden` |
| Loading | Single RGB insufficient for force/load claim | External-force and calibration evidence absent | None | Ambiguous term can smuggle in kinetics/joint stress | N/A | Forbid force, impact, joint/tissue load language; only describe visible timing/geometry | `forbidden` |
| Muscle activation | Single RGB insufficient | EMG or validated sensing absent | None | Kinematics do not identify activation | N/A | Never compute, infer, or imply | `forbidden` |
| Injury risk | No camera view makes this product claim permissible | Prospective outcome model and governed intended use absent | None; prohibited by doctrine | Association is not individual prediction; high-stakes clinical claim | N/A | Never score, predict, screen, or imply injury risk | `forbidden` |

## 8. Confidence and abstention requirements

Confidence must gate visibility; it must never upgrade the validation tier. A high MediaPipe landmark score is not a high probability that an angle is accurate.

Every experimental/analyst value requires a metric-specific contract containing:

1. **Protocol compliance:** declared side, non-alternating inline-lunge form, near-sagittal view, fixed camera, full travel/framing, mirror state known.
2. **Landmark evidence:** minimum visibility of every defining landmark, but also continuity, identity stability, plausible motion, and no occlusion label in the event window.
3. **Temporal evidence:** monotonic timestamps, effective frame rate, gap/dropout statistics, ordered and persistent events.
4. **Sample coverage:** enough usable frames around the event and enough complete trials for an aggregate.
5. **Internal agreement:** adjacent-frame stability and agreement among independent cues (for example, knee/hip descent plus foot displacement), without treating correlated cues as independent proof.
6. **Validation prior:** metric/model/view/population-specific reference and reliability status. Until direct validation exists, this contributor caps the result at experimental or analyst-only.
7. **Sensitivity:** the result remains within a predeclared acceptable change under in-range perturbations; otherwise it abstains even when landmarks are present.

Abstention is metric-specific unless the failed condition invalidates the protocol. A hidden rear knee may withhold only rear-leg angles; unknown mirror state, wrong view, incomplete return, camera motion, alternating sides, or invalid timestamps can invalidate the whole trial/set. Invalid capture produces diagnostics only and no movement conclusions. Questionable capture produces no coaching.

Missing values must be `null` with machine-readable reasons, never zero, last-value carry-forward, contralateral substitution, or model-filled “observations.”

## 9. Metric sensitivity experiments to run

These experiments are future inputs to M78 or a later owner-approved research milestone; this document does not authorize acquisition or code changes.

| Experiment | Controlled perturbation | Required truth / stratification | Decision output |
|---|---|---|---|
| View-yaw sweep | Rotate camera/athlete through predeclared increments around true sagittal | Synchronized reference angles/events; side and body-size strata | Per-metric yaw compliance/abstention boundary; do not average joints together |
| Pitch/height sweep | Vary phone pitch and height while holding yaw/distance | Reference angles plus camera geometry record | Determine whether knee/trunk/foot events tolerate the setup; ankle remains excluded unless separately supported |
| Roll sweep | Apply known roll and optional correction | Image transform truth | Roll-detection/correction error and trunk/angle abstention rule |
| Distance/occupancy/focal-length sweep | Vary distance, portrait/landscape, device lens/FOV, digital zoom | Frame dimensions, device/lens metadata where available, reference | Metric-specific framing bands; detect automatic zoom/camera motion |
| Crop sweep | Crop head, lead foot, rear foot, or travel margin independently | Exact synthetic crop mask plus event labels | Confirm dependent metrics abstain and unrelated metrics do not silently inherit confidence |
| Occlusion sweep | Natural/synthetic lead-over-rear overlap; loose clothing; arms crossing torso | Frame-level visibility/identity/occlusion labels | False-visible rate, left/right swap rate, rear-angle withholding rule |
| Mirror/side matrix | Raw mirrored/unmirrored inputs × preview mirror × declared left/right | Anatomical side truth | Zero silent side swaps; conflict produces protocol abstention |
| Frame-rate/gap sweep | Downsample and insert realistic irregular gaps | High-rate independent event labels | Lowest effective rate and maximum gap distribution meeting predeclared count/event criteria |
| Dynamic-vs-static comparison | Static held bottom versus continuous lunge at varied cadence | Synchronized reference curves and bottom interval labels | Quantify motion-dependent error; prevent static validity from standing in for dynamic validity |
| Filter/event interaction | Raw versus existing candidate filters, without retuning on test subjects | Subject-held-out event and angle truth | Event lag, peak attenuation, count error, and causal choice of filter |
| Body/device/environment strata | Height, limb proportions, clothing, skin/background contrast, lighting, phone classes | Subject/device-held-out splits | Failure-rate parity and explicit unsupported strata; no normative movement comparison |
| Repeatability | Same participants, standardized retest sessions and operators | Independent labels and synchronized reference subset | ICC form, SEM, MDC, bias/LoA with confidence intervals for each metric/setup |

Predeclare acceptance criteria, analysis code/version, exclusions, subject-held-out splits, and a frozen evaluation set before looking at final results. Report failure/dropout rates, not only error among successful frames.

## 10. Phase 4 engineering implications

Under current repository authority, the engineering implication is **no lunge production activation or threshold change**; the Phase 3 seam remains experimental and unavailable. The next action remains the M78 data-and-label gate and a named owner decision. This review supplies contracts that a later approved milestone can translate into code.

If that milestone is approved, it should:

- introduce a protocol-owned near-sagittal capture contract rather than reuse front-squat readiness;
- keep lead side explicit and preserve mirror metadata;
- extend pose-tape truth additively for lunge events, occlusion, exclusion, and declared side;
- preserve raw timestamps and report effective fps/gaps;
- make metric availability independent, with reason-coded `null` values;
- keep quality diagnostics visible while invalid reports fully abstain;
- build negative fixtures for squat, split squat, side lunge, partial step, no return, side switch, bystander, crop, and camera movement;
- validate offline/replay first, then live parity, before any user-facing route or registry availability;
- avoid importing squat phases, gates, front-view geometry, coaching thresholds, or apparent precision.

The current prompt/repository conflict should be resolved by revising the execution pack or obtaining explicit owner approval—not by treating this research document as an implementation milestone.

## 11. Activation evidence still required

Public activation remains a later, separate decision even after implementation is authorized. At minimum it requires:

- approved original timed data with recorded terms, checksums, provenance, and allowed use;
- a protocol-specific MediaPipe skeleton/coordinate/view contract;
- independent event, side, occlusion, exclusion, and bottom labels with inter-rater agreement;
- subject-held-out evaluation and a frozen negative-movement set;
- synchronized reference validity for every public angle/trajectory metric under the intended phone setup;
- repeat-session reliability with correctly specified ICC, SEM, MDC, and uncertainty intervals;
- bias and Bland-Altman limits compared against predeclared product tolerances;
- camera/device/body/environment perturbation boundaries and observed dropout rates;
- live/upload/replay parity, timing-gap behavior, regression protection for squat, and storage/export compatibility;
- claims/copy review and explicit human approval for implementation and, separately, availability.

Passing count accuracy does not activate angles. Passing angle validity does not activate coaching. Passing an internal benchmark does not establish external validation.

## 12. Explicitly forbidden claims

The following remain forbidden at every confidence level:

- diagnosis, pathology, dysfunction, impairment, or “correct/incorrect” clinical screening conclusions;
- injury risk, injury prediction, return-to-play, readiness, or safety claims;
- force, ground-reaction force, joint moment, torque, power, impact, joint stress, tissue load, or loading inference;
- muscle activation, weakness, mobility capacity, fatigue state, motor-control deficit, or anatomical cause attribution;
- center of mass disguised as a landmark centroid or hip midpoint;
- frontal-plane knee/valgus claims from the side-view protocol;
- segmental spinal claims from trunk landmarks;
- normative population comparisons or a composite movement-quality score;
- exact physical distance, velocity, or depth from uncalibrated normalized image coordinates;
- “validated” without naming the exact task, population, model/version, camera setup, metric definition, reference, and error bounds.

Allowed language remains observational and bounded: “projected,” “in this recording,” “from this view,” “experimental estimate,” or “the camera could not support this observation.”

## 13. Evidence gaps and confidence assessment

| Gap | Why it matters | Current confidence / resolution |
|---|---|---|
| No direct KinematicIQ/MediaPipe inline-lunge validation | Model, task, filter, browser, and event transfer are unknown | **Low**; M78 plus synchronized reference study |
| No approved timed inline-lunge corpus or labels | Count/event claims cannot be tested subject-held-out | **Low**; approval, provenance, dual-rater labels |
| No product camera tolerances | Wrong-view metrics may look plausible | **Low**; pose-tape geometry perturbations |
| Dynamic versus static angle error unresolved | Bottom holds may understate motion/peak error | **Low**; high-rate dynamic reference curves |
| Rear-leg self-occlusion failure rate unknown | Visibility may describe inference, not observation | **Low**; frame-level occlusion/identity labels |
| Frame-rate and gap tolerance unknown | Event timing/count may be device-dependent | **Low**; downsampling and irregular-gap study |
| Mirroring/side behavior not specified for lunge | Silent side inversion corrupts every side metric | **Medium** conceptual contract, **low** empirical evidence; side/mirror matrix |
| Reliability/SEM/MDC absent | Within-person change cannot be separated from noise | **Low**; repeated-session study |
| Hip, ankle, trunk, and COM validity absent | Joint-specific biases prohibit blanket kinematics claims | **Low**; separate validation or continued withholding |
| Population/device/environment coverage absent | Controlled healthy samples do not establish field robustness | **Low**; stratified subject/device-held-out field study |

Overall confidence is **medium** that a near-sagittal lead-knee/event research track is worth testing, based on consistent task-adjacent primary evidence and strong repository guardrails. Confidence is **low** that any candidate movement metric is ready for public KinematicIQ output. Confidence is **high**—because it follows directly from observability requirements and canonical doctrine—that kinetics, muscle activation, injury risk, and side-view frontal-plane claims must remain unavailable/forbidden.

## 14. References

1. Chida K, Inami T, Yamaguchi S, Nishioka T, Yoshida Y, Kohtake N. Assessing the validity of two-dimensional video analysis for measuring lower limb joint angles during fencing lunge. *Frontiers in Sports and Active Living*. 2024;6:1335272. [https://doi.org/10.3389/fspor.2024.1335272](https://doi.org/10.3389/fspor.2024.1335272)
2. Baldinger M, Reimer LM, Senner V. Influence of the camera viewing angle on OpenPose validity in motion analysis. *Sensors*. 2025;25(3):799. [https://doi.org/10.3390/s25030799](https://doi.org/10.3390/s25030799)
3. Ota M, Tateuchi H, Hashiguchi T, Kato T, Ogino Y, Yamagata M, Ichihashi N. Verification of reliability and validity of motion analysis systems during bilateral squat using human pose tracking algorithm. *Gait & Posture*. 2020;80:62–67. [https://doi.org/10.1016/j.gaitpost.2020.05.027](https://doi.org/10.1016/j.gaitpost.2020.05.027)
4. Pereira DR, Catelli DS, Santiago PRP, Bedo BLS. Markerless pixel-based pipeline for quantifying 2D lower limb kinematics during squatting: a preliminary validation study. *Biomechanics*. 2026;6(1):1. [https://doi.org/10.3390/biomechanics6010001](https://doi.org/10.3390/biomechanics6010001)
5. Asaeda M, Onishi T, Ito H, Miyahara S, Mikami Y. Reliability and validity of knee valgus angle calculation at single-leg drop landing by posture estimation using machine learning. *Heliyon*. 2024;10(17):e36338. [https://doi.org/10.1016/j.heliyon.2024.e36338](https://doi.org/10.1016/j.heliyon.2024.e36338)
6. Yamamoto M, Shimatani K, Ishige Y, et al. Verification of gait analysis method fusing camera-based pose estimation and an IMU sensor in various gait conditions. *Scientific Reports*. 2022;12:17719. [https://doi.org/10.1038/s41598-022-22246-5](https://doi.org/10.1038/s41598-022-22246-5)
7. Altman DG, Bland JM. Assessing agreement between methods of measurement. *Clinical Chemistry*. 2017;63(10):1653–1654. [https://doi.org/10.1373/clinchem.2016.268870](https://doi.org/10.1373/clinchem.2016.268870)
8. Koo TK, Li MY. A guideline of selecting and reporting intraclass correlation coefficients for reliability research. *Journal of Chiropractic Medicine*. 2016;15(2):155–163. [https://doi.org/10.1016/j.jcm.2016.02.012](https://doi.org/10.1016/j.jcm.2016.02.012)
9. Bazarevsky V, Grishchenko I, Raveendran K, Zhu T, Zhang F, Grundmann M. BlazePose: on-device real-time body pose tracking. arXiv:2006.10204. [https://doi.org/10.48550/arXiv.2006.10204](https://doi.org/10.48550/arXiv.2006.10204)

Repository authority consulted: `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`, `docs/implementation/NEXT_EXECUTION_PACKAGE.md`, `docs/research/INDEX.md`, `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md`, `docs/doctrine/claims-policy.md`, and `docs/doctrine/deferred-scope.md` at the repository basis named above.
