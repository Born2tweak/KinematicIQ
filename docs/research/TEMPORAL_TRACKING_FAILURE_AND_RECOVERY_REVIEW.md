# Temporal Tracking Failure and Recovery Review

**Status:** Phase 4 research review; implementation policy and numerical gates are not yet validated
**Repository audited:** `master` at `8d8a77d` (2026-07-14 session)
**Working lunge identity:** forward lunge with stride and return; owner approval pending
**Decision supported:** what KinematicIQ can observe, recover, reject, and serialize when a single-camera pose stream fails over time

## 1. Executive summary

KinematicIQ can add deterministic temporal-failure instrumentation now, but the live repository does **not** authorize inline-lunge implementation. The supplied research prompt says Phase 4 must continue implementing inline lunge. The controlling repository says the opposite: `NEXT_EXECUTION_PACKAGE.md` calls M73 a research track, M78 requires separately approved timed data and labels, and `INLINE_LUNGE_PROTOCOL_RESEARCH.md` says “Research only; not approved for implementation or availability.” No lunge protocol, runtime, phase detector, metrics, or test fixtures exist in `web/src`. This review therefore specifies shared contracts and future lunge-specific requirements without adding lunge code or treating public activation as the only gate. Repository authority wins until an owner-approved roadmap change closes the data, label, and implementation gates.

The current temporal defenses are useful but incomplete. Live coordinates receive a causal One Euro filter; upload/replay can use Hampel rejection, linear interpolation, and zero-phase Butterworth filtering. Per-frame quality observes visibility coverage and a largest critical-landmark speed, but it never gates analysis. The current filter accepts non-monotonic time by clamping `dt` to 1 microsecond, the live loop has no queue/latency ledger, no subject identity state, no swap or bone-length detector, and no recovery quarantine. Offline interpolation defaults to 100 frames, a frame-count rule that can span very different durations and is not defensible as a recovery threshold.

The recommended contract is a fail-closed state machine separate from filtering:

1. Preserve raw landmarks, raw timestamps, missingness, and declared orientation.
2. Compute scale- and time-aware diagnostics only from landmarks visible in both observations.
3. Classify each frame as `accepted`, `suspect`, `missing`, or `discontinuity`, with named reasons.
4. Freeze phase/trial advancement during suspect or missing intervals; never let interpolated samples create an event or metric extremum.
5. Permit recovery only after a short, protocol-neutral gap and a multi-frame identity/geometry confirmation; mark the bridged interval unavailable for event timing.
6. Reject the trial on a phase-boundary gap, identity ambiguity, timestamp reversal, camera/orientation discontinuity, or a protocol-critical landmark loss. Reject or abstain the set when reliable trials are insufficient.

All numeric gates below are **provisional engineering hypotheses**. They may be used to build instrumentation and perturbation fixtures, not to claim physiological plausibility, accuracy, or validated recovery.

## 2. Current pipeline audit

### 2.1 Observed repository behavior

| Surface | Current behavior | Consequence for temporal recovery |
|---|---|---|
| Pose engine | `poseEngine.ts` uses MediaPipe Pose Landmarker Full, `VIDEO` mode, GPU delegate, `numPoses: 1`; it returns only the first pose or `null`. `poseConfidence` is the mean visibility of eight squat-critical landmarks. | A second person is not exposed to downstream code. “Confidence” is a local visibility aggregate, not identity confidence or calibrated coordinate error. |
| Live clock and scheduling | `CameraScreen.tsx` schedules one `requestAnimationFrame` loop and calls the source with `performance.now()`. There is no captured media timestamp, inference duration, callback age, dropped-frame count, or queue depth. | Delayed inference and display cadence cannot be separated from subject motion. Queue growth is not currently observable. |
| Live filtering | `createLiveStreamFilter()` applies an independent One Euro filter to every landmark axis. Visibility passes through. `dt` is `max(t-current, 1e-6)`; there is no reset on reversal, long gap, loss, or reacquisition. | A discontinuity can contaminate filter state and appear as extremely high derivative/adaptive cutoff rather than a named failure. Coordinates with low visibility still enter filter state. |
| Offline filtering | `filterFrameSequence()` performs coordinate-wise interpolation, Hampel replacement, then forward/backward Butterworth. Default maximum gap is 100 **frames**; declared `meta.fps` supplies the sample rate. | Missingness is not represented by ordinary MediaPipe frames, and the default can silently bridge seconds. Forward/backward filtering is non-causal and may spread a replacement across event boundaries. |
| Frame quality | `landmarkQuality.ts` reports all/critical visibility coverage, missing critical names, max visible-to-visible 2D speed, and `implausibleJump` above 4 normalized units/s. It refuses speed comparison for `dt <= 0` or `dt > 500 ms`. | Good observational seam, but image-width/height anisotropy and body scale are ignored; coordinated jumps, segment consistency, swaps, and reacquisition are not distinguished. Quality is explicitly non-gating. |
| Readiness | `captureReadiness.ts` checks visible body regions, centering, occupancy, front-view proxies, feet margin, and bilateral visibility using provisional squat-front-view rules. | It is pre-capture and squat-specific. It does not monitor camera motion, user departure, or protocol validity during a trial. It cannot be reused as lunge side-view readiness unchanged. |
| Squat FSM | Phase detection/rep counting consumes filtered pose frames. Trial rejection and set quality handle angle/rep artifacts, but no temporal-failure state freezes or invalidates the FSM. | A tracking fault may alter a phase boundary before downstream rep gates see it. |
| Pose tapes | Raw frames, timestamps, `fps`, filter metadata, entry state, truth count/bottom frames, and rep rejections serialize. Deserialization validates only the top-level shape and positive `fps`; live FPS is a span estimate. | Strong audit substrate, but no schema for missing callbacks, inference timing, orientation, subject continuity, quality decisions, recovery intervals, or filter reset events. |
| Replay | Raw, One Euro, and Butterworth variants replay the same tape; live replay restores filtering and entry state. | Suitable for deterministic perturbations once temporal events and discontinuities are additive tape fields. |
| Benchmark schema | `benchmarkSequence.ts` preserves explicit missing joint states and rejects non-increasing timestamps. | This stricter missingness/timestamp contract should inform pose-tape vNext, but a benchmark sequence must remain distinct from a MediaPipe pose tape. |

