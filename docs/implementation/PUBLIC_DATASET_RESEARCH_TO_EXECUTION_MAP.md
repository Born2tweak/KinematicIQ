# Public Dataset Research → Execution Map

**Input:** `docs/research/PUBLIC_MOVEMENT_DATASET_RESEARCH.md`

**Repository audit:** `reports/audits/KINEMATICIQ_POST_DATASET_RESEARCH_AUDIT.md`

**Roadmap:** post-M60 wave in `KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## Operating rules

1. Dataset availability does not grant commercial use or redistribution.
2. Raw/participant media stays outside git; tracked artifacts are metadata, adapters, CI-safe fixtures, and aggregate reports.
3. No downloader bypasses registration, click-through agreements, credentials, access controls, or consent terms.
4. Skeleton mapping, coordinate definitions, frame timing, filter variants, and exclusions are part of the benchmark—not preprocessing trivia.
5. A tracking benchmark measures its dataset distribution; it does not validate coaching or clinical claims.
6. A public dataset can support research or local evaluation without becoming product-training data.

## Dataset role registry

| Dataset/group | Role now | Access/legal checkpoint | Local footprint | Immediate question | Roadmap |
|---|---|---|---|---|---|
| OpenCap validation data | Evaluation-only biomechanics pilot | SimTK account/terms; verify field-level reuse | Selected trials only | Angle/event agreement vs lab reference | M61-M64 |
| UI-PRMD | Evaluation + protocol research | Verify official terms; no assumed commercial reuse | Full small corpus or selected movements | Vicon/Kinect squat/sit-to-stand events and mappings | M61-M64, M71 |
| BML-MoVi/MoVi | Evaluation-only, later | Registration/research terms; large | Selected actions/views | Same-motion cross-view and filter lag | M61, M63-M65 |
| KIMORE | Protocol/coaching research | Registration/research; clinical privacy | Metadata first; selected allowed files later | Sit-to-stand/rehab variability and score ontology | M61, M71 |
| SportsPose | Evaluation/protocol research | Confirm official agreement | Selected sequences | Dynamic pose/view robustness | M61, M63-M64 |
| MPI-INF-3DHP/3DPW | Evaluation-only | Research/non-commercial agreements | Test/selected subsets | Outdoor, moving-camera, 3D generalization | M61, future M63 |
| PoseTrack | Evaluation-only temporal benchmark | Source-video/research terms | Validation clips | Jitter, dropout, recovery, bystander tracks | M61-M64 |
| OCHuman | Evaluation-only occlusion benchmark | Mixed image rights; research | Small full set | Error vs visibility/occlusion | M61-M64 |
| COCO/MPII/CrowdPose | Metadata/2D robustness later | Image-specific/mixed rights | Validation subsets only | Mapped joint detection/visibility | M61, deferred M63 |
| Human3.6M/Panoptic/TotalCapture | Research-only future evaluation | Academic/non-commercial agreements | Select views/sequences | Cross-view/3D/sensor synchronization | M61; later validation |
| Penn Action/UCF101 | Protocol discovery and segmentation | Web-media rights unclear | Selected classes | Movement vocabulary and temporal boundaries | M61, M71-M73 |
| NTU RGB+D 120 | Research-only future protocol benchmark | Academic/non-commercial agreement | Selected skeleton actions | Cross-view action/transition robustness | M61, future |
| AddBiomechanics/AMASS/CMU MoCap | Metadata/protocol priors | Per-source terms; no RGB for direct tracking | Metadata/selected motion files | Plausible motion/event ranges | M61, M71-M73 |
| BEDLAM/AGORA/SURREAL/SynBody/GTA-Human | Future ML/controlled stress only | Mostly research/non-commercial and asset licenses | Do not download now | Synthetic view/occlusion generation if ML strategy changes | Deferred |
| Clinical gait/Parkinson/stroke datasets | Research-only protocol/population context | Health-data/DUA/privacy review | Metadata only now | Robustness/research gaps, never diagnosis | M61, deferred |

## Traceability matrix

| ID | Research conclusion | Product/engineering requirement | Affected code/docs | Milestone | Evidence gate | Status |
|---|---|---|---|---|---|---|
| DS-01 | Public ≠ commercial | Registry records license, commercial status, registration, consent/privacy, allowed roles, legal owner, review date | new dataset manifests; risk register; ADR-006/010 | M61 | Parser/schema tests; every candidate classified; manual approvals explicit | planned |
| DS-02 | Raw restricted data must not enter git | Ignored local root, no participant paths in tracked manifests, checksum/version references, safe cleanup/docs | `.gitignore`, dataset README/scripts | M61 | `git check-ignore`; fixture scan; no raw extensions tracked | planned |
| DS-03 | Tracking and biomechanics benchmarks are different | Separate 2D/temporal, 3D, and biomechanics metric suites; reports never collapse them into one score | `web/src/eval/`, validation docs | M62-M64 | Report exposes per-suite metrics and limitations | planned |
| DS-04 | Skeleton definitions differ | Versioned mappings MediaPipe-33↔COCO-17/UI-PRMD/OpenCap/etc.; semantic joint docs | new `eval/adapters`/mapping modules | M62 | Mapping tests, unmapped-joint behavior, coordinate units documented | planned |
| DS-05 | Same-motion multiview is required for camera claims | Trial/view grouping and cross-view variance/worst-view outputs | eval schema/report | M62-M64 | Paired-view fixture and external pilot report | planned |
| DS-06 | Filtering can smooth while shifting events | Raw/candidate/reference waveforms, lag/peak attenuation/jitter metrics; no visual-only adoption | `landmarkFilter`, eval metrics/reports | M62, M64-M65 | Same counts; event drift tolerance; lower predeclared noise; no worst-case regression | planned |
| DS-07 | Current confidence is not anatomical accuracy | Report camera evidence quality separately from validation status and reference error | confidence/metric/report models | M64, M68 | UI copy/contract tests and benchmark fields | planned |
| DS-08 | PoseTrack/OCHuman test temporal/occlusion, not biomechanics | Dropout length, recovery time, visibility-stratified error, ID/bystander scenarios | eval metrics/adapters | M63-M64 | Pilot reports + local product-specific fixture | planned |
| DS-09 | OpenCap/UI-PRMD bridge video to lab references | Pilot angle/event adapters and coordinate reconciliation | eval adapters, validation report | M63-M64 | Reproducible selected-trial run; exclusions and sign conventions | planned |
| DS-10 | BML-MoVi is valuable but large/complex | Metadata now; selected actions/views after pilot tooling proves value | dataset registry/instructions | M61/M63 | Manual access approval; storage estimate; selected-trial plan | planned |
| DS-11 | Existing tape corpus lacks saved baseline and bottom truth | Save benchmark baseline; extend label workflow for events without altering old truth | `eval-tapes`, benchmark report | M63 | Baseline artifact, source-video labels, reviewer/provenance fields | planned |
| DS-12 | No evidence currently justifies model replacement | Keep MediaPipe model/config; evaluate candidates only behind registry and benchmark | `poseEngine`, deferred ledger | M65 | Candidate beats baseline on declared metrics and does not violate runtime/license/bundle constraints | accepted guard |
| DS-13 | Camera view changes metric eligibility | Protocol defines required view and metric eligibility; copy derives from one source | protocol/camera/upload/findings/report | M66-M70 | No front/side copy conflicts; view-specific fixture/e2e tests | planned |
| DS-14 | Public AQA scores are not coaching truth | Use KIMORE/Fitness-AQA/LLM-FMS to shape ontologies; require expert labels and agreement before product coaching | findings/coaching/research | M71-M73 | Expert annotation protocol + agreement; claims review | planned |
| DS-15 | Sit-to-stand has strongest second-protocol evidence | Research package defines chair/setup, events, completion, metrics, claims limits, datasets, and unknowns before code | protocol docs + research gaps | M71 | Evidence package accepted; labeled tapes; runtime contract ready | planned |
| DS-16 | Protocols may be transition/ballistic/gait, not reps | Runtime owns event/trial semantics, activation/completion, quality and reports; no universal `RepMetrics[]` assumption | protocol/runtime/session/camera/upload/replay | M70 | Squat parity + non-cyclic contract tests | planned |
| DS-17 | Results need explanation, not more data | Compact narrative and one canonical evidence path; separate confidence from validation | Results/report models | M68 | Desktop/mobile usability acceptance and copy audit | planned |
| DS-18 | Waveforms/timelines require alignment truth | Only add after event/mapping validation; link to representative rep/frame | Results/replay/visualization components | M69 | Named question, validated source, text alternative, visual/a11y/perf tests | planned |
| DS-19 | Public data cannot fill consumer edge-case gap | Proprietary QA corpus plan for devices, clothing, occlusion, bystanders, partial framing | validation governance | M61, M74 | Consent/retention/de-identification protocol approved before collection | planned |
| DS-20 | Strong metric claims require reliability and external comparison | Keep provisional/experimental language until repeated-measures and lab-reference gates close | metric board, claims policy | M64-M65, M71-M72 | Reliability output + comparison report + copy audit | accepted guard |
| DS-21 | Clinical data is ethically sensitive | Metadata minimization, no re-identification, no diagnosis/norms without scope change | registry, risk/claims docs | M61 | Privacy/legal review checkpoint | planned |
| DS-22 | Synthetic data is future ML/stress input | Do not schedule downloads/training now; retain metadata and reconsideration gates | R&D ledger | deferred | Explicit ML scope change + license review | deferred |
| DS-23 | Browser/device performance can alter tracking | Benchmark records browser/device/resolution/FPS; profile before workers/model changes | eval/performance plan | M64, M74 | Target-device matrix and p50/p95 timings | planned |
| DS-24 | CI cannot depend on restricted corpora | Small synthetic/redacted fixtures with explicit redistributable provenance; full local suite remains optional but reported | tests/eval manifests | M62-M63 | Fresh-clone CI passes and declares unavailable suites | planned |

## Benchmark report contract

Every report should include:

- report/schema/config version and timestamp;
- dataset ID/version/release URL, local checksum, role, license/access class;
- participant/trial/view subset and exclusions (aggregate metadata only when privacy requires);
- adapter/mapping version, joint semantics, coordinate units, frame rate, time alignment;
- MediaPipe/model/filter/algorithm/browser/device/input-resolution versions;
- 2D metrics (visibility-aware PCK/normalized error where labels allow);
- temporal metrics (jitter, dropout runs, recovery, event lag);
- 3D metrics only when coordinate alignment is valid;
- biomechanics metrics (angle waveform MAE/RMSE, bias/limits, correlation/lag, peak/event errors) only against an independent reference;
- performance timings and errors;
- per-trial failures, not only averages;
- acceptance result against a named saved baseline;
- limitations and prohibited inference.

## Dataset storage layout proposed for M61

```text
datasets/                         # gitignored local root; never auto-populated
  external/<dataset-id>/<version>/
  derived/<dataset-id>/<adapter-version>/
  README.local.md                 # optional, gitignored
dataset-metadata/                 # tracked; name finalized by M61 to match repo conventions
  registry.json
  manifests/<dataset-id>.json
  mappings/
  licenses/README.md              # references/checksums, not copied terms when redistribution is barred
benchmark-results/                # tracked aggregate/redacted baselines only
```

M61 may choose different paths after inspecting repo conventions, but the separation of tracked metadata from ignored participant data is binding.

## Approval checkpoints

- Accepting dataset terms or registration.
- Downloading any restricted/large/health-related corpus.
- Using credentials or university/clinical access.
- Treating a dataset as commercial-use evidence.
- Redistributing images/video/pose/body-model assets or derived data.
- Collecting proprietary participant data.
- Changing product claims or validation tier.
- Training/fine-tuning any model.
