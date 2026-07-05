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
- [x] Create `docs/validation/session-log.md` by copying entries from `session-log-template.md` for each filmed set. *(Created 2026-07-04 with three pilot sessions; ACTUAL rep counts and tape filenames still to fill in.)*
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

## Known detection-behavior items (deferred to validation phase)

Observed in the 2026-07-04 pilot recordings. These change detection behavior itself, so they wait for ground-truth tapes rather than being tuned by eye:

1. **Phase detection runs on partial-body frames.** With only face/shoulders in frame, the FSM reported `BOTTOM` with an active candidate at 28% pose confidence — the seated block gate was the only thing preventing a phantom count. Candidate: suspend phase detection below a visibility/confidence floor. Measure against labeled tapes first.
2. **Asymmetry reads carry High confidence despite single-leg dropouts.** Sets showed 39–42° left–right knee difference labeled "high confidence" while one knee read `---` on multiple frames. Candidate: gate asymmetry confidence on bilateral landmark coverage across the set.
3. **False-positive reps while standing** (session c, post-fix build): reps counted at 175–178° bottom knee angle — no knee bend at all — and one rep counted with *negative* hip drop. Root cause: `reachedBottom` can be satisfied by the phase detector alone, and `bilateralBend` / `hipDescended` are soft (non-rejecting) validations in `validateRep`. Highest-priority detection item; fix must be tuned against the session-c pose tape, not by eye, because promoting soft gates to hard gates risks dropping real reps (see `docs/validation/session-log.md` findings #5–#6).
4. **Extreme-flexion artifacts counted as reps** (13°–20° bottom angles at close range with clipped legs). Same family as #3 — tracking garbage passing soft gates. A plausibility band on bottom knee angle is the candidate guard.

(Related fixes that did NOT change detection: phantom zero-descent candidates are now excluded from coach-facing rejection counts (`RepRejection.phantom`), and the within-set outlier rep is excluded from set aggregates with disclosure. Both are reporting-layer only; raw diagnostics stay in the pose tape.)

---

## Next actions (ordered)

1. Ratify capture protocol on 1–2 pilot clips.
2. Schedule first internal pilot (owner or single volunteer) — log in `session-log.md`.
3. Draft labeling rubric stub in `docs/validation/` when pilot tapes exist.
4. Begin athlete recruiting only after protocol ratified + rubric counterfactuals written.

---

*Traces: validation-strategy.md deliverables; session-log-template.md; capture protocol docs/25.*