### 2.2 Prompt/repository conflict and lunge boundary

The prompt assumes Phase 3 lunge implementation exists and instructs continued Phase 4 implementation. Live evidence contradicts both assumptions:

- `web/src/protocols/registry.ts` has squat, sit-to-stand, hip hinge, jump, and sprint; no lunge ID is registered.
- `web/src/protocols/runtime.ts` registers only `SQUAT_RUNTIME`.
- Repository search finds “lunge” only in research/roadmap text, not production or test code.
- M78 requires approved original timed data, independent event labels, subject splits, and predeclared criteria before an implementation milestone.

Accordingly, this document maps future lunge requirements but does not advise implementing a lunge FSM, filters, metrics, or availability flag now. Shared, movement-neutral diagnostics remain reversible future work, subject to a separately authorized implementation task.

## 3. Evidence review

### 3.1 What the available signals can support

- MediaPipe documents `visibility` as the likelihood that a landmark is visible and its tracking options as minimum success scores. It does not document landmark visibility as a calibrated probability of coordinate correctness, subject identity, or joint-angle error. KinematicIQ must therefore use it as one observable feature, not as an error bar. The model has distinct detection, presence, and tracking concepts, but the current wrapper serializes only landmark visibility and a derived mean.
- Temporal pose literature uses motion continuity, constant/consistent bone length, body symmetry, and occlusion-aware association to improve estimation and tracking. These are good **diagnostics** for KinematicIQ. In monocular 2D, projected segment lengths legitimately change with out-of-plane rotation and foreshortening, so they cannot be hard anatomical truth.
- PoseTrack makes identity switches and occlusion explicit evaluation problems in multi-person pose tracking. With `numPoses: 1`, KinematicIQ cannot claim to detect multiple people reliably. It can only flag indirect contamination (abrupt scale/centroid/appearance-free geometry change) and abstain; true association requires exposing candidates or an identity signal.
- Normalize displacement using a robust subject scale measured during a trusted standing/calibration window (for example, median visible shoulder-to-ankle or hip-to-ankle chain scale), and use source timestamps. Keep image `x` and `y` separate or convert to pixels before Euclidean distance because normalized `x` and `y` use different denominators on non-square video. Report both normalized-body-length per second and pixel equivalent when frame dimensions are known. Do not normalize by a single current-frame segment during a suspected failure.
- Velocity and acceleration amplify coordinate noise; acceleration is appropriate as corroborating evidence, not a lone hard gate. Require agreement among visibility, displacement, segment-ratio residual, and coherent-body motion. Bilateral relationships are protocol- and view-dependent: projected left/right geometry can cross or collapse in a side view without a label swap.

### 3.2 Filtering evidence and limitations

The One Euro paper explicitly trades jitter against lag using a speed-adaptive cutoff; it is causal and suitable for interaction, but parameters are application-specific. Zero-phase forward/backward filtering removes phase delay only because it uses future samples, so it is upload/replay-only. The biomechanics comparison by Camargo et al. shows that moving average, Butterworth, and polynomial/Savitzky-Golay procedures differ in peak, border, and derivative errors; no filter is universally best without signal-specific tuning. A markerless kinematics validation using Hampel plus Butterworth supports the combination as a plausible pipeline, not KinematicIQ’s current thresholds.

The key policy is to benchmark the **derived decision**, not just smoothness. For every candidate filter measure coordinate jitter, peak-angle attenuation, bottom/event-frame displacement, phase transition lag, rep/trial count, rejection rate, and edge behavior. A filter that reduces jitter but changes events or suppresses real extrema fails.

## 4. Failure taxonomy

“Short” and “long” below are classifications derived from elapsed milliseconds and phase context, never a universal frame count. A starting experiment may sweep 1–5 missing samples at each observed cadence; no production threshold is approved here.

