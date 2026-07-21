# KinematicIQ Forward-Lunge Event-Labeling Handbook

**Status:** research-only handbook v1 draft; requires rater pilot and owner approval before locked use
**Task:** forward lunge with stride and return (`flsr-v0`)
**Label schema:** `kinematiciq-lunge-label` v1
**Repository basis:** `master` at `8d8a77d`, 2026-07-14

## 1. Purpose and scope

This handbook lets two independent human raters label task identity, frame-level events, completion/rejection, visibility, missingness, ambiguity, and confidence without seeing KinematicIQ predictions. It supplies truth for research evaluation; it does not define a “correct” lunge, clinical screen, safety result, or coaching rule.

The repository calls the research track “inline lunge,” but its proposed standing-to-step-to-return motion is a forward lunge with stride and return, not the fixed split-stance FMS inline lunge. The owner must approve this identity before real capture or locked labeling. Actual FMS inline-lunge recordings are labeled `wrong_movement:fms_inline_lunge` under this handbook.

No lunge implementation exists on current master. This handbook authorizes neither implementation nor public availability.

## 2. Protocol identity and versions

### Target trial

Starting in stable bilateral standing, the declared lead foot advances, reaches a visible planted forward position, the participant descends, reverses near maximum lead-knee flexion, ascends, and returns the lead foot to the calibrated bilateral standing region. Left and right leads are separate trials/sets.

### Version bundle

Every packet records:

- task/protocol ID and version;
- capture-contract version;
- label-schema/handbook version;
- source artifact ID and SHA-256;
- original frame count, dimensions, timestamps/effective fps, orientation, and raw/display mirror metadata;
- packet/tool version;
- declared anatomical lead side;
- allowed source views (`rgb`, `landmarks`) for that labeling round.

A task/event definition change increments the protocol or label major/minor version and requires a new agreement pilot. Typographical clarification with no label consequence increments patch version.

## 3. Rater eligibility and training

Raters must understand frame stepping, anatomical left/right under mirrored display, observable-versus-inferred events, the distinction between missing and ambiguous, and the prohibition on clinical/normative judgment. At least one supervising biomechanics lead approves the training packet.

Training sequence:

1. Read this handbook and complete a terminology/mirror-state check.
2. Label synthetic examples to learn the tool only.
3. Label the required real field-development examples independently.
4. Review disagreements with a trainer after submission.
5. Complete a qualification packet of approved real development recordings not reused in the locked set.
6. Meet the preregistered category/event agreement criteria without changing definitions to inflate agreement.

Failure triggers retraining and a new qualification packet. Synthetic fixtures cannot substitute for real-recording qualification. Qualification does not make a rater an algorithm adjudicator or claims authority.

## 4. Blind labeling workflow

1. The coordinator creates randomized packet IDs from frozen source hashes and removes names, contacts, predictions, KinematicIQ diagnostics/confidence, model overlays, and other-rater labels.
2. Rater A and B receive separate local workspaces and assignments. They do not communicate about active packets.
3. Default view is original RGB at 1×; raters may use 0.25×, 0.5×, 1×, and 2× playback and single-frame forward/backward stepping. No interpolation or frame synthesis is allowed.
4. Zoom/pan may inspect visibility but cannot change the underlying frame index. Contrast/enhancement or cropping is prohibited unless the packet includes a versioned common derivative available to both raters.
5. RGB is the primary source for task, events, and visibility. If a study round permits raw landmarks, raters first lock their RGB labels; landmark-assisted labels are a separate layer and must not replace the RGB result. Algorithm phase/metric output is never shown.
6. Label setup, intervals, trials/events, category, confidence, and comments. Use `missing` or `ambiguous`; never force a frame.
7. Run local schema validation, review the packet summary, and submit once. Submission hashes and locks the file.
8. Agreement is computed only after both files lock. The adjudicator then receives both originals and the source.

## 5. Complete label glossary

### States

