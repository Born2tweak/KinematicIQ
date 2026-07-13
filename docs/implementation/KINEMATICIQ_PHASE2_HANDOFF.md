# KinematicIQ Phase 2 Living Handoff

**Range:** M79-M98
**Current milestone:** M87
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
- M83: squat adapter emits the neutral outcome envelope without changing legacy
  segmentation/session/tape outputs; 9/9 labeled rep-count parity retained.
- M83W: isolated headless WebKit rAF throttling, moved pose-tape fixtures to a
  timer scheduler while real cameras retain rAF, and kept manual finish enabled
  during auto-finish pending. Ten repeated WebKit acceptance runs and the full
  support matrix passed.
- M84: available-protocol completeness lint now requires runtime, capture,
  landmarks, metrics, findings, confidence, evidence, and acceptance
  declarations; planned protocols remain metadata-only and non-runnable.
- M85: versioned robustness baseline covers 11 tapes / 3,332 frames with 11/11
  raw-versus-One-Euro rep parity; missing OCHuman and bottom-event evidence is
  explicit rather than inferred.
- M86: additive landmark taxonomy distinguishes direct, low-confidence, gap,
  recovered, missing, out-of-frame, ambiguous-side, and rejected evidence;
  raw tracker output is retained and no recovery is active.

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

## Continuation

Execute M87 next. Predeclare a bounded short-gap recovery candidate and compare
it against M85. Accept only on measured robustness improvement with unchanged
rep/event/camera behavior; otherwise record rejection and retain current logic.
