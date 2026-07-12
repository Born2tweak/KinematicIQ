# KinematicIQ Architecture

> Revised 2026-07-12 at M80; current through M79. This document describes the
> implemented architecture and the approved Phase 2 extension direction. It
> does not grant availability to a planned protocol.

## 1. System boundary

KinematicIQ is a React/TypeScript browser application. Pose inference,
biomechanics analysis, findings, and report construction run client-side. It
has no application backend, accounts, cloud inference, telemetry, or automatic
upload. MediaPipe model/runtime assets may still be fetched by the browser.

Application data is in memory unless a user explicitly exports an artifact or
selects “Save to history.” That existing compatibility path writes a versioned
record to local IndexedDB and provides delete-all; Phase 2 adds no persistence.

## 2. Canonical architecture

```text
camera or upload
      |
      v
MediaPipe Pose (raw landmarks retained where the tape contract requires)
      |
      v
ProtocolRuntime
  capture -> frame analysis -> lifecycle -> outcome kind -> outcome
      |
      v
set-quality gate ---- invalid evidence -> full abstention
      |
      v
MetricResult[] -> Finding[] -> bounded coaching cues -> report/export
```

`ProtocolRuntime` in `src/protocols/runtime.ts` is the sole universal runtime
extension point. It supports a shared five-stage contract while allowing
movement-specific outcome types. The live cyclic adapter currently connects
squat’s phase/rep pipeline to that contract. Phase 2 will enrich the contract
additively before migrating further movement adapters.

The registry separates definition from availability:

- **available:** squat only;
- **planned/fail-closed:** sit-to-stand, hip hinge, jump, and sprint;
- a schema, adapter, dataset, or successful test never activates a protocol.

## 3. Module ownership

| Module | Responsibility |
|---|---|
| `core/` | Stable movement-agnostic protocol, confidence, provenance, metric, and finding schemas |
| `protocols/` | Definitions, registry, runtime contract, runtime adapters, and movement-specific analysis entry points |
| `cv/` | MediaPipe integration, landmarks, quality, readiness, filtering, drawing, and frame sources |
| `analysis/` | Pure geometry/statistics plus squat phase, rep, set, and metric collection logic |
| `metrics/` | Protocol metric definitions and `MetricResult` construction |
| `findings/` | Abstention-aware rules and observation-language findings |
| `session/` | Quality gate, session-result assembly, baseline, and change detection |
| `camera/` | Real-camera and deterministic pose-tape camera sources |
| `eval/` | Versioned pose tapes, replay/benchmark contracts, dataset adapters, and evaluation |
| `storage/` | Explicit opt-in, local-only history and migrations |
| `export/` | Explicit local JSON, HTML, and tape artifacts |
| `screens/` / `components/` | Route orchestration and presentation; no protocol rules in components |

Primary routes are `/`, `/camera`, `/upload`, `/results`, and `/history`.
React hooks own route/session state; no global state library is required.

## 4. Dependency rules

Dependencies flow from presentation and orchestration toward stable contracts:

```text
screens/components -> camera/session/protocols -> analysis/metrics/findings
                                      |                  |
                                      +------> core <----+
cv -> landmark/frame contracts; eval -> public runtime and analysis contracts
storage/export -> versioned session artifacts
```

- `cv/` does not import protocol findings or UI.
- Analysis math remains pure and UI-independent.
- Components render props; screens orchestrate runtimes and sessions.
- Movement-specific thresholds stay with their evidence-backed movement logic.
- Dataset adapters cannot change runtime behavior or protocol availability.
- Versioned tape/session/export shapes are never silently reshaped.

## 5. Runtime and evidence contracts

The runtime contract owns five stages:

1. capture requirements and setup instructions;
2. per-frame analysis input/output;
3. lifecycle transitions and completion;
4. declared outcome kind; and
5. construction of a typed outcome.

Movement adapters may produce cyclic, transition, ballistic, or gait-shaped
outcomes. Cross-movement consumers depend on the runtime envelope, not squat’s
rep-specific internals. M81-M84 will add evidence/lifecycle metadata, a neutral
trial-outcome contract, squat parity coverage, and completeness linting before
another adapter may be considered.

Every emitted metric carries confidence, provenance, validation tier, and an
explicit value or abstention. Full-set invalidity suppresses posture summaries,
metrics summaries, findings, and coaching. There is no composite score.

## 6. Capture, tracking, and replay

The live and upload paths share landmark and analysis contracts. Camera sources
are pluggable: the real source uses `getUserMedia`; deterministic pose-tape
sources drive browser tests without fabricating hardware results.

Tracking/filter changes are evidence-gated. A candidate must be compared on
the replay harness against a frozen baseline, with declared metrics, fixtures,
and rollback. Raw observations and applied filter variants remain traceable in
provenance. The current MediaPipe engine and accepted filter remain unchanged
unless that benchmark gate passes.

Pose tapes and governed datasets are evaluation evidence, not product data.
Adapters validate checksums/licenses/metadata, exclude unsupported labels, and
must not convert source scores into KinematicIQ claims.

## 7. Results, claims, and persistence

Results use progressive disclosure: summary findings, metric evidence, and
expert diagnostics. Findings use observation language and at most three
bounded coaching cues. Diagnostic, pathology, injury-risk, kinetics,
muscle-activation, normative, and composite-score claims are prohibited.

Session data normally disappears with the in-memory session. The only retained
paths require an explicit user action:

- local IndexedDB history with schema-versioned records and delete-all;
- JSON or self-contained HTML session report export; or
- pose-tape export for evaluation.

There are no cookies, server storage, cross-device sync, or silent persistence.

## 8. Accessibility and target support

The declared target matrix is Windows 11 Chrome and Firefox plus iPhone Safari.
Automated Playwright projects cover Chromium, Firefox, desktop WebKit, and a
mobile Safari-compatible WebKit profile. These simulations do not establish
physical-device or screen-reader conformance. Exact iPhone Safari/VoiceOver and
Windows NVDA scripts live in
`docs/validation/M76_SUPPORT_MATRIX_AND_MANUAL_VERIFICATION.md` and remain
pending human execution.

UI work must preserve semantic landmarks, labels, keyboard access, visible
focus, reduced-motion behavior, contrast, zoom/reflow, and non-color status
cues. Code-level and automated checks are required; manual results must never
be fabricated.

## 9. Change gates

| Change | Required evidence before acceptance |
|---|---|
| Rep or phase thresholds | Labeled replay cases and regression comparison |
| Landmark filtering/tracking | Frozen baseline, candidate benchmark, declared acceptance bounds |
| Capture-readiness geometry | Representative real-tape validation |
| Pose model | Replay-harness benchmark and explicit product decision |
| Versioned artifact shape | Additive compatibility or schema bump plus migration tests |
| New protocol availability | Complete contract, evidence, UX, claims, validation, and explicit activation decision |
| Persistence/backend/auth/cloud | Separate product authorization; outside Phase 2 scope |

## 10. Verification boundaries

The build and Vitest suite are the default code-change floor. Camera, runtime,
UI, dataset, accessibility, or support changes additionally run their declared
Playwright and evaluation scripts from the Phase 2 roadmap. Physical device,
screen-reader, expert-review, and independent-rater outcomes remain external
gates and are recorded as pending until humans actually execute them.