- `present`: confidently observable from permitted source.
- `missing`: required content is absent/cropped/occluded or no usable frame exists.
- `ambiguous`: content exists but two or more defensible labels remain.
- `not_applicable`: the label does not apply to this trial/category.
- `unusable`: task identity or required event chain cannot be evaluated for the preregistered endpoint.

### Side

- `left`, `right`: anatomical lead side, independent of screen direction.
- `ambiguous`: advancing side cannot be determined confidently or identity swaps.
- `conflict`: observed advancing side conflicts with declared side.
- `not_applicable`: no target trial begins.

### Trial categories

- `completed`: readable target task with stable return.
- `shallow_complete`: readable target chain and stable return with small excursion; descriptive, not incorrect.
- `aborted`: target attempt reverses/stops before a defensible bottom/ascent chain completes.
- `incomplete_return`: bottom/ascent occurs but stable return does not.
- `false_start`: preparatory motion begins but does not establish an advancing target step/plant.
- `wrong_movement`: readable non-target task with subtype.
- `capture_invalid`: task may occur but capture evidence is insufficient/invalid.
- `ambiguous_trial`: two or more trial categories remain defensible.

### Confidence

- `high`: definition is satisfied with clear frames and no material competing label.
- `medium`: label is more likely than alternatives but affected by mild occlusion, sampling, or boundary uncertainty described in comments.
- `low`: a tentative label is retained for analysis but competing alternatives remain important; it cannot become exact adjudicated truth without resolution.
- `unrateable`: missing source evidence; use with `missing`, not as a substitute for a category.

Confidence describes rater evidence, not KinematicIQ accuracy and not movement quality.

## 6. Event-by-event operational rules

Before locked labeling, the development pilot freezes:

- `D_SETUP`: required stable-setup dwell;
- `D_EVENT`: sustained-motion dwell for onset/reversal events;
- `EPS_BOTTOM`: plateau tolerance around minimum projected lead-knee angle used only as an annotation aid;
- `D_RETURN`: stable-return dwell;
- `G_SHORT` and `G_LONG`: elapsed-time classes for temporary versus long dropout;
- `W_EVENT`: event agreement/matching tolerance in milliseconds and corresponding per-recording frame conversion.

These values come from effective temporal resolution, rater pilot distributions, and intended decision cost; they are not selected after viewing locked algorithm performance.

