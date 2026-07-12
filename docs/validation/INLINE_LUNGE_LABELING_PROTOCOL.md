# Inline-Lunge Independent Labeling Protocol

**Purpose:** create event/count truth for timed inline-lunge sequences without
turning source FMS scores or KinematicIQ output into ground truth.

## Source boundary

- LLM-FMS m05 = left inline lunge and m06 = right inline lunge. Its 270
  keyframe/label pairs may shape terminology only; they cannot supply temporal
  events, complete-trial counts, or biomechanical validity.
- UI-PRMD movement numbers are a different namespace. Preserve the source name
  with every movement ID.
- Raters must not see KinematicIQ output or aggregate FMS score while labeling.

## Required sequence manifest

One row per original timed sequence:

```text
sequence_id,source_dataset,source_version,artifact_sha256,subject_key,lead_side,
view,source_fps,frame_count,rater_id,label_version,excluded,exclusion_reason
```

`subject_key` is pseudonymous and used only for splitting. `exclusion_reason`
is one of `none`, `wrong_movement`, `wrong_view`, `cropped_feet`, `lead_side_unknown`,
`severe_occlusion`, `corrupt_or_incomplete`, or `other_with_note`.

## Event rows

For every visible trial, each rater independently records:

```text
sequence_id,trial_index,standing_start_frame,step_initiation_frame,
descent_start_frame,bottom_frame,ascent_start_frame,stable_return_frame,
lead_side,occlusion_present,crop_present,complete_trial,rater_id,notes
```

Definitions:

- `standing_start_frame`: first frame of stable upright stance before the step.
- `step_initiation_frame`: first persistent lead-foot departure from its standing
  region; ignore one-frame tracking noise.
- `descent_start_frame`: first persistent lowering after the step begins.
- `bottom_frame`: lowest visible pelvis/rear-knee configuration before ascent;
  use the earliest frame when a plateau spans multiple frames.
- `ascent_start_frame`: first persistent upward movement after bottom.
- `stable_return_frame`: first frame of a stable upright stance after the lead
  foot returns to its calibrated region.
- `complete_trial`: true only when all six events are visible and ordered.

Missing events are `null`, never guessed. A side change creates a new trial only
after a stable return.

## Independence and adjudication

1. Two raters label every sequence independently from the original timed file.
2. Freeze both raw label sets before comparison.
3. Report exact-count agreement, Cohen's kappa for inclusion/completeness, and
   per-event absolute frame/time disagreement (median, p95, maximum).
4. Adjudicate every count disagreement, missing event, lead-side disagreement,
   and event disagreement over five source frames. Preserve raw labels and add a
   third adjudicated record; never overwrite either rater.

## Subject-held-out split

Hash `source_dataset + subject_key` with a recorded seed, then allocate subjects
70% development, 15% validation, and 15% test. No subject crosses splits. Freeze
the test split before running KinematicIQ.

## Predeclared engineering gates

These gates assess this dataset/run only; they do not establish clinical or
biomechanical validity.

| Gate | Required result |
|---|---|
| Label completeness | 100% of included trials have all six ordered events |
| Count inter-rater agreement | >= 95% exact sequence counts before adjudication |
| Inclusion/completeness agreement | Cohen's kappa >= 0.80 |
| Event inter-rater disagreement | median <= 2 frames and p95 <= 5 frames per event |
| Held-out exact trial count | >= 90% of test sequences |
| Held-out count MAE | <= 0.10 trials/sequence |
| Held-out event timing | median <= 3 frames and p95 <= 8 frames per event |
| Held-out false activation | <= 5% across declared negative sequences |
| Held-out dropout | <= 5% of otherwise label-complete trials |

Any failed gate keeps inline lunge research-only. Passing these gates still does
not authorize protocol availability, coaching rules, joint-angle claims, or FMS
scoring.
