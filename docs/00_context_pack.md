# KinematicIQ Context Pack

> Hand-maintained on 2026-07-13 at M115; current through Phase 3 autonomous closeout. Do not run the
> deprecated `scripts/generate-context-pack.ps1`, which encodes the former
> milestone model and would overwrite this file with stale content.

## Workspace

| Key | Current value |
|---|---|
| Repository | `C:\Users\acetu\KinematicIQ` / `Born2tweak/KinematicIQ` |
| Branch baseline | `master`; local HEAD and `origin/master` were `8d8a77d` at M79 |
| Application | `web/` — Vite 8.1.4, React, TypeScript |
| Pose engine | MediaPipe Tasks Vision in the browser; no application backend or cloud inference |
| Routes | `/`, `/camera`, `/upload`, `/results`, `/history` |
| Supported automation targets | Windows 11 Chrome/Firefox and iPhone Safari-compatible WebKit projects |
| Unit baseline | 80 files / 533 tests passed at the M78 closeout |
| Coverage baseline | 86.29% statements, 81.62% branches, 92.14% functions, 87.58% lines |
| Browser baseline | 56 applicable support tests passed across four projects; Chromium fake-camera acquisition passed separately |

The repository intentionally contains the uncommitted M74-M79 execution
package. Preserve unrelated changes. Do not commit, push, deploy, activate a
protocol, or publish a release without explicit authorization.

## Product and data flow

KinematicIQ is a client-side movement-analysis platform. Squat is the only
available protocol. Inline lunge, sit-to-stand, hip hinge, jump, and sprint remain planned
metadata-only protocols and must fail closed if analysis is attempted.

Inline lunge additionally has an isolated executable research seam at
`protocols/inlineLunge/analyzeInlineLungeResearch`. It is not a public
`ProtocolRuntime`: its profile is null, input modes are empty, and public
runtime/profile lookup throws. It requires declared lead-side metadata and
emits only experimental, observation-language evidence.

The live path is:

`camera/upload -> MediaPipe landmarks -> ProtocolRuntime -> set-quality gate -> MetricResult[] -> Finding[] -> report`

`ProtocolRuntime` is the canonical extension point. It owns protocol capture,
frame analysis, lifecycle state, outcome kind, and outcome construction. Phase
2 extends this contract; it must not create a parallel “universal” engine.

Untrustworthy evidence produces a full abstention. KinematicIQ does not emit a
composite score and must not make diagnostic, injury-risk, pathology, kinetic,
muscle-activation, or normative claims.

## Persistence and privacy

Phase 2 adds no persistence, backend, authentication, telemetry, or cloud
processing. Existing history is retained for compatibility: only an explicit
“Save to history” action writes a versioned session record to local IndexedDB,
and the user can delete all records. Session reports and pose tapes are explicit
local exports. Nothing is silently saved or uploaded by application code.

MediaPipe runtime/model assets may be fetched by the browser. “Client-side”
therefore means no application API or cloud inference, not necessarily zero
network requests after the HTML document loads.

## Program status

Canonical Phase 2 plan: `docs/implementation/KINEMATICIQ_PHASE2_EXECUTION_ROADMAP.md`.
Living handoff: `docs/implementation/KINEMATICIQ_PHASE2_HANDOFF.md`.
Per-milestone evidence: `docs/implementation/progress/`.

| Range | Status |
|---|---|
| M00-M60 | Complete platform foundation, protocol/runtime work, evaluation, reports, and governance recorded in the master roadmap |
| M61-M73 | Complete research-to-execution and validation infrastructure package |
| M74-M78 | Complete release-readiness, toolchain, support/accessibility automation, device-performance decision, and inline-lunge data gate |
| M79 | Complete Phase 2 audit and M79-M98 execution roadmap |
| M80 | Current canonical context/architecture refresh |
| M81-M98 | Complete Phase 2 autonomous runtime, robustness, UI, traceability, statistics, and activation-audit work |
| M99-M115 | Complete Phase 3 autonomous inline-lunge research implementation; external validation and activation remain blocked |

## Current contracts

- `src/core/`: movement-agnostic confidence, provenance, metric, finding, and
  protocol schemas.
- `src/protocols/types.ts` and `src/protocols/runtime.ts`: the five-stage
  protocol runtime and live cyclic runtime adapter.
- `src/protocols/registry.ts`: protocol discovery and fail-closed availability.
- `src/session/setQualityGate.ts`: valid/questionable/invalid classification;
  invalid means full downstream abstention.
- `src/session/buildSessionResult.ts`: versioned session-result assembly.
- `src/eval/`: pose-tape replay, benchmark, and dataset-evaluation contracts.
- `eval/datasets/registry.json`: governed dataset metadata; registration is not
  protocol activation.
- `src/storage/`: explicit, opt-in local history only.
- `src/export/`: local JSON and self-contained HTML report artifacts.
- `src/camera/`: real and deterministic pose-tape sources used by automation.

## Evidence state

- M75 recorded a zero-vulnerability audit after the toolchain migration.
- M76 automated code-level accessibility and the declared cross-browser matrix;
  physical iPhone Safari/VoiceOver and Windows screen-reader scripts are
  documented and remain pending human execution.
- M77 retained the current browser pipeline based on measured evidence; it did
  not authorize a pose-model or filter swap.
- M78 added a checksum-gated LLM-FMS inline-lunge ontology adapter. Scores are
  excluded, raw source artifacts remain local and gitignored, and no inline-
  lunge protocol was activated.

## Locked doctrine and external gates

Read `docs/doctrine/claims-policy.md`, `movement-ontology.md`, and
`deferred-scope.md` before changing analysis or user-facing copy. The following
remain externally gated:

- physical iPhone Safari/VoiceOver and Windows NVDA verification;
- independent raters and expert biomechanics review;
- original timed UI-PRMD access (the official endpoint returned HTTP 403);
- availability of any new protocol; and
- commit, push, deploy, or release actions.

Do not change rep-count gates, phase thresholds, capture-readiness geometry,
the pose-tape format, filtering, or MediaPipe without the roadmap’s required
benchmark/labeled-evidence gate. Versioned shapes change additively or with an
explicit schema-version migration.

## Verification

Run commands from `web/`. The normal floor is `npm run build` and
`npm test -- --run`. Use the roadmap’s milestone-specific browser, coverage,
dataset, tape, accessibility, audit, and support-matrix commands when relevant.
Never describe a check as passing without current-session output.