| Label | Operational definition | First/last-frame rule | Tie-break rule | Ambiguity rule | Required visibility | Common mistakes |
|---|---|---|---|---|---|---|
| `setup_valid` | Bilateral standing before attempt, both feet/required chains readable, declared side/mirror known, no active camera discontinuity, stable for `D_SETUP` | Interval begins at first frame of qualifying dwell; ends immediately before trial start | Prefer the latest complete qualifying interval before trial | `setup_ambiguous` if stance anchor or side cannot be established | Both ankles/heels/foot indices; lead/rear hips/knees as capture contract requires; full travel framing | Calling any upright frame valid; ignoring cropped rear foot or unknown mirror |
| `setup_invalid` | Any setup requirement fails | Mark first and last failing frames plus reasons | Multiple reasons are retained | Use `setup_ambiguous` when evidence, not compliance, is uncertain | Same as setup | Turning a capture failure into movement failure |
| `lead_side` | Anatomical side whose foot advances into the target forward stance | Label from declared side, then record observed agreement separately | Declaration remains authoritative; observation cannot silently overwrite | `ambiguous` on identity uncertainty; `conflict` on clear disagreement | Bilateral foot/ankle trajectories and mirror metadata | Using screen-left/right; equating dominance with lead side |
| `trial_start` / `step_initiation` | First frame of sustained declared-lead-foot departure from calibrated standing region that leads to a target attempt | First frame of qualifying motion lasting `D_EVENT` | If heel/forefoot cues differ, choose earliest sustained whole-foot departure and comment | Ambiguous if preparatory shuffle and target step cannot be separated | Lead ankle, heel, foot index; standing anchor | Labeling verbal cue or first body sway; counting a false start |
| `visible_plant` | First frame the advanced lead foot appears to have reached a stable forward position before/during descent | First frame of stable foot-position interval | Prefer earliest frame satisfying frozen stability rule | Ambiguous when descent overlaps plant or heel/forefoot settle separately; preserve interval if needed | Lead ankle, heel, foot index across neighboring frames | Calling it force contact/heel strike; using one still frame only |
| `descent_onset` | First frame of sustained lowering/flexion into the lunge after or overlapping visible plant | First frame of lead-knee flexion plus pelvis lowering sustained `D_EVENT` | If step and descent overlap, both events may share/overlap frames | Ambiguous when knee and pelvis cues disagree beyond pilot rule | Lead hip/knee/ankle and readable pelvis/hip cue | Forcing plant before descent; using noise spike |
| `bottom` | Frame of maximum lead-knee flexion within the readable planted interval, cross-checked with movement reversal | Choose minimum projected lead-knee angle frame; if plateau, use rule at right | For all frames within `EPS_BOTTOM` of minimum forming one plateau, choose temporal midpoint (earlier middle for even count) and store plateau bounds | `ambiguous` if separate minima/bounce/occlusion/noise cannot be resolved; no exact frame | Lead hip, knee, ankle throughout bottom window; pelvis cue desirable | Choosing lowest pelvis automatically; selecting filtered algorithm minimum; ignoring plateau |
| `ascent_onset` | First frame after bottom of sustained lead-knee extension and pelvis rise | First frame of qualifying reversal lasting `D_EVENT` | A plateau ends at last plateau frame; onset is first sustained rise after it | Ambiguous for bounce/multiple reversals; label secondary dip separately | Lead hip/knee/ankle and pelvis/hip cue | Equating bottom frame with ascent onset; ignoring bounce |
| `return_initiation` | First frame the lead foot begins sustained movement from forward planted region toward standing anchor | First qualifying backward-departure frame | Prefer whole-foot displacement; comment if heel/forefoot separate | Ambiguous if foot shuffles or camera moves | Lead ankle, heel, foot index; fixed camera evidence | Calling it force toe-off/propulsion |
| `return_completion` / `stable_return` | Both feet are back in their calibrated standing regions with readable identity and stability for `D_RETURN` | Event frame is first frame of the qualifying stable interval; store interval bounds | Extra recovery step follows frozen protocol rule; never use knee extension alone | Ambiguous if anchor/mirror/identity changed or clip ends before dwell | Bilateral ankle/heel/foot index, standing hip/knee cues, monotonic time | Completing at full knee extension; ignoring lead foot outside anchor |
| `completed_trial` | Target events readable and ordered, one defensible bottom, ascent, and stable return | Trial interval step initiation through stable-return dwell end | Category rules outrank apparent smoothness | Ambiguous if event/category conflict survives rules | All event dependencies | Counting an incomplete return or static split squat |
| `shallow_trial` | Clear target step/plant/reversal/ascent/stable return with small subject-specific excursion | Same interval as completed | Do not apply a population angle cutoff; record observed excursion class only | If no defensible bottom/reversal, use aborted/ambiguous rather than shallow | Target event dependencies | Calling shallow incorrect/invalid automatically |
| `aborted_trial` | Target attempt begins but stops/reverses before a defensible completed bottom/ascent chain | Start at step initiation; end at stop/reversal/return | If bottom exists and ascent occurs but return fails, use incomplete return | Ambiguous if clip/capture hides whether continuation occurred | Step plus enough chain to identify interruption | Treating every shallow complete trial as aborted |
| `incomplete_return` | Bottom/ascent readable, but stable-return definition is unmet before clip end/next attempt | Trial end is last readable frame or next trial boundary | Preserve partial return event if visible | Ambiguous when return is hidden by dropout/crop; may also be capture invalid | Bottom/ascent plus lead/rear foot return evidence | Counting because participant stood up |
| `false_start` | Preparatory foot/body motion fails to establish target step/plant and is abandoned before trial chain | Mark interval only; no trial events after false-start end | Separate from next real attempt when stable setup reappears | Ambiguous if it merges with target step | Lead foot and setup context | Counting verbal cue, sway, or shuffle as trial start |
| `wrong_movement` | Readable motion is not target task | Mark interval and subtype | Use most specific subtype; multiple may be recorded | Ambiguous if capture prevents variant distinction | Enough whole-body/foot evidence to identify variant | Penalizing tracking confidence instead of protocol validity |
| `temporary_occlusion` | Required landmark/body part becomes unreadable for elapsed duration below `G_SHORT` without capture epoch/identity change | First unreadable to last unreadable frame; store ms | Duration uses timestamps, not frame count | If boundary uncertain, store interval uncertainty; if identity uncertain, escalate | Affected body part and neighboring continuity | Filling coordinates; assuming MediaPipe visibility proves observation |
| `long_dropout` | No usable required chain/pose for duration at or above `G_LONG`, or any gap that makes event/identity continuity unsupported | First missing/suspect frame through last before quarantined return | Protocol-critical gap may be long by consequence even below duration threshold | Preserve reason; do not infer events through it | Timestamp/missing evidence and pre/post identity cues | Interpolating phase events; resuming same trial automatically |
| `rear_leg_visibility_loss` | Rear hip/knee/ankle/heel/foot index required by current event becomes cropped, occluded, swapped, or temporally implausible | Affected interval plus landmark list | Metric/event-specific dependency rules decide consequence | `ambiguous` if inferred-looking coordinate cannot be visually verified | Rear chain and RGB source | Calling plausible pose-model coordinate observed |
| `out_of_frame` | Any required body part crosses/crops at image boundary or participant leaves | First cropped frame to last cropped frame | Record each affected region; whole-person leave is subtype | Ambiguous if loose clothing/background hides boundary | RGB frame margins | Treating low visibility without crop as out-of-frame |
| `camera_movement` | Camera orientation/position/zoom/framing changes during capture or a geometry epoch changes | First definite change frame; store new epoch start | Metadata change is definitive; pose-only coherent motion is `suspected_camera_movement` | Do not distinguish camera from whole-body travel without evidence | RGB background/edges and metadata where available | Calling body translation camera motion with certainty |
| `unusable_trial` | Required task/category or primary event reference cannot be determined after applying rules | Mark unusable endpoints and reason; retain readable labels | Endpoint-specific unusability preferred over whole-trial when possible | Preserve ambiguity rather than inventing label | Depends on endpoint | Dropping the trial from manifest/denominator |
| `ambiguous_event` | Two or more defensible frames/intervals remain after tie rules | Store candidate interval/range, not a fabricated exact frame | Use exact tie rules first; adjudicator may retain ambiguity | Required when uncertainty exceeds frozen label rule | Required chain partially readable | Choosing the frame closest to algorithm output |