| Failure | Observable inputs | Detection options | False-positive risk | Recovery eligibility | Confidence effect | Rejection/abstention behavior | Replay evidence | Required fixture |
|---|---|---|---|---|---|---|---|---|
| Single-landmark spike | Raw/current landmark, prior trusted samples, `dt`, visibility, neighbor segments | Robust local residual (median/Hampel), body-scale-normalized speed, adjacent-bone residual; other landmarks remain coherent | Fast distal motion; real occlusion edge; low FPS | Eligible only if isolated, not event-critical, surrounded by trusted samples; keep raw value and mark sample unavailable | Landmark and dependent metrics unavailable for that frame; no whole-pose penalty unless critical | Freeze metrics using that joint; reject trial if spike changes a boundary/extremum or repeats | Raw and classified coordinates, residuals, affected joint/metrics | 1–10 px equivalent impulse on each critical landmark at standing, descent, bottom, ascent |
| Coordinated whole-skeleton jump | Centroid/scale/orientation deltas for many visible landmarks | Robust centroid translation with preserved internal segment geometry; compare background/camera signal if later available | Athlete steps quickly; source resize/crop | Not interpolated. Recovery requires stable post-jump geometry and proof camera/subject continuity; otherwise new segment/session | Whole frame suspect; identity confidence drops | Freeze immediately; reject active trial; set-level abstain if camera continuity unknown | Per-landmark displacement vector, consensus translation, pre/post scale | Translate all landmarks together by swept x/y offsets for 1+ frames |
| Bone-length discontinuity | Trusted baseline segment ratios; current 2D and world segments; visibility | Median/MAD residual per segment plus multiple connected segments; distinguish scale-wide change from one segment | Foreshortening, yaw, depth error, clothing/occlusion | Only after ratios return for confirmation frames; never repair anatomy | Dependent limb unavailable; systemic changes lower whole-frame trust | Reject boundary/extremum using affected chain; persistent changes force reacquisition/abstention | Baseline ratios, residuals, view proxy, segments implicated | Stretch one limb segment; depth/yaw proxy; compare 2D vs world response |
| Left/right swap suspicion | L/R coordinates, segment continuity, declared/mirrored orientation, lead side | Compare identity-preserving vs swapped assignment cost over several joints and frames; require anatomically connected evidence | Body crossing in side view, camera mirror, rotation through profile | No automatic relabel in initial policy; resume only when declared orientation and labels are stable | Bilateral/lead-side metrics unavailable | Reject lunge trial; squat may retain only non-bilateral metrics if phase unaffected, otherwise reject | Both assignment costs, orientation metadata, implicated pairs | Swap all L/R paired landmarks for 1 frame and sustained interval; mirror coordinates separately |
| Partial occlusion | Per-landmark visibility/presence if exposed, missing critical set, continuity | Visibility below threshold plus chain coverage; separate distal/one-side/systemic loss | Visibility score miscalibration; self-occlusion expected by protocol | Short non-critical gaps may recover; critical chain loss cannot create events | Local dependency graph removes metrics; pose confidence never increases | Freeze protocol features depending on hidden joints; reject trial if required phase evidence is absent | Visibility vector, missing set, duration, phase | Zero/lower visibility for single joint, rear chain, feet, torso |
| Short dropout | No pose result or critical-chain unavailable; elapsed source time | Explicit missing callback/sample event, not repeated coordinates; duration by timestamp | Slow detector callback mistaken for no-pose unless timings are separate | Conditional: no phase boundary, identity stable before/after, duration below validated gate; interval remains missing | Confidence decays with duration; bridged metrics/event timing unavailable | Freeze state; if recovery passes, resume and annotate; otherwise reject current trial | Missing interval start/end/duration, prior phase, recovery checks | 1 and multi-frame no-pose gaps at each phase and several cadences |
| Long dropout | Same as short plus duration | Elapsed-time gate or maximum uncertainty bound | Device pause/backgrounding | Never join the same active trial. User may start a new capture after readiness/calibration | Trial confidence zero; prior completed trials retain evidence | Reject active trial; reset filters/FSM; require full readiness and calibration | Gap duration, lifecycle reason if known, reset sequence | Gaps from short sweep through seconds; page visibility pause |
| Landmark reacquisition | First pose after loss; pre-loss baseline; new geometry/centroid/scale/orientation | Quarantine and compare several consecutive frames against baseline and motion envelope; no single-frame resume | User legitimately repositioned; viewpoint drift | Only after stable confirmation; filter must reseed rather than bridge old state | Starts low and rises only through deterministic confirmation | Do not advance phase during quarantine; mismatch becomes new subject/capture and rejects old trial | Candidate frames, comparison residuals, confirmation count, reset event | Dropout followed by same pose, shifted same subject, swapped labels, wrong subject |
| Rear-leg visibility loss (future lunge) | Declared lead side; rear hip/knee/ankle/foot visibility | Protocol-owned required-joint coverage; duration and phase | Expected self-occlusion in strict side view | Only outside an active trial or for a validated non-rear-dependent output; initial lunge contract should not bridge | Trial completeness/return evidence unavailable | Reject lunge trial because both feet/line of travel and stable return are hard gates | Lead-side declaration, missing rear joints, phase, duration | Occlude rear knee/ankle/foot during step, bottom, and return |
| User leaves and returns | No pose, prior bbox/centroid/scale, time gap, readiness state | Departure after sustained no-pose/out-of-frame; return always enters reacquisition | Brief edge crop | Not within same active trial; new readiness/calibration required even if likely same person | Active trial zero; completed trials unchanged | Reject current trial; optionally continue set only under future validated session rule | leave/return events, durations, before/after signature | Translate body out of bounds, no-pose interval, return same/different scale |
| Camera movement | Coherent subject transform, frame dimensions/orientation, background motion if later implemented | Without image features only suspicion: coherent whole-body translation/scale/rotation inconsistent with motion; explicit orientation/track settings changes are definitive | Real whole-body step or lunge translation | No recovery inside trial. Re-establish setup/readiness and recalibrate | All geometry-dependent evidence after change separated | Reject active trial; split capture epoch | Frame transform metadata, consensus pose transform, epoch ID | Whole-skeleton translation/scale/rotation and crop/resize events |
| Timestamp reversal or large gap | Raw media/callback timestamps, monotonic clock, `dt` | `dt <= 0`; robust cadence baseline and explicit large-gap class; never clamp silently | Clock-domain mixing | Reversal: none until new epoch/reset. Large gap: same rules as dropout | Frame unavailable; derivative/filter confidence zero | Freeze/reject active trial depending phase; reset temporal filters | Raw timestamps, clock source, delta, discontinuity class | Equal, reversed, NaN/invalid (parser rejection), and swept positive gaps |
| Frame-rate degradation | Rolling timestamp deltas, media frame count, detected frame count | Robust p50/p95 `dt`, low-rate duration, dropped-media-frame estimate | Naturally variable cadence | Continue only if protocol bandwidth/event tolerance is validated at rate; otherwise freeze/reject | Timing/peak confidence reduced; no fixed-FPS derivative | Reject trials whose event resolution falls below gate; set can retain earlier trials | Rolling cadence, jitter, dropped count, phase | Downsample tapes, irregular cadence, bursty delivery while preserving timestamps |
| Inference queue growth | Capture/media timestamp, inference start/end, result timestamp, pending count | Result age and service time trends; latest-frame-wins drop policy | Slow display loop without queue | Recover after queue drained and fresh-frame age is within budget; reset causal filter if discontinuity | Stale results unavailable for live decisions | Do not process stale backlog; drop it explicitly; reject active trial if event interval lost | All four timestamps, queue depth, drop reason | Synthetic increasing service time/backlog and burst completion |
| Device rotation or mirroring mismatch | Width/height, orientation angle, facing mode, transform/mirror flags, declared side | Any change starts a new geometry epoch; verify coordinate transform and L/R assignment | Browser UI rotation without media-track change | Never seamless during trial; reset and redo setup | Geometry/side-dependent metrics unavailable | Reject active trial; prevent lunge lead-side carryover | Epoch metadata and transform matrix | Swap dimensions, rotate coordinates 90/180°, flip x with and without L/R swap |
| Multiple-person contamination where detectable | Number of pose candidates if engine is changed; today only abrupt pose geometry/scale/centroid | Today: indirect ambiguity flag only. Future: candidate count, association cost, sustained selected ID | Bystander overlap; same-scale entry | No recovery unless one subject is unambiguous across quarantine; initial policy restarts | Identity-dependent evidence zero while ambiguous | Reject active trial; never silently choose closest/largest without validated association | Candidate count (future), association scores, ambiguity reason | Bystander partial skeleton, wrong-subject replacement, crossing candidates; document current unobservability |
| Protocol-invalid but well-tracked motion | High tracking quality plus protocol-specific phase/trajectory contract | Movement classifier is not implied; deterministic negative rules and timeout/ordering constraints | Valid variation outside narrow protocol | Tracking recovery irrelevant | Tracking confidence may stay high; protocol confidence is zero | Reject trial as wrong/invalid movement; never relabel or coach | Quality pass plus named protocol rule violation | Squat, split squat, lateral lunge, partial step, side switch, wrong order |

