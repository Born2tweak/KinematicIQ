# Public Movement & Biomechanics Dataset Research

**Prepared for KinematicIQ**

**Research date:** 2026-07-10

**Scope:** public datasets, benchmarks, repositories, and validation resources relevant to browser-based MediaPipe Pose movement analysis.

## Executive summary

No single public dataset covers KinematicIQ's full need: consumer RGB video, MediaPipe-compatible landmarks, synchronized marker-based kinematics and kinetics, repeated exercise repetitions, expert technique labels, multiple camera angles, occlusion, and a commercial-use license. The best strategy is therefore a **portfolio**:

1. **OpenCap validation data, BML-MoVi, MoVi, and AddBiomechanics** for biomechanical ground truth and joint-angle validation.
2. **Human3.6M, MPI-INF-3DHP, 3DPW, HumanEva, TotalCapture, and CMU Panoptic** for camera/viewpoint and 3D-pose benchmarking.
3. **KIMORE, UI-PRMD, IRDS, and LLM-FMS** for rehabilitation/exercise protocol logic and quality scoring.
4. **UCF101, NTU RGB+D 120, Penn Action, FineGym, FineDiving, Fitness-AQA, GolfDB, and SportsPose** for movement segmentation, sports, and action-quality concepts.
5. **COCO Keypoints, MPII, PoseTrack, CrowdPose, OCHuman, and HiEve** for 2D tracking, temporal consistency, crowds, and occlusion stress tests.
6. **AMASS and CMU MoCap** for large-scale movement priors and protocol exploration, but not direct validation of MediaPipe on RGB.
7. **BEDLAM, AGORA, SURREAL, SynBody, GTA-Human, and 3DPeople** for controlled perturbation and future ML work; synthetic-to-real domain gap prevents their use as clinical ground truth.

The most actionable immediate step is a **small, legally reviewed benchmark pack**, not wholesale downloading. Start with OpenCap's ten-subject validation set, UI-PRMD, KIMORE, SportsPose, MPI-INF-3DHP test data, 3DPW, selected BML-MoVi actions, COCO validation images, PoseTrack validation clips, and UCF101 exercise classes. Run MediaPipe in the browser, retain raw and filtered landmarks, and compare task-specific metrics rather than a single aggregate score.

> **Licensing warning:** â€œpublicly downloadableâ€ does not mean â€œcommercially reusable.â€ Many flagship datasets are academic/research-only, and YouTube-derived datasets inherit media-rights uncertainty. Dataset licenses, participant consent, biometric/privacy obligations, and model/body-asset licenses (notably SMPL/SMPL-X) require counsel review before product use. The statements below are research guidance, not legal advice.

## How to interpret this report

- **Pose labels** means explicit 2D/3D joints, skeletons, or body-model parametersâ€”not merely an action class.
- **Biomechanics** means anatomical kinematics, kinetics, force plates, EMG, or marker trajectories suitable for quantitative validation.
- **Commercial use** is â€œunclearâ€ unless the official terms explicitly permit it. A code repository's license does not automatically license its data.
- **Size** is approximate and often depends on selected modalities/views. â€œLarge/very largeâ€ is used where official hosts expose multiple packages rather than a stable total.
- **Recommended** means useful to KinematicIQ's current deterministic product, not necessarily suitable for ML training.

## Priority comparison matrix

