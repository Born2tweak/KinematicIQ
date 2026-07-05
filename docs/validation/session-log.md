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
- Tape file: **fill in** — this tape is the important one; please save it
- ACTUAL reps performed (your count): **fill in**
- Detected reps: **25** — but rep-by-rep chart shows this set is heavily
  polluted (see finding below): reps 1–7 counted at 175°–178° bottom knee
  angle (standing — no knee bend), reps 13/16/17/18 at 13°–20° (tracking
  artifacts, near-impossible flexion), plausible genuine squats roughly
  reps 8–12, 14–15, 19–25 (65°–144° bottoms)
- Rejected candidates shown in analyst mode: low single digits on the live
  HUD (1–4 range) — phantom filter appears active
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

---

## Findings ledger (cross-session)

| # | Finding | Status |
|---|---------|--------|
| 1 | Phantom zero-descent rejections pollute ledger (a: 15 rejections on clean 9-rep set) | **Fixed** in `0d1ccd9` (`RepRejection.phantom`, reporting-layer only) |
| 2 | Flagged outlier rep still averaged into set metrics (b: 41° rep 1) | **Fixed** in `0d1ccd9` (aggregate exclusion + disclosure, ≥4-rep sets) |
| 3 | Phase detection runs on partial-body frames at low confidence (b: BOTTOM @ 28% conf, face-only framing) | Open — validation-phase item (kickoff doc) |
| 4 | Asymmetry reads carry High confidence despite single-leg dropouts (a: 39°, c: 35° with `---` knees) | Open — validation-phase item (kickoff doc) |
| 5 | **False-positive reps while standing** (c: reps 1–7 counted at 175–178° bottom knee angle; one rep counted with hip drop −0.014). `reachedBottom` can be satisfied by the phase detector without any knee bend, and `bilateralBend` / `hipDescended` are soft (non-rejecting) validations. Severity: high — inflates rep counts on any set with upper-body motion or close-range framing. | Open — highest-priority validation-phase item; needs the session-c pose tape as the regression fixture |
| 6 | Extreme-flexion artifacts counted as reps (c: 13°–20° bottoms on reps 13/16–18) | Open — likely same root cause family as #5 (tracking garbage passing soft gates) |
