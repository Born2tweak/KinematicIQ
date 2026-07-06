# KinematicIQ Mathematical and Algorithmic Biomechanics Specification

Generated from `Research_02_Mathematical_Algorithmic_Biomechanics.md`.

Audience: senior software engineers implementing a browser-based, markerless biomechanics engine from single RGB video.

Scope: this is an implementation specification, not a literature review. It distinguishes:

- Evidence: supported by established biomechanics, signal processing, computer vision, or robotics literature.
- Engineering inference: recommended implementation choices derived from evidence and browser constraints.
- Open problem: not reliably solved from a single consumer RGB camera without additional assumptions, calibration, or learned priors.

## 0. System Model

```text
Video frames
  -> Pose inference
  -> Landmark quality model
  -> Temporal filtering
  -> Geometry primitives
  -> Segment frames
  -> Kinematics
  -> Metric extraction
  -> Confidence propagation
  -> Scoring/coaching
```

The engine should treat pose landmarks as noisy observations, not ground truth. Each observation is:

```ts
type Landmark = {
  name: LandmarkName;
  image: Vec2;       // pixels or normalized [0, 1]
  world?: Vec3;      // model-estimated 3D, not guaranteed metric-true
  visibility: number; // pose model confidence [0, 1]
  presence?: number;
  sigma?: Vec3;      // estimated per-axis uncertainty
};
```

Recommended core state per frame:

```ts
type PoseFrame = {
  t: number;             // seconds, monotonic
  fpsEstimate: number;
  landmarks: Landmark[];
  camera?: CameraModel;
  subjectScale?: ScaleModel;
  quality: FrameQuality;
};
```

## 1. Mathematical Foundations

### 1.1 Coordinate Systems

Formal definition: a coordinate system is an origin `O` and basis vectors `{e1, e2, e3}`. A point `p` is represented by coordinates `x` where `p = O + E x`, and `E = [e1 e2 e3]`.

Biomechanics use:

- Image coordinates: `u, v`, usually origin top-left.
- Camera coordinates: `x right, y down/up depending convention, z forward`.
- Subject/global coordinates: often `x mediolateral, y vertical, z anteroposterior`.
- Segment local coordinates: anatomical axes attached to pelvis, torso, thigh, shank, foot, upper arm, forearm.

