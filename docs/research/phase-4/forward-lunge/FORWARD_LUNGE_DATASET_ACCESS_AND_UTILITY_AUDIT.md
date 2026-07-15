# Forward-Lunge Dataset Access and Utility Audit

> **Repository-status reconciliation (2026-07-15):** This report's original repository observations were correct for commit `8d8a77d`. The later Phase 3 implementation at `f49558e` supersedes its "no implementation exists" conclusion. Phase 3 provides an unavailable experimental research seam in `web/src/protocols/inlineLunge/index.ts` and `segmenter.ts`, with six ordered states and synthetic tests in `inlineLunge.test.ts` and `web/src/eval/inlineLungeEvaluation.test.ts`. Real-participant validity, synchronized criterion evidence, live/upload/session/results integration, coaching authority, and public availability do not exist. Squat remains the only available protocol. The research findings and validation requirements below remain applicable. `inlineLunge` references are preserved only as historical repository or source-native terminology; the approved identity is **Forward lunge with stride and return**.
**Prepared for:** KinematicIQ  
**Audit date:** 2026-07-14  
**Scope:** discovery and pre-acquisition access audit only. No dataset was downloaded, no account was created, no terms were accepted, and no researcher was contacted.

## Executive decision

No audited dataset is presently sufficient, by itself, for locked activation of KinematicIQ's timed forward-lunge protocol.

The best technical lead is the newly released **A Synchronized Marker-based and Markerless Motion Capture Dataset**: it has raw synchronized smartphone video and OptiTrack reference data under CC BY 4.0, but its public description omits the exact lunge instructions, repetition count, lead-side plan, marker set, camera calibration files, and event labels. The best biomechanics-only match is **SIAT-LLMD**: its documented movement begins standing, steps forward, lunges, and retracts the leg, on both left- and right-lead variants, with synchronized force plates and optical motion capture; it has no RGB video. The best documented multimodal rehabilitation set is **REHAB24-6**, but its lunge appears to be a split-stance lowering exercise rather than a standing-to-step-to-return trial and its license is noncommercial.

The practical strategy is therefore a three-part evidence stack:

1. use the 2026 Zenodo synchronized dataset for provisional RGB-to-optical angle checks after a metadata inspection;
2. use SIAT-LLMD for force/event and bilateral biomechanics priors, and REHAB24-6/MM-Fit/FMS for video-domain development and error examples; and
3. collect an original, protocol-matched KinematicIQ dataset for activation evidence.

## Evidence and decision conventions

- **Confirmed (C):** stated in a primary paper or official repository page.
- **Calculated (Calc):** arithmetic from confirmed protocol counts; not a file-level inventory.
- **Inference (I):** a reasoned compatibility or utility judgment, not a source claim.
- **Not reported (NR):** absent from the public pre-acquisition documentation reviewed.
- **Zero confirmed:** the published movement list does not contain a lunge. This is stronger than “not found in a filename,” but does not prove that an unlisted/free-choice trial never occurred.
- “Commercial use” describes the dataset license, not privacy, biometric-data, medical-device, or product-claims compliance. KinematicIQ should complete its own legal/privacy review before any product use.
- “MediaPipe compatible” means RGB frames can technically be processed by MediaPipe Pose. It does not imply domain match, adequate image quality, or valid ground-truth correspondence.
- “Locked activation evidence” means evidence suitable for freezing a product threshold or acceptance criterion. A dataset is not assigned that role when the protocol, synchronization, rights, or reference validity remains unresolved.

## Ranked technical comparison

| Rank | Dataset | Protocol match | RGB + timebase | Synchronized reference | Forces | Rights posture | Recommended role |
|---:|---|---|---|---|---|---|---|
| 1 | A Synchronized Marker-based and Markerless Motion Capture Dataset (2026) | Lunge confirmed; exact form NR | Two smartphones, 30 Hz | OptiTrack, 120 Hz | No/NR | CC BY 4.0 | Angle validation; development pending metadata gate |
| 2 | SIAT-LLMD | Very close: stand→left/right step→lunge→retract | None | Optical mocap + OpenSim | Two 6-D plates | CC0 | Event/angle biomechanics reference; ontology |
| 3 | REHAB24-6 | Lunge confirmed; likely split-stance/in-place | Two synchronized RGB, 30 fps | 41-marker OptiTrack | None | CC BY-NC 4.0 | Development, error examples, provisional angle/event work |
| 4 | Twente six-sensor locomotion dataset | Lunge confirmed; exact step form NR | Front/sagittal companion video; fps NR | Qualisys/OpenSim | Split-belt force treadmill | Dataset license NR | Event and angle validation after rights/video gate |
| 5 | FMS Azure Kinect dataset | In-line lunge, not forward-lunge protocol | Synchronized front/side RGB frame sequences + timestamps | Azure Kinect 32-joint skeleton only | None | CC0 | Development, scoring ontology, event prototyping |
| 6 | MM-Fit | Alternating lunges; not isolated start/return | Two RGB-D views, 30 fps | Estimated OpenPose/lifted 3D only | IMUs, no force plate | RGB CC BY 4.0; other data terms need checking | Development and negative examples |
| 7 | UI-PRMD | Step-forward inline lunge; one side/subject | No released RGB | Kinect 22 joints + Vicon 39 points | None | PDDL 1.0 | Skeleton-only angle/ontology and incorrect-form examples |
| 8 | Movement Screen, 183 Athletes | “Lunge,” bilateral within one retained trial; exact form NR | None | 45-marker optical mocap | None | CC0 | Bilateral angle distribution/ontology |
| 9 | Gait_Posture_dataset (2026) | Lunge confirmed; exact form NR | No raw video in release | Derived Vicon/Theia/Femto features | NR | CC BY 4.0 | Reliability statistics/ontology only |
| 10 | MoVi | Zero confirmed predefined lunges | Synchronized RGB | Qualisys/SMPL | None | Noncommercial; redistribution prohibited | General-motion negatives only |

## Dataset dossiers

### 1. A Synchronized Marker-based and Markerless Motion Capture Dataset

