# Performance and Worker Architecture Plan (M47)

**Status:** Plan only — no compute has moved. The decision record is
[ADR-005](../adr/ADR-005-worker-boundaries.md). Sources: R06 performance
engineering, R08 worker-based compute.

## 1. Current main-thread responsibilities

Everything runs on the main thread today:

| Responsibility | Where | Notes |
|---|---|---|
| Camera acquisition + `<video>` playback | `screens/CameraScreen.tsx` | getUserMedia or pose-tape fixture source (`camera/`) |
| Per-frame loop | `CameraScreen` rAF loop | drives detect → analyze → draw each display frame |
| MediaPipe inference | `cv/poseEngine.ts` | tasks-vision WASM (SIMD), VIDEO mode, monotonic timestamps |
| Live landmark filtering | `cv/landmarkFilter.ts` (one-euro) | per-frame, stateful |
| Analysis FSMs | `analysis/cyclic/cyclicEngine.ts` via phase/rep state | pure, cheap |
| Quality + posture + trace streams | `cv/landmarkQuality.ts`, `analysis/posture/`, `analysis/frameTrace.ts` | pure |
| Overlay rendering | `cv/drawSkeleton.ts` etc. onto `<canvas>` | main-thread 2D context |
| Upload analysis (two-pass) | `analysis/videoAnalyzer.ts` | seek+detect capture pass, then Butterworth + FSM pass; blocks UI between progress callbacks |
| Result assembly + React rendering | `session/`, `screens/` | end-of-set only |

## 2. Frame budget targets

Targets, not measurements — Stage 0 below adds the instrumentation that
turns these into evidence. At 30 fps the whole live loop owns **33 ms**:

| Stage | Target (p95) | Rationale |
|---|---|---|
| Frame hand-off (video → engine) | ≤ 2 ms | no copies on the main path |
| MediaPipe inference | ≤ 20 ms | the dominant cost; device-bound |
| Filtering + analysis FSMs + streams | ≤ 3 ms | pure math on 33 landmarks |
| Overlay draw | ≤ 5 ms | single canvas pass |
| Headroom (React state, GC) | ≥ 3 ms | rep-count/status updates |

Upload path has no per-frame deadline; its budget is **UI responsiveness**:
long tasks on the main thread should stay under 50 ms between yields, which
the current awaited seek loop mostly provides — the Butterworth + FSM second
pass is the known synchronous block on long clips.

## 3. Worker-safe modules (pure today)

Everything the M39–M43 architecture deliberately kept DOM-free can move to
a worker without modification, communicating in structured-clone-safe data
(`PoseFrame[]` in, result objects out):

- `analysis/` — angles, geometry, stats, cyclic engine, phase/rep FSMs,
  metricCollector, posture, frameTrace, videoAnalyzer's pure second pass
- `cv/landmarkFilter.ts`, `cv/landmarkQuality.ts` (pure functions)
- `session/` builders, `metrics/`, `findings/`, `scoring/`
- `analysis/analyzeProtocol.ts` (M43 entry point) — the natural worker API
- `eval/` replay + benchmark modules

**Not worker-safe as-is:** `cv/poseEngine.ts` (owns the tasks-vision
landmarker fed from a `<video>` element), all `draw*` modules (main canvas),
screens/components.

## 4. Staged migration (each stage independently shippable)

Gate for every stage: camera e2e 3/3 + tape replay parity unchanged
(ADR-004), plus the M45 benchmark on the local corpus with a saved baseline.

- **Stage 0 — instrument first.** Lightweight timing marks
  (`performance.mark/measure`) around detect / analyze / draw in the live
  loop and pass boundaries in upload; surfaced in the analyst debug HUD.
  No architectural change. Turns §2's targets into measurements.
- **Stage 1 — upload/replay analysis to a worker.** Best ROI, zero latency
  risk: the two-pass upload analyzer is batch work. Worker wraps
  `analyzeFramesForProtocol`; frames transfer as structured clones (or a
  packed `Float32Array` if clone cost shows up in Stage 0 numbers).
- **Stage 2 — live analysis tail to a worker.** Filtering + FSMs + streams
  move behind a per-frame postMessage; inference stays on main. Only
  worthwhile if Stage 0 shows the tail exceeding its 3 ms budget on target
  devices — otherwise skip (the FSMs are cheap by design).
- **Stage 3 — MediaPipe in a worker.** Requires `VideoFrame` transfer or
  `OffscreenCanvas` + `createImageBitmap`, WASM threads under COOP/COEP,
  and a per-browser support matrix. Highest risk; gated on a real device
  benchmark showing main-thread inference is the UX bottleneck AND replay
  parity holding (same model, same outputs — this is not a model swap, but
  it still runs the ADR-004 gate).
- **Stage 4 — overlay via OffscreenCanvas** from the same worker, only if
  Stage 3 lands.

## 5. Browser constraints (load-bearing)

- **COOP/COEP:** `vite.config.ts` ships `same-origin` /
  `require-corp` — required for WASM SIMD/threads. Any worker script and
  every cross-origin asset it loads must be CORP/CORS-clean or the page
  loses crossOriginIsolated and MediaPipe performance regresses silently.
  The production host (Vercel) must mirror these headers.
- **Asset loading in workers:** tasks-vision fetches its `.task` model and
  WASM from a URL; the worker needs the same reachable paths (no
  `document`-relative resolution).
- **`VideoFrame`/`OffscreenCanvas`:** Chromium-complete; Safari support is
  the deciding constraint for Stage 3 — verify before scheduling it.
- **Timestamps:** MediaPipe VIDEO mode requires strictly monotonic
  timestamps; a worker boundary must preserve the single ordered feed
  (one in-flight frame, drop-newest backpressure, never reorder).

## 6. Explicitly not now

No worker code lands in M47 (roadmap "do not do"): premature worker
implementation destabilizes the camera flow that the fixture e2e currently
pins. Stage 1 is the first implementation milestone and only after Stage 0
instrumentation exists.
