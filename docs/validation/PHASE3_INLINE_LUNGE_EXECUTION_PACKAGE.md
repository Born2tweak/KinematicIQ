# Phase 3 Inline-Lunge Human, Device, and Dataset Execution Package

**Status:** pending human/external execution. Blank forms and scripts are not results.
**Protocol state:** research-only and non-actionable in the product.

## Evidence owners and release gates

| Gate | Owner | Required evidence | State |
|---|---|---|---|
| Timed source manifest/checksums/licensing | Dataset custodian | Original files, license record, SHA-256 manifest | Blocked on source access |
| Independent event labels | Two raters + adjudicator | Frozen raw labels, agreement report, adjudicated labels | Pending human |
| Subject-held-out evaluation | Validation owner | Locked split and raw M109-compatible report | Pending labels |
| Windows 11 Chrome/Firefox + NVDA | Accessibility tester | Completed device forms and failures | Pending human |
| Physical iPhone Safari + VoiceOver | Accessibility tester | Completed device forms and failures | Pending human |
| Biomechanics and claims review | Qualified reviewer | Signed metric/threshold/copy disposition | Pending expert |
| Activation | Product/evidence owner | All gates passed plus explicit written approval | Blocked |

## Dataset and rater execution

1. Copy only approved original timed assets into a consent-appropriate location outside Git. Record source dataset/version/license, movement namespace, pseudonymous subject, lead side, frame rate, frame count, and SHA-256 in the sequence manifest defined by `INLINE_LUNGE_LABELING_PROTOCOL.md`.
2. Hash `source_dataset + subject_key` with the recorded seed and freeze subject-level development/validation/test assignments before any KinematicIQ output is inspected.
3. Give two raters original timed media and the labeling protocol. Do not show KinematicIQ output, LLM-FMS scores, or each other's labels. Freeze both raw files.
4. Compute exact-count agreement, Cohen's kappa for inclusion/completeness, and per-event median/p95/max disagreement. Adjudicate all specified disagreements into a third file without overwriting raw labels.
5. Convert the locked adjudicated cases into the M109 evaluation-case contract. Run from `web/`:

```powershell
npm test -- --run src/eval/inlineLungeEvaluation.test.ts
npm run eval:inline-lunge
```

The checked-in command uses synthetic cases only. A custodian may add an approved local manifest loader, but restricted/raw media and participant identifiers must never be committed. Record the exact command and SHA-256 of every input and output.

## Windows 11 NVDA: Chrome, then Firefox

1. Record commit, Windows build, browser version, NVDA version/settings, display scale, zoom, and viewport in the blank form.
2. Start NVDA with default settings. Open Home at 100% zoom and navigate only with `Tab`, `Shift+Tab`, arrows, `Enter`, and `Esc`.
3. Confirm “Available now” and “Research roadmap” are announced as distinct headings.
4. Confirm Bodyweight squat is the only actionable movement. Confirm Inline lunge is announced as informational list content with “Research only — validation pending”; it must not receive button semantics, keyboard focus, or start camera analysis.
5. Search the accessibility tree/virtual cursor for Inline lunge. Record the exact announcement in Chrome. Repeat in Firefox and record differences verbatim.
6. At 200% and 400% zoom, confirm the Inline lunge card does not overlap, clip its status, introduce two-dimensional scrolling at 1280 CSS px, or become actionable.
7. Attempt direct navigation to `/camera` without selecting squat. Confirm no Inline lunge runtime is exposed. Record any unexpected control or protocol copy as a failure.

## Physical iPhone Safari + VoiceOver

1. Record iPhone model, iOS/Safari version, VoiceOver settings, portrait viewport, text size, and commit.
2. At 100% text size, swipe through Home. Confirm heading order and that Inline lunge is read as research information, not a disabled or actionable button.
3. Double-tap the Inline lunge card text and surrounding blank area. Expected: no navigation, camera request, focus trap, or state change.
4. Repeat at Safari text sizes 125%, 150%, 175%, and 200%; rotate landscape once and return to portrait. Record clipping, overlap, unexpected horizontal scroll, or lost text.
5. Use VoiceOver rotor Links and Form Controls. Expected: Inline lunge is absent from both; Bodyweight squat remains the only movement-start control.
6. If any failure occurs, record exact gestures, announcement, expected/observed state, reproduction count, screenshot/screen recording path, and whether it also occurs without VoiceOver.

## Biomechanics and claims review script

Review, without editing results, the research spec, thresholds in `segmenter.ts`, signal geometry in `signals.ts`, metric definitions/copy, findings, traceability rows, and a locked evaluation report. For each item mark `accept-for-research`, `revise`, or `reject`, with evidence. Explicitly answer:

- Does the six-event definition match a complete step-to-return inline lunge?
- Are side declaration and side-view camera assumptions unambiguous?
- Which thresholds require population/setup-specific validation?
- Is projected lead-knee angle sufficiently qualified as a 2D research estimate?
- Does any copy imply correctness, diagnosis, injury risk, mobility capacity, kinetics, normative comparison, or FMS scoring?

Approval for research behavior is not activation approval.

## Blank evidence form

```yaml
run_id:
tester_or_reviewer:
date_utc:
commit:
gate:
device_or_dataset:
versions: {}
scenario:
expected:
observed:
result: pending
input_sha256: []
artifacts: []
notes:
```

## Blank activation audit

```yaml
timed_source_and_license: pending
independent_labels_and_agreement: pending
subject_held_out_gates: pending
windows_nvda_chrome_firefox: pending
iphone_safari_voiceover: pending
biomechanics_claims_review: pending
owner_activation_approval: pending
decision: blocked
```
