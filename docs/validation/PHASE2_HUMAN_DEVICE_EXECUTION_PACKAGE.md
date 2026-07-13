# Phase 2 human/device validation execution package

**Execution status:** pending human execution. This package contains no study
participants, ratings, physical-device results, or expert conclusions.

## Owners and release gates

| Gate | Owner | Required evidence | Current state |
|---|---|---|---|
| Windows 11 Chrome/Firefox + NVDA | Accessibility tester | Completed device form and failure records | Pending human |
| Physical iPhone Safari + VoiceOver | Accessibility tester | Completed device form and failure records | Pending human |
| Biomechanics reference labeling | Two independent raters + adjudicator | Locked labels, disagreements, adjudication | Pending human |
| Expert interpretation review | Qualified biomechanics reviewer | Signed claim/threshold review | Pending expert |
| Activation | Product/evidence owner | All gates passed and explicit activation approval | Blocked |

## Dataset split and leakage rules

1. Hash each raw recording before labeling.
2. Group all recordings from the same participant and session together.
3. Assign groups—not clips—to development, validation, or locked test splits.
4. Never tune thresholds on validation or test failures.
5. Record exclusions before running summary statistics.
6. Keep consent-restricted media outside Git; store only approved derived data.

## Operator protocol

1. Record app commit, browser/OS/device versions, camera orientation, lighting,
   distance, and protocol ID on a blank evidence form.
2. Reset local app state; confirm squat is the only available protocol.
3. Record the scripted valid set, low-light set, partial-body set, interrupted
   set, and no-rep set. Do not coach beyond on-screen instructions.
4. Export the result JSON and pose tape when consent permits; record SHA-256.
5. Have two raters label rep count and bottom events independently using stable
   participant-blind IDs. Lock both files before adjudication.
6. Run the preregistered analysis command; attach raw command output. Do not
   delete failed rows.

## Windows 11 NVDA script (Chrome, then Firefox)

1. Start NVDA with default settings and open the browser at 100% zoom.
2. Navigate from Home using only `Tab`, `Shift+Tab`, `Enter`, arrows, and `Esc`.
3. Confirm “Available now” and “Research roadmap” are announced as distinct
   headings; verify only Bodyweight squat is actionable.
4. Open Bodyweight squat. Confirm session status changes are announced once,
   calibration progress has a name/value, and the correction is understandable
   without the canvas.
5. Toggle “Analyst details”; confirm expanded/collapsed state and contained
   controls are announced. Complete and cancel one fixture flow.
6. On Results, traverse Summary, Evidence, and Expert tabs; confirm selected
   state, confidence text, abstention copy, replay controls, and export names.
7. Repeat in Firefox. Record every difference verbatim in the failure form.

## Physical iPhone Safari VoiceOver script

1. Enable VoiceOver, set Safari text size to 100%, and lock portrait orientation.
2. Swipe through Home; confirm heading order and that research movements are
   read as information, not disabled actions.
3. Start Bodyweight squat and grant camera permission manually.
4. Confirm status/correction/rep count/Finish Now are reachable by swipe and do
   not overlap at 390 px portrait. Rotate once and return to portrait.
5. Run one valid and one missing-feet set. Confirm correction and result
   abstention are available as text without relying on color or canvas.
6. Navigate Results tabs, replay controls, History, and back to Home.
7. Record iPhone model, iOS/Safari versions, VoiceOver settings, and failures.

## Blank device evidence form

```yaml
run_id:
tester:
date_utc:
commit:
device:
os_version:
browser_version:
assistive_technology:
viewport_orientation:
scenario:
expected:
observed:
result: pending
artifacts: []
notes:
```

## Blank rater/adjudication form

```yaml
recording_id:
recording_sha256:
split:
rater_id:
rep_count:
bottom_frame_indices: []
exclusions: []
locked_at_utc:
adjudicator_id:
adjudicated_rep_count:
adjudicated_bottom_frame_indices: []
decision_notes:
```

## Failure report

```yaml
failure_id:
run_id:
severity:
route_and_state:
exact_steps: []
expected:
actual:
reproduction_count:
artifacts: []
suspected_layer:
status: open
```

## Release-claim matrix

Until all gates pass, permitted wording is limited to “internally tested,”
“camera-based observation,” “experimental,” and the explicit confidence and
validation-tier copy already emitted by the product. “Validated,” “accurate,”
“clinical,” “diagnostic,” “prevents injury,” and protocol activation beyond
squat remain prohibited.