## 7. Trial and rejection taxonomy

Apply in this order:

1. Is source integrity/timing adequate? If no, `capture_invalid` with reason.
2. Is setup/side/mirror/task identity readable? If no, `capture_invalid` or `ambiguous_trial`.
3. Is it the target stride-and-return task? If no, `wrong_movement:<subtype>`.
4. Did a target attempt begin? If no, no trial or `false_start`.
5. Is a defensible bottom/ascent present? If no, `aborted` unless hidden by capture, then `capture_invalid/ambiguous`.
6. Is stable return present? If no, `incomplete_return` unless hidden by capture.
7. Did the event chain complete with small excursion? `shallow_complete`; otherwise `completed`.

Wrong-movement subtypes: `squat`, `static_split_squat`, `fms_inline_lunge`, `walking_lunge`, `reverse_lunge`, `lateral_lunge`, `step_only`, `alternating_or_side_switch`, `other_named`, `unknown_non_target`.

Capture reasons include wrong/unknown view, crop by body part, occlusion, camera movement/zoom, mirror/orientation conflict, timestamp invalidity/gap, identity/side swap, long dropout/reacquisition, bystander contamination, clip-edge loss, and insufficient temporal resolution.

One trial may have multiple observable failure intervals, but exactly one primary trial category. Comments explain competing categories.

