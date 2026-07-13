# KinematicIQ Phase 2 Living Handoff

**Range:** M79-M98
**Current milestone:** M91
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
- M87: the isolated two-frame critical-landmark interpolation candidate passed
  predeclared gates on 11 tapes (7 recovered samples, missing-critical frames
  624→620, jumps 12→12, rep/event parity 11/11) and camera E2E 20/20. It is
  accepted as an experiment but is not silently enabled in live analysis.
- M88: available protocols now own recovery copy for every non-direct tracking
  state; one deterministic instruction and analyst-only evidence are emitted,
  with direct-state abstention and completeness/claims/browser gates passing.
- M89: audited Landing through History against current responsive, accessibility,
  confidence, error, and protocol-state evidence; produced prioritized M90–M92
  wire and UI-system contracts without changing visuals. Fresh in-app-browser
  screenshots were unavailable due a session/tab ownership error and are not claimed.
- M90: separated available and research movements, derived squat view/setup copy
  from protocol metadata, and made planned movements structurally non-interactive;
  axe passed 16/16 and the support matrix passed 56 with 4 expected skips.

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
- Accepted in M87: `critical-landmark-linear-short-gap@1.0.0` as an isolated,
  provenance-preserving candidate. Live recovery remains inactive pending an
  explicit integration boundary; raw observations remain authoritative.

## Continuation

Execute M91 next. Reduce the active-session default hierarchy to status, one
correction, reps/trials, and the primary action. Keep analyst detail behind an
accessible disclosure and re-run camera, axe, responsive, and reduced-motion gates.
