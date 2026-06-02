# KinematicIQ — Expert outreach packet (M15B)

Lightweight materials for reaching out to biomechanics researchers, strength coaches, sports-tech builders, and related professionals. Use for 15–20 minute async reviews or short calls.

**Tone:** curious student-founder, not a sales deck.  
**Ask:** critique our assumptions, not endorsement.

---

## 1. Short project description

**KinematicIQ** is a browser-only app that analyzes a single set of **bodyweight squats** from a phone or webcam.

The user stands side-on to the camera, goes through calibration, performs squats, and the set ends automatically when they stand still (or they tap **Finish Now**). The app counts reps, scores movement quality on a few simple dimensions, and shows short coaching cues — all **on-device** with MediaPipe pose estimation. No video is uploaded to a server; there is no account or backend today.

We are building this as an MVP to learn whether **2D pose + simple metrics** can give athletes and coaches something useful, or whether we are measuring the wrong things entirely.

---

## 2. Current MVP capabilities

| Area | What works today |
|------|------------------|
| **Capture** | Live camera in the browser; auto-start after brief calibration; auto-finish after last rep + standing still |
| **Pose** | MediaPipe Pose Landmarker (client-side WASM); skeleton overlay |
| **Rep counting** | Phase-based FSM (standing → descending → bottom → ascending); rejects partial reps, some seated/chair-like patterns |
| **Metrics (per set)** | Depth (knee angle at bottom), trunk lean, left/right knee asymmetry, rep-to-rep depth consistency, hip shift at bottom |
| **Scoring** | Weighted 0–100 total from five components (depth 30%, trunk 25%, knee tracking 20%, consistency 15%, symmetry 10%) + bands (Excellent / Good / Needs Work / Poor) |
| **Coaching** | Up to 2 deterministic cues tied to weakest components (observed → why it matters → try next); hidden when camera confidence is low |
| **Confidence** | Separate “camera confidence” score; warnings when tracking is weak |
| **Results UI** | Summary, score ring, component breakdown with plain-language explanations, per-rep depth/trunk lines |
| **Testing** | Vitest coverage on angles, phases, reps, scoring, session build (synthetic fixtures, no camera) |

**Not in MVP yet:** barbell squats, video upload (planned client-side only), injury screening, medical claims, coach dashboards, data export, mobile native apps.

**Technical reference for reviewers:** [scoring_notes.md](./scoring_notes.md)

---

## 3. What we need feedback on

We are not asking experts to validate our startup idea. We want help **pressure-testing**:

1. Whether our **chosen metrics** relate to squat quality in a side view, or if we are proxying the wrong things.
2. Whether our **scoring weights and thresholds** are in a sensible ballpark, or misleading even as a “directional” tool.
3. Which **movement faults** are worth detecting first in a minimal product (vs. noise or false confidence).
4. What we must **not claim** (clinical, diagnostic, return-to-play, etc.).
5. How to **communicate uncertainty** when pose estimation is noisy — especially on phones.
6. Whether this would actually help **athletes or coaches** in practice, and what would need to change for that to be true.

A 15-minute screen recording plus answers to the questions below is enough. A short call is even better.

---

## 4. Specific questions for experts

### Squat metrics

- **Are these squat metrics meaningful?**  
  We use minimum knee angle (depth), average trunk lean, left/right knee angle difference at bottom, depth variability across reps, and horizontal hip shift. For a **2D side camera**, which of these are defensible? Which are weak proxies?

### Scoring

- **Are our scoring categories valid?**  
  We combine five component scores (0–100 each) with fixed weights into one total. Is that structure reasonable for coaching feedback, or does it create false precision? Would you weight depth/trunk/knees differently for general population vs. athletes?

### Movement faults

- **What movement faults should we prioritize?**  
  If you could only flag 2–3 issues in v1 (e.g. excessive forward lean, shallow depth, visible asymmetry, loss of balance), what would you pick for bodyweight squats filmed from the side?

### Claims and safety

- **What should we avoid claiming?**  
  We say “directional feedback” and “not medical advice.” What language would still be too strong? Any regulatory or professional-body sensitivities we should know about (even for a free browser demo)?

### Uncertainty

- **How should we communicate uncertainty?**  
  We already hide coaching when pose confidence is low and show warnings. Is that enough? Would you show scores at all when confidence is low? How do coaches talk about “noisy” movement capture?

### Usefulness

- **What would make this useful for athletes or coaches?**  
  Would they trust phone-based 2D analysis for anything beyond novelty? What output format (cues, video replay, trends, export) would matter most? What would make you **ignore** this product?

---

## 5. LinkedIn DM template

Use after a genuine connection or a warm intro when possible. Keep under ~300 words.

---

Hi [Name] — I’m [Your name], a student building **KinematicIQ**, a small browser app that analyzes bodyweight squats from a side camera view (on-device pose estimation, no upload).

