# Sit-to-Stand Evidence and Protocol Specification

**Milestone:** M71

**Decision:** transition-trial runtime; **not ready for product activation**.

## Product task and claim boundary

The product task is “Sit to stand,” meaning one or more complete transitions
from stable seated contact to stable upright standing, optionally followed by a
controlled return to the same chair. KinematicIQ may eventually report only:

- completed transition count;
- observed transition duration and within-session consistency;
- whether the camera retained the required landmarks;
- explicit abstention/retry reasons.

It must not name or reproduce a clinical 5xSTS/30-second-chair-stand score,
compare the user with age/population norms, infer lower-body strength,
impairment, frailty, fall likelihood, diagnosis, tissue state, force, torque,
or clinician equivalence.

## Primary evidence

| Source | Relevant evidence | Limits for KinematicIQ |
|---|---|---|
| [UI-PRMD data descriptor](https://doi.org/10.3390/data3010002) | Sit-to-stand is movement m05; Kinect/Vicon positions and angles; segmented repetitions; PDDL 1.0. | Ten healthy adults; official host currently inaccessible; acquired reduced repository contains deep squat only. |
| [OpenCap validation](https://doi.org/10.1371/journal.pcbi.1011462) | Ten healthy adults performed five natural and modified sit-to-stands; lab markers/force/EMG and two ±45° cameras; 4 Hz marker/force filtering. | OpenCap is a different multi-camera calibrated pipeline; no local approved files; kinetics are not transferable to monocular MediaPipe. |
| [KIMORE](https://doi.org/10.1109/TNSRE.2019.2923060) | RGB-D, skeletons, clinician-designed features and ratings across 78 participants. | Its five low-back exercises are not a direct sit-to-stand corpus; clinical scores are explicitly outside product scope. |

## Runtime-kind decision

Use a **transition-trial** contract, not the squat cyclic engine. A trial has
observable events rather than a required squat bottom:

1. `seated-stable`
2. `seat-off-candidate`
3. `rising`
4. `standing-stable` (completion)
5. optional `lowering`
6. optional `seated-stable` (return complete)

This model permits a single rise, repeated rises, and an incomplete return
without inventing `DESCENDING/BOTTOM/ASCENDING` squat phases. Seat-off is a
camera-derived event candidate, not measured chair force/contact.

## Capture contract

- **Required view:** side-on research capture. The chair edge, shoulder, hip,
  knee, ankle, and full standing position must remain visible.
- Stable chair against a wall; seat height and use of armrests recorded as
  context, not normalized away.
- Camera remains fixed near hip height. No digital zoom during the trial.
- User starts seated and still for calibration, feet planted and visible.
- Assistance, hands pushing on chair/thighs, another person, chair motion,
  occluded hips, cropped head/feet, or leaving the frame triggers abstention or
  an explicit unsupported-context reason—not a performance judgment.
- Live and upload must show the same protocol-owned view/setup wording.

## Required landmarks and derived signals

Required bilaterally where visible: shoulder, hip, knee, ankle; foot visibility
is required for setup but no ground-contact force is inferred. Candidate signals:

- hip vertical displacement relative to seated calibration;
- knee/hip angle observations in the declared side view;
- trunk angle observation;
- low-velocity stability windows for seated and standing states;
- landmark visibility/dropout duration.

All thresholds remain unnamed until labeled source data are available. Chair
contact, seat-off, assistance, and load are not directly observable from pose
landmarks alone.

## Completion, rejection, and abstention

Complete only when a seated calibration is followed by a monotonic rise
candidate and a stable standing window with required landmarks. Reject a trial
candidate from count for: return to seat before standing stability, insufficient
vertical displacement, lost hip/knee/ankle through the transition, or duration
outside a future evidence-derived capture sanity range. Fully abstain when
chair/setup context or landmark coverage cannot support event ordering.

Negative fixtures required before activation:

- squat performed in front of a chair;
- seated bounce/partial rise;
- standing start;
- assistance with hands or another person;
- chair moves;
- hip occlusion at seat-off;
- cropped ankles/feet;
- one complete rise followed by an incomplete sit.

## Metrics and report configuration

| Candidate metric | Initial tier | Product copy |
|---|---|---|
| Completed transitions | experimental | “transitions observed” |
| Rise duration | experimental | “camera-observed time from rise start to stable standing” |
| Return duration | research | Expert-only until event labels exist |
| Within-session duration CV | experimental with ≥3 complete trials | “consistency across this recording” |
| Trunk/knee angle waveform | research | No cue or expected range |

The Summary follows the M68 narrative. Evidence links each completed transition
to its event timeline. Expert shows raw event timestamps, coverage, assumptions,
and provenance. Coaching is omitted until independent expert labels and
agreement evidence exist.

## Label and validation plan

1. Acquire original UI-PRMD m05 or OpenCap validation files under M61 approval.
2. Preserve dataset subject splits and timestamps; do not use the reduced
   time-normalized deep-squat matrices.
3. Two independent raters label seated stability, rise start, standing stable,
   return start, seated return, assistance/occlusion, and trial exclusion.
4. Resolve disagreements without viewing KinematicIQ output.
5. Predeclare event tolerance, exact transition-count gate, dropout tolerance,
   and runtime budget before running the protocol candidate.
6. Report per-subject and per-context results, median/variance/worst case, and
   small-sample limits. Reliability/accuracy gates must be set before M72 activation.

## M72 hard-gate status

| Gate | Status |
|---|---|
| Transition-capable contract | Pass: M70 type/runtime pressure test |
| Protocol-owned capture metadata | Pass: research-only definition |
| Approved sit-to-stand seed files | **Fail**: current local UI-PRMD subset is deep squat only |
| Independent event labels | **Fail** |
| Predeclared numeric acceptance tolerances | **Fail pending seed inspection** |
| Desktop/mobile capture/results rendered | Not applicable until a runner exists |
| Claims checklist | Pass for this specification |

M72 may register a planned research stub and negative contract tests, but it
must not implement thresholds, emit metrics/findings, or become available.

