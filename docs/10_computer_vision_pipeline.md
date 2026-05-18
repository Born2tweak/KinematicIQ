# KinematicIQ Computer Vision Pipeline Research Report

## Executive Summary

KinematicIQ should start with a **single-person, single-camera, 2D pose pipeline** built around MediaPipe Pose/BlazePose or MoveNet, then layer rule-based movement analytics on top before training any custom models. This is the most realistic MVP path because modern pose systems already deliver real-time landmarks, confidence values, and browser/mobile-friendly deployment — the hardest remaining problems are depth ambiguity, occlusion, and movement interpretation, not raw keypoint detection. [ai.google](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)

For Layer 1, the safest design is:

```
browser camera input
  → on-device pose estimation
  → smoothing
  → joint angle extraction
  → rep detection
  → heuristic scoring
  → feedback UI
```

This gives a usable athlete product without requiring a large labeled biomechanics dataset on day one, and keeps privacy and latency under control. [tensorflow](https://www.tensorflow.org/hub/tutorials/movenet)

---

## Pose Estimation Foundations

Pose estimation locates human body landmarks from an image or video — typically keypoints for joints such as shoulders, elbows, hips, knees, and ankles. Each frame is passed through a model that predicts landmark coordinates and a confidence/visibility score, and those frame-wise predictions are linked over time to form skeletal motion. [github](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md)

### How It Works

Most modern systems use a detector + landmark model or a direct keypoint regressor. The model outputs 2D coordinates in image space (sometimes normalized to `[0,1]`), and in some systems also 3D/world coordinates or a pseudo-depth value:

- **MediaPipe Pose** provides both image-coordinate landmarks and 3D world coordinates
- **MoveNet** outputs 17 keypoints, optimized for speed
- **OpenPose** is a multi-person system that can output body, hand, face, and foot keypoints [cmu-perceptual-computing-lab.github](https://cmu-perceptual-computing-lab.github.io/openpose/web/html/doc/md_doc_00_index.html)

### 2D vs 3D

2D pose estimation is faster and simpler but loses depth and can misrepresent joint geometry when the subject rotates or moves out of plane. 3D/"world" coordinates help with interpretation, but monocular 3D is still an estimate — not true metric motion capture. Depth ambiguity remains a core limitation of single-camera systems. For MVP, 2D is sufficient for many athletic form checks when the camera angle is controlled, especially for side-view squat-like movements. [noraxon](https://www.noraxon.com/article/understanding-the-limitations-of-2d-video-analysis-vs-3d-imu-based-motion-capture/)

### Confidence and Occlusion

Confidence scoring indicates how trustworthy a landmark is in a given frame — crucial because joints may disappear behind clothing, self-occlude, or leave the frame. MediaPipe's landmark results include visibility-like confidence scores. Research on occlusion-aware pose tracking shows that explicit confidence modeling improves tracking and downstream stability. [arxiv](https://arxiv.org/pdf/2310.18920.pdf)

**Product rule:** Low-confidence frames should be downweighted, interpolated cautiously, or rejected if too many critical joints are missing.

### Smoothing and Temporal Tracking

Frame-by-frame landmarks are noisy. Movement systems apply temporal smoothing before calculating angles or events. A simple moving average works for MVP; Kalman-style filtering helps preserve smooth motion without over-lagging the signal. Temporal consistency is important because rep counting and phase detection are based on trends over several frames, not single-frame snapshots. [scitepress](https://www.scitepress.org/papers/2018/66287/66287.pdf)

### Camera and Depth Limits

Camera calibration matters because focal length, perspective, and lens distortion affect how body geometry appears in the frame. Single-camera systems cannot directly recover true depth without additional assumptions — perspective distortion is a major reason why "3D-looking" movements can still be misleading in 2D analysis. This is why KinematicIQ should strongly constrain capture setup rather than accepting arbitrary camera angles. [github](https://github.com/google-ai-edge/mediapipe/issues/3577)

---

## Model Comparison

| Model | Strengths | Weaknesses | Speed | Web/Mobile | MVP Fit |
|-------|-----------|------------|-------|------------|---------|
| **MediaPipe Pose / BlazePose** | 33 landmarks, world coordinates, mobile/web ready, strong real-time support [ai.google](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) | Monocular depth is approximate; less ideal for crowded scenes | Very fast | Excellent | **Best first choice** |
| **MoveNet** | Extremely fast, 17 keypoints, browser-friendly [blog.tensorflow](https://blog.tensorflow.org/2021/05/next-generation-pose-detection-with-movenet-and-tensorflowjs.html) | Fewer landmarks; less detail for feet/hands | Very fast | Excellent | **Best second choice** |
| **OpenPose** | Rich keypoint set, multi-person, mature docs [cmu-perceptual-computing-lab.github](https://cmu-perceptual-computing-lab.github.io/openpose/web/html/doc/md_doc_00_index.html) | Heavy, slower, harder to deploy for browser/mobile | Slower | Limited for MVP | Better long-term for research/server |
| **YOLO Pose** | Convenient if already using YOLO stack [ultralytics](https://www.ultralytics.com/blog/pose-estimation-with-ultralytics-yolov8) | Pose quality varies; not specialized for biomechanics | Good | Good in Python/server | Good later, not first |
| **PoseNet** | Browser-friendly, historically important [blog.tensorflow](https://blog.tensorflow.org/2018/05/real-time-human-pose-estimation-in.html) | Weaker than newer options | Fast enough | Yes | Legacy fallback only |

### Which Should KinematicIQ Use First?

**Use MediaPipe Pose** if the product needs rich landmark coverage, browser/mobile support, and quick movement-analysis iteration. The extra landmarks and world coordinates help downstream feature engineering for sports movement intelligence.

**Use MoveNet** if aggressively optimizing for very low latency and only the core 17 keypoints are needed. [youtube](https://www.youtube.com/watch?v=oaK74yozU9g)

**Long-term:** Consider a hybrid stack — lightweight on-device pose for capture, plus a deeper server-side or offline analysis layer for selected sessions. OpenPose or YOLO-pose become useful later for multi-person environments, custom training, or richer research workflows. [ultralytics](https://www.ultralytics.com/blog/pose-estimation-with-ultralytics-yolov8)

---

## Landmark Extraction and Joint Calculations

Pose landmarks are useful only after converting them into stable geometric features. The common pattern:

```
landmark coordinates
  → segment vectors
  → joint angles
  → temporal features
  → movement metrics
```

[dornsife.usc](https://dornsife.usc.edu/biomech/wp-content/uploads/sites/268/2023/11/Angular-Kinematics-Lab-3.pdf)

### Coordinate Systems

Pose systems typically return normalized image coordinates where `x` and `y` are relative to image width and height. MediaPipe also returns world landmarks — better for relative body-space reasoning, but not true motion-capture truth. The origin is centered around the hips in MediaPipe's world-coordinate framing. Normalized coordinates are easy to use but sensitive to image scale and perspective. [ai.google](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)

### Joint Angle Math

For a joint `J` with proximal point `P` and distal point `D`, form vectors `u = P - J` and `v = D - J`, then compute:

```
θ = arccos( (u · v) / (‖u‖ · ‖v‖) )
```

This works well for knee, hip, ankle, shoulder, and trunk inclination estimates in 2D. Angle definitions must be consistent across left/right sides and camera views. [wiki.has-motion](https://wiki.has-motion.com/doku.php?id=visual3d%3Atutorials%3Akinematics_and_kinetics%3Amodel_based_computations)

### Practical Formulas

| Feature | Calculation |
|---------|-------------|
| Knee angle | angle between `(hip - knee)` and `(ankle - knee)` [youtube](https://www.youtube.com/watch?v=I6DyTmFIU5U) |
| Hip angle | angle between trunk vector and thigh vector |
| Ankle angle | angle between shank vector and foot vector (if foot landmarks available) |
| Trunk lean | angle between vertical axis and `shoulder → hip` line |
| Shoulder alignment | compare left/right shoulder `y` values |
| Pelvis tilt proxy | `y_left_hip - y_right_hip`, or hip midpoint relative to shoulders |

### Core Pseudocode

```
for each frame:
    if required landmarks have confidence above threshold:
        knee_angle    = angle(hip - knee, ankle - knee)
        hip_angle     = angle(shoulder - hip, knee - hip)
        trunk_lean    = angle(vertical, shoulder - hip)
        pelvis_tilt   = y_left_hip - y_right_hip
    else:
        mark feature as missing or interpolate cautiously

smooth feature time series
derive peaks, minima, velocity, symmetry, range of motion
```

### Noise and Missing Keypoints

Use confidence weighting so low-confidence landmarks contribute less to angle estimates. If one side is missing, interpolate briefly; repeated missing frames should trigger a reliability downgrade because derived angles become unstable.

**MVP rule:** If critical joints fall below confidence threshold for too many frames, stop scoring and prompt the user to re-record.

### Side-to-Side Comparisons

Compare matched left/right angles at equivalent movement **phases** — not arbitrary frames. For example, compare left-knee valgus proxy and right-knee valgus proxy at the bottom of a squat or at landing contact. Phase-based comparison is more robust than raw frame-by-frame difference because athletes rarely move both sides identically in time.

---

## Movement Segmentation

Segmentation detects where a rep starts, where phases change, and when the rep ends. For KinematicIQ, segmentation is as important as pose estimation — the platform must analyze movement quality in context, not just display skeletons. [instructables](https://www.instructables.com/Real-Time-Push-Up-Squat-Recognition-With-Form-and-/)

### MVP Approach: State Machine

The simplest approach is a threshold-based state machine on one or two stable features, such as knee angle or hip vertical displacement. For a squat:

```
standing → descending → bottom → ascending → standing
```

Transitions are triggered by angle thresholds and temporal consistency. This is beginner-friendly and works well for controlled single-exercise MVPs.

### Advanced Options

- **Smoothed angular velocity** — identifies eccentric and concentric phases
- **Derivative features** — detects bottom position, takeoff, and landing more reliably than static angles
- **Learned temporal classifiers** — require labeled sequences, use later

[pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/30258393/)

### Key Event Definitions

| Event | Detection Signal |
|-------|-----------------|
| Squat start/end | Stable standing baseline → sustained drop in knee/hip angle → return to baseline |
| Bottom position | Minimum knee angle or minimum hip height within a rep |
| Jump takeoff | Rapid upward COM proxy velocity or rapid extension signal |
| Landing contact | First strong downward-to-upward reversal after flight |
| Eccentric phase | Primary angle is decreasing |
| Concentric phase | Primary angle is increasing |

### Signal Processing

Apply a low-pass filter, moving average, or Savitzky-Golay-style smoothing on angle series before thresholding. A Kalman filter helps when capture is noisy or landmarks are intermittently lost, because it can predict through brief gaps and preserve continuity. Temporal consistency rules should require several consecutive frames before confirming a state transition. [web2.qatar.cmu](https://web2.qatar.cmu.edu/~gdicaro/16311-Fall17/hw/homework-5.pdf)

---

## Computer Vision Constraints

Single-camera pose analysis is only reliable when capture conditions are constrained. The biggest failure modes are perspective distortion, occlusion, motion blur, poor lighting, and the subject leaving the frame. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8805121/)

### Optimal Capture Conditions

- Full body visible in frame
- Camera fixed on tripod or stable surface
- Bright, even lighting
- Tight but not cropped framing
- Minimal background clutter
- Clothing that does not hide major joints
- Exercise-specific camera angle (usually side view for squats and jumps)

### Movements Best Suited to Single Camera

Single-camera systems work best for **mostly planar movements**: squats, hinges, push-ups, jumps, lunges, and many rehab-style drills.

Less reliable: movements with heavy rotation or depth dependence — cutting, pivoting, Olympic lifts from arbitrary angles, complex multi-planar tasks. [noraxon](https://www.noraxon.com/article/understanding-the-limitations-of-2d-video-analysis-vs-3d-imu-based-motion-capture/)

### Automatic Rejection Rules

KinematicIQ must reject or downgrade sessions when:

- The user is too close or too far away
- The body is partially off-screen
- Critical landmarks are missing or low confidence for too many frames
- The camera is moving
- Multiple people are in frame when single-person mode is required
- The angle does not match the movement template

### Confidence Scoring

Confidence should combine: pose confidence, landmark completeness, temporal stability, and camera compliance. A practical score weights the minimum confidence of critical landmarks, the percentage of valid frames, and whether motion follows the expected movement pattern.

**Rule:** If confidence drops below threshold, give partial feedback or request a better recording — never produce strong biomechanical claims from poor-quality data.

---

## Pose Landmarks to Movement Intelligence

The goal is not to "predict injury" from a single frame. The goal is to turn geometric signals into stable, interpretable movement features. [sciencedirect](https://www.sciencedirect.com/science/article/pii/S2291522226000549)

### Reliable Features (Build These)

| Category | Features |
|----------|----------|
| Geometry | Joint angles at key phases, joint angle range of motion |
| Dynamics | Peak angular velocity, peak angular acceleration |
| Symmetry | Side-to-side angle differences |
| Posture | Trunk lean angle, pelvis height / tilt proxy |
| Quality | Smoothness (jerk-based measures, velocity peak counts) [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12954642/), rep-to-rep variability |

### Unreliable Features (Avoid These)

- Absolute joint load
- True spinal compression
- Internal/external rotation from a single frontal camera
- True pelvis rotation in depth
- Injury diagnosis from video alone

### Feature Examples

- **Knee valgus proxy:** medial knee drift relative to ankle and hip alignment in the frontal plane — a relative comparison, not a true measurement
- **Trunk lean:** shoulder-hip line versus vertical, especially in side view
- **Hip shift:** horizontal displacement of pelvis midpoint relative to foot centerline across reps

[pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10978775/)

### Movement Quality Signals

Good movement-quality features combine amplitude, timing, and consistency. An athlete who completes a squat with similar depth and timing across reps is more consistent than one with large rep-to-rep variance. Smoothness metrics (spectral arc length, jerk-related measures) can capture motor control quality — useful after basic geometry is already working. [frontiersin](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2018.00615/full)

### Fatigue and Readiness Signals

Potential within-session fatigue features: increased variability, reduced depth, slower concentric speed, higher asymmetry, reduced smoothness. These are better used for within-athlete monitoring than as universal scores because movement baselines differ across people.

---

## Real-Time vs Recorded Analysis

| Mode | Strengths | Weaknesses |
|------|-----------|------------|
| **Live camera** | Coaching-like feedback, instant rep counting, engagement | Tighter latency requirements, harder to recover from bad frames, more complex UI |
| **Uploaded video** | Easier to debug, replay, store; enables server-side processing | Upload friction, privacy/storage overhead |

### What Layer 1 Should Use

Layer 1 should primarily use **uploaded video plus optional live preview**, or live capture with local pose inference and session upload after the fact. This gives a better development path because you can iterate on the analytics engine without needing perfect real-time UX from day one. [blog.tensorflow](https://blog.tensorflow.org/2018/05/real-time-human-pose-estimation-in.html)

Browser-based inference is feasible and privacy-friendly — TensorFlow.js plus MediaPipe/MoveNet support live webcam workflows directly in the browser. [discuss.ai.google](https://discuss.ai.google.dev/t/markerless-tracking-and-pose-estimation-on-the-web-browser-with-single-camera/32002)

### First Demo Outputs

The first demo should analyze one movement (bodyweight squat, side view) and show:

- Skeleton overlay
- Rep count
- Depth estimate
- Trunk lean estimate
- Left-right symmetry proxy (if relevant)
- Confidence score
- Simple feedback messages

---

## Data Pipeline Architecture

A modular pipeline makes the system maintainable and allows model swapping later. Video capture, pose inference, feature engineering, segmentation, scoring, and UI should be separable services or well-defined modules. [chuoling.github](https://chuoling.github.io/mediapipe/)

### Pipeline Stages

| Stage | Purpose | Inputs | Outputs | Key Failure Modes |
|-------|---------|--------|---------|-------------------|
| **1. Camera / video input** | Collect frames | Live stream or file | Decoded frames | Motion blur, bad framing, low FPS |
| **2. Frame extraction** | Standardize rate and size | Video stream | Ordered frames | Dropped frames, variable timing |
| **3. Pose estimation** | Infer landmarks [research](https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/) | Frames | Keypoints, confidence, world coords | Occlusion, cropping, model mismatch |
| **4. Landmark extraction** | Select and store required joints | Pose output | Structured landmark arrays | Missing keypoints, wrong person tracked |
| **5. Smoothing** | Reduce jitter | Landmark time series | Smoothed series | Over-smoothing can hide peaks |
| **6. Movement segmentation** | Identify reps and phases | Angle and motion signals | Start/end markers, phase labels | False transitions, noisy thresholds |
| **7. Angle calculations** | Derive biomechanical proxies [dornsife.usc](https://dornsife.usc.edu/biomech/wp-content/uploads/sites/268/2023/11/Angular-Kinematics-Lab-3.pdf) | Landmarks | Angles and derived metrics | Coordinate geometry bugs, axis flips |
| **8. Asymmetry calculations** | Compare left/right | Paired metrics | Asymmetry scores | Phase misalignment |
| **9. Scoring** | Turn metrics into interpretable scores | Feature set and rules | Movement quality summary | Overconfident claims |
| **10. Feedback generation** | Translate metrics to coaching language | Scores and thresholds | User-facing feedback | Vague or misleading advice |
| **11. Visualization** | Show skeleton, charts, event markers | Metrics and frames | Overlays and dashboards | Cluttered UI |
| **12. Storage** | Retain session history and baselines | Landmarks, metrics, metadata | Athlete profile trends | Privacy and storage bloat |

### Storage Strategy

Store raw video only if necessary. In most cases, storing landmark streams and summary metrics is sufficient for privacy-preserving analytics. Baseline tracking should store per-athlete medians, best reps, and session-to-session trends so the system can compare new sessions against the user's own historical movement pattern.

---

## Training Strategy

KinematicIQ should not start by training a large end-to-end model. The right order is: pretrained pose estimation + hand-engineered analytics → collect labeled data → train higher-level interpretation models. [discuss.ai.google](https://discuss.ai.google.dev/t/open-source-movenet/27570)

### What Should Be Pretrained (Use Existing)

- Pose estimation backbone
- Person detection and tracking
- Generic keypoint segmentation
- Baseline smoothing and tracking logic

### What Should Be Hand-Engineered First

- Joint angle formulas
- Rep segmentation rules
- Side-to-side asymmetry metrics
- Camera compliance checks
- Simple movement scores and thresholds

### What Should Be Learned Later

- Exercise classification
- Movement quality regression models
- Personalized coaching models
- Fatigue trend prediction
- Multi-exercise sequence models

### Data to Collect from Day One

| Data Type | Examples |
|-----------|---------|
| Session metadata | Frame timestamps, exercise type, camera angle, athlete height (if volunteered) |
| Pose data | Landmarks, confidence scores |
| Labels (if available) | Session labels, subjective effort, coach form ratings |

### Useful Label Granularity

Avoid simple "good" / "bad" labels. Better label schema:

- Depth met / not met
- Trunk lean excessive / acceptable
- Asymmetry present / absent
- Rep complete / incomplete
- Camera setup valid / invalid
- Confidence low / usable

---

## MVP Technical Recommendation

### Recommended Stack

| Layer | Choice |
|-------|--------|
| Frontend | Web app with live camera and overlay |
| Pose engine | MediaPipe Pose (primary); MoveNet (lightweight alternative) |
| Inference location | On-device / browser for capture and immediate feedback |
| Backend | Session storage, user profiles, analytics history |
| Analytics layer | Rule-based movement engine on top of landmarks |
| Data format | Store landmarks and metrics — not just screenshots |

[tensorflow](https://www.tensorflow.org/hub/tutorials/movenet)

### First Movement

Start with a **bodyweight squat, side view, single person, fixed camera.** Squats have clear phases, relatively repeatable structure, and useful angles (knee flexion, trunk lean). [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8805121/)

### First Metrics to Ship

- Rep count
- Depth proxy from hip/knee angle
- Bottom position frame
- Trunk lean
- Left-right shoulder/hip level (if visible)
- Rep-to-rep stability/variability
- Confidence score

### What Not to Build Yet

- Full-body injury prediction
- Arbitrary-angle 3D biomechanics
- Multi-athlete team analysis
- Custom foundation models
- Force estimation claims
- Highly generalized coaching across all sports

---

## Open Problems and Future Potential

True monocular 3D motion capture remains hard — depth is ambiguous, occlusions are common, and joint rotation cannot be fully recovered from one camera. Research on temporally continuous 3D pose under occlusions shows progress, but robust real-world sports capture still depends on good camera placement and strong priors. [arxiv](https://arxiv.org/html/2312.16221v1)

### Realistic Today

- Single-person 2D and pseudo-3D movement analytics
- Exercise-specific scoring
- Rep counting and phase detection
- Asymmetry proxies
- Session-to-session trend tracking

### Experimental Today

- Learned 2D-to-3D lifting for sports movement
- Occlusion-aware pose correction
- Sequence models for movement quality scoring
- Smoothness-based athletic metrics

### Future Potential

- Multi-camera motion analysis
- Force and load estimation from video
- Sports-specific movement foundation models
- Biomechanical digital twins
- Personalized readiness and compensation models

---

## Sources

- MediaPipe Pose Landmarker guide: [ai.google](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker)
- MediaPipe/BlazePose research and documentation: [github](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/pose.md), [research](https://research.google/blog/on-device-real-time-body-pose-tracking-with-mediapipe-blazepose/)
- TensorFlow MoveNet documentation: [tensorflow](https://www.tensorflow.org/hub/tutorials/movenet), [blog.tensorflow](https://blog.tensorflow.org/2021/05/next-generation-pose-detection-with-movenet-and-tensorflowjs.html)
- OpenPose multi-person documentation: [cmu-perceptual-computing-lab.github](https://cmu-perceptual-computing-lab.github.io/openpose/web/html/doc/md_doc_00_index.html)
- Occlusion-aware tracking and confidence modeling: [arxiv](https://arxiv.org/pdf/2310.18920.pdf)
- Temporally continuous 3D pose under occlusion: [arxiv](https://arxiv.org/html/2312.16221v1)
- Single-camera kinematic estimation limits: [noraxon](https://www.noraxon.com/article/understanding-the-limitations-of-2d-video-analysis-vs-3d-imu-based-motion-capture/), [jvgemert.github](https://jvgemert.github.io/pub/bittner23sensorsSingleCamKinematics.pdf)
- Joint angle computation (biomechanics): [dornsife.usc](https://dornsife.usc.edu/biomech/wp-content/uploads/sites/268/2023/11/Angular-Kinematics-Lab-3.pdf), [wiki.has-motion](https://wiki.has-motion.com/doku.php?id=visual3d%3Atutorials%3Akinematics_and_kinetics%3Amodel_based_computations)
- Movement segmentation and rep detection: [instructables](https://www.instructables.com/Real-Time-Push-Up-Squat-Recognition-With-Form-and-/), [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/30258393/)
- Temporal smoothing for pose: [scitepress](https://www.scitepress.org/papers/2018/66287/66287.pdf)
- Browser deployment (TF.js, webcam): [github](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection), [discuss.ai.google](https://discuss.ai.google.dev/t/markerless-tracking-and-pose-estimation-on-the-web-browser-with-single-camera/32002)
- Movement quality and smoothness metrics: [frontiersin](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2018.00615/full), [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12954642/)
- Single-camera capture constraints: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8805121/)
- Frontal-plane and squat video metrics: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10978775/)
- Movement intelligence from pose: [sciencedirect](https://www.sciencedirect.com/science/article/pii/S2291522226000549)
- YOLO Pose: [ultralytics](https://www.ultralytics.com/blog/pose-estimation-with-ultralytics-yolov8)
- PoseNet: [blog.tensorflow](https://blog.tensorflow.org/2018/05/real-time-human-pose-estimation-in.html)
- Kalman filtering for signal processing: [web2.qatar.cmu](https://web2.qatar.cmu.edu/~gdicaro/16311-Fall17/hw/homework-5.pdf)
- MediaPipe browser pose demo: [chuoling.github](https://chuoling.github.io/mediapipe/)
- MoveNet open-source discussion: [discuss.ai.google](https://discuss.ai.google.dev/t/open-source-movenet/27570)