## 5. Filter and latency comparison

| Method | Online? | Strength | Primary risk to KinematicIQ events | Required benchmark |
|---|---|---|---|---|
| One Euro | Yes, causal | Adaptive jitter/lag trade-off; low state cost | Parameter-dependent lag/peak attenuation; stale state across gaps; independent axes ignore skeleton | Sweep `minCutoff`, `beta`, `dCutoff`; measure jitter, extrema attenuation, transition lag, count/rejection changes, and reset behavior |
| Butterworth | Causal or offline zero-phase | Well-characterized low-pass; common in biomechanics | Causal phase lag; forward/backward edge transients and acausal leakage; cutoff tied to actual sampling | Sweep cutoff/order with timestamp-resampled vs irregular inputs; report peak and event error, edges, counts |
| Savitzky-Golay | Centered offline; trailing variant is causal with lag | Polynomial shape/derivative preservation on evenly sampled windows | Window/polyorder distort abrupt events and edges; ordinary formulation assumes uniform spacing | Sweep odd window/polyorder; test peaks, derivatives, phase boundaries, edges and gaps |
| Kalman | Yes, causal | Explicit state/prediction/update and uncertainty machinery | False confidence from wrong motion/noise model; prediction can fabricate motion through occlusion | Predeclare constant-velocity/acceleration model; compare innovation, coverage/calibration, lag, and gap divergence against labeled truth |
| Median | Centered or trailing | Robust to isolated impulse noise; edge-preserving | Quantization/plateaus; window delay; can erase narrow real extrema | Sweep odd windows; impulse rejection vs bottom/turning-point timing |
| Hampel | Usually centered offline | Names robust local outliers using median/MAD | MAD-zero behavior can replace legitimate departures; centered look-ahead; not a dropout policy | Sweep window/k; false replacement on real movement, spike recall, boundary impact |

