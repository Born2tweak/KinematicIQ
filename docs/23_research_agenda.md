# KinematicIQ — Research Agenda & Reference / Validation Stack

> Purpose: ground KinematicIQ's 2D angle math, temporal filtering, and benchmark methodology
> in the **published markerless-biomechanics standard** instead of guessing. This is the
> evidence base for the "trust/validation wedge" (vs. competitors like Motus who show
> unvalidated 3D). Source repos were fetched with `opensrc` and mapped with `graphify`; every
> claim below cites a real file in the fetched source.

## How this was produced
- Fetched to `C:\Users\acetu\.opensrc\repos\github.com\...` (outside KinematicIQ's git tree).
- Graphed with `graphify` (AST, no API key) → `graphify-out/GRAPH_REPORT.md` per repo.
- Deep-read the files the graphs surfaced. Cited paths are relative to each repo's fetched root.

---

## 1. Reference & Validation Stack (Tier 1 — directly transferable)

### 1.1 Sports2D — `davidpagnon/Sports2D` (published, JOSS; author of Pose2Sim)
**What it is:** 2D joint/segment angles from monocular video → OpenSim-standard `.trc`/`.mot`.
This is *our exact problem*, done by a domain expert, peer-reviewed, MIT/BSD.

**Transferable techniques (cited):**
- **Published validation of our 2D-in-plane position.** Paper (`Content/paper.md:128`) states
  *"Results are acceptable only if the participants move in the 2D plane (frontal or sagittal),"*
  and (`:46`) *"2D analysis is often sufficient when the analyzed motion mostly lies in the
  sagittal or frontal plane."* → **Citable backing** that side-view squat 2D is legitimate; and
  the honest limitation (`:129`) *"Angle estimation is only as good as the pose estimation"*
  (Karthik's exact point). Use both in the Magic/expert pitch and in scoring disclaimers.
- **Facing-side normalization via foot orientation + coordinate flip** —
  `Sports2D/process.py:244` (`compute_angles_for_person`). Determines visible side from
  `X[Rtoe]-X[RHeel]` (+ left), then flips X so angles are **consistent regardless of facing
  direction**. We lack this; it directly hardens bilateral/asymmetry when a user faces either way.
  → **maps to `web/src/analysis/angles.ts` + `asymmetryDetector.ts`.**
- **Angles defined as data, not code** — `process.py:212` (`compute_angle`) reads an
  `angle_dict` of `name → [keypoints, type, offset, scaling]`. This **validates the
  `MovementProfile` abstraction (M22)**: angle definitions belong in config, not hardcoded
  functions like our current `leftKneeAngle()`/`rightKneeAngle()`.
- **Angle conventions** (`paper.md:96-119`): knee flexion = hip-knee-ankle (0° = straight);
  hip flexion = knee-hip-shoulder; segment angles anticlockwise from horizontal. Align our
  outputs to these so we're comparable to the standard. (Note: their knee "flexion" is the
  supplement of our hip-knee-ankle angle where 180° = straight.)
- **Pixel→meters + camera-distance + floor-line estimation** (`convert_px_to_meters`,
  `get_distance_from_camera`, `compute_floor_line`, surfaced as god-nodes in the graph) — a
  path to real-world scaling from a single camera. Future reference for velocity/height metrics.

### 1.2 Pose2Sim — `perfanalytics/pose2sim` (the multi-cam research standard)
**What it is:** 2D pose → triangulation → **OpenSim** full 3D inverse kinematics. The gold
standard for markerless kinematics; shares angle math + config with Sports2D.

**Transferable techniques (cited):**
- **The biomech filtering recipe** — `Sports2D/Demo/Config_demo.toml` (Pose2Sim-shared) is a
  menu of validated filters with parameters. This is the single most actionable extraction for
  **M19**:
  - **Butterworth** `cut_off_frequency = 6 Hz, order = 4` — *"Most intuitive and standard filter
    in biomechanics"* (`:156`). Use for **offline/video-upload** (zero-phase, needs full signal).
  - **One-Euro** `oneeuro_cut_off = 4 Hz, beta = 1.5, d_cut_off = 1.0` (`:168`) — *"zero-phase…
    adaptive cut-off… for real-time… tends to blunt RoM."* Use for **live camera**. These are
    concrete, validated One-Euro params to adopt directly.
  - **Pre-filter stages** (`:142-148`): **interpolate gaps** smaller than 100 frames
    (`fill_large_gaps_with='last_value'`), then **Hampel outlier rejection** (window 7, 95% CI
    from median) *before* filtering. We do neither today.
  - Also offered: Kalman, GCV-spline (auto cutoff), `acc_minimizing` (Whittaker-Henderson,
    *"inspired by AddBiomechanics"*). → reference set if One-Euro/Butterworth prove insufficient.
- **Ground-truth generation for M18.** Pose2Sim (multi-cam) → OpenSim IK produces research-grade
  3D kinematics. Use it to **validate KinematicIQ's browser output** ("here's our error vs. the
  published standard") — the core of the trust wedge and the M18 benchmark's gold standard.

### 1.3 OpenCap-Monocular — `utahmobl/opencap-monocular` (validated single-camera 3D)
**What it is:** 3D kinematics + kinetics from **one** smartphone video (`README.md`). Pipeline:
video → **WHAM** 3D pose → camera/pose optimization → **OpenSim IK** → export. Uses **ViTPose**
(the model Karthik recommended), SMPL, SLAHMR; classifies activities (incl. squats). arXiv paper.

**Transferable / strategic:**
- The **blueprint for our "validated 3D" north star** — how to go monocular-video → validated 3D.
  Study their `validation/` methodology.
- ⚠️ **LICENSING FLAG (critical for a startup):** `README.md:64` — **PolyForm Noncommercial 1.0.0**,
  and **SMPL body models are non-commercial** (`:77`). → We may **learn the method** but **cannot
  use this code or SMPL commercially.** ViTPose (Apache-2.0) and WHAM (MIT) are individually
  commercial-OK; SMPL is the blocker. Log this in the decision register.

### 1.4 pyomeca — `pyomeca/pyomeca` (biomech signal processing)
**What it is:** clean Python biomech processing library.
**Transferable techniques (cited):**
- **Zero-phase Butterworth** — `pyomeca/processing/filter.py:8` uses `scipy.signal.butter` +
  `filtfilt` (forward-backward → **no phase lag**), Nyquist-normalized `cutoff/(freq/2)`. This is
  the canonical, correct way to low-pass biomech signals offline. → **M19 offline filter** (avoids
  the lag a naive EMA/causal filter introduces). Pair with One-Euro for the live path.
- **3D anatomical angle extraction** — `pyomeca/processing/angles.py:7` extracts Euler angles
  from rotation matrices for any sequence (xyz, zyx, zyz…). Reference for the **validated-3D
  endgame** (deriving anatomical FE/AA/IE — the very numbers Motus shows — from 3D frames).

---

## 2. Reference tier (light-touch)
- `modenaxe/awesome-biomechanics` — curated master-list of biomech software/datasets/models; use
  to expand this agenda (literature, OpenSim models, validation datasets).
- `mkjung99/biomechanics_dataset` — dataset index → **benchmark-data candidates for M18**.
- `keenon/nimblephysics` — differentiable biomechanics (AddBiomechanics backend; R. James Cotton's
  neighborhood). North-star reference for **physics-constrained, validated 3D**. Reference only.
- `opencv/opencv` — only **OpenCV.js** is relevant, for the camera-angle gate (M20: undistortion,
  calibration). Not a strategic dependency.
- `simbody/simbody` — OpenSim's multibody engine. Context only; too low-level/heavy.
- `kamilj62/FormCheckAI` — direct peer analog (exercise form checker); read for approach + gaps.
- `JRKagumba/…yolov7`, `sarweshshah/gait_analysis` — pipeline references only (YOLO-pose is
  server-side, off our browser path).

---

## 3. Roadmap mapping (what to actually change, sourced)

| Our milestone | Sourced improvement | From |
|---|---|---|
| **M18 Benchmark** | Validate browser output vs Pose2Sim/OpenCap OpenSim kinematics (gold standard) + Sports2D 2D angles on identical clips | 1.2, 1.3, 1.1 |
| **M19 Filtering** | Live = **One-Euro (4 Hz / β1.5 / d1.0)**; offline = **zero-phase Butterworth (6 Hz / order 4)**; add **gap-interpolation (<100f) + Hampel outlier rejection** pre-stages | 1.2, 1.4 |
| **M19 Confidence** | Keypoint confidence gating + "keep persons with enough avg high-confidence" pattern | 1.1 (`paper.md:72`) |
| **M20 Camera gate** | Foot-orientation facing detection; per-movement valid plane (sagittal/frontal); OpenCV.js calibration | 1.1, 2 |
| **M22 Movement seam** | Angles-as-config `angle_dict [keypoints, offset, scaling]` validates `MovementProfile` | 1.1 (`process.py:212`) |
| **Angle correctness** | Align to standard conventions; add facing-invariant X-flip | 1.1 |
| **North-star (validated 3D)** | WHAM/ViTPose→OpenSim method; Euler-from-rotation; Nimble physics constraints | 1.3, 1.4, 2 |

## 4. Open research items / competitors (⏳ pending inputs)
- **Motus Motion Labs** — monocular 3D visualization (BVH/IK, anatomical FE/AA/IE, COM trails).
  Strong on render, **no validation shown** → our wedge. (Screenshots reviewed.)
- **R. James Cotton — Portable Biomechanics Lab / differentiable biomechanics** — ⏳ *video
  transcript pending from user.* Directly relevant to validated-monocular-3D; slot into §1.3/§2
  and the "validated 3D" north star once provided.
- Establish a labeled squat benchmark (multi-angle capture; hand-labeled bottom frame + reference
  knee angle; goniometer subset) — feeds M18.

## 5. Licensing note (carry into decision register)
- **Non-commercial blockers:** OpenCap-Monocular (PolyForm-NC) and **SMPL** models. Learn method,
  don't ship their code. **Commercial-OK:** ViTPose (Apache-2.0), WHAM (MIT), Sports2D/Pose2Sim,
  pyomeca, MediaPipe. Prefer these for anything that reaches the product.
