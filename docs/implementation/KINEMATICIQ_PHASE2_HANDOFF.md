# KinematicIQ Phase 2 Living Handoff

**Range:** M79-M98
**Current milestone:** M83
**Protocol availability:** squat only

## Completed

- M79: repository/canonical-doc audit, Phase 2 roadmap, dependency graph, gates,
  verification matrix, rollback rules, and contradiction decisions.
- M80: canonical context and architecture refreshed through M79, including the
  implemented `ProtocolRuntime`, current test/support evidence, persistence
  boundary, dataset governance, and Phase 2 change gates.
- M81: additive v2 protocol evidence/lifecycle metadata with registry boundary
  validation; squat remains the only available protocol and all stubs remain
  research-only and fail closed.
- M82: additive movement-neutral v1 trial envelope for repetition, transition,
  ballistic-event, and stride outcomes with explicit rejection/missingness and
  deterministic ordering validation; no session artifact migration.

## Current evidence baseline

- HEAD and `origin/master`: `8d8a77d`; prior M74-M78 work remains uncommitted.
- 533 unit tests and coverage passed in the immediately preceding M78 closeout.
- 56 applicable four-project support tests passed; generated Chromium fake-camera
  acquisition smoke passed separately.
- Build, tapes, UI-PRMD, LLM-FMS ontology, and zero-vulnerability audit passed.
- Raw LLM-FMS artifacts are local and gitignored.

## Architecture decisions

- Extend `ProtocolRuntime`; do not create a parallel universal engine.
- Add contracts before migration; keep existing session artifacts readable.
- Preserve squat thresholds, MediaPipe, pose-tape format, full abstention, and
  maximum-three-cue behavior.
- Schema existence never grants protocol availability.
- Add no persistence. Existing opt-in local history remains pending a separate
  product decision rather than being silently removed.

## External gates

- Physical iPhone Safari/VoiceOver and Windows NVDA execution.
- Independent raters and expert biomechanics review.
- Original timed UI-PRMD access (official endpoint currently HTTP 403).
- Any protocol availability/activation, commit, push, deploy, or release.

## Accepted/rejected experiments

- Accepted before Phase 2: guarded WebKit fixture-preroll timing; checksum-gated
  LLM-FMS ontology extraction with scores excluded.
- No Phase 2 tracking candidate accepted or rejected yet; M85 establishes the
  baseline before M87 may run one bounded experiment.

## Current blocker

M83 implementation and all non-WebKit gates pass, including 9/9 labeled tape
counts. Desktop WebKit's clean-squat fixture remains nondeterministic across
serial retries (calibration/rep/Finish lifecycle), and one serial iPhone WebKit
run also failed before a focused rerun passed. This path does not invoke the new
neutral-outcome adapter. Diagnose the pre-existing WebKit pose-tape scheduling
and lifecycle behavior before closing M83 or starting M84.

## Continuation

Resume M83 at the WebKit camera gate. Preserve the adapter and passing evidence;
inspect the generated traces and the pose-tape frame-counted preroll/lifecycle,
then rerun desktop and iPhone WebKit serially. Proceed to M84 only after green.