**Latency accounting:** distinguish algorithmic latency (filter/window), inference service time, result age, scheduling delay, and phase-decision delay. Report milliseconds and source-frame offsets. `filtfilt` may have zero phase relative to its processed sequence but is not zero-latency. A centered SG/median/Hampel window also uses future data. For live decisions, measure transition time against the raw source timestamp, not callback completion time.

**Current-filter decision:** retain current filters only as baselines. Do not endorse the 4 Hz/1.5 One Euro settings, 6 Hz fourth-order Butterworth, Hampel 7/3, or 100-frame interpolation as validated lunge or squat gates. The existing tests establish synthetic noise reduction and approximate peak position, not real-motion accuracy, recovery safety, or event latency.

## 6. Recovery versus abstention policy

### 6.1 Deterministic state model

Use an additive temporal-quality machine upstream of protocol segmentation:

`TRACKING` → (`SUSPECT` or `MISSING`) → `RECOVERY_QUARANTINE` → `TRACKING`, or → `DISCONTINUITY`.

- `TRACKING`: frame passes timestamp, orientation epoch, visibility dependency, and temporal residual checks. It may advance the protocol FSM.
- `SUSPECT`: pose exists but one or more diagnostics conflict. Serialize it; do not advance affected phase/metrics.
- `MISSING`: no usable pose/critical chain. Time continues; preserve absence.
- `RECOVERY_QUARANTINE`: candidate pose has returned, but identity/geometry stability is not yet established. Reseed filter state at quarantine start; do not join filtered state across the gap.
- `DISCONTINUITY`: recovery cannot support the same trial because of time, identity, camera epoch, orientation, protocol-critical coverage, or event ambiguity. Reject the active trial and reset protocol temporal state.

### 6.2 Recovery rules

Interpolation is defensible only for an explicitly marked, short, interior, isolated coordinate gap when both endpoints are trusted, motion is smooth at the relevant scale, no camera/identity/orientation discontinuity occurred, and the interpolated values are used for visualization or a non-event summary validated for that purpose. It is **not** defensible for phase transitions, extrema, trial start/end, velocity/acceleration peaks, identity changes, long/edge gaps, whole-pose loss, or a future lunge’s step/bottom/return events. Default policy: preserve missingness and freeze decisions.

Recovery requires all of the following: monotonic same-clock timestamps; same capture/orientation epoch; required landmarks visible; body scale and connected-segment residuals inside validated limits; no lower-cost L/R-swapped assignment; centroid displacement plausible over elapsed time; and several consecutive candidate frames. A single high visibility value is insufficient.

Confidence is dependency-based, not one scalar repair. A hidden ankle invalidates ankle- and foot-dependent observations; it need not erase a visible trunk observation. Trial confidence must, however, drop to unavailable when event order or identity is ambiguous. Invalid capture fully abstains; questionable capture does not coach, consistent with ADR-002 and the set-quality contract.

## 7. Shared and movement-specific contracts

Shared across squat and any future lunge:

- Raw timestamp/orientation epochs, explicit missingness, inference timing, queue/drop accounting, visibility semantics, filter resets, normalized temporal residuals, coherent-jump suspicion, reacquisition quarantine, identity ambiguity, and additive pose-tape events.
- A protocol receives only accepted observations plus quality state; it must not reinterpret raw tracker faults.
- No interpolated observation can create an event, extremum, or confidence increase.

Squat-specific:

- Front-view readiness and bilateral knee/hip/ankle coverage; squat phase rules and rep gates remain owned by the squat runtime.
- Bilateral loss may invalidate asymmetry before it invalidates every sagittal observation, but a phase-changing temporal fault rejects the rep.

Future inline-lunge-specific (research contract only):

- Side view, declared lead side, both feet and rear leg observable, and explicit `standing → step → descent → bottom → ascent → stable return` ordering.
- Rear-leg/foot loss, L/R uncertainty, a gap at step/bottom/return, or camera yaw sufficient to change projected sagittal geometry rejects the trial.
- Static split squat, lateral lunge, squat, partial step, side switch, and leaving frame are well-tracked negatives, not tracking failures.
- Thresholds and phase rules wait for approved timed data and independent event labels; no production implementation is authorized by this review.