| Dataset | Movement type | Subjects | Videos / scale | Pose labels | 3D | Exercises | Sports | License / commercial status | Download | Best use | Difficulty | Recommended |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| [OpenCap validation](https://simtk.org/projects/opencap) | Gait, squat, sit-to-stand, drop jump, running | 10 validation participants | Synchronized smartphone + lab data | Keypoints, markers, OpenSim | Yes | Yes | Some | Research data; verify SimTK terms; commercial not established | Registration; moderate | Joint angles, kinetics, end-to-end validation | Medium | **Yesâ€”highest** |
| [BML-MoVi](https://www.biomotionlab.ca/movi/) | 21 everyday/exercise actions | 90 | 9 h MoCap, 17 h video, 4 views, 6.6 h IMU | Markers, SMPL-derived resources | Yes | Yes | Limited | Research terms/registration; commercial unclear | Large | RGB-to-MoCap angle validation | High | **Yes** |
| [MoVi](https://www.biomotionlab.ca/movi/) | 20 scripted + 1 self-selected movement set | 90 | Multi-view video, optical MoCap, IMU | 2D/3D, markers | Yes | Yes | Limited | Research-oriented terms | Large | Multi-view and temporal validation | High | **Yes** |
| [AddBiomechanics](https://addbiomechanics.org/) | Walking, running, sports, clinical and diverse MoCap trials | Thousands across contributed studies | >100 years-equivalent motion reported by project; evolving | Markers, OpenSim states | Yes | Yes | Yes | Per-dataset terms; platform/code Apache-2.0 does not guarantee data rights | Large; selective | Protocol priors, OpenSim references | Mediumâ€“High | **Yes, selectively** |
| [Human3.6M](http://vision.imar.ro/human3.6m/description.php) | 15 daily actions | 11 | 3.6M poses, 4 RGB cameras + depth/ToF | High-quality 2D/3D joints | Yes | No | No | Academic use only; registration | Very large | Camera-angle and 3D pose benchmark | High | Yes, research only |
| [MPI-INF-3DHP](https://vcai.mpi-inf.mpg.de/3dhp-dataset/) | Indoor/outdoor actions | 8 train; 6 test | 14-camera green-screen studio; outdoor test | 2D/3D joints | Yes | General | Limited | Research use; agreement/registration | Large | Generalization, outdoor/viewpoint testing | Mediumâ€“High | **Yes** |
| [3DPW](https://virtualhumans.mpi-inf.mpg.de/3DPW/) | In-the-wild daily motion | 18 | 60 sequences, ~51k frames | IMU-assisted SMPL poses | Yes | General | Some | Non-commercial scientific research; registration | ~30 GB class | Moving camera/in-the-wild | Medium | **Yes** |
| [HumanEva-I](http://humaneva.is.tue.mpg.de/) | Walk, jog, gestures | 4 | 7 calibrated video views + MoCap | 3D joints | Yes | No | Running | Research-only terms | Moderate | Classic video/MoCap validation | Medium | Yes |
| [TotalCapture](https://cvssp.org/data/totalcapture/) | Walking, running, ROM, acting | 5 | 8 HD views + Vicon + 13 IMUs | 3D joints / MoCap | Yes | Yes | Running | Non-commercial research; request access | Large | Sensor fusion and synchronized validation | High | **Yes** |
| [CMU Panoptic Studio](https://domedb.perception.cs.cmu.edu/) | Multi-person social motion | ~100 | 65 sequences, 5.5 h, 1.5M skeletons; 480 VGA + 31 HD + 10 RGB-D | 3D body/face/hands | Yes | No | No | Research only; commercial prohibited | Extremely large; view-selectable | Viewpoint, self/people occlusion | High | Yes, sampled |
| [SportsPose](https://sportsposes.github.io/) | Golf, tennis, football, badminton, volleyball | 24 | >176k 3D poses; multi-camera markerless capture, Vicon subset | 3D joints | Yes | No | Yes | Check official agreement; research dataset | Moderateâ€“large | Dynamic sports pose and camera robustness | Medium | **Yes** |
| [OpenCapBench](https://openaccess.thecvf.com/content/WACV2025/html/Gozlan_OpenCapBench_A_Benchmark_to_Bridge_Pose_Estimation_and_Biomechanics_WACV_2025_paper.html) | Biomechanics-focused multi-view movement | See paper/release | Multi-view video + marker-based MoCap/forces | 2D/3D and biomechanics | Yes | Yes | Some | Release terms must be checked; new research benchmark | Access via project/paper | Pose-to-biomechanics evaluation | Medium | **Yesâ€”watch/retrieve** |
| [COCO Keypoints](https://cocodataset.org/) | In-the-wild people | Many | 58,945 train/val images; 156,165 annotated people; 17 joints | 2D | No | Incidental | Incidental | Image-specific Creative Commons terms; annotations CC BY 4.0; commercial rights not uniform | ~25 GB train/val images | Landmark detection and visibility | Low | Yes |
| [MPII Human Pose](https://www.mpi-inf.mpg.de/departments/computer-vision-and-machine-learning/software-and-datasets/mpii-human-pose-dataset) | 410 activities | >40k people | ~25k images; optional video context | 16-joint 2D, occlusion | No | Yes | Yes | Simplified BSD annotations; images research-only/no commercial use | 12.9 GB images; videos ~425 GB | Movement diversity and occlusion | Medium | Yes, sampled |
| [PoseTrack](https://posetrack.net/) | Multi-person video | Many | PoseTrack18: 1,138 clips / 153k pose annotations | 2D pose + identity tracks | No | Incidental | Incidental | Research benchmark; source-video rights constrain commercial use | Moderate | Jitter, identity, temporal tracking | Medium | **Yes** |
| [CrowdPose](https://github.com/Jeff-sjtu/CrowdPose) | Crowded people | Many | 20k images, ~80k persons | 14-joint 2D | No | No | Incidental | Research dataset; image rights mixed; check terms | Moderate | Inter-person occlusion | Low | Yes |
| [OCHuman](https://github.com/liruilong940607/OCHumanApi) | Heavily occluded people | Many | 4,731 images, 8,110 people | 17 keypoints + masks | No | No | Incidental | Research use; underlying image rights mixed | Small | Severe occlusion stress test | Low | **Yes** |
| [HiEve](http://humaninevents.org/) | Crowded public events | Many | 32 video sequences, >1M boxes; pose subset | 2D pose/tracks | No | No | Public-event motion | Research agreement | Large | Long-duration tracking/occlusion | Medium | Yes |
| [KIMORE](https://vrai.dii.univpm.it/content/kimore-dataset) | Five rehabilitation exercises | 78 (44 healthy, 34 patients) | Repetitions captured with Kinect v2 | RGB-D skeleton; clinical scores | Yes (Kinect) | Yes | No | Research/academic; registration/terms; commercial unclear | Moderate | Quality scores and rehab protocols | Lowâ€“Medium | **Yes** |
| [UI-PRMD](https://webpages.uidaho.edu/ui-prmd/) | Ten physical rehabilitation movements | 10 | 10 repetitions each; 1,000 samples | Vicon + Kinect skeletons | Yes | Yes, including deep squat | No | Public research dataset; verify use terms | Smallâ€“moderate | Rep segmentation and Kinect/Vicon comparison | Low | **Yesâ€”immediate** |
| [IRDS](https://github.com/irfanICMLL/IRDS) | Correct/incorrect rehabilitation exercise | 15 (reported by paper) | Kinect sequences across 9 exercises | Skeleton + correctness labels | Yes | Yes | No | Check repository/data terms; research use | Small | Error-mode protocol design | Low | Yes |
| [LLM-FMS](https://github.com/Zhouziyuya/LLM-FMS) | Functional Movement Screen | See release | Seven FMS actions with fine-grained quality/reasoning labels | Derived pose/video labels | Varies | Yes | Functional movement | Research release; verify media and code licenses | Moderate | Explainable coaching taxonomy | Medium | **Yes, protocol research** |
| [Fitness-AQA](https://github.com/ParitoshParmar/Fitness-AQA) | Weightlifting/exercise quality | Athletes in source videos | 3 exercise classes; repetition/action quality labels | No native pose | No | Yes | Weightlifting | Research use; YouTube/media rights unclear | Moderate | AQA concepts, not biomechanical truth | Low | Yes, conceptual |
| [FineGym](https://sdolivia.github.io/FineGym/) | Artistic gymnastics | Elite athletes | 708 long videos; 32,697 action instances; 530 fine actions | Temporal hierarchy, no keypoints | No | No | Gymnastics | Research only; broadcast rights | Large | Fine-grained phase segmentation | Medium | **Yes** |
| [FineDiving](https://finediving.ivg-research.xyz/) | Competitive diving | Elite athletes | 3,000 video clips; 52 action types | Procedure/step and score labels | No | No | Diving | Research use; broadcast rights | Moderate | Procedure-aware quality logic | Lowâ€“Medium | Yes |
| [GolfDB](https://github.com/wmcnally/golfdb) | Golf swings | 248 golfers | 1,400 swings; 390k frames; 8 swing events | Event labels, no pose | No | No | Golf | Research dataset; YouTube-derived, commercial unclear | Moderate | Phase/event detection | Low | **Yes, golf protocol** |
| [Penn Action](https://dreamdragon.github.io/PennAction/) | 15 actions | Many | 2,326 clips | 13-joint 2D + action labels | No | Exercise | Baseball, tennis, golf, jumping | Research benchmark; web-video rights unclear | ~1 GB class | Rep/action phase and 2D pose | Low | **Yes** |
| [UCF101](https://www.crcv.ucf.edu/research/data-sets/ucf101/) | 101 actions | Many | 13,320 clips | Action class only | No | Squat, lunges, pushups, pullups, bench press | Many sports | Research dataset; YouTube-derived rights unclear | ~7 GB | Protocol discovery / robustness clips | Low | **Yes, sampled** |
| [NTU RGB+D 120](https://rose1.ntu.edu.sg/dataset/actionRecognition/) | 120 daily/exercise/interaction actions | 106 | 114,480 samples; 155 views/setups; RGB, depth, IR, 25-joint skeleton | 3D skeleton | Yes | Squat, jump, cross-toe touch | Martial actions | Academic/non-commercial agreement | Very large | Cross-view skeleton/action benchmark | High | **Yes, selected actions** |
| [AMASS](https://amass.is.tue.mpg.de/) | Aggregated human MoCap | >300 reported in original release; expanded collections | >40 h original release; many source datasets | SMPL body parameters | Yes | Broad | Broad | Non-commercial scientific research; source licenses also apply | ~100+ GB depending package | Movement priors/protocol expansion | High | Yes, not direct RGB validation |
| [CMU MoCap](http://mocap.cs.cmu.edu/) | 2,605 motion trials / 23 categories | 144 | Optical marker trajectories; no RGB | Markers/skeleton | Yes | Exercise/daily | Sports, running, jumping | Free for all uses per CMU FAQ, attribution requested; verify individual assets | ~10 GB class | Motion repertoire and synthetic rendering | Medium | **Yes** |
| [ACCAD](https://accad.osu.edu/research/motion-lab/mocap-system-and-data) | Dance, sports, locomotion | Multiple | BVH motion clips | Skeleton | Yes | Some | Yes | Check ACCAD terms; commonly redistributed via AMASS under stricter terms | Smallâ€“moderate | Protocol motion references | Low | Selectively |
| [KIT Whole-Body Human Motion Database](https://motion-database.humanoids.kit.edu/) | Whole-body daily/manipulation motion | Multiple | Thousands of motions + semantic labels | MoCap/kinematic | Yes | Some | Limited | Registration/research terms | Moderate | Semantic movement phases | Medium | Yes |
| [D-FAUST](https://dfaust.is.tue.mpg.de/) | Dynamic body shapes/motions | 10 | 40k 3D scans, 129 sequences | Dense 4D surface/SMPL registrations | Yes | Limited | Limited | Non-commercial research | Large | Body-shape deformation, future ML | High | Future only |
| [BEDLAM](https://bedlam.is.tue.mpg.de/) | Synthetic in-the-wild motion | 271 body shapes | ~1M images / 10k motion sequences | SMPL-X, masks, depth | Yes | Broad | Broad | Research-only; asset/SMPL-X constraints | Very large | Occlusion/view/camera perturbation | High | Future ML |
| [BEDLAM 2.0](https://bedlam2.is.tue.mpg.de/) | Synthetic humans/cameras in motion | Diverse bodies | >8M images | SMPL-X/body and camera GT | Yes | Broad | Broad | Research purposes; third-party asset terms | Extremely large | Moving-camera and world-coordinate robustness | Very high | Future ML |
| [AGORA](https://agora.is.tue.mpg.de/) | Synthetic crowded realistic scenes | >350 scans | ~17k images / ~173k people instances | SMPL/SMPL-X, masks | Yes | Broad poses | Incidental | Non-commercial scientific research; registration | Large | Crowds, body shape, occlusion | Medium | Future ML |
| [SURREAL](https://www.di.ens.fr/willow/research/surreal/data/) | Synthetic humans from MoCap | 145 textures/body identities | 6.5M frames | 2D/3D pose, depth, parts, flow, normals | Yes | Broad | Broad via MoCap | Research-oriented; SMPL and source-data constraints | Very large | Controlled perturbations | High | Future ML |
| [SynBody](https://synbody.github.io/) | Synthetic clothed humans | 10,000 models | 1.2M+ images; 1,187 actions | SMPL/SMPL-X, masks/layers | Yes | Broad | Broad | CC BY-NC-SA 4.0; **non-commercial**; SMPL-X separate | Very large | Diversity and future ML | High | Future ML |
| [GTA-Human](https://caizhongang.github.io/projects/GTA-Human/) | Synthetic/game-world motion | >600 identities | 1.4M frames, 20k sequences | SMPL + 2D/3D | Yes | Broad | Some | Research only; GTA V assets prohibit product reuse | Large | In-the-wild camera/context | High | Future ML |
| [3DPeople](https://cv.iri.upc-csic.es/) | Synthetic multi-view people | 80 identities | ~2.5M images, 70 actions, 4 cameras | 2D/3D joints, depth, masks | Yes | Broad | Some | Research use; confirm project terms | Very large | Controlled view/occlusion tests | High | Future ML |

## Detailed findings by domain

### 1. Human pose estimation and tracking

#### Core 2D benchmarks

- **COCO Keypoints** is the practical compatibility baseline because MediaPipe-style body landmarks can be mapped to COCO's 17 joints. It provides scale, clutter, truncation, and visibility flags but consists mostly of isolated images; it cannot measure temporal jitter, joint angles against laboratory truth, or repetition segmentation. The official site reports 330k images and 250k people with keypoints across all releases; the 2017 train/validation keypoint subset contains 58,945 images and 156,165 annotated people.
- **MPII Human Pose** provides much broader movement semantics than COCO: about 25k images, >40k people, and 410 activity labels, plus occlusion annotations and adjacent unannotated frames. It is especially valuable for mining exercises and sports. The official download page explicitly says commercial use of images is not allowed.
- **CrowdPose** deliberately balances easy, medium, and hard crowding. It is a better occlusion challenge than COCO but has no biomechanical truth and uncertain underlying-image rights.
- **OCHuman** is a compact, high-value regression suite for severe person-person occlusion because it includes both keypoints and instance masks. A browser test harness can run its 4,731 images cheaply.
- **AI Challenger Human Keypoint** contains roughly 300k images and ~700k person instances with 14 joints. The original competition has ended and official hosting/terms are less dependable; use only after locating the authoritative license package. It remains historically useful but is lower priority than COCO/CrowdPose.
- **COCO-WholeBody** extends COCO to 133 keypoints (body, feet, face, hands). It can help assess feet and hand context, but KinematicIQ should not infer that hand/face density improves lower-limb biomechanics. It inherits COCO media-rights complexity.
- **Halpe-FullBody** adds 136 full-body keypoints over in-the-wild images. Useful for foot/ankle and whole-body mapping research; licensing and underlying images must be reviewed.

#### Temporal tracking benchmarks

- **PoseTrack 2017/2018/2021** supplies per-frame pose and identity tracks in crowded videos. It is the best immediate benchmark for raw-versus-filtered landmark jitter, dropout duration, and identity continuity. It does not provide 3D or joint-angle truth.
- **HiEve** provides long, complex public-event videos with heavy occlusion and human tracks; its pose track is useful for robustness, not biomechanics.
- **J-HMDB** has 928 clips across 21 actions with 15-joint puppet masks, segmentation, optical flow, and pose. Its short, trimmed clips are useful for temporal segmentation experiments but dated and small.
- **Penn Action** uniquely combines short sports/exercise clips with frame-level 2D joints and action labels. Its action set includes baseball pitch, golf swing, tennis serve/forehand, jumping jacks, pushups, pullups, squats, and bench press.
- **JRDB-Pose** records crowded indoor/outdoor campus scenes from a mobile robot with 2D poses and tracking. Its unusual moving-camera viewpoint is valuable for robustness but unlike a fixed coaching camera.

#### Core 3D benchmarks

- **Human3.6M** remains the canonical controlled monocular 3D benchmark. Four calibrated cameras, repeated actions, and accurate MoCap make it good for view sensitivity. Its limited actors, indoor studio, ordinary actions, and academic-only license severely limit direct product relevance.
- **MPI-INF-3DHP** improves generalization with 14 views, green-screen compositing, varied clothing, and indoor/outdoor test scenes. Use the test set to compare MediaPipe's normalized/world landmarks and 2D reprojection, while acknowledging different skeleton definitions.
- **3DPW** adds moving phone cameras and outdoor scenes; IMUs and SMPLify produce 3D body estimates. It is closer to consumer video but its â€œground truthâ€ is model-fitted rather than laboratory-marker anatomical angles.
- **HumanEva-I** and **TotalCapture** are smaller but valuable because synchronized marker-based motion is paired with calibrated RGB. TotalCapture's IMUs strengthen temporal validation.
- **CMU Panoptic Studio** is unmatched for view-count and multi-person occlusion: 480 VGA, 31 HD, and 10 Kinect II sensors; 65 sequences, 5.5 hours, and 1.5 million 3D skeletons. Download selected HD views, not the full corpus.
- **MuPoTS-3D / MuCo-3DHP** target multi-person outdoor 3D pose and composited training, respectively. They are useful for occlusion testing but less relevant to single-user coaching.
- **HUMBI** contains multiview body, face, hand, gaze, and garment data from 772 subjects. It offers demographic/view diversity; check its research terms and large storage needs.
- **DNA-Rendering / GeneBody / ZJU-MoCap** emphasize high-quality multiview human rendering and body reconstruction. They are valuable for future model research, not current deterministic biomechanics.
- **AthletePose3D** (CVPR Workshops 2025) is a newer sports-oriented 3D pose benchmark. It should be monitored and legally evaluated as release artifacts mature; it is promising for high-dynamic-pose generalization but is not yet as operationally proven as SportsPose.

### 2. Exercise, fitness, and movement-quality datasets

| Dataset | Content and labels | Value to KinematicIQ | Principal limitation |
|---|---|---|---|
| UI-PRMD | 10 subjects Ã— 10 repetitions Ã— 10 rehab movements; Vicon and Kinect skeletons; includes deep squat, hurdle step, lunge, sit-to-stand | Direct rep segmentation, angle comparison, protocol thresholds | Small, controlled, mostly healthy subjects |
| KIMORE | 44 healthy + 34 patients; 5 rehab exercises; Kinect RGB/depth/skeleton; clinician scores | Clinician-linked quality scoring and patient variability | Kinect skeleton â‰  anatomical MoCap; score granularity limitations |
| IRDS | Correct and incorrect performance of nine rehab exercises, skeleton sequences | Exercise-error taxonomy and deterministic coaching rules | Small; verify exact release terms and subject counts |
| LLM-FMS | Seven Functional Movement Screen actions with fine-grained labels/reasoning | Closest public resource to explainable functional-movement coaching | New; label provenance and commercial rights need review |
| Fitness-AQA | Back squat, front raise, and overhead press quality assessment derived from instructional/online videos | AQA formulation, rep clips, failure-mode ideas | No lab ground truth; media rights; small exercise set |
| EC3D / Exercise Correction 3D resources | Correct/incorrect exercise skeletons used in exercise-correction papers | Candidate protocol evidence | Releases are fragmented; accept only verified official packages |
| Fit3D | Large multiview 3D human dataset with exercises and SMPL-X/3D annotations | Strong future pose/shape and exercise benchmark | Research-oriented access; very large; not laboratory kinetics |
| MM-Fit | Multimodal fitness dataset using inertial sensors and video across exercises | Rep counting and temporal segmentation | Pose/biomechanical labels limited; wearable dependence |
| MEx | Multimodal exercise dataset with depth, pressure, and inertial sensors | Exercise recognition and modality comparison | Small cohort; not consumer RGB-first |
| WorkoutDB / Workout video collections | Online workout action clips/metadata | Movement vocabulary discovery | Often no authoritative license, no pose truth, inconsistent naming; do not treat scraped mirrors as product-safe data |

**Key conclusion:** public exercise datasets are generally either (a) small clinical skeleton collections with better quality labels or (b) large web-video action collections with weak/no biomechanics. There is no verified, large, multi-view, commercial-friendly squat/deadlift/lunge corpus with force plates, marker MoCap, synchronized consumer RGB, expert fault labels, and demographic diversity.

### 3. Sports datasets

| Sport | Strongest public sources | Labels available | Appropriate use |
|---|---|---|---|
| Basketball | APIDIS basketball, NCAA Basketball Dataset, SportsMOT, UCF101, Kinetics, Penn Action (limited) | Detection/tracking/action; generally no biomechanical joints | Player tracking, action segmentation, occlusionâ€”not joint-angle validation |
| Baseball | Penn Action; UCF101; MLB-YouTube-derived action datasets | 2D joints in Penn Action; pitch/hit action labels elsewhere | Throw/bat phase prototypes; no kinetics |
| Soccer | SoccerNet, SportsMOT, SportsPose football movement | Events/tracking; SportsPose 3D joints | Field occlusion/events; SportsPose for body pose |
| Golf | GolfDB; SportsPose; Penn Action; UCF101 | Eight swing events (GolfDB); 3D pose (SportsPose); 2D joints (Penn) | High-quality protocol phase design; combine rather than rely on one dataset |
| Tennis | THETIS, Penn Action, UCF101, SportsPose | Stroke classes; Penn 2D; SportsPose 3D | Stroke segmentation and dynamic pose |
| Running | OpenCap, BML-MoVi/MoVi, HumanEva, TotalCapture, AddBiomechanics, running biomechanics repositories | MoCap, video, IMU, sometimes forces/OpenSim | Quantitative gait/running metrics |
| Jumping | OpenCap drop jump, BML-MoVi, UI-PRMD, AddBiomechanics, UCF101, NTU RGB+D | Lab/video skeleton or action labels depending dataset | Landing/knee-angle protocols; kinetics only where force data exist |
| Weightlifting | Fitness-AQA, UCF101, Kinetics, Olympic broadcast AQA datasets | Quality/action labels; usually no pose/forces | Phase and visible-form logic; weak scientific validation |
| Diving/gymnastics | MTL-AQA/AQA-7, FineDiving, FineGym, FineGym-AQA | Scores, procedures, fine temporal hierarchy | Best examples of structured action-quality assessment |
| Functional movement | UI-PRMD, KIMORE, LLM-FMS, OpenCap | Skeleton/MoCap/clinical or expert labels | Direct protocol expansion |

Other noteworthy sports resources include **Ski-Pose** (outdoor 3D skiing), **3D Diving**, **AIST++** (dance with 3D motion and music), **DanceTrack** (crowded tracking), **FS-Jump3D**/specialized jump datasets where official access can be verified, and the **Sports Video in the Wild (SVW)** family. Many are research-only and sport-video datasets often license annotations but not broadcast footage.

### 4. Motion capture and biomechanics repositories

#### Highest-value resources

**OpenCap validation and field-study data.** The OpenCap paper publishes data through SimTK, including synchronized videos, motion capture, ground-reaction forces, EMG in applicable trials, scaled OpenSim models, inverse kinematics, inverse dynamics, and simulation results. The validation cohort is only ten people, but the measurement chain matches KinematicIQ's need better than generic pose data. Use it to compare sagittal hip/knee/ankle angles and event timing. Do not treat OpenCap estimates themselves as independent ground truth; compare against its lab reference channels.

**BML-MoVi / MoVi.** Ninety subjects performed 21 actions with optical MoCap, four video perspectives (one handheld), and IMUs. This is unusually useful for testing identical motion across views and for converting marker trajectories through OpenSim. Published work has derived joint angles from its marker data. It is large and preprocessing-heavy.

**AddBiomechanics.** This Stanford project standardizes heterogeneous marker-based datasets into OpenSim-compatible kinematics and dynamics. It is a discovery and processing platform rather than one homogeneous study. Each contributed dataset must retain its own provenance, consent, and license. It is excellent for finding movement priors and reference distributions, not for claiming a unified validation population.

**Grand Challenge Competition to Predict In Vivo Knee Loads.** Instrumented knee implant data, gait, force plates, EMG, and MoCap provide rare internal-load validation. It is clinically important but too specialized for routine pose validation and comes with research agreements.

**CAMARGO / public locomotion biomechanics datasets.** Large treadmill locomotion datasets with varied speed, incline, stairs/ramps, joint kinematics, kinetics, EMG, and subject metadata can support expected ranges and phase definitions. They generally lack synchronized consumer RGB and therefore validate protocol logic, not MediaPipe tracking.

#### Other reusable MoCap sources

- **CMU Graphics Lab MoCap:** 144 subjects, 2,605 trials, 23 categories. Rich motion vocabulary, sports, locomotion, and exercise; no synchronized RGB and marker conventions vary.
- **AMASS:** normalizes CMU, HumanEva, ACCAD, BML, KIT, TotalCapture, and many other sources into SMPL parameters. Excellent for movement priors and synthetic rendering; source-specific restrictions and SMPL licensing remain.
- **BMLrub, BMLhandball, BMLmovi:** locomotion/emotion, sports, and multimodal movement subsets from the BioMotionLab ecosystem.
- **KIT Whole-Body Motion Database:** MoCap with semantic descriptions and object interactions; excellent for movement phase ontology.
- **HDM05:** ~3 hours of motion across 5 actors and 100+ motion classes; useful for action primitives.
- **SFU MoCap:** everyday and sports motions in BVH/ASF-AMC formats; check host terms.
- **ACCAD:** dance, locomotion, and sport motion clips; also represented in AMASS.
- **Mocap Database HDM05, Eyes Japan, and Edinburgh locomotion datasets:** useful movement assets, but license provenance must be established before product use.

**Can MoCap validate markerless tracking?** Only when it is time-synchronized and spatially calibrated to RGB/depth video, and anatomical definitions are reconciled. AMASS or CMU MoCap alone can validate plausible motion ranges and temporal rules, but not MediaPipe's image-to-landmark accuracy. Marker placement, soft-tissue artifact, OpenSim model scaling, and skeleton mapping introduce their own error.

### 5. Clinical, gait, elderly, and rehabilitation datasets

| Resource | Population / task | Modalities | Legal/ethical reuse notes | KinematicIQ value |
|---|---|---|---|---|
| [Parkinson's full-body walking dataset](https://figshare.com/articles/dataset/A_dataset_of_overground_walking_full-body_kinematics_and_kinetics_in_individuals_with_Parkinson_s_disease/14896881) | 26 people with Parkinson's and 28 controls (see paper/version metadata) walking overground | Full-body kinematics, kinetics, clinical scales | Figshare license/version must be retained; sensitive clinical metadata should be minimized | Pathological gait ranges and robustness |
| [GaitRec](https://figshare.com/articles/dataset/GaitRec_A_large-scale_ground_reaction_force_dataset_of_healthy_and_impaired_gait/7612715) | Healthy and impaired gait; >2,000 subjects/trials in aggregated clinical database | Bilateral ground-reaction forces | Figshare terms; de-identified; no RGB/pose | Gait event and force-shape reference only |
| [Healthy/stroke full-body gait dataset](https://data.4tu.nl/) | 138 able-bodied adults across lifespan + 50 stroke survivors | Full-body MoCap gait | Locate exact DOI/version and license before use; clinical consent limits apply | Age/pathology reference distributions |
| [KIMORE](https://vrai.dii.univpm.it/content/kimore-dataset) | Healthy and patients with motor dysfunction | RGB-D, skeleton, clinician scores | Research consent/terms; avoid re-identification from video | Rehab quality scoring |
| [UI-PRMD](https://webpages.uidaho.edu/ui-prmd/) | Healthy adults performing rehab movements | Kinect + Vicon | Small, research-oriented | Controlled protocol tests |
| [Toronto Rehab Stroke Pose Dataset](https://github.com/asheshjain399/RGBD-HuDaAct) / related project pages | Stroke and controls using rehabilitation robot/tasks | Kinect 3D pose | Availability is fragmented; verify authoritative host and consent before use | Stroke motion variability; lower priority |
| [TUG / Timed Up and Go public datasets](https://physionet.org/) | Older adults/clinical mobility in selected PhysioNet projects | Wearables, pressure, sometimes depth/video | PhysioNet credentialing/data-use agreement often required; patient privacy | Phase logic for sit-stand-walk-turn |
| [mPower](https://www.synapse.org/Synapse:syn4993293/wiki/) | Large remote Parkinson's study | Smartphone accelerometer/gyroscope, walking/balance tasks | Qualified researcher access and strict governance; not product media | Protocol population research, not pose validation |
| [Daphnet Freezing of Gait](https://archive.ics.uci.edu/dataset/245/daphnet+freezing+of+gait) | 10 Parkinson's participants | Wearable accelerometers + freeze labels | UCI terms; no video | Temporal event logic only |
| [HuGaDB](https://github.com/romanchereshnev/HuGaDB) | 18 healthy participants, locomotion/transition actions | Six wearable inertial sensors + EMG | Repository license governs files; no RGB | Movement segmentation baselines |

Clinical reuse requires more than a permissive file license. Video, body shape, gait, and health labels may be biometric or health data. KinematicIQ should avoid retaining faces, strip metadata, store only derived landmarks where possible, document intended-use limits, and never imply diagnostic validity from healthy-subject benchmarks.

### 6. Synthetic datasets

Synthetic data is most useful for **controlled stress testing** and future training: exact camera intrinsics/extrinsics, known 3D bodies, arbitrary viewpoints, occlusion, lighting, clothing, motion blur, and body shapes. It is weak evidence for clinical or biomechanical validity because rendering, body models, and animation do not reproduce soft tissue, anatomy, camera pipelines, or natural technique errors.

- **BEDLAM / BEDLAM 2.0:** strongest current synthetic video option for realistic clothing, multiple people, camera motion, and SMPL-X truth. Research-only and huge.
- **AGORA:** strongest crowd/body-shape static-image benchmark with scan-based clothed humans and SMPL-X truth.
- **SynBody:** 10,000 bodies and 1,187 actions; explicit CC BY-NC-SA 4.0 makes commercial use unavailable without separate permission.
- **SURREAL:** 6.5M frames with unusually rich modalities (depth, optical flow, parts, normals). Visually dated but useful for deterministic corruption experiments.
- **GTA-Human:** 20k sequences and 1.4M frames in varied game scenes; strong context diversity, weak legal/product suitability.
- **3DPeople:** controlled 4-view synthetic actions, depth, masks, and pose.
- **HSPACE:** diverse GHUM bodies in synthetic scenes and multiview video; research-focused.
- **PeopleSansPeople:** Unity-based synthetic generator for people detection/keypoints. More valuable as a controllable generator than as a fixed biomechanics corpus.
- **NVIDIA Omniverse Replicator / Isaac Sim:** can generate domain-randomized humans and camera metadata. It is a toolchain, not a ready biomechanics benchmark; asset licenses matter.
- **Unreal Engine MetaHuman + Control Rig:** potential proprietary dataset generator. MetaHuman assets are governed by Epic's license and cannot automatically be treated as open dataset assets.
- **Blender + SMPL/AMASS:** flexible rendering route, but Blender's GPL does not override SMPL, texture, or MoCap licenses.

### 7. Validation benchmark design

#### Metric-to-dataset mapping

| Validation target | Primary datasets | Metrics | Important caveat |
|---|---|---|---|
| Landmark detection | COCO, MPII, CrowdPose, OCHuman | PCK/PCKh, OKS/AP, visibility-aware error, dropout rate | Map MediaPipe's 33 landmarks to each schema and exclude unmapped joints |
| Temporal jitter | PoseTrack, Penn Action, MoVi, OpenCap video | Velocity/acceleration jerk at static or smooth segments; frame-to-frame normalized displacement; spectral noise | True motion must be separated from estimator noise |
| Identity/track continuity | PoseTrack, HiEve, JRDB-Pose, Panoptic | ID switches, track fragmentation, missed frames | KinematicIQ may be single-user, but bystanders create failure cases |
| 3D pose | Human3.6M, MPI-INF-3DHP, 3DPW, TotalCapture | MPJPE, PA-MPJPE, PCK3D, bone-length variance | MediaPipe â€œworldâ€ coordinates are not equivalent to calibrated global 3D |
| Joint angles | OpenCap validation, BML-MoVi, UI-PRMD, TotalCapture | MAE, RMSE, bias/limits of agreement, CMC, waveform correlation | Reconcile joint coordinate systems and filtering first |
| Rep counting | UI-PRMD, MM-Fit, KIMORE, selected UCF101/Penn clips | Count MAE, exact-match rate, boundary F1, missed/double counts | Action labels rarely provide gold repetition boundaries |
| Movement segmentation | FineGym, FineDiving, GolfDB, Penn Action, NTU RGB+D | Segmental F1@IoU, edit score, event timing error | Sports phases may not transfer to exercise reps |
| Camera angle robustness | MoVi, Human3.6M, MPI-INF-3DHP, Panoptic, SportsPose | Within-trial variance across views; worst-view error; failure rate | Same synchronized action/view pair is essential |
| Occlusion robustness | OCHuman, CrowdPose, PoseTrack, Panoptic, AGORA/BEDLAM | Error vs visible-joint fraction; recovery time; dropout duration | Synthetic occlusion performance may overstate real performance |
| Coaching quality | KIMORE, LLM-FMS, IRDS, Fitness-AQA | Agreement with experts, confusion by fault, calibration, sensitivity/specificity | Avoid medical claims; scoring rubrics can encode subjective bias |
| Protocol generalization | OpenCap, AddBiomechanics, CMU/AMASS, KIT, sports datasets | Coverage, valid phase detection, false activation rate, demographic subgroup error | Motion-only data cannot test image tracking |

#### Recommended evaluation protocol

1. **Freeze the implementation.** Record MediaPipe version, model/complexity settings, input resolution, browser/device, FPS, and smoothing parameters.
2. **Create schema adapters.** Define explicit mappings from MediaPipe 33 landmarks to COCO-17, MPII-16, Human3.6M-17, OpenSim markers/joints, and each dataset skeleton. Never compare semantically different â€œhip,â€ â€œpelvis,â€ or â€œankleâ€ points without documentation.
3. **Preserve raw outputs.** Store raw landmark coordinates/confidence plus each filtered output. Filtering can reduce jitter while adding phase delay and attenuating peaks.
4. **Use nested test tiers:** unit clips (known poses), controlled synchronized lab data, cross-view data, in-the-wild data, and adversarial/occluded data.
5. **Normalize deliberately.** Report pixel error, body-scale-normalized error, and degrees for angles. Avoid using MediaPipe's normalized z as metric depth without calibration.
6. **Measure waveform agreement.** For biomechanical signals, report MAE/RMSE plus Blandâ€“Altman bias and 95% limits, cross-correlation/lag, coefficient of multiple correlation, and peak/event errors.
7. **Stratify.** Break results down by movement, camera azimuth/elevation, distance, body region, visibility, clothing, body size, skin tone where ethically and statistically supported, device, and FPS.
8. **Prevent leakage.** Split by subject and capture session, never by frame. For tuning deterministic thresholds, hold out entire participants and camera setups.
9. **Define acceptable-use bands.** Coaching feedback may tolerate more error than clinical measurement. Establish metric-specific tolerances before looking at results.
10. **Publish a model card-like benchmark note.** State datasets, licenses, exclusions, known failure modes, and which claims the evidence does and does not support.

## Licensing and access ledger

This ledger supplements the comparison table and should be rechecked at download time.

| Dataset/group | Commercial use | Registration | Approx. size/access | Maintenance/access status |
|---|---|---|---|---|
| COCO | Mixed: annotations CC BY 4.0; each image retains source license | No | ~25 GB core train/val images; easy | Stable archive |
| MPII Human Pose | **No commercial use of images** | No | 12.9 GB images; context video ~25 Ã— 17 GB | Stable official page |
| Human3.6M | **Academic use only** | Yes/agreement | Very large; access sometimes slow | Legacy benchmark; portal may be fragile |
| MPI-INF-3DHP | Research-focused; verify agreement | Usually registration | Large | Stable project page |
| 3DPW | Non-commercial scientific research | Yes | Tens of GB | Stable MPI portal |
| PoseTrack | Research benchmark; source-video rights | Yes/terms vary by release | Moderate | Active benchmark lineage |
| CMU Panoptic | **Commercial prohibited** | Agreement | Sample 5 MB; full corpus extremely large | Stable tools/page; dataset mature |
| CrowdPose/OCHuman | Research; source image rights unclear | No | Small/moderate | GitHub mirrors/projects mature |
| OpenCap validation | Research release; verify SimTK project terms | SimTK account may be required | Moderate with video/lab channels | Actively maintained ecosystem |
| BML-MoVi/MoVi | Research terms; commercial unclear | Yes | Hundreds of GB depending modalities | Maintained by BioMotionLab/data hosts |
| UI-PRMD | Research/public; no clear blanket commercial grant | Usually no/simple request | Small/moderate | Mature, low update frequency |
| KIMORE | Academic/research; commercial unclear | Request/registration | Moderate | Mature research release |
| NTU RGB+D 120 | **Academic/non-commercial** | Agreement | Hundreds of GB full modalities | Stable official host |
| UCF101 | Research distribution; source media rights unclear | No | ~7 GB | Stable archive |
| FineGym/FineDiving/GolfDB/Fitness-AQA | Research; broadcast/YouTube rights restrict commercial reuse | Usually form/request | Moderateâ€“large | Project-specific, mostly mature |
| AMASS | **Non-commercial scientific research**; source licenses apply | Yes | ~100+ GB depending subsets | Active MPI ecosystem |
| CMU MoCap | CMU states free use, attribution requested; verify files/derived assets | No | ~10 GB class | Stable legacy archive |
| KIT Motion | Research terms | Yes | Moderate | Active database interface |
| AddBiomechanics | **Per contributed dataset**; code license is not data license | Account for processing/access may be needed | Selective to very large | Actively developed |
| SynBody | **CC BY-NC-SA 4.0; non-commercial** | Download host account | Very large | Released/maintained project page |
| BEDLAM/AGORA/SURREAL/GTA-Human | Generally **research/non-commercial** plus body/asset restrictions | Usually yes | Large to multi-terabyte | Active/mature research portals |
| Clinical/PhysioNet/Synapse datasets | Dataset-specific; often qualified research only | Often credentialed/DUA | Varies | Versioned repositories; governance active |

## Gap analysis

### What does not currently exist as a strong public resource

1. **A large squat biomechanics benchmark** pairing calibrated consumer RGB from multiple realistic viewpoints with Vicon/Qualisys markers, force plates, OpenSim angles/moments, repetition boundaries, and expert fault labels.
2. **A commercial-friendly exercise corpus** with explicit participant consent for product testing and redistribution of derived landmarks.
3. **A MediaPipe-native validation dataset** containing raw 33-landmark predictions, manually adjudicated visibility, and independent anatomical ground truth.
4. **A movement-coaching dataset** with observable faults, causal explanations, safe corrective cues, and inter-rater reliabilityâ€”not just a single scalar quality score.
5. **A broad multi-exercise quality dataset** spanning squat, hinge/deadlift, lunge, push, pull, rotation, carry, jump/land, walk/run, and mobility screens under one ontology.
6. **Enough edge cases:** mobility aids, limb difference, pregnancy, obesity, loose clothing, cultural clothing, reflective surfaces, home clutter, pets/bystanders, partial framing, floor exercises, and camera vibration.
7. **Longitudinal adaptation data** showing whether coaching cues change movement safely across sessions.
8. **Clinically representative and demographically balanced samples** with sufficient subgroup sizes and transparent recruitment.
9. **Consumer-device reproducibility data** spanning webcams and phones, browsers, resolutions, frame rates, rolling shutter, compression, and low light.
10. **Validated coaching outcomes.** Existing AQA scores rarely show that automated feedback improves performance or reduces injury risk.

### How KinematicIQ should build a proprietary dataset

Build in four stages:

1. **Product QA corpus:** consented internal recordings across devices, rooms, angles, clothing, and deliberate occlusion. Capture failures, not only ideal reps. Store raw video only under a defined retention policy and create a face-blurred/landmark-only derivative.
2. **Expert protocol corpus:** certified coaches/clinicians define phase boundaries, observable faults, severity, cue eligibility, contraindications, and confidence. Use at least two independent raters plus adjudication; report inter-rater agreement.
3. **Lab validation cohort:** partner with a biomechanics laboratory for synchronized multi-view consumer RGB, Vicon/Qualisys, force plates, and OpenSim processing. Pre-register outcomes and include repeated sessions for testâ€“retest reliability.
4. **Prospective field study:** test diverse users in homes/gyms, measure failure rate and cue agreement, and obtain explicit consent for commercial algorithm evaluation. Separate research consent, product telemetry consent, and media reuse consent.

The proprietary schema should include participant/session/device IDs; camera calibration and placement; raw video metadata; MediaPipe raw/filtered landmarks; visibility; marker trajectories; joint angles/moments; force events; rep and phase boundaries; fault labels; rater confidence; cue text/category; safety exclusions; and dataset/version lineage. Favor derived, de-identified data and document deletion/export rights.

## Ranked recommendations

### Top 10 to download or request immediately

1. **OpenCap validation data** â€” closest available video-to-biomechanics ground truth.
2. **UI-PRMD** â€” small, immediately useful, includes deep squat and Vicon/Kinect.
3. **KIMORE** â€” clinical scores and patient variability.
4. **SportsPose** â€” dynamic sports 3D poses with a Vicon precision subset.
5. **MPI-INF-3DHP test set** â€” indoor/outdoor camera generalization.
6. **3DPW** â€” consumer-like moving-camera, in-the-wild 3D motion.
7. **BML-MoVi selected actions/views** â€” synchronized RGB/MoCap/IMU; avoid full download initially.
8. **PoseTrack validation clips** â€” temporal jitter/dropout benchmark.
9. **OCHuman** â€” compact severe-occlusion suite.
10. **Penn Action plus selected UCF101 exercise classes** â€” protocol/segmentation coverage at low storage cost.

### Top 10 for future validation

1. OpenCapBench
2. Full OpenCap lab/field validation releases
3. BML-MoVi/MoVi full selected modality set
4. TotalCapture
5. Human3.6M
6. CMU Panoptic sampled synchronized views
7. AddBiomechanics datasets with video counterparts
8. Parkinson's full-body kinematics/kinetics walking dataset
9. Healthy/stroke full-body gait dataset
10. A KinematicIQ-owned synchronized lab cohort

### Top 10 for protocol expansion

1. UI-PRMD
2. KIMORE
3. LLM-FMS
4. OpenCap example and validation movements
5. AddBiomechanics movement collections
6. CMU MoCap
7. KIT Whole-Body Motion Database
8. GolfDB
9. FineGym
10. FineDiving / AQA-7 family

### Top 10 for future AI research

1. AMASS
2. BEDLAM 2.0
3. BEDLAM
4. SynBody
5. AGORA
6. Human3.6M
7. MPI-INF-3DHP / MuCo-3DHP
8. 3DPW
9. Fit3D
10. GTA-Human / SURREAL

### Top 10 GitHub repositories

1. [google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) â€” MediaPipe Tasks/Pose source, calculators, model metadata, and examples.
2. [opencap-org/opencap-core](https://github.com/opencap-org/opencap-core) â€” OpenCap processing pipeline from video keypoints through OpenSim.
3. [stanfordnmbl/addbiomechanics](https://github.com/stanfordnmbl/addbiomechanics) â€” automated biomechanics processing and data ecosystem.
4. [open-mmlab/mmpose](https://github.com/open-mmlab/mmpose) â€” broad pose benchmark tooling and dataset adapters.
5. [open-mmlab/mmhuman3d](https://github.com/open-mmlab/mmhuman3d) â€” 3D human body-model preprocessing/evaluation across many datasets.
6. [facebookresearch/VideoPose3D](https://github.com/facebookresearch/VideoPose3D) â€” reproducible Human3.6M 2D-to-3D evaluation pipeline.
7. [CMU-Perceptual-Computing-Lab/panoptic-toolbox](https://github.com/CMU-Perceptual-Computing-Lab/panoptic-toolbox) â€” Panoptic download, calibration, projection, and skeleton tools.
8. [vrai-group/KIMORE](https://github.com/vrai-group/KIMORE) â€” KIMORE data/code entry point (confirm current canonical repository from official page).
9. [ParitoshParmar/Fitness-AQA](https://github.com/ParitoshParmar/Fitness-AQA) â€” fitness action-quality baseline and dataset instructions.
10. [wmcnally/golfdb](https://github.com/wmcnally/golfdb) â€” GolfDB event annotations and swing-sequencing baseline.

Additional useful repositories: [Jeff-sjtu/CrowdPose](https://github.com/Jeff-sjtu/CrowdPose), [liruilong940607/OCHumanApi](https://github.com/liruilong940607/OCHumanApi), [open-mmlab/mmaction2](https://github.com/open-mmlab/mmaction2), [CMU-Perceptual-Computing-Lab/openpose](https://github.com/CMU-Perceptual-Computing-Lab/openpose), [DeepLabCut/DeepLabCut](https://github.com/DeepLabCut/DeepLabCut), [pyomeca/ezc3d](https://github.com/pyomeca/ezc3d), [opensim-org/opensim-core](https://github.com/opensim-org/opensim-core), and [perfanalytics/pose2sim](https://github.com/perfanalytics/pose2sim).

### Top academic benchmarks to cite

1. COCO Keypoint AP/OKS
2. MPII PCKh
3. PoseTrack pose mAP and tracking metrics
4. Human3.6M Protocol 1 MPJPE and Protocol 2 PA-MPJPE
5. MPI-INF-3DHP 3DPCK/AUC/MPJPE
6. 3DPW MPJPE, PA-MPJPE, and per-vertex error
7. OpenCap laboratory marker-based kinematic/kinetic comparisons
8. OpenCapBench biomechanically focused joint-angle/body metrics
9. FineGym/FineDiving temporal localization and procedure-aware AQA
10. KIMORE/UI-PRMD movement-quality and rehab-exercise evaluation

## Integration roadmap

### Phase 0 â€” governance and reproducibility (weeks 1â€“2)

- Create a dataset register containing official URL, paper DOI, downloaded version/hash, license text, approval status, modalities, participants, and allowed uses.
- Separate **evaluation-only research data** from assets allowed in product demos or commercial development.
- Freeze a browser benchmark runner that logs MediaPipe/model/browser/device settings and exports a common JSON schema.
- Define landmark/skeleton mappings and biomechanics sign conventions.

### Phase 1 â€” compact regression suite (weeks 2â€“6)

- Build a 500â€“2,000 clip/image suite from UI-PRMD, OpenCap, OCHuman, PoseTrack, MPI-INF-3DHP, Penn Action, and self-recorded consented clips.
- Cover frontal, sagittal, 30â€“45Â° oblique, elevated/low, partial-body, low-light, occluded, loose-clothing, and bystander conditions.
- Establish raw and smoothed jitter, dropout, angle error, event timing, and rep-count dashboards.
- Run it for every MediaPipe/model/filter/protocol change.

### Phase 2 â€” biomechanics validation (months 2â€“4)

- Process OpenCap and selected BML-MoVi sequences through a documented coordinate pipeline.
- Validate squat, sit-to-stand, lunge, gait, and jump-land metrics separately.
- Report waveform agreement, lag, bias/limits of agreement, peak errors, and failure rateâ€”not only correlations.
- Use results to label metrics as experimental, coaching-grade, or unsupported.

### Phase 3 â€” protocol library (months 3â€“6)

- Use UI-PRMD/KIMORE/LLM-FMS for phase and fault ontologies.
- Use GolfDB/FineGym/FineDiving to design hierarchical protocol structure: activity â†’ repetition â†’ phase â†’ event â†’ observable fault â†’ eligible cue.
- Derive broad plausible ranges from AddBiomechanics/AMASS/CMU, but tune thresholds only on held-out video-linked data.
- Add false-trigger tests so ordinary daily actions do not activate exercise protocols.

### Phase 4 â€” proprietary evidence (months 4â€“12)

- Collect a diverse product QA corpus under explicit commercial consent.
- Commission a synchronized lab study with Vicon/Qualisys, force plates, consumer devices, and repeated camera placements.
- Pre-register primary metrics and publish a peer-reviewed validation paper or technical report.
- Maintain a locked external test set and repeat validation after major tracking changes.

### Phase 5 â€” future ML, only if product strategy changes

- Use AMASS/BEDLAM/SynBody for pretraining or controlled augmentation and real datasets for evaluation.
- Conduct license and data-protection review before any training.
- Preserve deterministic protocol logic as an auditable layer even if learned pose filtering, segmentation, or quality models are introduced.

## Practical conclusions for current KinematicIQ

- Public data can materially improve **testing and credibility now**, even without training a model.
- The highest-return work is a browser-based, dataset-agnostic evaluation harness and explicit skeleton mapping.
- MediaPipe landmark stability should be evaluated independently from biomechanical metric validity; a stable landmark can still be anatomically biased.
- OpenCap, BML-MoVi, and UI-PRMD are the best bridges between pose and biomechanics. PoseTrack/OCHuman cover failure robustness; KIMORE/LLM-FMS cover coaching concepts.
- Scientific claims should be movement-, plane-, camera-, device-, and population-specific. Public datasets do not support a blanket claim of universal biomechanical accuracy.
- KinematicIQ's durable data advantage will come from consented consumer-video edge cases paired with expert and laboratory truth, because that combination is largely absent publicly.

## Primary references and official sources

### Pose and tracking

- Lin et al., [Microsoft COCO: Common Objects in Context](https://arxiv.org/abs/1405.0312); [official COCO site](https://cocodataset.org/).
- Andriluka et al., [MPII Human Pose Dataset](https://www.mpi-inf.mpg.de/departments/computer-vision-and-machine-learning/software-and-datasets/mpii-human-pose-dataset).
- Ionescu et al., [Human3.6M](http://vision.imar.ro/human3.6m/description.php).
- Mehta et al., [MPI-INF-3DHP official page](https://vcai.mpi-inf.mpg.de/3dhp-dataset/).
- von Marcard et al., [3DPW official page](https://virtualhumans.mpi-inf.mpg.de/3DPW/).
- Andriluka et al., [PoseTrack paper](https://arxiv.org/abs/1710.10000); [benchmark](https://posetrack.net/).
- Joo et al., [CMU Panoptic Studio](https://domedb.perception.cs.cmu.edu/).
- Li et al., [CrowdPose](https://github.com/Jeff-sjtu/CrowdPose).
- Zhang et al., [OCHuman API and data](https://github.com/liruilong940607/OCHumanApi).

### Biomechanics and exercise

- Uhlrich et al., [OpenCap: Human movement dynamics from smartphone videos](https://doi.org/10.1371/journal.pcbi.1011462); [data](https://simtk.org/projects/opencap); [code](https://github.com/opencap-org/opencap-core).
- Gozlan et al., [OpenCapBench](https://openaccess.thecvf.com/content/WACV2025/html/Gozlan_OpenCapBench_A_Benchmark_to_Bridge_Pose_Estimation_and_Biomechanics_WACV_2025_paper.html).
- Ghorbani et al., [MoVi paper](https://arxiv.org/abs/2003.01888); [dataset](https://www.biomotionlab.ca/movi/).
- [AddBiomechanics](https://addbiomechanics.org/) and [source](https://github.com/stanfordnmbl/addbiomechanics).
- Vakanski et al., [UI-PRMD](https://webpages.uidaho.edu/ui-prmd/).
- Capecci et al., [KIMORE dataset](https://vrai.dii.univpm.it/content/kimore-dataset).
- Parmar and Morris, [Fitness-AQA](https://github.com/ParitoshParmar/Fitness-AQA).
- Shao et al., [FineGym](https://sdolivia.github.io/FineGym/).
- Xu et al., [FineDiving](https://finediving.ivg-research.xyz/).
- McNally et al., [GolfDB](https://github.com/wmcnally/golfdb).
- Soomro et al., [UCF101 official page](https://www.crcv.ucf.edu/research/data-sets/ucf101/).
- Shahroudy et al. / Liu et al., [NTU RGB+D and NTU RGB+D 120](https://rose1.ntu.edu.sg/dataset/actionRecognition/).

### Motion capture, sports, and clinical

- Mahmood et al., [AMASS](https://amass.is.tue.mpg.de/).
- [CMU Graphics Lab Motion Capture Database](http://mocap.cs.cmu.edu/).
- [KIT Whole-Body Human Motion Database](https://motion-database.humanoids.kit.edu/).
- Ingwersen et al., [SportsPose paper](https://arxiv.org/abs/2304.01865) and [project page](https://sportsposes.github.io/).
- Hu et al., [A public data set of walking full-body kinematics and kinetics in Parkinson's disease](https://doi.org/10.1038/s41597-023-02001-5); [Figshare data](https://figshare.com/articles/dataset/A_dataset_of_overground_walking_full-body_kinematics_and_kinetics_in_individuals_with_Parkinson_s_disease/14896881).
- Slijepcevic et al., [GaitRec](https://figshare.com/articles/dataset/GaitRec_A_large-scale_ground_reaction_force_dataset_of_healthy_and_impaired_gait/7612715).
- Bachlin et al., [Daphnet Freezing of Gait](https://archive.ics.uci.edu/dataset/245/daphnet+freezing+of+gait).

### Synthetic

- Black et al., [BEDLAM](https://bedlam.is.tue.mpg.de/); [BEDLAM 2.0](https://bedlam2.is.tue.mpg.de/).
- Patel et al., [AGORA](https://agora.is.tue.mpg.de/).
- Varol et al., [SURREAL](https://www.di.ens.fr/willow/research/surreal/data/).
- Yang et al., [SynBody](https://synbody.github.io/).
- Cai et al., [GTA-Human](https://caizhongang.github.io/projects/GTA-Human/).

---

**Research quality note.** This report deliberately excludes many Kaggle mirrors, scraped â€œworkoutâ€ folders, and datasets mentioned only in secondary lists when an authoritative paper, project page, or license could not be verified. Counts can vary by release and modality. Before operational use, archive the exact official terms and dataset version alongside each download.