I’m not selling anything. I’m trying to learn whether our **metrics and scoring** make any sense before we build further. You work in [biomechanics / coaching / sports tech] — would you be open to a **15-minute async look** (short screen recording + 6 questions)?

Happy to send a one-pager and a link to try the MVP on localhost or a short deployed demo.

Thanks for considering it,  
[Your name]  
[LinkedIn / email]

---

**Follow-up (if they reply yes):**

Thanks so much. Here’s a 2-min demo video: [link]. Questions are here: [link to this doc §4 or a Google Doc]. Brutally honest “this metric is useless” feedback is exactly what I need.

---

## 6. Email template

**Subject:** Quick expert input on squat movement metrics? (student project, 15 min)

---

Hi [Name],

My name is [Your name]. I’m working on **KinematicIQ** — a browser-based MVP that analyzes a set of bodyweight squats using client-side pose estimation (MediaPipe). The user films from the side; the app counts reps and scores depth, trunk control, knee symmetry, consistency, and hip shift, then shows simple coaching cues. Nothing is uploaded to a server.

I’m reaching out because I don’t want to ship scoring that **sounds scientific but misleads people**. Your background in [area] is exactly the kind of perspective we need.

**Would you be willing to spend ~15 minutes** on either:
- a short Loom walkthrough + written replies to six questions, or  
- a 20-minute video call?

I’ve attached / linked a one-page summary: `docs/expert_outreach.md` (questions in section 4). Technical scoring details: `docs/scoring_notes.md`.

There’s no commercial ask — we’re in learning mode and happy to credit your input in our methods notes if useful.

Thank you for your time,  
[Your name]  
[University / program, if relevant]  
[Email] | [Optional: demo link]

---

## 7. Short demo script (showing the app)

**Length:** ~3–5 minutes live, or ~2 minutes recorded.  
**Setup:** Good lighting, full body side view, phone or laptop webcam, `npm run dev` → http://localhost:5173/ (or deployed URL).

### Before you share screen (10 seconds)

> “This is KinematicIQ — browser only, no login, video stays on your device. It’s built for one thing: a single set of bodyweight squats from the side. I’ll show calibration, a few reps, and the results screen. I’m looking for your take on whether these metrics mean anything.”

### 1. Home → Camera (20 seconds)

- Open app, click **Camera** (or primary CTA).
- Point out: no install, runs in Chrome/Edge/Safari with camera permission.

### 2. Calibration & status card (45 seconds)

- Step into frame until status says **Step into frame** → **Hold still, calibrating** → **Start squatting when ready**.
- Mention: set starts on first descent automatically; user doesn’t press start.

### 3. Perform 3–5 squats (60–90 seconds)

- Do clear down-up reps, pause briefly at bottom, return to stand.
- Optional: point at **rep counter** overlay and skeleton.
- After last rep, **stand still** ~5 seconds for auto-finish countdown (or tap **Finish Now**).
- Say: “Finish Now is the backup if auto-finish doesn’t trigger.”

### 4. Results screen (90 seconds)

Walk top to bottom:

1. **Summary line** — rep count, rough depth, total score.  
2. **Movement score** ring + band.  
3. **Camera confidence** — explain it’s separate from movement quality; low confidence = rough read, coaching may be hidden.  
4. **Score breakdown** — depth, trunk, knees, consistency, symmetry: what was measured and why the score landed there.  
5. **Coaching cards** (if shown) — “What we saw / why it matters / try next.”  
6. **Rep-by-rep** table.

Close with:

> “Everything you saw is heuristic — 2D angles, not force plates or 3D lab gear. That’s what I need your help judging: what’s worth keeping, what’s misleading, and what we should never claim.”

### Optional: show low-confidence case (30 seconds)

- Re-run with poor lighting or partial body out of frame.
- Show warning copy and missing coaching.

### After demo — send them

- Link to this doc (questions in §4).  
- Link to `scoring_notes.md` if they want thresholds/weights.  
- Thank them and offer to implement one concrete change they suggest (shows you listen).

---

## Outreach strategy (internal)

| Step | Action |
|------|--------|
| 1 | **List 15–25 names** — mix: 1–2 academic biomechanics, 2–3 S&C coaches, 1–2 sports-tech founders/PMs, 1 physiotherapist (clearly not for medical validation). |
| 2 | **Warm paths first** — advisors, professors, alumni, Twitter/LinkedIn mutuals. |
| 3 | **Send DM or email** — use templates above; personalize first line only. |
| 4 | **Deliver async by default** — Loom + doc reduces friction; offer call only if they prefer. |
| 5 | **Track in a simple sheet** — name, role, sent date, replied, top 3 insights, follow-up. |
| 6 | **Synthesize in 1 page** — “Expert feedback summary” → feed into scoring calibration backlog (not marketing copy). |
| 7 | **Close the loop** — email contributors what you changed based on their input. |

**Target:** 5 substantive replies before changing scoring weights in code.  
**Avoid:** claiming “validated by experts” unless someone formally agrees to be cited.

---

*Document version: M15B — expert outreach prep. No application code changed.*
