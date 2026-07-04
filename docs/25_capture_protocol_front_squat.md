# Capture Protocol — Front-View Squat (v1)

**Status:** Draft — provisional values, to be confirmed against the first pilot recordings and ratified before dataset collection begins. This is the protocol document required by the Scientific Validation recruiting checklist (`strategy/validation-strategy.md`): every dataset recording must comply with it, because validation is scoped to (question, protocol) pairs (ontology P5) — **protocol drift invalidates the dataset**.

**Scope:** this document defines capture geometry and recording rules only. Dataset *diversity* (body types, clothing, lighting, settings) is specified in the validation program and is deliberately varied; the geometry below is deliberately fixed.

---

## 1. Setup geometry (fixed)

| Parameter | Value | Rationale |
|---|---|---|
| Viewpoint | Athlete faces the camera square-on (shoulders and hips parallel to sensor plane, ±15°) | Front view is the v1 protocol; yaw beyond ~15° degrades L/R symmetry reads |
| Camera height | Hip height of the standing athlete (~0.8–1.0 m), lens level (no tilt) | Minimizes perspective distortion of hip/knee angles; tilt biases trunk-lean reads |
| Distance | 3–4 m, adjusted so the full body fills ~70–80% of frame height | Full-body landmark coverage with margin; closer clips feet/head at the bottom position |
| Framing | Entire body visible in **every** frame, including feet and full arm span, with head-room and floor margin | MediaPipe degrades sharply on out-of-frame limbs; the bottom position is the frame that matters most |
| Orientation | Portrait preferred on phones; landscape acceptable if full body + margins fit | A standing human is portrait-shaped; resolution spent on the athlete, not the room |
| Camera support | Fixed mount (tripod or stable surface). Handheld recordings are non-compliant | A moving camera is indistinguishable from a moving athlete |

## 2. Environment

- **Lighting:** athlete evenly lit from the front or above; no strong backlight (windows behind the athlete are the most common failure).
- **Background:** any, but the athlete must be the only person fully in frame (partial passers-by in the far background are tolerable; a second full body confuses tracking).
- **Floor:** flat; athlete's stance stays on one spot for the whole set.
- **Clothing:** per the dataset diversity spec, varied on purpose — but ankles and knees should not be fully obscured (no floor-length garments). Note the clothing type in the session metadata.

## 3. Recording

| Parameter | Value |
|---|---|
| Resolution / frame rate | 1080p at 30 fps minimum (device default is usually fine); never below 24 fps |
| Set length | 5–8 bodyweight squats, athlete-chosen depth and tempo — do **not** coach the movement before or during recording (the dataset needs natural patterns; induced-pattern clips are a separate, labeled instruction) |
| Start/stop | Begin recording ≥2 s before the first descent; stop ≥2 s after the final stand |
| Sessions per athlete | **Two**, same protocol, separated by hours or days — this is what makes test-retest measurable from the same collection effort |
| Metadata per recording | date/time, device model, athlete ID, clothing note, lighting note, induced-pattern instruction if any |

## 4. Compliance checklist (verify before keeping a recording)

- [ ] Full body (head to feet) visible in every frame, including at the deepest position
- [ ] Camera did not move, tilt, or refocus-hunt during the set
- [ ] Athlete square to camera within ~15° for the whole set
- [ ] No second person fully in frame
- [ ] No strong backlight; landmarks visually stable when scrubbing the video
- [ ] ≥5 complete reps captured with pre/post buffer

A recording that fails any item is re-shot, not "fixed in post" — non-compliant recordings never enter the tune or holdout sets.

## 5. What this protocol can and cannot observe

Stated here so recorders and raters share expectations (mirrors the front-view honesty table in `strategy/report-design.md` §3): front view supports movement-completion and load-symmetry well, strategy-selection at capped confidence (3D-lifted hinge ratio), and posture-organization weakly — trunk reads from this protocol will frequently and *correctly* abstain. Side-view recordings are a different protocol and a different validation scope; do not mix them into this dataset.

## 6. Provisional values to confirm on pilot

1. The 3–4 m / 70–80% frame-height pairing against real MediaPipe visibility scores at the bottom position.
2. Whether ±15° yaw tolerance is enforceable by eye or needs the advisory yaw estimate surfaced during recording.
3. Portrait 1080p30 on the recruits' actual devices (older phones may default lower).

---

*Traces: protocol/observation separation from `24_movement_ontology.md` §3.2 and P5; dataset requirements from `strategy/validation-strategy.md` (Scientific Validation program); observability expectations from `strategy/report-design.md` §3.*
