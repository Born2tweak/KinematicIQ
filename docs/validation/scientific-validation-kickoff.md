# Scientific Validation — Engineering Kickoff

**Status:** Kickoff (2026-07-04) — docs/engineering foundation only; recruiting not started.  
**Program owner context:** `docs/strategy/validation-strategy.md` § Scientific Validation program.

This checklist wires the product to the validation pipeline so live and upload sessions produce auditable artifacts. No verdict vocabulary or threshold changes happen here.

---

## Prerequisites (already in repo)

| Item | Location |
|------|----------|
| Validation strategy + deliverables | `docs/strategy/validation-strategy.md` |
| Front-view capture protocol (draft) | `docs/25_capture_protocol_front_squat.md` |
| Per-session ground-truth log template | `docs/validation/session-log-template.md` |
| Pose tape substrate + gate diagnostics | `web/src/eval/poseTape.ts`, rep-gate `RepRejection` in `repCounter.ts` |
| Live session tape export | Camera → Results → Analyst → Save pose tape |

---

## Kickoff checklist

### Protocol & logging

- [ ] Ratify `docs/25_capture_protocol_front_squat.md` against the first pilot recordings (distance, framing, lighting).
- [ ] Create `docs/validation/session-log.md` by copying entries from `session-log-template.md` for each filmed set.
- [ ] For every session: record **ACTUAL reps** (human count), **detected reps**, and **rejected candidates** (from Results analyst panel or live HUD feedback).

### First recording sessions (per athlete)

Each athlete: **two protocol-compliant sessions** (test-retest from the same visit when possible).

1. **Session A** — normal movement intent, front view per protocol.
2. **Session B** — same setup, repeat after brief rest (test-retest pair).

For each session:

1. Film with protocol-compliant framing (see protocol checklist).
2. Complete set in-app (live) or upload raw video.
3. Download `.posetape.json` from Results (Analyst mode).
4. Fill a `session-log-template.md` entry immediately while memory is fresh.
5. Note capture issues (backlight, clipped feet, camera moved) in the log — protocol drift invalidates the dataset.

### Labeling prep (before recruiting raters)

- [ ] Draft labeling rubric per deliverable #2 in `validation-strategy.md` (rep count, bottom frames, four question verdicts).
- [ ] Write counterfactual for each label before labeling begins (ontology §7).
- [ ] Identify ≥2 qualified raters (S&C / PT / sport scientist) — **do not recruit until protocol is ratified**.

### Dataset targets (reference)

- 20–30 real squat sessions
- ≥5 different bodies (body type, clothing, lighting, setting)
- Include induced patterns for tuning; hold wild/natural clips for holdout only

---

## What engineering provides

| Capability | Notes |
|------------|-------|
| Live pose tape + gate diagnostics | Rejection reasons surfaced in normal mode; full gate dump in Analyst DBG |
| Upload path parity | Same analysis pipeline as live |
| Session log fields | Template aligned with `RepRejection.gate` / coach-facing copy |
| No recruiting automation | Human scheduling only |

---

## Next actions (ordered)

1. Ratify capture protocol on 1–2 pilot clips.
2. Schedule first internal pilot (owner or single volunteer) — log in `session-log.md`.
3. Draft labeling rubric stub in `docs/validation/` when pilot tapes exist.
4. Begin athlete recruiting only after protocol ratified + rubric counterfactuals written.

---

*Traces: validation-strategy.md deliverables; session-log-template.md; capture protocol docs/25.*
