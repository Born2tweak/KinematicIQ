# Direct MediaPipe Forward-Lunge Validity Review

> **Repository-status reconciliation (2026-07-15):** This report's original repository observations were correct for commit `8d8a77d`. The later Phase 3 implementation at `f49558e` supersedes its "no implementation exists" conclusion. Phase 3 provides an unavailable experimental research seam in `web/src/protocols/inlineLunge/index.ts` and `segmenter.ts`, with six ordered states and synthetic tests in `inlineLunge.test.ts` and `web/src/eval/inlineLungeEvaluation.test.ts`. Real-participant validity, synchronized criterion evidence, live/upload/session/results integration, coaching authority, and public availability do not exist. Squat remains the only available protocol. The research findings and validation requirements below remain applicable. `inlineLunge` references are preserved only as historical repository or source-native terminology; the approved identity is **Forward lunge with stride and return**.
**Decision question:** Does direct evidence exist validating MediaPipe Pose or BlazePose for a dynamic forward/anterior lunge recorded by a single consumer RGB camera?

**Search date:** 14 July 2026  
**Review type:** Bounded, targeted literature search; not a repeat of the broad observability review.

## Decision

**Conclusion: no direct evidence found.**

No located study simultaneously met all four defining conditions:

1. MediaPipe Pose or BlazePose;
2. a dynamic forward/anterior lunge;
3. one consumer RGB camera used to derive the tested output; and
4. validation against synchronized Vicon, Qualisys, OptiTrack, or an equivalent criterion system for joint kinematics or event timing.

This is an absence-of-evidence finding from a bounded search, not proof that no such study exists anywhere. It means KinematicIQ should not claim that its MediaPipe forward-lunge angles, peaks, waveforms, or events are criterion-valid on the basis of the located literature.

The closest lunge-specific paper is an OpenPose study with synchronized Vicon. The closest MediaPipe/BlazePose criterion studies concern running gait and single-leg drop landing. A forward/backward-lunge dissertation used an eight-camera commercial markerless system, not MediaPipe and not a monocular consumer-camera pipeline. These studies are **secondary transfer evidence only**.

## Direct-evidence screen

| Candidate | MediaPipe / BlazePose | Dynamic forward lunge | One consumer RGB view is the tested system | Synchronized criterion reference | Classification |
|---|---:|---:|---:|---:|---|
| Baldinger et al., 2025 | No—OpenPose BODY_25 | Yes | Each inference is monocular, but four iPads were collected | Yes—Vicon | Secondary: movement-specific, wrong pose model |
| Nienhuis, 2024 | No—commercial eight-camera 3D markerless system | Yes | No | Yes—marker-based optical system | Secondary: movement-specific, wrong system and camera architecture |
| Young et al., 2023 | Yes—BlazePose | No—treadmill running | Yes—left sagittal iPhone stream used for the proposed pipeline | Yes—Vicon | Secondary: model/camera/reference match, wrong movement |
| Asaeda et al., 2024 | Yes—MediaPipe Pose | No—single-leg drop landing | Yes—frontal high-speed RGB camera | Yes—Vicon MX | Secondary: model/reference match, wrong movement and plane |
| Akturk et al., 2026 | Yes—MediaPipe | No—sit-to-stand | Yes—sagittal Redmi smartphone | Limited—2D Kinovea/physical markers, not a 3D criterion comparison for angles | Secondary: setup similarity, weak criterion and wrong movement |

## Search strategy

### Sources searched

- PubMed and PubMed Central records surfaced through targeted web search;
- publisher full-text pages (MDPI, Elsevier/ScienceDirect, Springer Nature, JMIR Preprints);
- university repositories and dissertations;
- DOI- and title-based web searching for citation chasing; and
- recent systematic reviews used to identify candidate primary studies, followed by inspection of the primary study whenever accessible.

### Query concepts

Queries combined the following terms and close variants:

- `MediaPipe Pose`, `MediaPipe`, `BlazePose`, `GHUM`;
- `forward lunge`, `anterior lunge`, `front lunge`, `lunge`, `in-line lunge`;
- `validation`, `validity`, `accuracy`, `reliability`, `agreement`;
- `Vicon`, `Qualisys`, `OptiTrack`, `motion capture`, `gold standard`;
- `single camera`, `monocular`, `RGB`, `smartphone`, `sagittal`;
- `knee angle`, `hip angle`, `ankle angle`, `waveform`, `peak`, `event timing`, `dropout`; and
- adjacent searches for `OpenPose lunge`, `MediaPipe squat`, `MediaPipe gait`, `MediaPipe landing`, `sit-to-stand`, and manual 2D validation.

Representative exact searches included:

- `MediaPipe Pose BlazePose forward lunge validation Vicon knee angle`
- `"MediaPipe" "forward lunge" biomechanics validation`
- `"BlazePose" lunge validation motion capture`
- `single camera markerless pose estimation forward lunge Vicon validation`
- `OpenPose forward lunge validation knee angle Vicon`
- `MediaPipe BlazePose validation functional exercises lunge squat deadlift Vicon`

### Eligibility and classification

A study was direct only if the tested pose system, movement, capture architecture, and reference comparison all matched the decision question. Studies with another movement, another pose estimator, manual 2D reference only, depth cameras, or multi-camera markerless reconstruction were retained only when they supplied useful protocol or failure-mode information. Conference abstracts, preprints, and dissertations were permitted in the search because the direct evidence base was expected to be sparse, but their publication status is stated.

### Search limits

- This was a targeted search, not a registered systematic review.
- No citation-index subscription search or author contact was performed.
- Some tables available only as publisher-rendered images could not be machine-extracted; unverified values were not transcribed.
- “NR” below means not reported in the accessible primary text, not zero.

## Included secondary evidence

### 1. Baldinger, Reimer, and Senner (2025): OpenPose during front lunges

