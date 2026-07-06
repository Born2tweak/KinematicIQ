# M02 — Testing & Benchmark Foundation

Date: 2026-07-05. Make the existing eval harness the official regression net before any refactor begins.

## What changed

- **`web/vite.config.ts`** — widened coverage `include` from `src/cv/**` only to `['src/cv/**', 'src/analysis/**', 'src/session/**', 'src/eval/**']`. Measured the real aggregate first (lines/stmts 83.73%, branches 84.39%, funcs 92.14%) and set thresholds *below* the measured numbers with margin: `{ lines: 75, functions: 80, branches: 75, statements: 75 }`. Margin is deliberate so the real-tape suites (which `skipIf` when the ~10 MB gitignored tape is absent) cannot flip the gate red in a tape-less environment. COOP/COEP server headers untouched (load-bearing for MediaPipe WASM).
- **`web/src/eval/tapeRegression.test.ts`** (new) — replays `eval-tapes/live-session-2026-07-05.posetape.json` through the production pipeline (`replayTape` → `runPipelineOnFrames`) and locks the observable outputs a refactor must not silently change:
  - rep count = 12
  - quality verdict = `invalid`, trusted reps = 8, untrusted rep numbers = [1,2,3,8], reason ids = [standing-reps-counted, impossible-flexion-reps, knee-less-reps, artifact-heavy-set], phantom candidates = 26
  - per-rep bottom frame indices = [1098,1161,1249,1417,1517,1551,1581,1730,1911,1953,2047,2402]
  - replay config = one-euro filtering, seeded-reconstructed entry
  - plus a determinism check across repeated replays.

## Files touched

- `web/vite.config.ts` (modified)
- `web/src/eval/tapeRegression.test.ts` (new)

## Decisions / conflicts

- Loaded the tape via `fs` from the repo-root `eval-tapes/` path (same pattern as `replayParity.test.ts`) rather than copying the 10 MB file into `src/test/fixtures/` — keeps the git tree clean and reuses the tape's canonical location. The test skips cleanly when the tape is absent.
- Did **not** touch `replayParity.test.ts` (per M2 accept criteria) — it remains green.
- Snapshot values were captured from the current pipeline, not hand-picked: the tape honestly grades `invalid` (findings #5/#6/#8 survive replay), which is the correct product behavior and now regression-locked.

## Tests

Before: 30 files / 180 tests. After: **31 files / 182 tests**, all green. `npm run build` clean; `npm run test:coverage` passes thresholds (83.73% lines/stmts, 84.39% branches, 92.14% funcs).
