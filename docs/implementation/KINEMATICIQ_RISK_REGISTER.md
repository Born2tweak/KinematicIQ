# KinematicIQ Living Risk Register

**Updated:** 2026-07-12

**Maintenance:** update when a milestone changes likelihood, impact, evidence, owner, or mitigation. “Closed” requires evidence; deferral is not closure.

| ID | Risk | Likelihood | Impact | Current evidence | Mitigation / owner milestone | Gate / status |
|---|---|---:|---:|---|---|---|
| R-TRK-01 | Tracking/filter changes reduce jitter but shift peaks/events | High | High | Different live/offline filters; no reference-event benchmark | Raw/candidate/reference metrics, saved baseline | M62-M65; open |
| R-TRK-02 | MediaPipe landmarks are treated as anatomical joints | High | High | Angle code consumes model landmarks; no lab adapter | Mapping/coordinate contract and OpenCap/UI-PRMD pilot | M62-M64; open |
| R-TRK-03 | Camera view/distance/lighting alter metrics beyond disclosed limits | High | High | Heuristic readiness; contradictory front/side copy; no paired-view report | View contract, cross-view benchmark, device matrix | M63-M67; open |
| R-TRK-04 | Occlusion/dropout recovery produces false reps or artifacts | Medium-high | High | Quality tracks jumps/missingness; current tapes include artifacts | Dropout/recovery metrics, OCHuman/PoseTrack + local occlusion fixtures | M62-M65; open |
| R-TRK-05 | Bystander becomes selected single pose | Medium | High | `numPoses: 1`; public tapes mention second person | Two-person fixtures, intended-subject policy, recovery UX | M64-M67; open |
| R-VAL-01 | Internal exact rep count is mistaken for biomechanical validity | High | High | 9/9 labeled rep counts, no independent angle truth | Separate benchmark suites and claims language | M62-M64; open |
| R-VAL-02 | No saved benchmark baseline makes acceptance undecidable | High | High | `eval:tapes` explicitly reports no baseline | Save versioned baseline before candidate change | M63; open |
| R-VAL-03 | Bottom/event timing cannot be evaluated | High | Medium-high | Bottom-frame MAE `n/a` | Extend source-video labeling protocol with events | M63; open |
| R-VAL-04 | Reliability/MDC claims remain provisional | High | High | Calculator/template exists, study not run | Repeated-measures study and metric-board update | M64/M71; blocked on data |
| R-DATA-01 | Public/research data used commercially without permission | Medium | Critical | Many candidate datasets research-only/mixed rights | Role registry, legal approval checkpoint, no blanket downloader | M61; open |
| R-DATA-02 | Restricted participant media or local paths enter git | Medium | Critical | Tapes ignored; external-data structure absent | Ignore rules, manifest parser, staged diff/secret/media scan | M61-M63; open |
| R-DATA-03 | Health/biometric data is re-identified or over-retained | Low before collection | Critical | M74 governance plan exists; no proprietary collection occurred | Approve consent/retention/de-identification plan before collection | M74; guarded |
| R-DATA-04 | Dataset version/license changes invalidate evidence | Medium | High | LLM-FMS official Figshare v1 acquired with SHA-256 and matching published MD5; original UI-PRMD timed site returns 403 | Version/checksum/access-date/license snapshot reference | M61/M78; reducing |
| R-SCI-01 | Product copy implies lab or clinical equivalence | Low-medium | High | M74 removed landing “motion lab,” PT/patient, and “validated reps” claims; e2e guard added | Maintain claims scan and human review | M74; mitigated |
| R-SCI-02 | Camera confidence is confused with validation status | High | High | Evidence shows “High confidence · experimental” | Separate labels/explanation/hierarchy | M68; open |
| R-SCI-03 | Experimental/proxy metrics drive strong coaching | Medium-high | High | Findings and posture cards can use internal thresholds | Eligibility contract; validation board gate | M64/M68-M72; open |
| R-SCI-04 | Sit-to-stand drifts into fall-risk/frailty/impairment claims | Medium | Critical | Functional boundary doc exists; public clinical context is tempting | M58 checklist, copy tests, non-clinical protocol name/scope | M71-M72; guarded |
| R-UX-01 | Mobile camera overlays obscure setup/action priority | High | High | 390×844 browser screenshot and layout inspection | Progressive setup UI, single primary correction, responsive visual tests | M66-M67; open |
| R-UX-02 | Mobile navigation wraps/clips and breaks fixed HUD offsets | High | High | Browser walkthrough shows two-row/clipped nav | Responsive app-shell contract and viewport tests | M67; open |
| R-UX-03 | Results Evidence repetition hides what matters | High | Medium-high | 6,500+ px Evidence view; same concepts repeated 4-5 times | Canonical evidence model and compact IA | M68; open |
| R-UX-04 | More charts increase density and apparent precision | High | High | Many metrics exist; no visualization policy before ADR-008 | Question/evidence-led visualization gate | M69; guarded |
| R-UX-05 | Analyst/debug controls confuse normal users | Medium | Medium | Analyst toggle is always visible in camera | Audience/feature exposure decision | M67; open |
| R-PROT-01 | Protocol ID labels squat analysis as another movement | Medium now; high when protocol two enabled | Critical | Live/upload bypass runtime; planned protocols disabled today | Complete execution contract + squat parity before enablement | M70; blocked |
| R-PROT-02 | Universal rep-shaped schemas cannot represent jump/gait/transition | High | High | `RepMetrics[]` embedded in runtime/session/results | Event/trial outcome contract without cyclic assumption | M70; open |
| R-PROT-03 | Squat regression during generalization | Medium | Critical | Strong tapes/tests exist; large coupled modules | Expand/migrate/contract, parity and e2e gates, no threshold changes | M70; guarded |
| R-PROT-04 | Sit-to-stand is forced into squat activation/completion | High | High | Current upright/descent auto-start; chair/contact absent | Research package decides transition model from labels | M71; open |
| R-PERF-01 | Main-thread inference/UI misses frame budget on devices | Medium | High | Targets only; no timing profile; large chunks | Instrument and profile target matrix before worker work | M64/M74; open |
| R-PERF-02 | Bundle size harms first-use/model readiness | Medium | Medium | Main 505 kB and lazy 3D 907 kB minified; no target-device trace | M76-M77 target-device profile before optimization | open |
| R-ACC-01 | Accessibility audit claims exceed real assistive-tech evidence | Medium-high | High | Axe WCAG A/AA scans run across Chromium, Firefox, desktop/mobile WebKit; NVDA/VoiceOver and physical iPhone remain pending human execution | Exact M76 human scripts; do not promote pending rows | M76; open |
| R-DEP-01 | Development-tool vulnerabilities expose local files/server | Low | High | Approved Vite 8/Vitest 4 migration applied; full and production audits report zero vulnerabilities; acceptance matrix passes | Keep dependencies audited and local servers loopback-only | M75; mitigated |
| R-DOC-01 | Canonical docs drift from code | High | High | Traceability marked implemented milestones planned; AI rules conflict with persistence | Update canonical rows, link Aurelian indexes, doc checks | Current task/M61; reducing |
| R-FIX-01 | CI passes without real validation fixtures | High | High | Real tapes local; CI-safe suite synthetic | Explicit availability report + redistributable redacted fixtures | M62-M63; open |

## Escalation rules

- **Critical:** stop implementation when the risk becomes active; require explicit approval/evidence.
- **High:** milestone must include a named mitigation and evidence gate.
- **Medium:** track and test when touched; do not silently absorb into scope.
- Legal/privacy/scientific-claims decisions are not auto-resolved by engineering judgment.

## Review cadence

- At every M61-M74 milestone closeout.
- Before accepting any dataset/license, tracking change, protocol availability change, schema migration, or stronger claim.
- At release-readiness review with residual risk explicitly accepted or deferred.