**Citation and status:** Baldinger M, Reimer LM, Senner V. *Influence of the Camera Viewing Angle on OpenPose Validity in Motion Analysis*. Sensors. 2025;25(3):799. Peer reviewed, open access. [Primary article](https://www.mdpi.com/1424-8220/25/3/799) · [DOI](https://doi.org/10.3390/s25030799)

**Why it is secondary:** It is the closest movement-specific criterion study, but it evaluates OpenPose BODY_25, not MediaPipe Pose or BlazePose. Its four oblique views are also not the requested near-sagittal view.

| Extraction item | Finding |
|---|---|
| Population | Healthy adults without orthopedic disease or injury; 8 women, 12 men; age 25.1 ± 5.0 years; BMI 23.11 ± 2.52. |
| Sample size | Enrolled 20; analyzed 16. Four participants (20%) were excluded: three for marker-visibility failures and one for missing iPad recording. |
| Movement | Alternating dynamic front lunges: step forward, descend until anterior knee approximately 90° and posterior knee just above floor, then push back to start. |
| Repetitions | 6 per participant. |
| Pose system and version | OpenPose, 25-keypoint model (BODY_25); software version NR. |
| Camera/device | Four 2021 iPad Pro 11-inch devices; 12 MP wide lens, f/1.8; 1194 × 834 pixels. |
| View, distance, height, frame rate | Front-left, front-right, back-left, and back-right at 45° intervals around movement direction; tripod height and distance NR; mean 43 ± 2.6 fps. These are oblique frontal/sagittal views, not a true sagittal validation. |
| Reference system | 12-camera Vicon; Full Body Plug-in Gait; 200 Hz; Nexus 2.10.3. |
| Synchronization | iPads hardware/software synchronized to one master iPad. Pose and Vicon series were subsequently aligned using the first and last right-knee peaks across six lunges and downsampled to the lower rate. The article does not describe a shared trigger between Vicon and RGB. |
| Filtering | OpenPose angles: third-order Savitzky–Golay, window 15. Vicon gaps manually filled with spline, pattern, or rigid-body fill. Other Vicon filtering NR. |
| Angle definition | 2D included angle from OpenPose keypoints for bilateral knee, hip, elbow, and shoulder flexion/extension; compared with the corresponding Vicon plane. Peak analysis was sampled at peak knee flexion. |
| MAE/RMSE | Waveform RMSE: knee 15.50°–29.44°; hip 15.20°–25.25°; elbow/shoulder 23.63°–37.10° across views. MAE NR. At peak knee flexion, mean absolute deviation averaged by view was 23.8° for front-left and 14.1°–14.9° for the other views. |
| Bias and limits of agreement | Biases across joints/views ranged from −0.35° to −26.07°. For knee, front-left LoA were approximately −51° to 62°; other views were within approximately −27° to 38°. This shows that high ICC did not imply small absolute error. |
| ICC | Knee ICC(2,1): front-right 0.95, front-left 0.86, back-left 0.95, back-right 0.96. Hip ICC(2,1): 0.88, 0.74, 0.94, 0.94, respectively. Elbow: 0.75, 0.80, 0.83, 0.84. Shoulder: 0.28, 0.72, 0.59, 0.55. |
| SEM/MDC | NR. |
| Event timing error | Not evaluated. Peaks were used for alignment and discrete-angle extraction, not validated as detected events. |
| Dropout/failure rate | Participant-level technical exclusion 4/20 (20%). The three marker-visibility failures were reference-system failures; the fourth was an RGB recording failure. OpenPose landmark dropout was not quantified. |
| Dynamic versus static | Dynamic waveform and peak comparisons were performed; a static T-pose was used only for Vicon calibration. |
| Limitations | Wrong pose family for the decision question; oblique rather than sagittal views; lab lighting; young healthy sample; peak and waveform errors were large; some synchronization was post hoc; failures were excluded; no hip/knee/ankle event-timing or dropout analysis. |
| Transferability to KinematicIQ | High for lunge protocol and camera-angle risk, low for algorithm-specific validity. It supports testing waveform and peak error separately, reporting failures, and treating small view deviations as a major source of error. It cannot validate MediaPipe. |

### 2. Nienhuis (2024): multi-camera commercial markerless forward/backward lunges

**Citation and status:** Nienhuis M. *Concurrent Validation of an Artificial Intelligence-Based Motion Capture System Using a Common Functional Movement Screen Exercise*. University of Miami doctoral dissertation, defended 27 March 2024. [Repository record and full text](https://scholarship.miami.edu/esploro/outputs/doctoral/Concurrent-Validation-of-an-Artificial-Intelligence-Based/991032024720002976)

**Why it is secondary:** It validates dynamic forward and backward lunges, but the tested system is a commercially available **eight-camera 3D markerless system**, not MediaPipe/BlazePose and not a single consumer camera.

| Extraction item | Finding |
|---|---|
| Population | Healthy young adults; detailed demographics were not available in the repository abstract inspected for this bounded review. |
| Sample size | NR in the accessible repository abstract. |
| Movement | Dynamic forward and backward lunges. |
| Repetitions | NR in accessible text. |
| Pose system and version | Commercial eight-camera 3D markerless motion-capture system; product/version not verified from accessible text. |
| Camera/device | Eight-camera markerless array. Models, resolution, and frame rate NR in accessible text. |
| View, distance, height, frame rate | Multi-view laboratory capture; geometry NR in accessible text. Not monocular. |
| Reference system | Gold-standard marker-based optical motion-capture system; make/model NR in accessible text. |
| Synchronization | Concurrent collection is stated; mechanism NR in accessible text. |
| Filtering | NR. |
| Angle definition | Hip and knee joint angles; maximal knee angle and total hip range of motion are described. Exact coordinate definitions NR. |
| MAE/RMSE | NR in accessible text. |
| Bias and limits of agreement | NR in accessible text. |
| ICC | Agreement described as moderate to excellent, with forward lunge better than backward lunge; exact coefficients NR in accessible text. |
| SEM/MDC | NR. |
| Event timing error | Not reported as a validation endpoint in the accessible text. |
| Dropout/failure rate | NR. |
| Dynamic versus static | Dynamic. |
| Limitations | Dissertation rather than peer-reviewed article; healthy young adults; commercial opaque model; eight-camera reconstruction; no transfer to monocular 2D/BlazePose can be assumed. |
| Transferability to KinematicIQ | Useful for selecting lunge conditions and confirming that direction can change agreement. It provides no support for a single-camera MediaPipe claim. |

### 3. Young et al. (2023): single-smartphone BlazePose running versus Vicon

**Citation and status:** Young F, Mason R, Morris R, Stuart S, Godfrey A. *Internet-of-Things-Enabled Markerless Running Gait Assessment from a Single Smartphone Camera*. Sensors. 2023;23(2):696. Peer reviewed, open access. [Primary article](https://www.mdpi.com/1424-8220/23/2/696) · [DOI](https://doi.org/10.3390/s23020696)

**Why it is secondary:** The pose family, consumer camera, sagittal view, Vicon reference, waveforms, and temporal outcomes are highly relevant, but the movement is treadmill running, not a lunge.

| Extraction item | Finding |
|---|---|
| Population | 31 healthy experienced runners; 20 men, 11 women; age 34.5 ± 9.7 years; no gait-affecting injury/condition. |
| Sample size | 31 participants; 148 one-minute bouts; 9,327 strides. |
| Movement | Treadmill running at 8–14 km/h. |
| Repetitions | Up to five 1-minute runs per participant. |
| Pose system and version | Google BlazePose, Python/Django implementation using 2D x-y landmarks; exact model complexity and MediaPipe package version NR. |
| Camera/device | iPhone 13. Two phones collected side and rear streams, but the proposed app analyzed uploaded left-side video as a single-camera pipeline. |
| View, distance, height, frame rate | Left sagittal and rear cameras about 6 ft (1.83 m) from treadmill; height NR. Methods state 240 fps, whereas a later limitations discussion refers to 60 fps. This internal inconsistency should be resolved before reusing the protocol. |
| Reference system | 14-camera Vicon Vertex at 200 Hz; 16 reflective lower-limb/pelvis markers; Vicon gait suite. |
| Synchronization | Simultaneous laboratory capture is implied, but a hardware trigger or explicit alignment method is not described in the accessible methods. |
| Filtering | Five-sample moving average, selected by visual inspection. |
| Angle definition | Knee angle: included angle hip-knee-ankle. IC and final contact: peaks in leg-extension angle above a dynamic 90th-percentile threshold, distinguished by preceding minima. Contact, swing, and step times derived from those events. Foot angle used toe, heel, and a vertical point; strike class used ±5° from a static baseline. |
| MAE/RMSE | Temporal mean error: left 0.011–0.014 s; right 0.014–0.033 s. Cadence mean error 1.2 steps. Angle MAE/RMSE NR in text. |
| Bias and limits of agreement | Bland–Altman plots were supplied, but numerical LoA were NR in text. Right swing and step time tended to be overestimated. Knee flexion was overestimated near maximum extension; foot angle was underestimated. |
| ICC | Contact time 0.862 left/0.861 right; swing time 0.837/0.821. Knee waveform/aggregate angle 0.961/0.979. Cadence 0.981. Foot angle 0.981/0.844. Temporal outcomes overall ≥0.751. |
| SEM/MDC | NR. |
| Event timing error | Reported as derived temporal-parameter mean error, not frame-level IC/FC signed latency. |
| Dropout/failure rate | No participant/data dropout: 0/31. Landmark-level low-confidence or failed frames were not quantified. Occlusion degraded the far (right) limb. |
| Dynamic versus static | Dynamic running; a short static stance established baseline foot angle. |
| Limitations | Wrong movement; treadmill/laboratory conditions; fixed left view favors near limb; far-limb occlusion; no package/model version; unclear synchronization; frame-rate inconsistency; moving average selected manually. |
| Transferability to KinematicIQ | Strong evidence that a single sagittal consumer view can support some BlazePose temporal and sagittal-angle metrics in a different cyclic task. It directly motivates side-specific occlusion analysis, signed event error, a fixed version, and separate waveform/peak reporting. It does not validate lunge metrics. |

### 4. Asaeda et al. (2024): MediaPipe single-leg drop landing versus Vicon

**Citation and status:** Asaeda M, Onishi T, Ito H, Miyahara S, Mikami Y. *Reliability and validity of knee valgus angle calculation at single-leg drop landing by posture estimation using machine learning*. Heliyon. 2024;10(17):e36338. Peer reviewed, open access. [Primary article](https://www.sciencedirect.com/science/article/pii/S2405844024123699) · [DOI](https://doi.org/10.1016/j.heliyon.2024.e36338)

**Why it is secondary:** It directly tests MediaPipe against Vicon during a rapid unilateral task, but the task is a single-leg drop landing and the output is frontal-plane knee valgus, not sagittal lunge flexion.

| Extraction item | Finding |
|---|---|
| Population | Male college students; exact age and anthropometrics NR in the accessible extraction. Women and adolescents were excluded. |
| Sample size | 15 participants. |
| Movement | Single-leg jump landing from 20 cm. A retest was performed at least 3 days later. |
| Repetitions | 10 landings. |
| Pose system and version | MediaPipe Pose; package/model version NR. The analysis used 2D x-y coordinates and excluded depth. |
| Camera/device | High-speed RGB camera; model NR in accessible text. |
| View, distance, height, frame rate | Frontal plane; distance/height NR; 100 Hz. |
| Reference system | Vicon MX 3D motion analysis; reference joint centers projected to x-y for comparison. |
| Synchronization | Simultaneous capture is implied; exact trigger/alignment mechanism NR. Initial contact defined the time origin, with values assessed through 100 ms after IC. |
| Filtering | NR in accessible text. |
| Angle definition | Frontal 2D knee-valgus angle from estimated hip, knee, and ankle joint centers. Two metrics: absolute angle and excursion from the participant's angle at IC. |
| MAE/RMSE | Not reported as MAE/RMSE. Absolute between-system error was 18.83°–19.68° across IC to 100 ms. |
| Bias and limits of agreement | Bland–Altman analysis found error exceeding the prespecified 5° criterion during the first 100 ms. A [2026 systematic review](https://www.mdpi.com/1424-8220/26/12/3956) reports an absolute-angle bias of −19.28° and wide LoA, but because the review's printed bias/LoA values appear internally inconsistent, they are not adopted here as verified primary values. |
| ICC | MediaPipe intrarater ICC(3,10) for absolute angle 0.69–0.89 across IC–100 ms; excursion 0.14–0.70. Between-system ICC for absolute angle 0.02–0.69; excursion 0.50–0.83 from 10–100 ms. |
| SEM/MDC | NR. |
| Event timing error | Not validated; IC was used as the normalization landmark. |
| Dropout/failure rate | NR. |
| Dynamic versus static | Dynamic landing. Normalization to the dynamic IC posture greatly improved agreement relative to absolute angles. |
| Limitations | Wrong task/plane; small male-only sample; 2D projection cannot represent tibial rotation; 100-Hz video still noted as a possible error source; absolute angle showed a roughly 19° fixed error; no failure-rate analysis; no clinical validity. |
| Transferability to KinematicIQ | Strong warning against assuming that correlation or normalized change validates absolute joint angle. KinematicIQ should predefine whether it reports absolute flexion, change from start/IC, or ROM and validate each separately. |

### 5. Akturk, Derdiyok, and Serbest (2026): single-camera MediaPipe sit-to-stand

**Citation and status:** Akturk S, Derdiyok FB, Serbest K. *Markerless joint angle estimation using MediaPipe with a rapid setup for joint moment calculation*. Multimedia Tools and Applications. 2026. Peer reviewed. [Primary article](https://link.springer.com/article/10.1007/s11042-026-21256-z) · [DOI](https://doi.org/10.1007/s11042-026-21256-z)

**Why it is secondary:** It resembles KinematicIQ's consumer-camera setup but evaluates slow sit-to-stand and compares MediaPipe mainly with marker-assisted 2D Kinovea, not synchronized 3D criterion angles.

| Extraction item | Finding |
|---|---|
| Population | 15 healthy volunteers (12 men, 3 women), age 18–42 years, mean 27.66 ± 10.53. |
| Sample size | 15. |
| Movement | Sit-to-stand and return-to-sit from a 60-cm chair, feet fixed, arms crossed. |
| Repetitions | NR. |
| Pose system and version | MediaPipe Pose via Python/OpenCV; version/model complexity NR. |
| Camera/device | Redmi Note 9 Pro smartphone; captured 1080p MP4 and analyzed resized 720p video. |
| View, distance, height, frame rate | Right sagittal; 4 m distance; 0.75 m height; 30 fps. |
| Reference system | Physical-marker 2D Kinovea 0.9.5 for angles. A MATLAB multibody model reused MediaPipe-derived angles; it is not an independent kinematic criterion. |
| Synchronization | Same annotated video appears to have been used by MediaPipe and Kinovea; explicit synchronization procedure NR. |
| Filtering | No trajectory filter reported. Authors note occasional erroneous transitions at 30 fps. |
| Angle definition | 2D included angles for ankle, knee, and hip from three landmarks; exact sign conventions NR. |
| MAE/RMSE | Angle MAE/RMSE NR. Joint-moment RMSE/MAE were calculated but do not answer angle validity and are therefore not used here. |
| Bias and limits of agreement | NR. |
| ICC | NR. Correlations reported for joint moments, not criterion joint-angle agreement: hip 0.94, knee 0.95, ankle 0.11. |
| SEM/MDC | NR. |
| Event timing error | NR. |
| Dropout/failure rate | NR. |
| Dynamic versus static | Slow controlled dynamic task; no static validity experiment. |
| Limitations | Wrong movement; 2D comparator rather than 3D criterion; model/version absent; ankle oscillation and occlusion noted; no agreement statistics for angles; simplified inverse dynamics; no quantified failures. |
| Transferability to KinematicIQ | Useful only for practical camera geometry and distal-joint caution. It provides no criterion validity for a lunge and should not support accuracy claims. |

## Evidence synthesis

### What the literature supports

- MediaPipe/BlazePose has been compared with Vicon in dynamic, single-camera contexts, so a synchronized KinematicIQ validation study is technically feasible.
- Performance is metric- and phase-specific. Young et al. found strong aggregate knee-angle ICCs during running but visible waveform divergence near maximum extension. Asaeda et al. found poor absolute frontal-angle agreement but better agreement after normalization to initial contact.
- View geometry and occlusion are not minor nuisances. In the OpenPose lunge study, camera view changed peak deviations and waveform RMSE substantially. In running, the far limb performed worse because the near limb occluded it.
- ICC or correlation alone is inadequate. The lunge and landing studies show that high consistency can coexist with large bias, wide limits of agreement, or clinically large absolute error.

### What the literature does not support

- No validated error bound for MediaPipe knee, hip, or ankle angle during a forward lunge.
- No validated forward-lunge waveform agreement, peak-angle error, ROM error, or phase-specific error for MediaPipe.
- No validated MediaPipe forward-lunge event detector or event-timing error.
- No evidence that MediaPipe's static or gait accuracy transfers quantitatively to a unilateral stepping lunge.
- No defensible lunge cutoff, calibration offset, SEM, or MDC for KinematicIQ.
- No adequate estimate of MediaPipe landmark failure/dropout during forward lunges.

## Requirements for KinematicIQ's synchronized reference subset

The absence of direct evidence makes a synchronized criterion subset a release requirement for any quantitative validity claim.

### 1. Lock the intended use and metrics before collection

Pre-specify each claim separately:

- front-leg knee flexion waveform and peak;
- front-leg hip flexion waveform and peak;
- front-leg ankle dorsiflexion waveform and peak, if exposed to users;
- ROM or change-from-start metrics, distinct from absolute angle;
- lunge events: movement onset, front-foot contact, bottom/turning point, and return to stance; and
- repetition acceptance/failure.

Do not allow good performance on repetition count or normalized ROM to stand in for absolute-angle validity.

### 2. Use true simultaneous reference capture

- Record the exact KinematicIQ consumer RGB stream while Vicon, Qualisys, OptiTrack, or equivalent records the same repetitions.
- Use a shared hardware trigger, LED/TTL pulse visible in RGB and logged by motion capture, or another auditable common timebase. Do not rely only on aligning waveform peaks.
- Preserve native timestamps and quantify clock drift over the whole trial.
- Record reference video rate high enough for the intended event tolerance. If KinematicIQ operates at 30 fps, the nominal frame interval is 33.3 ms and must be reflected in event-error interpretation.

### 3. Match the production capture envelope

At minimum stratify or deliberately vary:

- phone/webcam models and lens modes;
- production resolution and frame rate;
- camera distance and lens height;
- near-sagittal yaw error (for example, 0°, ±10°, and ±20°);
- left-facing and right-facing execution;
- dominant/nondominant leading limb;
- clothing, body size, skin tone, background, and lighting;
- shallow, target-depth, and deep lunges; and
- correct executions plus plausible compensations.

The OpenPose lunge results make camera yaw a primary experimental factor, not an incidental covariate.

### 4. Recruit for generalization and repeated measures

- Include healthy adults across sex, age, height, BMI, and relevant mobility ranges; include the eventual clinical population before making clinical claims.
- Use repeated lunges per side and repeated sessions. The unit of inference must account for repetitions nested within participants; thousands of frames are not thousands of independent samples.
- Set sample size from a precision target for bias/LoA or a prespecified equivalence margin, not only from an ICC hypothesis.

### 5. Make angle definitions commensurate

- Freeze the MediaPipe package, graph/model complexity, confidence thresholds, coordinate choice (image 2D versus world landmarks), and smoothing settings.
- Document anatomical point definitions and sign conventions.
- Create both a reference 3D anatomical angle and a camera-plane-projected 2D angle. Comparing a 2D included angle directly with an unprojected 3D joint coordinate angle confounds pose error with construct mismatch.
- Report absolute angle, participant-normalized change, and ROM separately.
- Run sensitivity analyses for reference marker model, camera yaw, and filter choices.

### 6. Report waveform, discrete, and timing performance

For every exposed joint/metric report:

- time-normalized waveform bias and RMSE/MAE, with participant-level confidence intervals;
- waveform similarity such as CMC or cross-correlation, interpreted alongside absolute error;
- peak signed error, peak absolute error, and peak-time error;
- Bland–Altman bias and 95% limits of agreement using a repeated-measures method;
- ICC with exact model and confidence interval;
- SEM and MDC only where reliability design supports them;
- event signed error, absolute error, 95th percentile error, and missed/extra-event rate; and
- results by movement phase, side, view-yaw bin, depth, and near/far limb.

Define an a priori acceptable-error margin for each intended use. Statistical significance or “good ICC” is not a clinical/product acceptance criterion.

### 7. Treat failures as first-class outcomes

Record and publish:

- frames with no pose, low visibility/presence, implausible segment length, identity/side swap, or out-of-frame landmark;
- repetitions with any critical-landmark gap and repetitions the pipeline cannot score;
- longest consecutive dropout and percentage of missing/filled frames;
- raw performance and performance after any interpolation/filtering;
- participant- and repetition-level exclusions with reasons; and
- failure rate by camera, lighting, body characteristic, side, lunge depth, and phase.

Do not exclude failed trials from accuracy analysis without also reporting the denominator and failure analysis. The 20% technical exclusion in the OpenPose lunge study illustrates why this matters.

### 8. Minimum defensible claim after validation

The eventual claim should be narrow and metric-specific, for example:

> “Under the tested near-sagittal capture envelope, KinematicIQ estimates front-knee flexion change from standing to lunge bottom with [observed bias and 95% LoA], while [failure percentage] of repetitions are unscorable.”

It should not become “MediaPipe is validated for lunges” unless hip, knee, ankle, waveform, peak, timing, capture conditions, and failures have each been demonstrated for the claimed scope.

## Final answer to the decision question

**No direct evidence was found validating MediaPipe Pose or BlazePose for a dynamic forward/anterior lunge from a single consumer RGB camera against synchronized criterion motion capture.** Adjacent studies justify feasibility and identify failure modes, but they do not supply a transferable validity coefficient or error bound. KinematicIQ therefore needs the synchronized reference subset described above before making a quantitative forward-lunge validity claim.