## 8. Pose-tape perturbation plan

Every experiment runs raw and each candidate filter, preserves the original as an immutable baseline, and reports by phase and trial. A “rollback” means do not adopt the candidate rule/filter and revert the isolated experimental change; it does not mean altering original tapes.

| Experiment | Injection | Expected invariant | Metrics | Failure-threshold classification | Rollback condition |
|---|---|---|---|---|---|
| 1–10 px equivalent landmark perturbations | Convert pixels using tape width/height metadata; impulse each critical landmark/axis at each phase | Small perturbations do not change count/events; large isolated spikes are named and cannot create extrema | Detection rate, false positives, angle/peak delta, event-frame delta, count | Sweep only; candidate `warning`/`trial-reject` boundaries require labeled ROC/cost choice | Any adopted rule rejects clean real frames or a filter hides an event-changing spike |
| One- and multi-frame gaps | Remove pose or lower selected visibility for 1, 2, 3, 5, 10 samples at regular and degraded cadence | Missingness remains explicit; FSM does not advance through gap; same perturbation duration classifies consistently across FPS | Recovery/rejection class, event/count delta, gap duration, post-gap residual | `recoverable`, `trial-reject`, `set-discontinuity`; provisional until data | Frame-count dependency, invented event, identity-free resume, or confidence increase |
| Phase-boundary shifts | Place spikes/gaps immediately before/on/after descent, bottom, ascent, return | A fault cannot move a boundary without a named low-confidence/rejection result | Absolute event lag ms/frames, extrema attenuation, trial disposition | Any ambiguous boundary is initially `trial-reject` | Silent boundary shift or count preserved with wrong event evidence |
| Camera-yaw proxies | Horizontally compress shoulder/hip spread, alter depth/segment projection, or use real multi-yaw captures when approved | Shared detector labels view change/suspicion; does not call it anatomical change | Segment-ratio residual, false camera-motion flags, angle bias, disposition | Proxy is diagnostic-only; production threshold needs real yaw labels | Proxy conflates valid motion with yaw or yields a claimed degree estimate |
| Timestamp gaps/reversals | Preserve coordinates; inject equal, reversed, and swept positive `dt`, plus cadence jitter | Reversal never reaches filter/FSM; positive gaps use elapsed-time policy | Classification, reset count, derivative extrema, event/count delta | reversal=`discontinuity`; gap classes provisional | Silent `dt` clamp, NaN/infinite output, or cross-gap phase advancement |
| Filter parameter variations | One Euro grid; Butterworth cutoff/order; SG window/order; median/Hampel windows; optional Kalman models | No filter wins on jitter alone; accepted variant stays within event/count/peak budgets | Jitter, RMSE where truth exists, peak attenuation, lag, overshoot, edge error, rejection | `candidate`, `no-benefit`, `unsafe-regression` against predeclared multi-metric gate | Any labeled per-trial regression beyond budget, or benefit lacks external reference |
| Mirrored landmarks | Flip x, swap L/R labels independently and together; change declared mirror flag | Coordinate mirroring and anatomical labels remain separate; mismatch is detected before side metrics | Swap suspicion, lead-side errors, event/count, false positives | mismatch=`trial-reject`; correct declared mirror should preserve compatible outputs | Silent lead-side reversal or changed metric sign without epoch metadata |
| Whole-skeleton translation | Add common x/y vector for one frame, sustained block, and post-gap reacquisition | Internal geometry stays stable while coherent-jump detector distinguishes transform from single-joint spike | Consensus ratio, jump class, phase/count, recovery result | one-frame suspicion; sustained transform/camera continuity unresolved=`trial-reject` | Detector calls coherent translation a bone failure or silently filters it into motion |
| Wrong-movement input | Squat, split squat, lateral lunge, partial step, side switch; future approved videos/tapes | Tracking may remain high while protocol result rejects; no lunge event is invented | False trial count, wrong-movement rejection reason, tracking-quality distribution | `protocol-invalid`, separate from tracker failure | Wrong movement completes a trial or gets tracking-confidence penalty as substitute |

Minimum reporting strata: source/capture, subject (when permitted), phase, landmark, cadence, filter, perturbation magnitude/duration, and clean versus perturbed pair. Predeclare acceptance costs before tuning. Synthetic fixtures establish determinism and monotonic response; they do not validate physiological thresholds.

## 9. Required diagnostics and serialization

Extend pose tapes **additively** in a future authorized implementation; old tapes remain readable. Suggested vNext fields:

- `meta.frameWidth`, `frameHeight`, clock source, media facing mode, orientation angle, coordinate transform/mirror declaration, capture epoch ID, and exact filter parameters/version.
- Per callback: capture/media timestamp, callback timestamp, inference start/end, frame/result age, source frame sequence, inference sequence, queue depth, and explicit drop/no-pose reason.
- Per frame: raw landmark/presence/visibility values exposed by the chosen API; accepted/suspect/missing state; named failure reasons; body-scale baseline; normalized displacement; segment residuals; coherent-motion statistic; swap costs; required-joint mask.
- Per interval: dropout start/end/duration, phase at entry, recovery decision, quarantine evidence, reset events, camera/orientation epoch changes, and affected metrics/events.
- Per trial: reliable time coverage, unavailable event/metric reasons, rejection reason, and whether any value is observed, filtered, or interpolated.

