# Orlando Magic Context — Daniel Yu Meeting Notes

**Meeting:** 2026-07-02, Daniel Yu, Sport Scientist, Orlando Magic.
**Rule for this doc:** four strictly separated sections — public facts, verbatim/paraphrased meeting notes, inferred needs, and assumptions to confirm. **Never fabricate internal Magic data.** Everything below the "meeting notes" section that is not verbatim is labeled as inference or assumption.

---

## 1. Public facts

- The Orlando Magic are an NBA franchise; NBA teams employ performance/sport-science staff who monitor athlete movement and workload.
- Force plates and marker-based motion capture are established gold standards in sports biomechanics; markerless video systems are an active industry trend.

## 2. Meeting notes (verbatim or near-verbatim signal)

- *"We're never going to do anything with markers. It's always going to be markerless."*
- *"We don't care about knee valgus. We care about **posture**."* Posture, as he enumerated it: **tall chest; arm clearance; bending at knees vs hips (hinge vs squat); stable/neutral spine throughout the movement; trunk angle throughout; upper-thoracic vs lower.**
- *"It's hard to say a single movement causes injury… it's more about **deviation from that athlete's normal movement signature**."*
- On injury prediction: *"everyone overfits… high false-positive rate"* — do not market injury prediction.
- *"There's more data showing bad movement leads to **worse performance** than injuries… movement efficiency, where are you losing momentum."*
- *"Every movement you look at different things… it's hard to say we'll give values for everything."*
- *"**We don't have software that provides the posture metrics we want.**"*
- Context matters: workload, sleep, warm-up. Their daily movement read is taken off a **set warm-up**, not extra test jumps.
- Software should **surface the right questions**, not replace staff judgment.
- Arm clearance example was given in a running/gait context ("arm clear your body while running").
- Gold-standard reference he invoked for validation-grade measurement: **force plates**.

## 3. Inferred needs (our interpretation — not his words)

- A daily, zero-friction posture read layered on an existing warm-up routine (no extra protocol time).
- Per-athlete baselines so "deviation from own normal" is computable — longitudinal eventually; within-set now.
- Movement-specific metric priorities (a squat read and a sprint read should not share one score).
- Confidence-honest output; performance staff distrust tools that overclaim (his overfitting comment implies burned experience).
- Coach-language output ("tall chest") rather than joint-angle dumps — with raw detail available to analysts on demand.

## 4. Assumptions to confirm (open follow-up questions)

1. Which movements are in their set warm-up, in what order? (Determines which MovementProfiles matter first.)
2. What does "arm clearance" look like operationally — is it a sprint-only read or also relevant in change-of-direction work?
3. Would they want within-set deviation flags now, before longitudinal baselines exist?
4. What surface do they want this in — a screen a coach glances at courtside, or an analyst report?
5. Upper- vs lower-thoracic distinction: is a low-confidence "trunk drift" flag useful, or noise, given markerless can't resolve thoracic segments?
6. Any hardware constraints (device, camera position in their facility)?
7. Is there appetite for a validation pass against their force plates (see `validation-strategy.md`)?

## Product implications (summary)

Camera-only is correct. Posture concepts are the product. Deviations > absolutes. Performance framing, never injury prediction. Movement-specific priorities. Honest confidence. The opening: nobody sells them the posture metrics they want.