**Source and primary paper.** Official current record: [Zenodo v2, DOI 10.5281/zenodo.18399031](https://zenodo.org/records/18399031). The record identifies the creator only as Capital University of Physical Education and Sports. **NR:** no primary paper or protocol document is linked or discoverable from the record at audit time.

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** “lunges” are one of seven fitness movements. **NR:** forward vs reverse, start/end posture, depth, cadence, load, and foot-return instructions. |
| Subjects | **C:** 21 male university physical-education students. |
| Lunge trials | **NR:** neither recording count nor repetitions per participant is stated. |
| Lead-side coverage | **NR.** Do not infer bilateral coverage from the plural “lunges.” |
| Video availability | **C:** synchronized video from two smartphones; released in `03_markerless_data.zip` (485.8 MB). Original container/codec and whether both views are included are **NR** pre-acquisition. |
| Skeleton format | **C:** raw optical marker coordinates in C3D. **NR:** marker names/count and any released markerless skeleton format. |
| Reference system | **C:** calibrated seven-camera OptiTrack at 120 Hz, explicitly described as ground truth. |
| Timestamps/frame rate | **C:** smartphones 30 Hz; OptiTrack 120 Hz; systems described as synchronized. **NR:** timestamp representation, clock/trigger method, dropped-frame handling, and temporal residual. |
| Camera view/calibration | **C:** two smartphones. **NR:** view angles, resolution, intrinsics, extrinsics, distortion coefficients, and whether calibration files are released. “Calibrated” modifies the optical system, not clearly the smartphones. |
| Force/IMU | **NR;** none is described. Treat as unavailable until inventory proves otherwise. |
| Event annotations | **NR.** |
| Subject identifiers | **C:** a `01_participant_metadata.zip` is released. Identifier schema is **NR** without acquisition. |
| License/commercial/redistribution | **C:** CC BY 4.0; commercial reuse and redistribution are permitted with attribution. Product privacy/biometric review remains necessary. |
| Access procedure | **C:** open direct Zenodo files; no account or request is indicated. Expected archives: participant metadata, marker-based data, markerless data, and code/model data. |
| MediaPipe compatibility | **I:** high technical compatibility if the released smartphone files contain ordinary RGB video and preserve frame correspondence. Marker visibility and camera framing must be checked. |
| KinematicIQ-label compatibility | **I:** potentially high for angles; unknown for start/step/contact/depth/return events because instructions and annotations are absent. |
| Suitable role | **Angle validation** and **development**, conditional on the metadata gate below; not yet locked activation evidence. |

**Acquisition gate.** Before computing a single score, inventory the lunge filenames and metadata, visually confirm the movement, determine repetitions and lead side, verify the two video streams and optical frames share an auditable alignment, inspect camera calibration, and map the marker set. Failure of any of those checks demotes the dataset to ontology/development only.

### 2. Shenzhen Institute of Advanced Technology Lower Limb Motion Dataset (SIAT-LLMD)

**Source and primary paper.** [Official Figshare dataset](https://springernature.figshare.com/articles/dataset/Shenzhen_Institute_of_Advanced_Technology_Lower_Limb_Motion_Dataset_SIAT-LLMD_/22776389); Wei et al., [“Surface electromyogram, kinematic, and kinetic dataset of lower limb walking for movement intent recognition”](https://pmc.ncbi.nlm.nih.gov/articles/PMC10244354/) (Scientific Data, 2023).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** LUGF starts standing at force platform 2, steps forward with the **left** leg, lunges, then retracts the left leg. LUGB starts at platform 1, steps forward with the **right** leg, lunges, then retracts the right leg. Despite the label “backward,” the described lead-foot action is forward; the label reflects travel/setup direction. Hands stay on the abdomen. |
| Subjects | **C:** 40 healthy adults (30 male, 10 female). |
| Lunge trials | **C:** each subject folder contains one data file for each of 16 movement classes, including LUGF and LUGB: 80 lunge-class recordings in the designed release (**Calc:** 40×2). **NR:** number of repetitions within each recording and file-level missingness. |
| Lead-side coverage | **C:** left lead in LUGF and right lead in LUGB for every designed subject. |
| Video availability | **C:** no RGB sequence is listed; experiment photos are included, not trial video. |
| Skeleton format | **C:** raw motion was processed to C3D/TRC/MOT and OpenSim; released per-movement CSVs contain eight bilateral lower-limb joint-angle channels, eight joint-torque channels, and nine sEMG channels. Paper describes a 41-marker whole-body setup. |
| Reference system | **C:** six-camera Motion Analysis system, two AMTI OR6-7 six-dimensional force platforms, OpenSim kinematics/kinetics. |
| Timestamps/frame rate | **C:** first CSV column is time; sEMG was acquired at 1,920 Hz and synchronized with motion/forces. **NR in the reviewed public text:** final CSV rate and native optical/force rates. |
| Camera view/calibration | Not applicable to released RGB. Optical-camera geometry/calibration files are **NR**. |
| Force/IMU | **C:** bilateral six-dimensional force plates and nine left-leg Delsys sEMG channels; no IMU described. |
| Event annotations | **C:** movement labels and gait-phase labels exist. **NR:** whether lunge-specific contact, peak-depth, and return events are explicitly marked. |
| Subject identifiers | **C:** `SubjectsInformation.xlsx` contains subject ID and anthropometrics; files use `Subxx_xxx_data.csv`. |
| License/commercial/redistribution | **C:** CC0 on the official Figshare item; unrestricted reuse/redistribution. Ethical and biometric-data review still applies. |
| Access procedure | **C:** open direct Figshare download, 7.8 GB; no request described. |
| MediaPipe compatibility | **C:** none, because no trial RGB is released. |
| KinematicIQ-label compatibility | **I:** excellent movement-ontology match and strong force-derived event potential; joint definitions must be reconciled with MediaPipe/KinematicIQ angles. |
| Suitable role | **Event validation** (reference-side only), **angle validation**, and **ontology only**; not end-to-end MediaPipe validation. |

### 3. REHAB24-6: A Multi-modal Dataset of Physical Rehabilitation Exercises

**Source and primary paper.** [Official Zenodo record](https://zenodo.org/records/13305826); Černek, Sedmidubsky, and Budikova, [“REHAB24-6: Physical Therapy Dataset for Analyzing Pose Estimation Methods”](https://doi.org/10.1007/978-3-031-75823-2_2), in the proceedings of the 17th SISAP conference (proceedings publication 2025).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** Ex5 is “leg lunge”: lower the back-leg knee while keeping a right angle at the front knee. **I:** this wording is compatible with a split-stance/in-place repetition and does not establish a standing-to-step-to-return trial. |
| Subjects | **C:** 10 (6 male, 4 female), ages 25–50, varied fitness. |
| Lunge trials | **NR exact.** Each exercise was performed with at least five correct and five incorrect repetitions by each participant and in two body/camera directions. The repository reports 1,072 repetitions overall, not an Ex5 count. |
| Lead-side coverage | **C:** participants had freedom to choose the leg for Ex5. **NR:** per-trial side and whether each subject used both sides. “Direction” labels body orientation, not lead side. |
| Video availability | **C:** two synchronized RGB videos, 30 fps; `videos.zip` is 2.7 GB. |
| Skeleton format | **C:** 41 optical markers plus a derived 26-joint 3D skeleton, with projected 2D markers/joints and name files. |
| Reference system | **C:** 16 OptiTrack cameras using Motive 2.3. |
| Timestamps/frame rate | **C:** 30 fps RGB; 184,825 frames. **NR:** independent timestamps beyond frame indices and native optical sampling rate. |
| Camera view/calibration | **C:** two room-corner views (front/profile or two half-profiles depending on orientation). Approximate pinhole placement: camera positions were tape-measured and orientations optimized against projected markers. **NR:** production-grade intrinsic/distortion calibration. |
| Force/IMU | **C:** none described. |
| Event annotations | **C:** repetition start/end frames, correctness, exercise, subject, and direction in segmentation files; no sub-phase events. |
| Subject identifiers | **C:** included in file/segmentation structure. |
| License/commercial/redistribution | **C:** CC BY-NC 4.0; academic/nonprofit noncommercial use only. Commercial use requires a separate license from the stated rights holder. Redistribution is noncommercial, attributed, and subject to CC terms. |
| Access procedure | **C:** open Zenodo files; no account described. Expected files: videos, 2D/3D marker and joint archives, marker/joint names, `Segmentation.csv`, and `Segmentation.txt`. |
| MediaPipe compatibility | **I:** high for processing, with a marker-clothing/lab-domain caveat. |
| KinematicIQ-label compatibility | **I:** repetition bounds and correct/incorrect labels are useful; KinematicIQ phase labels would require derivation, and protocol equivalence must first be disproved or confirmed visually. |
| Suitable role | **Development**, **negative examples**, provisional **angle validation**, and coarse **event validation**; not commercial locked evidence under the published license. |

### 4. Comprehensive Kinetic and EMG Dataset of Daily Locomotion with 6 Types of Sensors

**Source and primary paper.** [Official Zenodo record](https://zenodo.org/records/6457662); Wang et al., [“A wearable real-time kinetic measurement sensor setup for human locomotion”](https://www.cambridge.org/core/journals/wearable-technologies/article/wearable-realtime-kinetic-measurement-sensor-setup-for-human-locomotion/488C21B7706FFDFA7FFAB387FD0A1A64) (Wearable Technologies, 2023). Linked RGB companion: [Zenodo DOI 10.5281/zenodo.6644593](https://doi.org/10.5281/zenodo.6644593).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** a lunge is one of four non-locomotion tasks and is performed for 10 repetitions; the paper depicts a dominant-leg/toe-supported lunge. **NR:** definitive forward-step, start/return, depth, and lead-side instructions. |
| Subjects | **C:** 12 released young adults. The paper's validation analysis used 9; the first three were excluded from analysis while the protocol matured. |
| Lunge trials | **Calc:** 120 designed repetitions in the released 12-subject set (12×10); 90 in the 9-subject paper analysis. File-level completion must be verified after acquisition. |
| Lead-side coverage | **NR:** paper context suggests dominant-leg execution, not bilateral trials. |
| Video availability | **C:** two Qualisys Miqus RGB cameras captured sagittal and frontal views; videos are on a linked companion record. **NR:** exact file inventory and whether every released subject/lunge is included. |
| Skeleton format | **C:** 33 lower-body/trunk markers; raw Qualisys `.qtm`, Xsens `.mvn`, processed `.mat`, OpenSim model/IK/ID files. |
| Reference system | **C:** eight-camera Qualisys optical motion capture plus OpenSim. |
| Timestamps/frame rate | **C:** common trigger/synchronization protocol; processed signals resampled to 100 Hz. **NR:** RGB fps and timestamp fields. |
| Camera view/calibration | **C:** frontal and sagittal views. **NR:** released intrinsics/extrinsics/distortion and video-to-optical calibration. |
| Force/IMU | **C:** split-belt instrumented treadmill (separate foot GRF), eight Xsens IMUs, pressure insoles, and nine dominant-leg EMG channels. |
| Event annotations | **C:** non-locomotion start/end frames were manually detected from under-foot GRF. **NR:** step onset, contact, peak depth, push-off, and feet-together labels. |
| Subject identifiers | **C:** `Subjxx` folder/file naming. |
| License/commercial/redistribution | **NR:** the official data record shows no dataset license. The paper's CC BY license does not license the data. Commercial use and redistribution are unresolved. |
| Access procedure | **C:** direct Zenodo archives (`Raw_data.rar` 13.1 GB; `Processed_data.rar` 17.9 GB) plus the companion video record; no application described. Do not use beyond internal evaluation until rights are resolved. |
| MediaPipe compatibility | **I:** technically compatible if the companion files contain ordinary RGB; visible markers and laboratory views create domain shift. |
| KinematicIQ-label compatibility | **I:** strong reference for force-derived repetition bounds and lower-limb angles; exact protocol and side remain blockers. |
| Suitable role | **Event validation** and **angle validation** after rights, video, and protocol gates. |

### 5. Functional Movement Screen Dataset Collected with Two Azure Kinect Depth Sensors

**Source and primary paper.** [Official Figshare+ collection/item](https://plus.figshare.com/articles/dataset/Skeleton_data_supporting_Functional_movement_screen_dataset_collected_with_two_Azure_Kinect_depth_sensors_/18144266); Xing et al., [Scientific Data 9, 104](https://www.nature.com/articles/s41597-022-01188-7) (2022).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** the standardized FMS **in-line lunge**, not an unconstrained anterior lunge. It uses the FMS preparation/return posture and expert 0–3 scoring. **I:** the heel-to-toe/dowel constraints make it a protocol mismatch for KinematicIQ. |
| Subjects | **C:** 45, ages 18–59. The paper's reported sex counts sum inconsistently; do not use them without checking metadata. |
| Lunge trials | **Calc nominal:** 270 episodes if both side variants were completed by all subjects (45×2 sides×3 repeats). **NR exact:** some subjects did not complete all movements; inventory the episode JSON/files. |
| Lead-side coverage | **C/I:** the paper and movement IDs indicate left/right FMS variants, and a left-lunge trajectory is illustrated; exact ID-to-side mapping and actual completion require metadata confirmation. |
| Video availability | **C:** published color-image sequences, depth PNGs, skeleton JSON, and two auxiliary RGB views. Original 7.3 TB MKV recordings were not published. Thus original encoded video is unavailable, but frame sequences with identifiers/timestamps can be reconstructed. |
| Skeleton format | **C:** Azure Kinect Body Tracking, 32 joints; 3D positions, quaternions, and 2D pixel trajectories in JSON. |
| Reference system | **C:** Azure Kinect skeleton only; no simultaneous optical ground truth. |
| Timestamps/frame rate | **C:** per-frame microsecond timestamps and frame IDs. **NR:** a single authoritative nominal fps in the reviewed text; do not infer it from exposure time. |
| Camera view/calibration | **C:** hardware-synchronized front and side Azure Kinects at 96 cm height, plus back/low-side color views. **NR:** released intrinsics/extrinsics and distortion files. |
| Force/IMU | **C:** none. |
| Event annotations | **C:** episode boundaries and three expert scores (0–3). No explicit lunge sub-phase events. |
| Subject identifiers | **C:** subject/movement/episode/view and timestamps are encoded in the data organization. |
| License/commercial/redistribution | **C:** official Figshare item is CC0 and confirms public distribution; commercial reuse and redistribution are permitted. |
| Access procedure | **C:** direct Figshare+ item/collection download; the skeleton item is 948.88 MB and the collection is about 158 GB. No application is described. |
| MediaPipe compatibility | **I:** high for RGB-frame processing, but not “original video” ingestion; frame-order and timestamp preservation are essential. |
| KinematicIQ-label compatibility | **I:** useful for left/right episode classification, quality scoring, and phase-label prototyping; poor as an unconstrained forward-lunge angle reference. |
| Suitable role | **Development**, **ontology only**, and **negative examples** for protocol discrimination. |

### 6. MM-Fit

**Source and primary paper.** [Official project page](https://mmfit.github.io/), [official RGB Zenodo release](https://zenodo.org/records/7672767), and Strömbäck et al., [“MM-Fit: Multimodal Deep Learning for Automatic Exercise Logging across Sensing Devices”](https://vradu.uk/publications/UbiComp2020.pdf) (IMWUT/UbiComp 2020).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** one leg is forward with knee bent/foot flat and the other behind; leg positions are repeatedly swapped. **I:** this is an alternating workout lunge, not isolated quiet-standing→single step→return trials. |
| Subjects | **C:** 10. |
| Lunge trials | **NR exact:** 6,160 repetitions and 616 sets are reported across all exercises, but no official pre-acquisition lunge subtotal. Obtain it from label CSVs. |
| Lead-side coverage | **C:** positions are repeatedly swapped, so both lead sides occur by definition; per-repetition side labels are **NR**. |
| Video availability | **C:** two Orbbec Astra Pro RGB-D views; RGB release on Zenodo. |
| Skeleton format | **C:** 2D OpenPose keypoints and model-lifted 3D pose estimates, not optical ground truth. |
| Reference system | **C:** none suitable as laboratory ground truth. |
| Timestamps/frame rate | **C:** RGB 30 fps; wearable/video streams were synchronized with an initial abrupt motion and documented offsets. |
| Camera view/calibration | **C:** two viewpoints, RGB nominally 1280×720 (one project-page dimension is inconsistent). **NR:** camera intrinsics/extrinsics and distortion. |
| Force/IMU | **C:** smartwatch, phone, and earbud accelerometer/gyroscope streams; no force plate. |
| Event annotations | **C:** manual exercise-set boundaries and repetition counts, estimated within 2–3 frames; no per-repetition phase events. |
| Subject identifiers | **C:** workout IDs `w00`–`w20` and participant/session mapping. The official materials inconsistently say 20 versus 21 sessions; use the file inventory as authority after acquisition. |
| License/commercial/redistribution | **C:** RGB Zenodo release is CC BY 4.0; code is MIT. **NR:** whether every non-video sensor archive is under the same dataset license. Commercial RGB reuse is permitted with attribution. |
| Access procedure | **C:** RGB direct from Zenodo; project page links the remaining dataset/code. No request described. |
| MediaPipe compatibility | **I:** high for pose extraction; workout clutter, alternating motion, and the existing OpenPose estimates make it a useful cross-model comparison set. |
| KinematicIQ-label compatibility | **I:** set bounds and counts help coarse segmentation; KinematicIQ-specific events and isolated repetitions must be derived. |
| Suitable role | **Development**, **negative examples**, and coarse **event validation** only. |

### 7. UI-PRMD

**Source and primary paper.** Vakanski et al., [“A Data Set of Human Body Movements for Physical Rehabilitation Exercises”](https://www.mdpi.com/2306-5729/3/1/2) (Data, 2018). The paper's official dataset URL is `http://webpages.uidaho.edu/ui-prmd/`; it was not reliably reachable in this audit.

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** inline lunge: step forward and lower the body so the knee behind the front foot approaches/makes floor contact; errors include trunk deviation and inability to remain upright. The paper's correct/incorrect prose contains an apparent knee-contact inconsistency; inspect labels/examples before treating depth as truth. |
| Subjects | **C:** 10 healthy subjects. |
| Lunge trials | **Calc:** 200 Kinect lunge episodes (10 subjects×10 correct+10 incorrect). Vicon data for movement 3/subject 3 are missing; nominal available Vicon count is 180 if that missing block contains both classes. Confirm from files. |
| Lead-side coverage | **C:** one assigned side per subject: left for 7 subjects, right for 3; no within-subject bilateral trials. |
| Video availability | **C:** RGB/depth were recorded by Kinect but not released; only joint/angle text files are public. |
| Skeleton format | **C:** Kinect 22-joint positions/angles at 30 Hz; Vicon 39 marker/body points at 100 Hz; ASCII text, millimetres, Euler Y-X-Z angles. |
| Reference system | **C:** simultaneous Vicon optical motion capture. **NR:** an auditable sample-level Kinect↔Vicon synchronization transform. |
| Timestamps/frame rate | **C:** 30 Hz Kinect and 100 Hz Vicon; segmented and unsegmented sequences. Explicit timestamps are **NR**. |
| Camera view/calibration | **NR** for RGB because video/calibration is not released. |
| Force/IMU | **C:** none. |
| Event annotations | **C:** repetition segmentation and correct/incorrect class; no internal phase events. |
| Subject identifiers | **C:** subject, movement, repetition, and correctness are represented in filenames. |
| License/commercial/redistribution | **C:** Open Data Commons PDDL 1.0 in the paper; commercial use and redistribution are permitted under the public-domain dedication/fallback license. |
| Access procedure | **C/NR:** historically direct from the University of Idaho page; current official availability is uncertain. Use an institutionally archived official copy, not an unverified third-party mirror. |
| MediaPipe compatibility | **C:** none without RGB. |
| KinematicIQ-label compatibility | **I:** useful for skeleton angle conventions, side imbalance tests, and correct/incorrect ontology; not for end-to-end event timing. |
| Suitable role | **Angle validation** (skeleton-only), **ontology only**, and **negative examples**. |

### 8. Three-Dimensional Motion Capture Data of a Movement Screen from 183 Athletes

**Source and primary paper.** [Official Figshare collection](https://springernature.figshare.com/collections/Three-Dimensional_Motion_Capture_Data_of_a_Movement_Screen_from_183_Athletes/6014509); Ross et al., [Scientific Data paper](https://www.nature.com/articles/s41597-023-02082-6) (2023).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** a proprietary movement-screen “lunge” is one of 21 tasks; both sides are performed within the same trial. **NR:** public article text does not establish KinematicIQ's standing-to-step-to-return definition; consult the released supplementary protocol after acquisition. |
| Subjects | **C:** 183 athletes, ages 9–36. |
| Lunge trials | **Calc nominal:** 183 retained lunge trial files, one best trial per athlete, each containing both sides. Verify missing files; discarded repeats are unavailable. |
| Lead-side coverage | **C:** bilateral within the retained trial. |
| Video availability | **C:** none. |
| Skeleton format | **C:** 45-marker whole-body optical data in C3D and MAT. |
| Reference system | **C:** eight-camera Raptor-E optical motion capture. |
| Timestamps/frame rate | **C:** 120 or 480 Hz depending on movement/setup; C3D timebase. Confirm the lunge-specific rate from files. |
| Camera view/calibration | Not applicable; no RGB. |
| Force/IMU | **C:** no force/IMU data described for the release. |
| Event annotations | **NR:** no lunge sub-phase annotations. |
| Subject identifiers | **C:** athlete IDs and demographics are included. |
| License/commercial/redistribution | **C:** CC0; commercial use and redistribution permitted. |
| Access procedure | **C:** open Figshare download; no application. |
| MediaPipe compatibility | **C:** none without RGB. |
| KinematicIQ-label compatibility | **I:** potentially useful for bilateral angle distributions after marker-to-joint mapping; single retained trial prevents repeated-trial reliability analysis. |
| Suitable role | **Angle validation** and **ontology only**. |

### 9. Gait_Posture_dataset (2026 derivative feature release)

**Source and primary paper.** [Official Mendeley Data record](https://data.mendeley.com/datasets/7s894bg4pp/1). **NR:** no primary paper is cited on the record; the title suggests a manuscript-support package, but no bibliographic record should be invented.

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** lunge is one of three tasks. **NR:** forward/reverse, side, start/end, cadence, and depth. |
| Subjects | **C:** 22 across two visits. |
| Lunge trials | **NR:** repetition-level rows exist, but count is not stated on the official page. |
| Lead-side coverage | **NR.** |
| Video availability | **C:** no raw video is included in the described release. |
| Skeleton format | **C:** no skeleton trajectories in the release; extracted repetition-level feature tables and Python scripts. |
| Reference system | **C:** Vicon is treated as reference against Theia and Femto; raw source CSVs are expected by scripts but are not described as included. |
| Timestamps/frame rate | **C:** repetition-level features, not original time series; rates/timestamps **NR**. |
| Camera view/calibration | **NR** and not included in the described derivative package. |
| Force/IMU | **NR.** |
| Event annotations | **C:** detected repetitions/sets are represented by participant, visit, set, and system rows; event frames are not described. |
| Subject identifiers | **C:** participant and visit identifiers are columns. |
| License/commercial/redistribution | **C:** CC BY 4.0; commercial reuse and redistribution permitted with attribution. |
| Access procedure | **C:** direct Mendeley Data download; no application stated. Expected files include `Lunge_Master_Database_Detailed_Features.csv`, data dictionaries, READMEs, and analysis scripts. |
| MediaPipe compatibility | **C:** none for raw inference because no RGB is included. |
| KinematicIQ-label compatibility | **I:** derived joint-angle agreement and reliability statistics may inform tolerances, but the missing raw trials prevent independent relabeling or protocol verification. |
| Suitable role | **Ontology only** and supporting **angle-validation** statistics; not primary validation evidence. |

### 10. MoVi

**Source and primary paper.** [Official BioMotionLab page](https://www.biomotionlab.ca/movi/); Ghorbani et al., [PLOS ONE paper](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0253157) (2021).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** none of the 20 predefined actions is a lunge. The list includes walking, jogging, running in place, side gallop, crawling, jumps, kicks, and stretches. Self-chosen movements exist, but their content cannot be assumed. |
| Subjects | **C:** 90. |
| Lunge trials | **Zero confirmed** in the predefined protocol; exact free-choice lunge count **NR**. |
| Lead-side coverage | Not applicable/NR. |
| Video availability | **C:** two stationary FLIR RGB cameras synchronized at 30 fps; two handheld iPhones are neither synchronized nor calibrated. |
| Skeleton format | **C:** 67-marker Qualisys, MoSh++/SMPL, and Visual3D-derived data. |
| Reference system | **C:** 15-camera Qualisys at 120 Hz; 17-sensor IMU subsets. |
| Timestamps/frame rate | **C:** stationary video 30 fps, optical/IMU 120 Hz. |
| Camera view/calibration | **C:** two stationary calibrated/synchronized views; handheld views unsuitable for reference alignment. |
| Force/IMU | **C:** IMU in subsets; no force plates. |
| Event annotations | **C:** action segments/rest/A-pose structure; no lunge events. |
| Subject identifiers | **C:** subject/session/action organization. |
| License/commercial/redistribution | **C:** noncommercial scientific, educational, or artistic use; commercial use/model training is prohibited and redistribution is prohibited. |
| Access procedure | **C:** request access through Scholar's Portal Dataverse using an institutional identity and agree to terms. No request was submitted. |
| MediaPipe compatibility | **I:** strong generic benchmark for synchronized RGB/3D, but not a lunge set. |
| KinematicIQ-label compatibility | **I:** only general-motion negatives and camera/pose robustness. |
| Suitable role | **Negative examples** only; otherwise **unsuitable**. |

### 11. KIMORE

**Source and primary paper.** [Official VRAI dataset page](https://vrai.dii.univpm.it/content/kimore-dataset); Capecci et al., [TNSRE paper DOI 10.1109/TNSRE.2019.2923060](https://doi.org/10.1109/TNSRE.2019.2923060).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** five exercises: arm lift, lateral trunk tilt, trunk rotation, pelvis rotation, and squat. No lunge. |
| Subjects | **C:** 78 (44 healthy, 34 with motor dysfunction). |
| Lunge trials/lead side | **Zero confirmed;** not applicable. |
| Video availability | **C:** Kinect v2 RGB and depth with skeleton. |
| Skeleton/reference | **C:** Kinect v2 25-joint skeleton; no synchronized optical reference. |
| Timestamps/frame rate/camera calibration | **NR** in the official summary reviewed. |
| Force/IMU | **C:** none described. |
| Event annotations | **C:** five repetitions per exercise plus clinical/expert quality scores; no lunge events. |
| Subject identifiers | **C:** subject grouping/identifiers are part of the dataset organization. |
| License/commercial/redistribution | **NR:** official page calls the dataset free but states no license. Commercial use and redistribution are unresolved. |
| Access procedure | **C:** official page provides a download link; no application is described. |
| MediaPipe/KinematicIQ compatibility | **I:** usable as non-lunge rehabilitation video and squat confusion negatives, not forward-lunge validation. |
| Suitable role | **Negative examples**; otherwise **unsuitable**. |

### 12. Fitness-AQA

**Source and primary paper.** [Official GitHub repository](https://github.com/ParitoshParmar/Fitness-AQA); Parmar and Morris, [“What and How Well You Performed? A Multitask Learning Approach to Action Quality Assessment”](https://arxiv.org/abs/2202.14019) (CVPR 2022 workshop/associated release).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** back squat, barbell row, and overhead press only. No lunge. |
| Subjects/lunge trials/lead side | **NR subjects; zero confirmed lunge trials;** lead side not applicable. |
| Video availability | **C:** in-the-wild exercise videos with expert error labels, subject to access terms. |
| Skeleton/reference | **C:** no synchronized 3D reference or published skeleton ground truth. |
| Timestamps/frame rate/camera calibration | **NR/heterogeneous** in-the-wild sources. |
| Force/IMU | **C:** none. |
| Event annotations | **C:** action-quality/error annotations for the three lifts, not lunge phases. |
| Subject identifiers | **NR** as stable biomechanical subject IDs. |
| License/commercial/redistribution | **C:** access is restricted to noncommercial research under supplied terms; redistribution is not authorized by the public repository. |
| Access procedure | **C:** submit the official Google request form and accept terms. No request was submitted. |
| MediaPipe/KinematicIQ compatibility | **I:** technically processable video, but only as challenging non-lunge negatives. |
| Suitable role | **Negative examples**; otherwise **unsuitable**. |

### 13. MEx

**Source and primary paper.** [Official UCI record](https://archive.ics.uci.edu/dataset/500/mex); Ni et al., [MEx paper](https://arxiv.org/abs/1908.08992).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** seven physiotherapy exercises performed lying on a pressure mat; none is a lunge. |
| Subjects | **C:** 30. |
| Lunge trials/lead side | **Zero confirmed;** not applicable. |
| Video availability | **C:** no RGB; only heavily downsampled numerical depth frames (12×16). |
| Skeleton/reference | **C:** no optical skeleton/reference. |
| Timestamps/frame rate | **C:** depth approximately 15 Hz with timestamped sensor streams. |
| Camera view/calibration | **C:** overhead depth context; no RGB calibration useful to KinematicIQ. |
| Force/IMU | **C:** two accelerometers and a pressure mat. |
| Event annotations | **C:** exercise-class sequences; no lunge phases. |
| Subject identifiers | **C:** subject/session structure. |
| License/commercial/redistribution | **NR in the reviewed official page text:** do not assume UCI's site-wide defaults cover this record without reading the record license at acquisition. |
| Access procedure | **C:** direct UCI download; no application described. |
| MediaPipe/KinematicIQ compatibility | **C:** no usable RGB and no lunge. |
| Suitable role | **Unsuitable**. |

### 14. Pose2Sim demos and validation-adjacent datasets

**Source and primary paper.** [Official Pose2Sim repository](https://github.com/perfanalytics/pose2sim); Pagnon et al., [Pose2Sim validation paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC8512754/).

| Required field | Audit finding |
|---|---|
| Dataset status and movement | **C:** Pose2Sim is a processing pipeline with demonstrations, not a standardized cohort dataset. No official lunge validation cohort is documented in the demos reviewed. |
| Subjects/lunge trials/lead side | **NR/zero confirmed** as a reusable validation dataset. |
| Video/skeleton/reference/time/calibration | **C:** varies by demo/input. The software supports calibrated multiview video and multiple pose formats; this is capability, not evidence that a lunge dataset exists. |
| Force/IMU/events/IDs | **NR/varies.** |
| License/commercial/redistribution | **C:** repository software terms apply to code; source-dataset rights remain separate. |
| Access procedure | **C:** code is public; individual demo/source assets follow their own links and licenses. |
| MediaPipe/KinematicIQ compatibility | **I:** useful tooling for triangulating KinematicIQ's own capture or converting supported 2D keypoints; not acquisition evidence. |
| Suitable role | **Ontology/tooling only**; as a dataset, **unsuitable**. |

### 15. OpenCap example and validation data

**Source and primary paper.** [Official SimTK OpenCap project](https://simtk.org/projects/opencap); Uhlrich et al., [PLOS Computational Biology paper](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1011462) (2023).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** the public validation release covers walking, squatting, chair rise, and drop jumps; no lunge is listed. Public example sessions are not a documented cohort. |
| Subjects | **C:** 10 healthy subjects in the validation study. |
| Lunge trials/lead side | **Zero confirmed** in validation; example-session count **NR** and not suitable for cohort claims. |
| Video availability | **C:** iPhone videos exist for validation/example workflows; public release variants include with- and without-video packages. |
| Skeleton/reference | **C:** OpenCap outputs plus laboratory marker motion capture; validation included force plates and EMG. |
| Timestamps/frame rate/calibration | **C:** OpenCap uses synchronized/calibrated multi-phone video; exact release-specific values must be read from each session. |
| Force/IMU | **C:** force/EMG in the validation study; no IMU emphasized. |
| Event annotations | **C:** task/trial structure; no forward-lunge event labels. |
| Subject identifiers | **C:** session/trial identifiers. |
| License/commercial/redistribution | **NR for each data package:** SimTK/project code terms do not automatically establish video/participant-data commercial rights. |
| Access procedure | **C:** official SimTK release files and public OpenCap sessions; some use may require an OpenCap account. No account was created. |
| MediaPipe/KinematicIQ compatibility | **I:** valuable generic cross-pipeline benchmark, not a lunge validation source. |
| Suitable role | Generic **angle validation** tooling/reference; for forward lunges, **unsuitable**. |

### 16. AddBiomechanics

**Source and primary paper.** [Official download page](https://addbiomechanics.org/download_data.html) and [Stanford FAIR dataset summary](https://faircenter.stanford.edu/resources/datasets/). The platform aggregates many studies rather than having one lunge-specific primary paper.

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** the core corpus includes walking, jumping, cutting, squatting, sit-to-stand, stairs, and many other tasks. **NR:** no official lunge inventory or KinematicIQ-compatible protocol was identified. |
| Subjects | **C:** core v1 summary: 273 subjects, 70+ hours, 24 million frames. |
| Lunge trials/lead side | **NR;** no confirmed public lunge subtotal. |
| Video availability | **C:** none in the core biomechanics corpus. |
| Skeleton/reference | **C:** optical marker trajectories, standardized musculoskeletal models, OpenSim-compatible outputs. |
| Timestamps/frame rate | **C:** study-dependent motion time series; inspect per-trial metadata. |
| Camera view/calibration | Not applicable without RGB. |
| Force/IMU | **C:** about 80% of frames have synchronized GRF; IMU availability varies/was not established. |
| Event annotations | **NR/heterogeneous** across source studies. |
| Subject identifiers | **C:** study/subject/trial hierarchy, with de-identification. |
| License/commercial/redistribution | **C:** core data advertised under CC BY 4.0; commercial use/redistribution with attribution. Check any source-study exceptions. |
| Access procedure | **C:** official bulk/direct download; no lunge-specific request. |
| MediaPipe/KinematicIQ compatibility | **C:** no end-to-end MediaPipe input. **I:** useful for generic biomechanics priors only if a lunge subset is later confirmed. |
| Suitable role | **Ontology only** / generic **angle validation** priors; not a current lunge acquisition target. |

### 17. BioCV — Synchronised Video, Motion Capture and Force Plate Dataset

**Source and primary paper.** [University of Bath official repository](https://researchdata.bath.ac.uk/1258/); Evans et al., [Scientific Data paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11604968/) (2024).

| Required field | Audit finding |
|---|---|
| Exact movement definition | **C:** repeated walking, running, jumping, and hopping; no lunge in the published movement list. |
| Subjects | **C:** 15 (8 female, 7 male in the paper's detailed description). |
| Lunge trials/lead side | **Zero confirmed;** not applicable. |
| Video availability | **C:** nine synchronized 1920×1280 RGB views at 200 fps, H.265/YUV444, with marker and markerless blocks. |
| Skeleton/reference | **C:** 15-camera Qualisys marker data at 200 Hz, C3D, plus force plates. |
| Timestamps/frame rate | **C:** video/mocap 200 Hz; force plates 1,000 Hz; timing LEDs and aligned/cropped releases. |
| Camera view/calibration | **C:** intrinsics, extrinsics, and distortion provided for nine views. |
| Force/IMU | **C:** four Kistler force plates; no IMU described. |
| Event annotations | **C:** task/trial structure; no lunge events. |
| Subject identifiers | **C:** participant/trial file hierarchy. |
| License/commercial/redistribution | **C:** access terms restrict use to biomechanics/machine-vision purposes and prohibit sharing outside the approved dataset use; repository material indicates rights are reserved. Commercial use is not affirmatively granted. |
| Access procedure | **C:** request through the Bath Data Archive and agree to ethical-use conditions; access is described as unlikely to be denied. No request was made. |
| MediaPipe/KinematicIQ compatibility | **I:** excellent generic camera/pose accuracy stress test, but no forward-lunge content. |
| Suitable role | Generic **angle validation** and **negative examples**; for lunge activation, **unsuitable**. |

### 18. Partnership-only lunge validity studies

**Identified study.** Tang et al., “The Validity and Usability of Markerless Motion Capture and Inertial Measurement Units for Measuring Lower-Extremity Kinematics” (Medicine & Science in Sports & Exercise, DOI [10.1249/MSS.0000000000003579](https://doi.org/10.1249/MSS.0000000000003579)). Public abstracts describe 30 adults performing lunges while Theia/OptiTrack, Vicon, APDM IMUs, and a VALD RGB-D system were compared simultaneously.

| Required field | Audit finding |
|---|---|
| Exact movement/subjects | **C:** lunges among lower-extremity tasks; 30 adults. **NR:** forward vs reverse, start/return, trials, sides, and cadence. |
| Lunge trials/lead side | **NR.** |
| Video/skeleton/reference | **C:** simultaneous markerless and marker-based systems were used in the study. **NR:** whether raw RGB, calibration, markers, or per-trial outputs are shareable. |
| Timestamps/frame rate/camera calibration | **NR** publicly. |
| Force/IMU | **C:** APDM IMU; force plates are not established by the reviewed abstract. |
| Events/IDs | **NR.** |
| License/commercial/redistribution | **NR:** no public dataset record or license was identified. |
| Access procedure | **Partnership only:** a formal data-sharing agreement with the investigators/institution would be required if data are retained and consent permits sharing. The user prohibited contact, so availability was not tested. |
| MediaPipe/KinematicIQ compatibility | **I:** potentially valuable if original RGB and synchronization can be shared; Theia/VALD outputs alone are not MediaPipe inputs. |
| Suitable role | Potential **angle validation** or **locked activation evidence** only after protocol, consent, raw-data, synchronization, and commercial-rights review; presently unavailable. |

## Repository coverage and negative search result

Official records and primary papers were searched across Zenodo, Figshare/Figshare+, Mendeley Data, SimTK, UCI, university repositories, OSF-indexed web results, and general scholarly search. IEEE DataPort blocked public crawling during this audit; no qualifying DataPort record could be confirmed from accessible official metadata. No additional OSF record was found that established all of: forward/anterior lunge, original RGB, synchronized laboratory 3D, and force plates. “No additional qualifying record identified” is a search result, not proof that no such private or poorly indexed dataset exists.

## 1. Ranked acquisition shortlist

1. **A Synchronized Marker-based and Markerless Motion Capture Dataset (Zenodo v2).** Acquire first because it is open, small (~1.1 GB plus code), commercial-friendly, and directly pairs RGB with optical markers. Treat the first pass as a metadata/protocol qualification, not validation.
2. **SIAT-LLMD.** Acquire for the closest documented bilateral standing→step→lunge→retract biomechanics and force/EMG reference. It cannot validate MediaPipe directly.
3. **REHAB24-6.** Acquire for synchronized RGB/optical data, repetition boundaries, and correct/incorrect examples, subject to noncommercial or separately licensed use and visual protocol screening.
4. **Twente six-sensor dataset plus companion RGB.** Acquire only after internal rights review; it is the best force-rich RGB candidate, but its dataset license and exact video/protocol details are unresolved.
5. **FMS Azure Kinect dataset.** Acquire the lunge subset for bilateral multiview video, timestamp handling, and scoring/ontology work; do not use it as unconstrained forward-lunge ground truth.
6. **MM-Fit.** Acquire for alternating-lunge development, pose robustness, and negative/error examples under the RGB CC BY license.
7. **UI-PRMD and the 183-athlete Movement Screen dataset.** Acquire as low-friction skeleton/mocap references, not end-to-end video validation.
8. **Gait_Posture_dataset.** Acquire only for published-feature/reliability context; it cannot replace raw trials.
9. **Partnership study data.** Pursue only if the internal capture is delayed and the institution can share original RGB plus synchronized reference data under commercial terms.

## 2. Exact approval needed for each shortlisted source

| Source | External approval | Internal approval before KinematicIQ product use |
|---|---|---|
| 2026 synchronized Zenodo dataset | None under CC BY 4.0; attribution required | Legal/privacy/biometric-data review; protocol qualification sign-off |
| SIAT-LLMD | None under CC0 | Privacy/biometric and scientific-validity review; no RGB claimant evidence |
| REHAB24-6 | None for internal noncommercial research under CC BY-NC 4.0; **written commercial license from the stated rights holder** for commercial/product use | Legal approval of commercial grant; protocol qualification |
| Twente six-sensor | **Written dataset-license clarification or grant from the data rights holder** before commercial use or redistribution | Legal approval; confirm companion video is covered; privacy review |
| FMS Azure Kinect | None under CC0 | Privacy/biometric review and explicit acceptance that this is FMS in-line lunge, not protocol truth |
| MM-Fit | None for Zenodo RGB under CC BY 4.0; confirm the license for non-video sensor archives | Legal confirmation of mixed-asset terms; attribution plan |
| UI-PRMD | None under PDDL 1.0 if an official/archived copy is obtained | Provenance check and scientific-validity review |
| 183-athlete Movement Screen | None under CC0 | Scientific-validity review, especially youth/athlete population applicability |
| Gait_Posture_dataset | None under CC BY 4.0 | Confirm derivative-only use and attribution; do not imply raw validation |
| Partnership study | Investigator/institution approval, consent compatibility, data-use agreement, security terms, and explicit commercial/model-validation rights | Legal, privacy, security, and scientific protocol approval |

## 3. Files expected after acquisition

| Source | Minimum expected inventory |
|---|---|
| 2026 synchronized Zenodo | `01_participant_metadata.zip`; `02_marker_based_data.zip` with C3D; `03_markerless_data.zip` with two smartphone streams; `04_code_and_model_data.zip`; checksums |
| SIAT-LLMD | subject-information workbook; 40 subject folders; LUGF/LUGB CSVs; time, 8 angle, 8 torque, and 9 sEMG channels; labels; processing code; any C3D/TRC/MOT files actually included |
| REHAB24-6 | `videos.zip`; 2D/3D marker and 26-joint archives; joint/marker-name files; `Segmentation.csv`; `Segmentation.txt` |
| Twente | raw `.qtm`, `.mvn`, insole text, and companion RGB; processed subject/trial `.mat`; OpenSim models, IK/ID setup/results; manual GRF-derived bounds |
| FMS Azure Kinect | front/side color JPG sequences; depth PNG; 32-joint JSON; expert-score JSON; auxiliary color views; frame/timestamp naming metadata |
| MM-Fit | two RGB/depth streams; synchronized wearable CSVs; 2D OpenPose and lifted-3D estimates; workout/subject mapping; set boundaries and rep-count labels |
| UI-PRMD | segmented/unsegmented Kinect and Vicon ASCII files; joint positions and angles; subject/movement/repetition naming documentation |
| 183-athlete screen | per-athlete C3D and MAT files; demographics; lunge protocol supplement; marker-name/model documentation |
| Gait_Posture_dataset | lunge detailed-feature CSV; data dictionary; READMEs; analysis scripts; reliability/agreement outputs; no assumption of raw video/time series |

For every acquisition, generate a manifest with file path, byte size, checksum, subject, session, movement, lead side, repetition count, modality, native rate, time origin, and license source. The manifest is the point at which “NR” trial counts can be replaced by exact counts.

## 4. Skeleton-mapping requirements

KinematicIQ should not compare angles until the coordinate and joint-definition mapping is explicit.

1. **Define the KinematicIQ canonical schema.** At minimum: left/right hip, knee, ankle, heel, forefoot/toe, shoulder, and pelvis center; 2D image coordinates, normalized coordinates, and any world-coordinate estimate; confidence/visibility; frame timestamp.
2. **Map MediaPipe Pose 33 landmarks.** Use hip/knee/ankle/heel/foot-index directly for sagittal knee/ankle constructs; define pelvis as the hip midpoint and trunk from pelvis to shoulder midpoint. MediaPipe landmarks are surface proxies, not anatomical joint centers.
3. **Optical-marker datasets (2026 Zenodo, REHAB24-6, UI-PRMD, Twente, 183-athlete).** Reconstruct anatomical hip/knee/ankle joint centers from each marker protocol before comparison. Do not map a skin marker directly to a MediaPipe joint without stating the offset/model. Preserve each source's global axes, units, handedness, and Euler/Cardan order.
4. **Azure Kinect 32 joints.** Map pelvis, hip, knee, ankle, foot, spine/chest, and shoulders to the canonical schema; document Azure's joint-center model and confidence. Compare angles only after matching plane definitions.
5. **REHAB24 26 joints and UI-PRMD Kinect 22 joints.** Use the supplied name files/paper definitions. Build explicit left/right lookup tables and test them on a known pose; do not assume array order.
6. **MM-Fit OpenPose/lifted 3D.** Treat as model output, not reference truth. Convert OpenPose BODY layout to the canonical schema and keep model-to-model comparisons separate from optical-reference error.
7. **SIAT/OpenSim and Twente/OpenSim.** Match OpenSim coordinate definitions/signs to KinematicIQ's geometric angles. A model coordinate such as knee flexion is not automatically identical to the 2D angle formed by hip–knee–ankle landmarks.
8. **Temporal alignment.** Retain native timestamps, then align by documented trigger/timebase. Resampling alone does not synchronize. Report constant offset, drift, dropped frames, and interpolation method; use force-contact events as an independent check where available.
9. **Validation outputs.** Report per-side and per-phase bias, MAE/RMSE, limits of agreement, coverage after confidence filtering, and sensitivity to view. Never pool left/right or front/sagittal views before checking systematic differences.

## 5. Remaining gaps no public dataset can close

- No confirmed public dataset combines KinematicIQ's exact forward-lunge instructions, quiet standing start, anterior step, bottom position, push-off, and return to the same standing posture with original RGB, synchronized laboratory 3D, force plates, both lead sides, repeated trials, and commercial-clear rights.
- The leading 2026 RGB/OptiTrack release lacks enough public protocol and synchronization documentation to qualify before acquisition.
- SIAT-LLMD closes the movement/force/bilateral gap but has no trial RGB.
- Public video sets either use a different movement (FMS in-line, alternating workout, or split-stance rehabilitation lunge) or lack optical/force ground truth.
- No audited source provides KinematicIQ's exact event ontology: ready/quiet standing, step initiation, lead-foot contact, peak depth, ascent/push-off, trailing-foot recovery, and stable return.
- No source is demonstrably representative of KinematicIQ's deployment cameras, distance, height, clothing, lighting, occlusion, floor, device processing, and user population.
- No source supports a defensible product threshold for failed repetitions, partial returns, off-axis steps, extra steps, pauses, loss of balance, or leaving the frame under KinematicIQ's instructions.
- No public set supplies enough protocol-matched repeats to estimate within-person repeatability, between-session drift, and both-side asymmetry for the target workflow.
- Commercial permission is absent or ambiguous for several technically attractive datasets, and open licensing does not itself settle human-image/privacy obligations.

## 6. Recommendation for original KinematicIQ capture

Run a protocol-matched validation capture and treat public data as supporting evidence, not the activation set.

**Recommended trial.** Begin in quiet feet-together or standardized stance; on cue, step anteriorly with the assigned lead foot onto a force plate, descend to the KinematicIQ-defined bottom criterion, ascend/push off, retract the lead foot, and regain stable starting stance. Record left and right lead in randomized blocks, at least 3–5 valid repetitions per side plus deliberately scripted failure modes. Specify footwear, step target/tolerance, cadence policy, arm position, gaze, and whether rear-knee contact is prohibited.

**Recommended acquisition.** Use the exact KinematicIQ target camera/device and app settings as the primary RGB stream, ideally 60 fps or higher with raw monotonic timestamps. Add frontal and sagittal reference RGB views; hardware-synchronize them to a calibrated optical system (approximately 100–200 Hz) and two force plates (approximately 1,000 Hz). Release/retain camera intrinsics, extrinsics, distortion, exposure, resolution, rolling-shutter information, and synchronization residuals. Capture a marker block for ground truth and a separate markerless block for deployment realism.

**Recommended labels.** At minimum: instruction/cue, stable-ready start, lead-foot toe-off or first displacement, lead-foot initial contact, full-foot contact, peak depth, ascent onset, push-off, return-foot contact, feet-restored, and stable-end. Store annotator, method (force/kinematic/manual), uncertainty, invalidity reason, lead side, repetition number, and quality/error tags. Define KinematicIQ angles and event tolerances before labeling.

**Recommended cohort and analysis.** Use a prospective sample-size calculation based on the required confidence interval for angle and event error. Include variation in age, sex, height, body mass, limb dominance, mobility, skin tone, clothing, footwear, and camera environment consistent with intended use. Split by subject, lock the activation set before threshold tuning, and reserve a session-separated holdout. Report per-side, per-view, per-phase, and per-demographic performance with confidence intervals; include failure-to-track and excluded-trial rates.

**Activation rule.** Do not lock thresholds from any public dataset alone. Lock only after the original holdout demonstrates prespecified angle error, event timing error, repeatability, side parity, and failure-mode behavior under the exact KinematicIQ protocol and deployment camera conditions.

## Source integrity note

All factual claims above were limited to primary papers and official repository/project pages. Repository license statements were kept separate from article licenses. Exact counts were not reverse-engineered from unacquired archives, and ambiguous protocol terms were left as **NR** or **I** rather than converted into facts.
