# Report Design — What a Movement Professional Reads

**Status:** Draft — pending owner review. Benchmarked against Daniel Yu (first customer archetype); designed for the class **movement professional** (S&C coach, PT, performance scientist, researcher).

**Design rule:** this document is written *before* the reasoning engine that feeds it. Phases 2–3 build to satisfy this report; the report does not bend to what happens to be computable. Where the front-view protocol cannot support a section, the report abstains instructively — it never fills the space with a weaker number.

---

## 1. The three-second test

The first thing a professional sees must be **a verdict in coach language**, scoped and confidence-marked. Not a number, not a chart, not geometry. If the first three seconds show anything an S&C coach has explicitly rejected (a universal score, a valgus warning, a load claim), trust is spent before the honest parts render.

Acceptance criterion: cover everything below the first card. What remains must still be a defensible, decision-relevant statement about this athlete's set.

## 2. Report anatomy (top to bottom)

### 2.1 Header — the scope contract
- Movement + protocol, in plain words: *"Bodyweight squat · front view · 6 reps analyzed."*
- **Capture quality**, in words, never a percentage: *"Tracking held through all reps"* / *"Tracking degraded on reps 4–5 (left hip intermittently hidden) — affected reads are marked."* The old "camera confidence 82%" implied calibration that doesn't exist (ontology §3.12); words describe what actually happened.
- Scope line, always present: *"Everything below describes this set, from this camera angle, compared to this athlete's own reps."*

### 2.2 Verdict cards — one per question, the spine of the report
One card per universal question (ontology §4), each **verdict-or-abstain**:

| Question (coach phrasing on card) | Vocabulary |
|---|---|
| "Did the reps meet the standard?" (`movement-completion`) | completed / partial / not-completed |
| "How did they organize the movement?" (`strategy-selection`) | hip-dominant / knee-dominant / balanced |
| "Did posture stay organized?" (`posture-organization`) | stable / progressive-collapse / abrupt-break (@ progress %) |
| "Was load shared evenly?" (`load-symmetry`) | centered / shift-left / shift-right |

**Card anatomy** (every field maps to a §7 label-contract field):
1. **Question** in coach language.
2. **Verdict + confidence chip** (High/Medium/Low). Low confidence → the card abstains rather than hedging a verdict.
3. **Evidence** — two or three items, each a concrete observation with its rep/phase address: *"Trunk angle increased steadily after ~60% of descent on 5 of 6 reps."* No orphan geometry: evidence appears only in service of its verdict.
4. **Decision consequence** — one line: what this verdict means for programming/attention: *"Consistent with a hip-led strategy; if knee loading was the session goal, cue accordingly — otherwise no change."*
5. **Counterfactual** (collapsed by default; always present in analyst mode): *"This would read knee-dominant if the hinge ratio had stayed below X through the first half of descent."*

**Abstention card anatomy** — an abstention is a first-class product surface, not an error state:
1. The question, unchanged.
2. *"Can't answer from this capture"* + the enumerated reason (`AbstainReasonId`).
3. **The capture fix**: *"Film from the side (camera at hip height, 3–4 m) and this read unlocks next session."* Every abstention must name the cheapest change that would produce an answer.

### 2.3 Within-set deviation strip
Self-referenced only: *"Rep 5 differed from your other reps — deeper bottom, longer pause."* No population norms, no "abnormal." This is the seed of the deviation-from-own-signature product; in v1 it is within-set only.

### 2.4 Show me on the video
Every verdict is grounded in footage the professional can audit with their own eyes: tapping evidence jumps to the frame (bottom of rep 4, hip-offset peak) with the relevant landmarks overlaid. `frameTrace` already carries phase, per-frame offsets, and timestamps — this section consumes it. A coach can't audit a CV pipeline; they can audit a picture of rep 4. This is the cheapest trust win in the product and it is **required**, not decorative.

### 2.5 Analyst mode (toggle)
- Per-frame traces (trunk-angle-vs-progress, hip offset), raw angles, rep table.
- Thresholds with provenance: every constant names its source or is marked *provisional — pending labeled data*.
- **The validation tier table, in-product** (from `validation-strategy.md`): each conclusion labeled observation-only / expert-reviewed / instrument-compared / provisional. Showing this table is the trust story.
- Counterfactuals expanded on every card.

### 2.6 Footer — refusals and disclaimer
The standing disclaimer plus one line of identity: *"This report describes observable movement. It does not measure force or load, predict injury, or diagnose anything — no video tool can."* The refusal is a feature; say it where the reader ends.

## 3. Front-view v1 honesty table

What this protocol can actually answer — the report is designed so its default state under front-view capture is still worth reading:

| Question | Front-view v1 status |
|---|---|
| movement-completion | **Answerable.** Rep gates + working-depth standard are front-view observable. |
| load-symmetry | **Answerable**, with one dependency: naming left/right requires facing detection (research agenda M20). Until it lands, the card says "one side" with the video frame showing which. |
| strategy-selection | **Medium-confidence.** Primary evidence is the 3D hinge ratio (tier-b per validation-strategy); confidence capped, counterfactual always shown. |
| posture-organization | **Frequently abstains.** Trunk behavior is weakly observable from the front; the abstention card names the side-view fix. This is by design — the abstention that teaches capture beats a fabricated trunk read. |

Two answers, one capped answer, one instructive abstention is the honest v1 baseline. The protocol setup flow should tell the athlete this *before* recording, so the report never surprises.

## 4. What is not in this report
- No composite score, band, grade, or any 0–100 anywhere, analyst mode included.
- No population comparison, percentile, or "normal range."
- No kinetics (force/load/stress/torque/power), injury language, or inferred physiology.
- No orphan metrics: a number with no verdict to serve does not render.
- No raw-geometry lead: angles appear as evidence under verdicts, never as headline content. "Percent of frame width" never reaches coach-facing copy.

## 5. The Daniel walkthrough (acceptance test)

Run before every report release, against a real session:
1. **First three seconds** — does he meet a coach-language verdict, or a number?
2. **"Why?"** — is evidence one tap away, phrased as observations he can check?
3. **"How do you know?"** — does every threshold show provenance or admit *provisional*?
4. **"Confidence in what?"** — is capture quality in words describing what happened, not a pseudo-calibrated %?
5. **"Show me."** — can he jump from any claim to the frame that supports it?
6. **"Would it say the same tomorrow?"** — is test-retest status (from Scientific Validation) honestly stated for each verdict?
7. **Does anything anywhere claim what a camera cannot see?** — automatic fail if yes.

## 6. Open decisions (owner)
1. Card order: fixed (completion → strategy → posture → symmetry) or most-confident-first?
2. Does the within-set deviation strip ship in v1, or wait for test-retest data so deviation flags exceed known instrument noise?
3. Print/PDF export layout — the analyst brief was a stated M19 requirement; same structure, or condensed?

---

*Traces: questions and vocabularies from `docs/24_movement_ontology.md` §4; label-contract fields §7; refusals from `safety-claims.md`; tiers from `validation-strategy.md`; audience from `product-thesis.md`.*