Evidence: ISB joint coordinate system recommendations standardize anatomical reporting axes for clinical interpretation [Wu et al., 2002](https://pubmed.ncbi.nlm.nih.gov/11934426/).

Engineering inference: choose one internal right-handed coordinate convention and convert all model outputs immediately. Store the convention in metadata.

Common mistakes:

- Mixing image `y down` with world `y up`.
- Reporting left and right limbs with mirrored signs.
- Computing 3D angles from model-estimated `z` as if it were calibrated depth.

Recommended implementation:

```text
normalizePose(frame):
  convert landmarks into right-handed subject coordinate frame
  center pelvis at origin
  scale by robust body scale, e.g. hip-to-shoulder or predicted height
  preserve original image/world coordinates for debugging
```

### 1.2 Vector Algebra

Definitions:

- Vector difference: `v = b - a`
- Norm: `||v|| = sqrt(v.x^2 + v.y^2 + v.z^2)`
- Unit vector: `v_hat = v / max(||v||, eps)`

Dot product:

```text
a . b = ||a|| ||b|| cos(theta)
theta = atan2(||a x b||, a . b)
```

Cross product:

```text
a x b = [
  a_y b_z - a_z b_y,
  a_z b_x - a_x b_z,
  a_x b_y - a_y b_x
]
```

Use dot products for angle magnitudes and cross products for signed axes and segment frames.

Numerical stability:

- Prefer `atan2(||cross||, dot)` over `acos(dot)` because `acos` is unstable near `0` and `pi`.
- Clamp normalized dot values to `[-1, 1]`.
- Reject angle computations when either vector length is below `eps`.

Pseudocode:

```text
angleBetween(a, b):
  na = norm(a); nb = norm(b)
  if na < eps or nb < eps: return invalid
  dot = (a . b) / (na * nb)
  crossNorm = norm(a x b) / (na * nb)
  return atan2(crossNorm, clamp(dot, -1, 1))
```

Complexity: `O(1)` per angle.

Single RGB feasibility: good for 2D projected angles; limited for true 3D unless the pose model is validated for the activity and camera view.

### 1.3 Distance, Projection, and Transformations

Distance metrics:

```text
Euclidean: d(a,b) = ||a - b||
Mahalanobis: d_M(a,b) = sqrt((a-b)^T Sigma^-1 (a-b))
Point-line distance: ||(p-a) x (p-b)|| / ||b-a||
```

Use Euclidean distance for segment lengths, Mahalanobis distance for uncertainty-aware outlier rejection.

Projection:

```text
proj_b(a) = ((a . b) / (b . b)) b
orth_b(a) = a - proj_b(a)
```

Use projection to decompose motion into vertical, mediolateral, and sagittal components.

Homogeneous transforms:

```text
T = [ R  t ]
    [ 0  1 ]

p_world = T_segment * p_local
```

Affine transforms support scaling, rotation, shear, and translation. Rigid biomechanics should use rotation plus translation; avoid shear except for image preprocessing.

### 1.4 Rotations

Rotation matrix:

```text
R in SO(3), R^T R = I, det(R) = 1
```

Euler angles: ordered rotations such as `XYZ`, `ZYX`, or anatomical sequences. They are interpretable but suffer gimbal lock.

Quaternion:

```text
q = [w, x, y, z], ||q|| = 1
p' = q p q^-1
```

Biomechanics need segment orientation and joint relative orientation:

```text
R_joint = R_parent^T R_child
```

Evidence: the Grood-Suntay joint coordinate system and ISB recommendations are widely used for reporting clinically meaningful joint motion [Wu et al., 2002](https://pubmed.ncbi.nlm.nih.gov/11934426/).

Recommended implementation:

- Internally store rotations as quaternions or matrices.
- Compute relative joint orientation as `R_parent^T R_child`.
- Convert to anatomical angles only at metric/reporting boundaries.
- Use a fixed order per joint and document it.

Common mistakes:

- Mixing intrinsic and extrinsic Euler orders.
- Differentiating Euler angles directly through discontinuities.
- Failing to re-orthonormalize matrices after numerical updates.

### 1.5 PCA, Covariance, Least Squares, Optimization

Covariance:

```text
mu = (1/N) sum_i x_i
Sigma = (1/(N-1)) sum_i (x_i - mu)(x_i - mu)^T
```

PCA solves eigenvectors of `Sigma`. In biomechanics, PCA can estimate principal motion direction, identify rep axes, or define subject-specific movement planes.

Least squares:

```text
min_x ||A x - b||_2^2
x* = (A^T A)^-1 A^T b
```

Weighted least squares:

```text
min_x sum_i w_i ||r_i(x)||^2
```

Use WLS for inverse kinematics and confidence-aware fitting.

Numerical stability:

- Prefer QR or SVD over normal equations when matrices may be ill-conditioned.
- Apply Tikhonov regularization: `min ||Ax-b||^2 + lambda ||x||^2`.
- Use robust losses such as Huber for occlusion-induced outliers.

Browser feasibility: PCA and small least-squares systems are feasible in TypeScript/WebAssembly. IK for a 20 to 40 DOF skeleton is feasible at 30 FPS if sparse and warm-started.

## 2. Human Kinematics

### 2.1 Segment Model

Represent the body as a kinematic tree:

```text
pelvis
  spine -> neck -> head
  left_hip -> left_knee -> left_ankle -> left_foot
  right_hip -> right_knee -> right_ankle -> right_foot
  left_shoulder -> left_elbow -> left_wrist
  right_shoulder -> right_elbow -> right_wrist
```

Segment `s` has:

```ts
type Segment = {
  id: SegmentId;
  parentJoint: JointId;
  childJoint: JointId;
  length: number;
  massFraction?: number;
  comFractionFromParent?: number;
  localFrame: Mat3;
};
```

Evidence: OpenSim provides a reference architecture for musculoskeletal modeling and inverse kinematics [Delp et al., 2007](https://pubmed.ncbi.nlm.nih.gov/18018689/). Body segment parameters are commonly derived from cadaver and anthropometric studies such as Dempster and later refinements [Dempster source PDF](https://www.oandplibrary.org/al/pdf/1964_01_044.pdf).

Engineering inference: for a browser coaching product, start with a rigid-link kinematic model plus anthropometric COM fractions. Do not claim clinical inverse dynamics from single RGB.

### 2.2 Forward Kinematics

Formal definition: given joint parameters `q`, compute global segment transforms.

```text
T_child = T_parent * T_joint(q_j) * T_offset
```

Pseudocode:

```text
forwardKinematics(rootPose, joints):
  T[pelvis] = rootPose
  for joint in topologicalOrder:
    T[child(joint)] = T[parent(joint)] * jointTransform(q[joint]) * offset[joint]
  return T
```

Complexity: `O(J)` per frame.

### 2.3 Inverse Kinematics

Formal definition: fit joint parameters `q` so model landmarks match observed landmarks:

```text
min_q sum_i w_i ||h_i(q) - y_i||^2 + lambda ||q - q_prior||^2
subject to q_min <= q <= q_max
```

Where:

- `h_i(q)` maps model state to landmark `i`.
- `y_i` is observed landmark.
- `w_i` is confidence-derived weight.
- `q_prior` is previous frame or neutral pose.

Pseudocode:

```text
inverseKinematics(y, confidence, qPrev):
  q = qPrev
  repeat maxIter:
    r = []
    J = []
    for each landmark i:
      if confidence[i] < minConf: continue
      r_i = h_i(q) - y_i
      append sqrt(w_i) * r_i to r
      append sqrt(w_i) * jacobian(h_i, q) to J
    solve (J^T J + lambda I) delta = -J^T r
    q = clampToJointLimits(q + alpha * delta)
    if norm(delta) < tol: break
  return q
```

Complexity: dense solve `O(DOF^3)`; sparse tree Jacobian reduces effective cost.

Browser feasibility: feasible for small DOF, warm-started, using typed arrays. Heavy anatomical IK should move to WebAssembly.

Single RGB feasibility: moderate for sagittal-plane exercises; weak for transverse rotations, occluded joints, and depth-sensitive metrics.

### 2.4 Joint Centers and Segment Frames

Joint center estimation:

- Direct landmark: use model-provided hip/knee/ankle if validated.
- Midpoint: pelvis center = midpoint of left/right hip.
- Functional center: fit a sphere or hinge axis from motion over time.

Functional hip center sphere fit:

```text
min_c sum_t (||p_t - c|| - r)^2
```

Engineering inference: use direct landmark centers for real-time coaching, then optionally refine with temporal functional estimates when enough high-quality movement exists.

Segment orientation example, thigh:

```text
y_axis = normalize(hip - knee)          // proximal direction
x_axis = normalize(cross(y_axis, planeNormal))
z_axis = cross(x_axis, y_axis)
R_thigh = [x_axis y_axis z_axis]
```

Common mistakes:

- Building frames from nearly collinear landmarks.
- Failing to handle left/right mirrored axes.
- Using segment frames before filtering landmarks, causing noisy angular derivatives.

## 3. Time-Series and Signal Processing

### 3.1 Filter Comparison

| Filter | Equation | Latency | Noise rejection | Complexity | Best use | Browser |
|---|---:|---:|---:|---:|---|---|
| Moving average | `y_t = mean(x_{t-k+1:t})` | `k/2` samples | good high-frequency | `O(1)` rolling | simple display smoothing | excellent |
| EMA | `y_t = alpha x_t + (1-alpha)y_{t-1}` | low/moderate | moderate | `O(1)` | streaming pose | excellent |
| One Euro | adaptive first-order low-pass | low when moving | good jitter at rest | `O(1)` | interactive landmarks | excellent |
| Butterworth | IIR low-pass | phase lag unless filtfilt | strong | `O(order)` | offline/nearline kinematics | excellent |
| Kalman | prediction + update | low | model-dependent | `O(n^3)` small n | positions/velocities with uncertainty | excellent |
| EKF/UKF | nonlinear state filter | low | strong if model valid | higher | orientation/IK state | feasible |
| Savitzky-Golay | polynomial window | `k/2` samples | preserves derivatives | `O(kp)` | derivative estimation | excellent |
| Median | median window | `k/2` samples | impulse outliers | `O(k log k)` or better | spike removal | excellent |
| Cubic interpolation | piecewise cubic | gap-dependent | none by itself | `O(n)` | short gap fill | excellent |
| DTW alignment | dynamic programming | offline | not a filter | `O(NM)` | movement template alignment | feasible short windows |

Evidence: the One Euro filter is designed for noisy interactive input and explicitly trades jitter against lag through adaptive cutoff [Casiez et al., 2012](https://dl.acm.org/doi/10.1145/2207676.2208639). Markerless pose estimation systems such as DeepLabCut and OpenPose show that learned keypoints are useful but still require downstream temporal processing for measurement-grade metrics [Mathis et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30127430/), [Cao et al., 2017/2019](https://pubmed.ncbi.nlm.nih.gov/31331883/).

### 3.2 Key Equations

EMA:

```text
alpha = dt / (tau + dt)
y_t = alpha x_t + (1-alpha)y_{t-1}
```

One Euro:

```text
dx_hat = lowpass((x_t - x_{t-1}) / dt, d_cutoff)
cutoff = min_cutoff + beta * |dx_hat|
x_hat = lowpass(x_t, cutoff)
alpha(cutoff) = 1 / (1 + tau/dt), tau = 1 / (2 pi cutoff)
```

Kalman:

```text
Prediction:
x_t^- = F x_{t-1}
P_t^- = F P_{t-1} F^T + Q

Update:
K_t = P_t^- H^T (H P_t^- H^T + R)^-1
x_t = x_t^- + K_t(z_t - H x_t^-)
P_t = (I - K_t H)P_t^-
```

Savitzky-Golay fits a polynomial in a local window:

```text
min_a sum_{i=-m}^{m} (x_{t+i} - sum_{j=0}^{p} a_j i^j)^2
```

The derivative at center is derived from fitted polynomial coefficients.

### 3.3 Recommended Filtering Stack

Real-time stack:

```text
1. Landmark confidence gating
2. Spike rejection using Mahalanobis/velocity threshold
3. Short gap fill for <= 150 ms gaps
4. One Euro or confidence-adaptive EMA per landmark
5. Kinematic constraint projection for segment lengths
6. Metric-level smoothing for user-facing display
```

Offline/high-accuracy stack:

```text
1. Confidence masking
2. Robust gap filling
3. Zero-phase Butterworth or Savitzky-Golay
4. IK with WLS
5. Derivatives from filtered trajectories, not raw pose
```

Engineering inference: for browser inference, One Euro plus confidence-aware gating is the best default because it is causal, cheap, tunable, and responsive. Use Kalman only where uncertainty estimates are needed or where constant-velocity dynamics materially improve tracking.

Common mistakes:

- Filtering angles with wraparound discontinuities.
- Computing velocities from raw landmarks.
- Applying zero-phase filters in live mode, which uses future samples.
- Using fixed FPS when browser camera frame intervals vary.

## 4. Motion Segmentation

### 4.1 Algorithms

| Method | Accuracy | Explainability | Cost | Implementation effort | Browser suitability |
|---|---:|---:|---:|---:|---|
| Rule thresholds | low/medium | high | `O(1)` | low | excellent |
| State machines | medium/high for known exercises | high | `O(1)` | low/medium | excellent |
| HMM | medium | medium | `O(NS^2)` | medium | good |
| DTW | high for template match | medium | `O(NM)` | medium | good for short windows |
| Change-point | medium | medium | `O(N)` to `O(N^2)` | medium | good |
| Temporal CNN | high with data | low/medium | model-dependent | high | good with WebGPU/WebNN |
| Transformer | high with data | low | high | high | limited unless small |

Evidence: HMMs are a classical interpretable sequence model [Rabiner, 1989](https://doi.org/10.1109/5.18626). DTW is a classical method for time-normalized sequence comparison [Sakoe and Chiba, 1978](https://doi.org/10.1109/TASSP.1978.1163055).

Recommended browser approach:

```text
Use exercise-specific finite state machines driven by robust phase variables.
Add DTW only for template-quality scoring.
Use ML temporal models only after collecting labeled KinematicIQ data.
```

### 4.2 Phase Detection and Rep Counting

Phase variable example for squat:

```text
depth(t) = verticalHip(t) - verticalHipStanding
velocity(t) = d depth / dt
```

State machine:

```text
states = {standing, descending, bottom, ascending, complete}

transition standing -> descending if depth > d_min and velocity > v_min
transition descending -> bottom if velocity crosses <= 0 and depth > d_bottom
transition bottom -> ascending if velocity < -v_min
transition ascending -> complete if depth < d_top and velocity approx 0
```

Pseudocode:

```text
updateRepState(features, state):
  features = hysteresisSmooth(features)
  switch state:
    standing:
      if features.depth > enterDepth && features.vDepth > vDown: descending
    descending:
      if features.depth > bottomDepth && abs(features.vDepth) < vStill: bottom
    bottom:
      if features.vDepth < -vUp: ascending
    ascending:
      if features.depth < exitDepth: complete; reps += 1; standing
```

Use hysteresis and minimum dwell times to avoid double-counting.

## 5. Biomechanical Algorithms

### 5.1 Joint Angles

2D angle at joint `b`:

```text
a = proximal - joint
c = distal - joint
theta = atan2(|a_x c_y - a_y c_x|, a . c)
```

3D signed angle around axis `n`:

```text
theta = atan2(n . (a x c), a . c)
```

Relative orientation:

```text
R_rel = R_parent^T R_child
angles = decomposeJointCoordinateSystem(R_rel)
```

Limitations:

- 2D projected angles are view-dependent.
- Single RGB 3D landmark depth may be learned prior, not measured geometry.
- Soft tissue and clothing can shift apparent landmarks.

Validation:

- Compare against marker-based motion capture on activity-specific datasets.
- Report MAE, RMSE, bias, limits of agreement, and correlation.
- Validate rep-level decisions separately from frame-level angles.

### 5.2 Derivatives

Velocity:

```text
v_t = (p_{t+1} - p_{t-1}) / (t_{t+1} - t_{t-1})
```

Acceleration:

```text
a_t = 2 * [ (p_{t+1}-p_t)/(t_{t+1}-t_t) - (p_t-p_{t-1})/(t_t-t_{t-1}) ] / (t_{t+1}-t_{t-1})
```

Angular velocity from rotation matrices:

```text
R_delta = R_t^T R_{t+1}
omega ~= log(R_delta) / dt
```

Recommended: compute derivatives from filtered positions/orientations using central differences or Savitzky-Golay. For live mode, use backward differences with extra smoothing and confidence penalties.

### 5.3 Range of Motion

```text
ROM = percentile(theta, 95) - percentile(theta, 5)
```

Use percentiles over min/max to reduce spike sensitivity.

Pseudocode:

```text
computeROM(angleSeries, confidence):
  values = angles where confidence > threshold
  return p95(values) - p5(values)
```

### 5.4 Center of Mass

Segment COM:

```text
COM_s = proximal_s + alpha_s (distal_s - proximal_s)
```

Whole-body COM:

```text
COM = sum_s m_s COM_s / sum_s m_s
```

Evidence: segment mass and COM fractions require anthropometric assumptions; Dempster-style body segment parameters are classic but population-limited [Dempster source PDF](https://www.oandplibrary.org/al/pdf/1964_01_044.pdf).

Single RGB feasibility: COM proxy is feasible; precise whole-body COM is not guaranteed without calibration and subject-specific anthropometry.

### 5.5 Symmetry

Temporal symmetry:

```text
symmetry = 1 - |metric_left - metric_right| / max(|metric_left|, |metric_right|, eps)
```

Waveform symmetry:

```text
symmetry_dtw = exp(-DTW(left_series, right_series) / scale)
```

Recommended: report both scalar symmetry and phase-normalized waveform difference for cyclic movements.

### 5.6 Balance and Stability Proxies

Possible proxies:

- COM projection relative to base of support.
- Sway path length: `sum_t ||COM_2D(t) - COM_2D(t-1)||`.
- RMS sway around mean.
- Margin proxy: distance from projected COM to foot polygon.

Open problem: true dynamic stability requires forces, base of support, body inertia, and often force plates or IMUs. Single RGB can provide only kinematic proxies.

### 5.7 Smoothness, Jerk, Curvature, Path Length

Jerk:

```text
j_t = d^3 p / dt^3
```

Normalized jerk cost:

```text
NJ = (T^5 / L^2) integral_0^T ||j(t)||^2 dt
```

Path length:

```text
L = sum_t ||p_t - p_{t-1}||
```

Curvature:

```text
kappa = ||v x a|| / ||v||^3
```

Recommended: compute smoothness only on high-confidence, filtered trajectories. Jerk is extremely noise-sensitive.

### 5.8 Work, Power, and Force Proxies

Mechanical work proxy:

```text
W_proxy = sum_t m_total * g * max(0, COM_y(t+1) - COM_y(t))
```

Power proxy:

```text
P_proxy = W_proxy / duration
```

Force proxy:

```text
F_vertical_proxy = m_total * (g + COM_accel_y)
```

Engineering inference: label these as proxies. Do not present them as force-plate-equivalent measurements.

Validation: compare against force plates for vertical ground reaction force trends and against motion capture for COM trajectory. Report calibration dependence.

## 6. Confidence and Uncertainty

### 6.1 Landmark Uncertainty

Map model confidence to variance:

```text
sigma_i^2 = sigma_min^2 + (1 - c_i)^gamma * (sigma_max^2 - sigma_min^2)
```

Temporal consistency penalty:

```text
c_i' = c_i * exp(-||p_i(t) - predict(p_i(t))||^2 / (2 sigma_motion^2))
```

Occlusion handling:

- If confidence below threshold for <= short gap, predict and mark imputed.
- If longer gap, stop metric accumulation or degrade metric confidence.
- Never silently fill long gaps for coaching-critical metrics.

### 6.2 Propagation

For metric `y = f(x)`, first-order covariance propagation:

```text
Sigma_y ~= J_f Sigma_x J_f^T
```

Monte Carlo fallback:

```text
sample landmarks from N(mu, Sigma)
compute metric for each sample
return mean, std, confidence interval
```

Browser feasibility: analytic propagation for common metrics is cheap. Monte Carlo with 32 to 128 samples is feasible for summary metrics, not every frame on low-end devices.

Metric confidence should include:

```text
confidence = landmarkQuality
           * viewQuality
           * temporalCoverage
           * modelApplicability
           * numericalStability
```

Pseudocode:

```text
metricConfidence(inputs):
  qLandmark = weightedMean(input.confidence)
  qCoverage = validFrames / totalFrames
  qView = cameraViewScore(activity, pose)
  qStability = clamp(1 - conditionNumberPenalty, 0, 1)
  return qLandmark * qCoverage * qView * qStability
```

Recommended output shape:

```ts
type Metric<T> = {
  value: T;
  units: string;
  confidence: number;
  uncertainty?: {
    std?: number;
    ci95?: [number, number];
    method: "analytic" | "monteCarlo" | "empirical";
  };
  evidence: "direct" | "proxy" | "inference";
  warnings: string[];
};
```

## 7. Software Architecture

### 7.1 Module Boundaries

```text
Video
  owns camera stream, timestamps, frame sampling
Pose
  owns model execution and raw landmark schema
Quality
  owns confidence, occlusion, view checks
Filtering
  owns temporal smoothing and imputation
Geometry
  owns vectors, matrices, rotations, transforms
Kinematics
  owns segment frames, joint angles, IK/FK
Metrics
  owns primitive measurements
Derived Metrics
  owns exercise-specific features
Segmentation
  owns rep/phase detection
Scoring
  owns coaching thresholds and uncertainty-aware scoring
Validation
  owns golden datasets, numerical tests, regression tests
```

### 7.2 TypeScript Interfaces

```ts
export type Vec2 = Float32Array; // length 2
export type Vec3 = Float32Array; // length 3
export type Mat3 = Float32Array; // column-major length 9
export type Quat = Float32Array; // [w, x, y, z]

export interface TimeSeries<T> {
  t: Float64Array;
  values: T[];
  confidence: Float32Array;
}

export interface Filter<T> {
  reset(initial?: T): void;
  update(value: T, t: number, confidence?: number): T;
}

export interface KinematicsEngine {
  estimateSegments(frame: PoseFrame): SegmentState[];
  computeJointAngles(segments: SegmentState[]): JointAngleSet;
}

export interface MetricComputer<T> {
  id: string;
  requiredLandmarks: LandmarkName[];
  compute(window: PoseWindow): Metric<T>;
}
```

Use typed arrays for hot math paths. Keep object-rich structures at module boundaries.

### 7.3 Numerical Validation

Unit tests:

- Dot/cross product identities.
- Rotation orthonormality and determinant.
- Quaternion round-trip: quaternion -> matrix -> quaternion.
- Euler decomposition fixture cases.
- Derivative accuracy on known sinusoids.
- Filter step response and lag.

Property tests:

- Angle invariant to translation.
- Segment length invariant under rigid transforms.
- Symmetry metric bounded in `[0, 1]`.
- Confidence never increases after missing-data imputation unless explicitly modeled.

Golden tests:

- Synthetic stick figure with known joint angles.
- Rendered 3D skeleton projected into 2D with known camera.
- Public or internal videos with marker-based labels.

### 7.4 Benchmark Datasets

Recommended validation tiers:

1. Synthetic skeleton data with exact ground truth.
2. Controlled lab video with marker-based motion capture.
3. Consumer-device videos across lighting, body types, clothing, and viewpoints.
4. In-the-wild clips for robustness, not metric accuracy claims.

Evidence: modern markerless methods are powerful but validation is task and population dependent. DeepLabCut demonstrated high accuracy with transfer learning and labeled frames in controlled settings [Mathis et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30127430/). OpenPose established real-time multi-person 2D pose using part affinity fields [Cao et al., 2017/2019](https://pubmed.ncbi.nlm.nih.gov/31331883/). MediaPipe Pose/BlazePose is optimized for on-device, real-time fitness use and exposes 3D landmarks through a learned model [Google AI Edge Pose Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker).

## 8. Decision Trees

### 8.1 Should a Metric Be Reported?

```text
Is required landmark coverage >= threshold?
  no -> do not report; explain missing landmarks
  yes
Is camera view appropriate for metric axis?
  no -> report low-confidence proxy only
  yes
Is metric derivative-based?
  yes -> require stronger filtering and higher confidence
  no
Is metric validated for this exercise?
  no -> mark as experimental
  yes -> report value, confidence, uncertainty
```

### 8.2 Filter Selection

```text
Need live coaching?
  yes -> One Euro or confidence-adaptive EMA
  no
Need derivatives?
  yes -> Savitzky-Golay or zero-phase Butterworth
  no
Have reliable process model and uncertainty?
  yes -> Kalman/EKF
  no -> Butterworth/EMA
```

### 8.3 2D vs 3D Angle

```text
Is movement mostly in image plane?
  yes -> 2D angle acceptable as projected metric
  no
Do you have calibrated multi-view, depth, or validated monocular model?
  yes -> 3D angle with uncertainty
  no -> avoid or mark as low-confidence proxy
```

## 9. Recommended KinematicIQ v1 Implementation

1. Pose backend: use a browser-capable pose model with landmarks and confidence. Preserve raw outputs.
2. Coordinate normalization: convert to a documented right-handed subject frame; scale by robust body measure.
3. Quality layer: compute landmark, frame, view, and temporal confidence.
4. Filtering: confidence-aware One Euro per landmark; velocity spike rejection; short-gap interpolation.
5. Kinematics: compute 2D and learned-3D joint angles; expose view-dependent limitations.
6. Metrics: ROM, rep count, phase duration, symmetry, path length, smoothness proxy, COM proxy.
7. Avoid v1 claims: true ground reaction force, clinical-grade joint moments, precise transverse-plane rotations, medical diagnosis.
8. Validation: synthetic fixtures plus activity-specific marker-based comparisons before product claims.

## 10. Common Implementation Mistakes

- Treating model world coordinates as calibrated metric 3D.
- Computing derivatives before filtering.
- Using fixed time steps despite dropped frames.
- Reporting joint angles without coordinate convention and Euler order.
- Hiding missing data through interpolation.
- Combining confidence scores with arbitrary averages instead of propagating weakest-link failure modes.
- Validating only landmark error but not downstream metrics.
- Using min/max ROM instead of robust percentiles.
- Ignoring left/right sign conventions.
- Presenting force/work/power proxies as physical measurements.

## 11. Source Notes

Primary and near-primary sources used:

- Wu G. et al. "ISB recommendation on definitions of joint coordinate system..." Journal of Biomechanics, 2002. https://pubmed.ncbi.nlm.nih.gov/11934426/
- Delp S.L. et al. "OpenSim: Open-source software to create and analyze dynamic simulations of movement." IEEE Transactions on Biomedical Engineering, 2007. https://pubmed.ncbi.nlm.nih.gov/18018689/
- Casiez G., Roussel N., Vogel D. "1 Euro Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems." CHI 2012. https://dl.acm.org/doi/10.1145/2207676.2208639
- Mathis A. et al. "DeepLabCut: markerless pose estimation of user-defined body parts with deep learning." Nature Neuroscience, 2018. https://pubmed.ncbi.nlm.nih.gov/30127430/
- Cao Z. et al. "Realtime Multi-Person 2D Pose Estimation Using Part Affinity Fields." CVPR/TPAMI. https://pubmed.ncbi.nlm.nih.gov/31331883/
- Google AI Edge MediaPipe Pose Landmarker documentation. https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker
- Dempster W.T. body segment parameter source reproduction. https://www.oandplibrary.org/al/pdf/1964_01_044.pdf
- Rabiner L.R. "A tutorial on hidden Markov models and selected applications in speech recognition." Proceedings of the IEEE, 1989. https://doi.org/10.1109/5.18626
- Sakoe H., Chiba S. "Dynamic programming algorithm optimization for spoken word recognition." IEEE TASSP, 1978. https://doi.org/10.1109/TASSP.1978.1163055

