# Validation Session Log

One entry per recorded set — informal ground truth that gate diagnostics and
detected counts get audited against. Template: `session-log-template.md`.

Entries below were reconstructed from screen recordings (ShareX) by frame
inspection; fields marked **fill in** need the athlete's own memory or the
pose tape. Recordings live outside the repo:
`C:\Users\acetu\OneDrive - purdue.edu\Documents\ShareX\Screenshots\2026-07\`.

---

## Sessions

### Session: bedroom-2026-07-04-a (chrome_TKeCSOsoyJ.mp4)
- Date/time: 2026-07-04 ~20:44 EDT (105 s recording)
- Source: live
- View / protocol: front-ish, bedroom, dim mixed lighting — not protocol-compliant
- Build: pre-fix (`c7eca12` era — before phantom-rejection filter / outlier exclusion)
- Tape file: **fill in** (not confirmed downloaded)
- ACTUAL reps performed (your count): **fill in** (~9 believed genuine)
- Detected reps: 9 — `REPS(state)` == `REPS(disp)` throughout (trust-pass sync fix confirmed live)
- Rejected candidates shown in analyst mode: 15 total; ledger dominated by
  `bottom` gate "Bottom not held long enough" with **hip drop 0.000 @ 99% conf**
  (phantom candidates — the finding that produced `RepRejection.phantom`).
  Real entries showed hip drop 0.049–0.014 @ 75–99% conf.
- Movement intent: normal
- Capture issues: started too close ("Step back — your feet are out of frame"
  guidance fired correctly); single-knee dropouts mid-set (L or R knee `---`
  in DBG on several frames)
- Protocol compliant? no — lighting, distance, background clutter
- Notes: Results reported avg depth ~95°, camera confidence 91%. "Even drive"
  flagged 39° L/R difference at **High confidence** despite single-leg
  dropouts → logged as validation item (asymmetry confidence vs coverage).

### Session: bedroom-2026-07-04-b (chrome_CHmkrosOnF.mp4)
- Date/time: 2026-07-04 ~20:46 EDT (90 s recording)
- Source: live
- View / protocol: front-ish, bedroom, same setup as session a
- Build: pre-fix
- Tape file: **fill in**
- ACTUAL reps performed (your count): **fill in** (~9–10; rep 1 is a setup artifact)
- Detected reps: 10 — counter synced; rep 1 recorded at 41° bottom knee angle
  (implausible; athlete still settling into position). App flagged "Rep 1
  stands out" but still averaged it in (fixed post-session in `0d1ccd9`).
- Rejected candidates shown in analyst mode: 8 on the live HUD near the end
  (gate mix not captured)
- Movement intent: normal, plus walked up to the camera at set end
- Capture issues: end-of-set walk-off put only face/shoulders in frame —
  DBG showed `PHASE BOTTOM`, `CANDIDATE YES`, `HIT BOTTOM YES` at **28%
  confidence**; the seated block gate ("Movement looked seated") was the only
  thing preventing a phantom count → logged as validation item (suspend phase
  detection below a visibility floor).
- Protocol compliant? no — same as session a
- Notes: Results: avg depth ~99° (range 41°–123°), confidence 80%, knee
  asymmetry 42°. Rep-1 artifact skewed range and likely the asymmetry read.

### Session: bedroom-2026-07-04-c (chrome_1xptMwF3mE.mp4)
- Date/time: 2026-07-04 ~21:20+ EDT (132 s recording)
- Source: live
- View / protocol: front-ish, bedroom; athlete moved around, at times very
  close to camera (knees out of frame, `---` in DBG)
- Build: **post-fix (`0d1ccd9`)** — both disclosure surfaces confirmed
  rendering: summary line "Rep 1 differed most from your set pattern and is
  left out of the averages" and depth copy "Rep 1 excluded as an outlier
  from your own set pattern."
- Tape file: `live-session-2026-07-05.posetape.json` (Downloads; backed up
  next to the recordings in the OneDrive ShareX folder). 1475 frames @
  15.5 fps, recordedAt 2026-07-05T01:37Z (2026-07-04 21:37 EDT). Kept out
  of the repo deliberately — it is athlete motion data and part of the
  validation dataset; store tapes with the recordings, not in git.
- ACTUAL reps performed (your count): **fill in**
- Detected reps: **25** — but rep-by-rep chart shows this set is heavily
  polluted (see finding below): reps 1–7 counted at 175°–178° bottom knee
  angle (standing — no knee bend), reps 13/16/17/18 at 13°–20° (tracking
  artifacts, near-impossible flexion), plausible genuine squats roughly
  reps 8–12, 14–15, 19–25 (65°–144° bottoms)
- Rejected candidates (from tape diagnostics): ledger at its 50-entry cap
  (`MAX_REJECTIONS`) — **46 phantom** (`bottom` gate, zero descent) + **4
  real** (`knee-lift` gate). Live HUD correctly showed only the real ones
  (phantom filter working as designed). Note: the cap means early
  rejections were truncated; actual candidate churn was ≥50.
- Movement intent: partly normal squats, partly free movement / walking
  toward camera (effectively an adversarial stress test)
- Capture issues: close-range frames with legs clipped; skeleton distorted
  when near camera
- Protocol compliant? no
- Notes: Results: avg depth ~120° (rep 1 excluded), range 13°–177°,
  depth CV 43%, camera confidence 89%, knee asymmetry 35°. One flagged
  outlier is correctly excluded, but a single-outlier exclusion cannot
  clean a set with ~10 artifact reps — as designed; the real problem is
  upstream (false-positive rep counting, below).
- Offline replay (2026-07-04, `runPipelineOnFrames` on the tape's frames):
  **12 reps** vs 25 live — see finding #7. The replay independently
  reproduces the false-positive families: rep 1 at 178° and rep 2 at 175°
  bottom (standing, 3164 ms / 520 ms), rep 3 counted with **no knee data
  at all** (both min knee angles null, 63% conf), reps 7–8 at 18°/12°
  bottoms with the other knee at ~164° (single-leg tracking artifacts).
  Plausible genuine squats in the replay: reps 4–6 and 9–12 (55°–139°).

---

## Findings ledger (cross-session)

| # | Finding | Status |
|---|---------|--------|
| 1 | Phantom zero-descent rejections pollute ledger (a: 15 rejections on clean 9-rep set) | **Fixed** in `0d1ccd9` (`RepRejection.phantom`, reporting-layer only) |
| 2 | Flagged outlier rep still averaged into set metrics (b: 41° rep 1) | **Fixed** in `0d1ccd9` (aggregate exclusion + disclosure, ≥4-rep sets) |
| 3 | Phase detection runs on partial-body frames at low confidence (b: BOTTOM @ 28% conf, face-only framing) | Open — validation-phase item (kickoff doc) |
| 4 | Asymmetry reads carry High confidence despite single-leg dropouts (a: 39°, c: 35° with `---` knees) | Open — validation-phase item (kickoff doc) |
| 5 | **False-positive reps while standing** (c: reps 1–7 counted at 175–178° bottom knee angle; one rep counted with hip drop −0.014). `reachedBottom` can be satisfied by the phase detector without any knee bend, and `bilateralBend` / `hipDescended` are soft (non-rejecting) validations. Severity: high — inflates rep counts on any set with upper-body motion or close-range framing. | Open — highest-priority validation-phase item; needs the session-c pose tape as the regression fixture |
| 6 | Extreme-flexion artifacts counted as reps (c: 13°–20° bottoms on reps 13/16–18; replay reproduces at 12°/18° with the other knee ~164°) | Open — likely same root cause family as #5 (tracking garbage passing soft gates) |
| 7 | **Live vs replay parity gap**: replaying the session-c tape through `runPipelineOnFrames` yields 12 reps where the live session counted 25. Same frames, same gates — the difference is pipeline entry state (live auto-start/calibration/`beginSetDuringDescent` vs cold-start replay), and filtering semantics (live analysis consumed One-Euro-filtered frames; cold replay ran raw). | **Fixed forward** (2026-07-04): `eval/replayHarness.replayTape` reproduces the live pipeline — applies the tape's declared filtering to the raw frames and seeds the activation entry state. New live tapes record `meta.entryState`, `meta.analysisStartFrameIndex`, and a READY-onward preroll (warms the One-Euro filter exactly as live), giving bit-identical live↔replay parity — proven by `eval/replayParity.test.ts` (synthetic live-session simulator + replay, identical reps/phases/rejections/metrics). **Caveat for the legacy session-c tape**: it predates the entry-state/preroll fields, so its live entry is *reconstructed* (calibration approximated from frame 0) — replay is deterministic and reproduces every false-positive family (#5 standing bottoms, #6 extreme flexion, #8 knee-less rep) but yields 12 reps, not the live 25; exact parity for that tape is unreachable because the live filter warm-up and calibration snapshot were never recorded. A calibratedHipY sweep confirmed entry-state sensitivity (4–71 reps across 0.3–0.7), validating the entry-state hypothesis. |
| 8 | A rep can be counted with zero knee data (replay rep 3: both min knee angles null). `bilateralBend` soft-fails and nothing hard-rejects a knee-less rep. | Open — subset of #5, worth its own guard (hard-reject when no knee angle was ever read during the candidate) |
| 9 | Rejection ledger cap (`MAX_REJECTIONS` = 50) reached in session c; 46/50 entries were phantoms, so real rejections can be evicted by jitter churn. | Open — minor: stop appending phantoms once flagged, or raise cap / count phantoms separately |