## 8. Visibility, missingness, and ambiguity policy

Visibility is anatomical/event-specific. A lead-knee bottom needs lead hip/knee/ankle; step/return needs lead ankle/heel/foot index; bilateral standing and lead verification need both feet; rear-leg observations require the genuine rear chain. Model visibility is never sufficient proof under self-occlusion.

- Mark `missing` when evidence is absent.
- Mark `ambiguous` when evidence exists but supports multiple values.
- Mark capture/trial invalid when ambiguity affects task identity, event order, lead side, or a primary endpoint.
- Preserve readable independent labels even when another endpoint is missing.
- Never interpolate, carry forward, substitute contralateral landmarks, infer physical contact, or use algorithm output to resolve uncertainty.
- Timestamp gaps crossing trial start, bottom, or return make that event unavailable unless synchronized RGB establishes a separate valid reference; they still invalidate KinematicIQ timing evaluation for that event.

## 9. Confidence and comments

Confidence is required for setup, lead side, every event, category, visibility interval, and usability decision. Medium/low labels require a coded reason and concise comment. Comments describe observable facts: “rear heel hidden by lead foot for frames 120–134,” not “poor balance” or “bad form.”

Allowed reason codes include `sampling_boundary`, `plateau`, `multiple_reversal`, `occlusion`, `crop`, `identity_swap`, `mirror_unknown`, `camera_change`, `timestamp_gap`, `clip_edge`, `variant_uncertain`, and `other_observable`.

## 10. Submission schema and validation

Each immutable rater file contains:

```text
schema, schemaVersion, handbookVersion, protocolId, protocolVersion
packetId, recordingId, sourceArtifactId, sourceSha256
frameCount, timestampBasis, effectiveFpsSummary, mirror/orientation metadata
raterId, raterQualificationVersion, toolVersion, submittedAt
setupLabels[], visibilityIntervals[], trials[], recordingComments
```

Each `trial` contains `trialId`, interval, declared/observed lead side, category/subtype, ordered event objects, failure intervals/reasons, confidence, comments, and usable endpoints. Each event contains `state`, exact `frameIndex` or candidate `frameRange`, source timestamp(s), confidence, reason codes, required-visibility status, and optional plateau bounds.

Validator rejects:

- unsupported versions, source hash mismatch, duplicate trial/event IDs;
- indices outside the source or non-monotonic timestamps;
- impossible event order without an explicit allowed-overlap/ambiguity record;
- exact frame plus `missing`/`ambiguous` state;
- completed trial without required events/stable return;
- adjudication presented as an independent rater file;
- missing confidence/reason where required;
- algorithm prediction/provenance fields inside a blind label;
- overwrite/same artifact ID with changed hash.

## 11. Agreement calculations and tolerances

Calculate agreement before adjudication and by subject/recording as well as aggregate.

- **Categorical labels:** confusion matrix, raw agreement, classwise agreement/sensitivity as appropriate, and a prespecified chance-corrected coefficient with subject-clustered CI. Report prevalence and marginals; do not use kappa alone.
- **Lead side:** raw agreement and full `left/right/ambiguous/conflict/not-applicable` matrix.
- **Trial count:** exact recording agreement and absolute count difference.
- **Events:** one-to-one trials matched by temporal order/category; report signed/absolute frame and ms differences, median/95th percentile, within-`W_EVENT` agreement, and tolerance curves.
- **Usable/unusable and rejection:** full confusion matrices by reason; do not collapse capture invalid and wrong movement.

`W_EVENT` is frozen from effective timestamp resolution, label-pilot distribution, and the downstream decision; it is not widened to improve agreement. Store both milliseconds and frames because effective fps varies. Agreement does not establish KinematicIQ validity.

Qualification and locked-study agreement thresholds are registry entries approved before the relevant packet opens. A failed agreement gate triggers definition/tool/training review and a new development pilot—not silent adjudication of all disagreement into apparent precision.

## 12. Adjudication procedure

