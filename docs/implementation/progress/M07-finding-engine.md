# M07 — Finding Engine v1

Date: 2026-07-05. Metrics → meaning: rule-based findings with evidence chains; coaching cues derived FROM findings.

## What changed

- **`web/src/findings/squatRules.ts`** (new) — `deriveSquatCoaching(components, sessionConfidence, metrics, metricResults, maxCues)` returns `{ findings, cues }` in one pass. Findings map each low component to a `Finding` (id `squat.<key>`, coach question, statement = the observation, evidence refs to the triggering `MetricResult`s, confidence, priority primary/secondary, tryNext). Cues are emitted from the SAME `buildBiomechanicalCue` output, so copy is byte-identical. Component→question and component→evidence-metric maps included.
- **`web/src/findings/engine.ts`** (new) — protocol-agnostic `deriveCoaching(input)`: **full abstain on `invalid` quality verdict** (zero findings + cues), dispatches to squat rules, returns empty for planned protocols. Exhaustive switch over `ProtocolId`.
- **`web/src/feedback/feedbackEngine.ts`** — `generateFeedback` now delegates to `deriveSquatCoaching(...).cues`; the Low-confidence guard moved into the shared derivation. Same signature, same output.
- **`web/src/session/types.ts`** + **`buildSessionResult.ts`** — added `findings: Finding[]` to `SessionResult`; `buildSessionResult` now calls `deriveCoaching` (gated by insufficientData / quality verdict exactly as before) and stores `findings` + `feedback` (the derived cues) from one consistent pass.
- Tests: `findings/squatRules.test.ts` (Low ⇒ empty; cues byte-identical to direct builder; one finding per cue with priority + evidence chain), `findings/engine.test.ts` (invalid ⇒ full abstain; valid squat ⇒ findings+cues; planned ⇒ empty).

## Files touched

- `web/src/findings/{squatRules.ts,engine.ts,squatRules.test.ts,engine.test.ts}` (new)
- `web/src/feedback/feedbackEngine.ts`, `web/src/session/types.ts`, `web/src/session/buildSessionResult.ts` (modified)

## Decisions / conflicts

- **Byte-identical cues** achieved by keeping `buildBiomechanicalCue`/`lowestComponents` as the single source of cue copy and building findings around it, rather than rewriting the copy declaratively. Confirmed by the pre-existing `buildSessionResult.test.ts` and `verdictEvidence.test.ts` staying green unchanged, plus a dedicated equality test.
- **Abstain preserved on two levels:** invalid verdict ⇒ engine returns empty (commit 2408a58 behavior); Low session confidence ⇒ derivation returns empty (pre-M7 behavior). Confidence gating of individual claims still lives in `buildBiomechanicalCue` (`claimGated`, commit 4df8ad4) and is unchanged.
- No import cycles: `feedbackEngine → findings/squatRules → feedback/feedbackReasoning` (leaf); `buildSessionResult → findings/engine → findings/squatRules`.

## Tests

Before: 39 files / 219 tests. After: **41 files / 225 tests**, all green. `npm run build` clean.