Do not overwrite raw coordinates, compress away missing callbacks, backfill visibility, or serialize a synthetic point as observed. Do not store video, biometric appearance embeddings, or telemetry: KinematicIQ remains browser-only/local-first. Diagnostics should be downloadable/local like pose tapes and must avoid implying that `visibility` is calibrated accuracy.

## 10. Implementation and test map

This is a map, not authorization to edit code. Keep the temporal-quality machine movement-neutral and protocol dependencies explicit.

| Future change | Likely code seam | Targeted tests/evidence |
|---|---|---|
| Temporal state/types and dependency mask | New `web/src/cv/temporalQuality.ts`; additive types in `cv/types.ts` | Unit tests for every transition, timestamp class, missingness, scale normalization, no mutation |
| Filter discontinuity/reset contract | `cv/landmarkFilter.ts` | Reversal/large-gap/low-visibility/reacquisition tests; no cross-gap state; clean baseline parity |
| Capture/inference timing | Camera source/`CameraScreen.tsx` loop and `poseEngine.ts` | Fake-clock queue growth, latest-frame drop, result-age tests; camera e2e parity |
| Raw missing-event recording and tape vNext | `eval/poseTape.ts`, recorder, download/store readers | Old/new round trip, explicit missing intervals, invalid timestamp/orientation parsing, immutable raw frames |
| Replay perturbation library | New `eval/perturbations.ts`, `replayHarness.ts`, `scripts/evalTapes.ts` | Golden deterministic transformations; pairwise reports; seed/version serialization |
| Upstream gate into segmentation | `analysis/videoAnalyzer.ts`, protocol runtime boundary | Fault frames never advance phase; affected trials reject; clean squat parity and existing regression tapes |
| Set-quality integration | `session/setQualityGate.ts` | Invalid fully abstains; questionable suppresses coaching; completed trustworthy trials remain distinguishable |
| Squat-specific dependency rules | Squat runtime/profile and tests | Bilateral-vs-local metric abstention, boundary faults, front-view fixtures |
| Future lunge rules | Only after owner-approved implementation milestone, in a lunge-owned protocol/runtime | Approved subject-held-out count/event/dropout gates, negatives, rear-leg/lead-side/mirror tests |

Verification for any behavior change must include targeted unit tests, nearby analysis/CV/session tests, build, coverage, `eval:tapes` when local tapes exist, and camera e2e for loop changes. Filter/gate changes require a saved paired benchmark and per-trial regressions, not only aggregate jitter.

## 11. Unsupported approaches and explicit non-actions

- No lunge code, registry entry, runtime, phase FSM, metric, camera copy, or activation change is supported by this review.
- Do not change MediaPipe model, `numPoses`, confidence thresholds, current filters, or phase/rep gates without a separately approved benchmark task.
- Do not interpret visibility, the mean `poseConfidence`, or a Kalman covariance as calibrated anatomical accuracy.
- Do not invent an image-quality, person-identity, camera-motion, or movement classifier from pose coordinates alone.
- Do not auto-swap left/right labels, extrapolate through occlusion, or fill long/edge gaps.
- Do not treat constant 2D bone length as anatomy under monocular yaw/foreshortening.
- Do not use smoothing as failure recovery: detection, policy, and filtering are separate stages.
- Do not use frame counts as time thresholds across variable rates, or declared average FPS as a substitute for timestamps.
- Do not claim a zero-phase offline filter is zero-latency or suitable for live decisions.
- Do not turn a well-tracked wrong movement into a low-tracking-confidence result.

## 12. Open questions and confidence assessment

| Question | Current confidence | What closes it |
|---|---|---|
| Can current MediaPipe visibility predict coordinate/angle error for KinematicIQ captures? | Low | Synchronized reference data and reliability/calibration curves by joint, view, motion, and device |
| What short-gap duration is recoverable without event bias? | Low | Approved labeled tapes with induced/natural gaps at every phase and a predeclared cost function |
| Which scale normalization is most stable in side-view lunge? | Low | Approved side-view captures across distance, body size, clothing, and yaw |
| Can `numPoses: 1` detect wrong-subject reacquisition? | High that it cannot do so reliably | Expose multiple candidates or another privacy-reviewed identity-continuity signal, then validate association |
| Are current filter settings beneficial on real squat data? | Low-to-medium | Synchronized external reference; existing synthetic/replay tests establish only noise reduction/parity |
| Can lunge rear-leg loss ever be recoverable? | Low | Independent event/metric labels demonstrating which outputs remain valid; initial policy rejects the trial |
| Can pose-only coherent translation distinguish camera movement from subject travel? | High that it is ambiguous | Background/image motion or explicit camera metadata plus labeled experiments |
| Does a temporal gate improve safety without excessive false rejection? | Low | Subject-held-out paired clean/perturbed evaluation and field validation across named devices |

