# KinematicIQ Context Pack

<!-- Hand-maintained as of M34 (2026-07-06). The former generator
     (scripts/generate-context-pack.ps1) is DEPRECATED — it encodes the
     pre-protocol-platform milestone model (old M1–M18) and must not be run;
     it would overwrite this file with stale content. Update this file by
     hand as part of each docs-sync milestone. -->

## Workspace

| Key | Value |
|-----|-------|
| Repo | `C:\Users\acetu\KinematicIQ` / https://github.com/Born2tweak/KinematicIQ.git |
| Branch | `master` |
| App | `web/` — Vite + React + TypeScript — `npm run dev` → http://localhost:5173/ |
| Pose engine | MediaPipe `@mediapipe/tasks-vision` (on-device, no backend) |
| Routes | `/` `/camera` `/upload` `/results` `/history` |
| Tests | `npm test` (vitest, 56 files / 353 tests green at M33) + `npm run test:e2e:camera` (Playwright fixtures, no webcam) |

## Product

Browser-only **movement analysis platform** organized as a protocol engine.
Squat is the available protocol; hip hinge / jump / sprint are registered
stubs (`analyze` throws). Camera or upload → MediaPipe Pose → angles → phases
→ reps → keyed `MetricResult[]` → observation-language `Finding[]` → tabbed
report (Summary / Evidence / Expert). **Verdict-or-abstain:** an
untrustworthy recording produces a full abstain, not a hedged report. No
composite score exists anywhere — permanently forbidden.

Persistence is **opt-in and local-only**: explicit "Save to history" writes a
versioned record to IndexedDB with a delete-all control (M9/M31). Nothing is
uploaded, ever. Session reports export as self-contained HTML/JSON (M33);
pose tapes export separately as JSON.

## Program status (master roadmap M25–M60)

Source of truth: `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`.
Per-milestone record: `docs/implementation/progress/` (one note per milestone).

| Range | Status |
|---|---|
| M00–M24 | Done — platform schemas, protocol/metric/finding engines, report UX, history, labeled ground truth, metric expansion, coaching intelligence |
| M25–M26 | Done — capture readiness v2, per-frame landmark quality |
| M27 | Blocked — needs a filter candidate + real-tape benchmark evidence |
| M28–M30 | Blocked on the M39–M43 protocol runtime |
| M31–M33 | Done — personal baseline, MDC-aware trends, local report export |
| M34 | Done — this docs sync |
| M35+ | Not started |

## Key contracts (current)

- `core/` — movement-agnostic schemas: `Confidence`, `Provenance`,
  `MetricDefinition`/`MetricResult`, `ProtocolDefinition`, `Finding`
- `protocols/registry.ts` — `getProtocol` / `listProtocols`; squat available,
  stubs throw `NotImplementedError`
- `session/setQualityGate.ts` — valid / questionable / invalid; **invalid ⇒
  full abstain** (no posture, no metrics summary, no coaching)
- `session/buildSessionResult.ts` — assembles `SessionResult`
- `session/baseline.ts` + `session/changeDetection.ts` — self-referenced
  history deltas with MDC-aware "within noise / possible change" language
- `export/sessionReport.ts` + `sessionReportHtml.ts` — versioned JSON +
  self-contained offline HTML report artifact
- `camera/` — pluggable camera sources: real webcam or pose-tape fixtures
  (deterministic, drives Playwright e2e without hardware)
- `eval/poseTape.ts` — replayable audit-trail recording; extend additively
  only, with a version bump

## Doctrine (locked — read before writing any user-facing copy)

- `docs/doctrine/claims-policy.md` — observation language only; forbidden:
  diagnosis, injury risk, pathology, kinetics, muscle activation, normative
  comparison, composite scores. Validation tiers gate language.
- `docs/doctrine/movement-ontology.md` — reasoning-layer rules.
- `docs/doctrine/deferred-scope.md` — the do-not-build ledger.
- `docs/research/` — 11 immutable source specs. Never edit.

## Do not refactor yet

| Item | Why |
|---|---|
| Rep-counting gates (`analysis/repCounter.ts`) | Open validation findings #5/#6 pending labeled data |
| Phase-detector thresholds (`analysis/phaseDetector.ts`) | Same evidence gate |
| Pose-tape format (`eval/poseTape.ts`) | Audit trail; additive changes + version bump only |
| MediaPipe engine (`cv/poseEngine.ts`) | Pose-model swap requires a replay-harness benchmark first |
| Legacy `metrics`/`scoring` dual-write in `SessionResult` | Consumed by report until M40 SessionResult v2 lands |
| Capture-readiness geometry thresholds (`cv/captureReadiness.ts`) | Provisional pending real-tape validation (M44–M45) |

## Rules for agents

1. One milestone at a time; verify status against `docs/implementation/progress/` first.
2. Quality gates from `web/`: `npm run build` clean + `npm test` green; camera
   changes also `npm run test:e2e:camera`.
3. One commit per milestone + one progress note. Never push without an
   explicit ask. Never `git add -A`.
4. Versioned shapes (`schemaVersion`) — bump on change, never silently reshape.
5. Rep gates / phase thresholds change only with labeled-tape evidence.
6. No backend, no auth, no cloud, no composite score, no pose-model swap.
