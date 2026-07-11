# M64 Tracking, Camera, and Metric Failure-Mode Diagnosis

**Baseline:** 2026-07-11 at repository commit `d0532036` plus the uncommitted M61-M63 working tree.

## Decision summary

| Surface | Decision | Confidence | Why |
|---|---|---|---|
| One Euro live filter | **Do not change** | High | No independent event/angle reference proves a target improvement or acceptable lag. |
| MediaPipe model/config | **Research** | High | OCHuman corpus is unavailable; UI-PRMD reduced matrices contain no RGB or MediaPipe pairing. |
| Rep gates | **Do not change** | High | Local labeled exact count is 9/9; bottom-frame MAE is unavailable. |
| Camera confidence algorithm | **Do not change yet** | High | Confidence is visibility/tracking evidence, not validity; fix semantics before retuning. |
| Camera view copy | **Change** | High | Front and side instructions conflict. Protocol metadata must own one setup contract. |

M65 therefore completes as a measured **no-adoption** decision. This is safer
and more informative than tuning a filter against incompatible data.

## Inputs and limitations

1. Eleven local pose tapes: 0 replay errors; nine labeled tapes match exact rep
   count; three tapes report landmark jumps; verdicts are 3 valid, 5
   questionable, and 3 invalid.
2. UI-PRMD reduced deep-squat baseline: 180 classed trials, but centered/scaled
   and time-normalized. It measures the external adapter and source waveform
   distribution, not KinematicIQ tracking error.
3. OCHuman: native schema adapter verified on a CI fixture; no real corpus run.
4. No paired camera views, source-video bottom labels, absolute reference
   angles, or performance device matrix.

## Ranked diagnosis

### 1. Reference-evidence coverage, not the filter

The dominant limitation is absence of a synchronized consumer-RGB → MediaPipe
→ independent angle/event reference. Without it, jitter reduction can mask
phase lag or peak attenuation. This blocks filter/model adoption.

### 2. Confidence concepts are easy to conflate

Several invalid tapes retain High camera confidence. That is internally
consistent—landmarks may be visible while a set has impossible asymmetry or too
few trusted reps—but the UI must distinguish camera confidence, set validity,
and scientific validation. M68 owns that separation.

### 3. Camera view has contradictory instructions

The current protocol/readiness contract is front-view, while upload and some
coaching copy request side-view. There is no paired-view evidence supporting
equivalent sagittal metrics. M66 must source instructions from protocol metadata
and select front view for current squat capture. Sagittal-sensitive metrics stay
experimental/limited rather than being declared view-valid.

### 4. Quality gates are doing substantial work

Eight of eleven tapes are qualified or invalid. The recurring reasons—small
sample, impossible asymmetry/flexion, one-sided view, knee-less reps, no reps—are
not demonstrated filter failures. They support clearer setup/results language.

### 5. Temporal jumps merit future targeted evidence

Three tapes report jumps, but exact rep counts remain correct. A future filter
candidate needs source-video event labels or an independent waveform reference,
one-variable comparison, per-trial regressions, and a lag budget.

## Camera-view / metric eligibility decision

| Metric family | Current front-view use | Side-view use | Decision |
|---|---|---|---|
| Rep count / phase | Allowed with quality gates | Unvalidated | Keep current behavior. |
| Bilateral knee visibility/asymmetry | Observational | Limited | Front-view only. |
| Knee flexion/depth angle | Experimental observation | Potentially informative but unvalidated | Do not claim cross-view equivalence. |
| Trunk lean / sagittal waveform | Limited | Research | Do not strengthen claims. |
| Force, torque, power, tissue state | Forbidden | Forbidden | No monocular view unlocks kinetics. |

## M65 predeclared gate

No candidate experiment is authorized because M64 found no compatible external
reference capable of measuring improvement and regression. The old default
remains. Reopen only when at least one synchronized reference provides event lag
or comparable waveform error and a saved before baseline.