High-confidence conclusions are directly supported by current code/repository evidence: lunge is research-only and absent from implementation; temporal quality is observational; current tape schema lacks recovery diagnostics; live filtering lacks discontinuity reset; multiple-person identity is unavailable downstream. Medium-confidence design recommendations follow official API semantics and primary pose/filter literature. All numerical recovery, filter, and rejection thresholds remain low-confidence until labeled KinematicIQ data exists.

## 13. References

Primary/official sources (stable links; accessed 2026-07-14):

1. Google AI Edge, [Pose landmark detection guide](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) — model stages, 33 landmarks, normalized/world outputs.
2. Google AI Edge, [PoseLandmarkerOptions API](https://ai.google.dev/edge/api/mediapipe/python/mp/tasks/vision/PoseLandmarkerOptions) — detection, presence, tracking thresholds and running modes.
3. Google AI Edge, [NormalizedLandmark JavaScript API](https://ai.google.dev/edge/api/mediapipe/js/tasks-vision.normalizedlandmark) — coordinate normalization and visibility semantics.
4. Bazarevsky et al. (2020), [BlazePose: On-device Real-time Body Pose Tracking](https://arxiv.org/abs/2006.10204) — MediaPipe/BlazePose design and fitness-oriented tracking evaluation.
5. Casiez, Roussel, and Vogel (2012), [1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems](https://doi.org/10.1145/2207676.2208639) — adaptive cutoff and jitter/lag trade-off.
6. Camargo et al. (2021), [Filtering Biomechanical Signals in Movement Analysis](https://doi.org/10.3390/s21144683) — comparative peak, border, and derivative behavior of Butterworth, moving-average, and polynomial filters.
7. Savitzky and Golay (1964), [Smoothing and Differentiation of Data by Simplified Least Squares Procedures](https://doi.org/10.1021/ac60214a047) — original polynomial smoothing method.
8. Kalman (1960), [A New Approach to Linear Filtering and Prediction Problems](https://doi.org/10.1115/1.3662552) — state prediction/update framework and covariance assumptions.
9. SciPy, [`scipy.signal` official reference](https://docs.scipy.org/doc/scipy/reference/signal.html) — maintained implementations and distinctions among forward/backward, Savitzky-Golay, median, and second-order-section filters.
10. Döring et al. (2022), [PoseTrack21: A Dataset for Person Search, Multi-Object Tracking and Multi-Person Pose Tracking](https://openaccess.thecvf.com/content/CVPR2022/html/Doring_PoseTrack21_A_Dataset_for_Person_Search_Multi-Object_Tracking_and_Multi-Person_CVPR_2022_paper.html) — identity, occlusion, and multi-person tracking evaluation.
11. Andriluka et al. (2018), [PoseTrack: A Benchmark for Human Pose Estimation and Tracking](https://openaccess.thecvf.com/content_cvpr_2018/html/Andriluka_PoseTrack_A_Benchmark_CVPR_2018_paper.html) — video pose tracking benchmark and identity association errors.
12. Arnab et al. (2019), [Exploiting Temporal Context for 3D Human Pose Estimation in the Wild](https://openaccess.thecvf.com/content_CVPR_2019/html/Arnab_Exploiting_Temporal_Context_for_3D_Human_Pose_Estimation_in_the_Wild_CVPR_2019_paper.html) — temporal constraints including bone-length consistency under monocular ambiguity.
13. Chen et al. (2020), [Anatomy-aware 3D Human Pose Estimation with Bone-based Pose Decomposition](https://arxiv.org/abs/2002.10322) — across-time bone consistency and visibility-guided estimation; used here only to support diagnostics, not hard 2D anatomy gates.
14. Hossain and Little (2018), [Exploiting Temporal Information for 3D Human Pose Estimation](https://openaccess.thecvf.com/content_ECCV_2018/html/Mir_Rayat_Imtiaz_Hossain_Exploiting_temporal_information_ECCV_2018_paper.html) — temporal smoothness as an estimation prior and its limits.
15. Pagnon et al., [Pose2Sim maintained implementation](https://github.com/perfanalytics/pose2sim) and [2022 validation study](https://doi.org/10.3390/s22072712) — an open biomechanics workflow with explicit filtering/interpolation machinery and task-specific accuracy evidence.
16. Gionfrida et al. (2022), [Validation of Two-Dimensional Video-Based Inference of Finger Kinematics with Pose Estimation](https://doi.org/10.1371/journal.pone.0276799) — markerless validation using Hampel and Butterworth stages against marker-based reference.

Repository authorities reviewed: `AGENTS.md`; `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`; `docs/implementation/NEXT_EXECUTION_PACKAGE.md`; `docs/research/INLINE_LUNGE_PROTOCOL_RESEARCH.md`; ADR-002, ADR-004, and ADR-007; and the current CV, analysis, protocol-runtime, session-quality, pose-tape, and replay code/tests listed in the implementation map.