1. Coordinator verifies both independent files/hashes and computes pre-adjudication agreement.
2. Third authorized adjudicator receives source plus read-only A/B labels, never algorithm predictions.
3. For each disagreement, apply the published rule and record `choose_a`, `choose_b`, `new_resolved_value`, or `remain_ambiguous/missing` with rationale.
4. A new value is allowed only when source evidence and handbook rule support it; it is not an average of frame indices by default.
5. Store adjudication as a new immutable artifact referencing both original IDs/hashes and agreement report hash.
6. Do not edit or delete A/B. Corrections create a superseding version and preserve prior lineage.
7. Recurrent disagreement revealing a definition defect triggers a handbook amendment and relabeling policy decided before locked evaluation. It cannot be patched after viewing algorithm results.

## 13. Required illustrated examples

Real examples do not yet exist in this repository and must not be fabricated. Before rater qualification, add approved, consented/licensed field-development clips or still sequences for:

- clean left and right trials;
- slow bottom transition;
- multiple equally deep frames with the midpoint rule;
- bounce/secondary dip;
- shallow complete attempt;
- aborted descent;
- incomplete return;
- occluded rear foot and inferred-looking pose coordinate;
- user leaves and returns;
- squat and another non-target lunge;
- mirrored preview/raw-coordinate distinction;
- dropped-frame/timestamp-gap interval;
- camera movement versus whole-body translation;
- false start followed by a valid attempt.

Each example includes source/rights ID, allowed-use statement, frame/timestamp strip, correct label JSON, rule citation, common wrong labels, and explanation. Qualification examples cannot appear in locked validation.

## 14. Quality-control checklist

- [ ] Packet source hash and version bundle match.
- [ ] No predictions, diagnostic overlays, other-rater labels, identity, or contact data are visible.
- [ ] Anatomical side and raw/display mirror are distinguished.
- [ ] Setup and capture failures are labeled before trial interpretation.
- [ ] Every attempted target/negative motion is represented; none is dropped for difficulty.
- [ ] Events use sustained/tie rules and original frame/timestamps.
- [ ] Visible plant/return are not labeled physical contact/toe-off.
- [ ] Bottom plateaus/bounces preserve bounds and ambiguity.
- [ ] Stable return requires both feet and dwell, not knee extension alone.
- [ ] Shallow is descriptive, not automatically invalid.
- [ ] Missing, ambiguous, not-applicable, and unusable remain distinct.
- [ ] Confidence and observable comments are complete.
- [ ] Local schema validation passes before submission.
- [ ] A/B files are separately locked/hashed before agreement/adjudication.
- [ ] Adjudication references and preserves both originals.

## 15. Prohibited rater behavior

- viewing or requesting KinematicIQ predictions, phase traces, metrics, confidence, or prior benchmark results;
- discussing active packets with the other rater;
- using screen-left/right as anatomical side without mirror metadata;
- labeling dataset “correct/incorrect,” FMS score, form quality, pain, risk, diagnosis, balance, mobility, weakness, or cause;
- calling visible plant physical contact or return initiation toe-off/propulsion;
- inventing an exact frame from an ambiguous plateau/dropout;
- interpolating missing frames or using filtered/model coordinates as observed truth;
- deleting failed/partial/wrong-movement attempts;
- changing definitions/tolerances after seeing agreement or algorithm output;
- overwriting a submitted label or original source.

## 16. Revision and versioning policy

- Handbook/schema v1 becomes lockable only after protocol identity approval, real development examples, two-rater pilot, resolved tool/schema findings, and signed agreement/tolerance registry.
- Every revision records date, author/authority, reason, affected labels, compatibility, required relabeling, and source commit.
- Definition/event/order/category changes require a version increment and impact assessment. Locked labels are never silently reinterpreted under a new version.
- A locked-study amendment is signed before implementation, names affected subjects/artifacts/endpoints, and labels the run exploratory or restarts with untouched data as required.
- Availability, coaching, metric promotion, and claims approvals are separate documents. High rater agreement does not pass any of them.
