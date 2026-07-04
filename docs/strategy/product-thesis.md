# KinematicIQ Product Thesis

**Status:** Draft — pending owner ratification. Once ratified, this is the document every other strategy doc, and every feature, must trace to. One page. No code. No architecture.

---

## North star

> **KinematicIQ exists to reduce the distance between observed human movement and trustworthy coaching decisions.**

Everything else in this company — tracking, ontology, protocols, validation, reports, abstentions — is a mechanism for reducing that distance. A proposed feature that does not shorten it does not ship.

## What problem exists

Movement professionals — strength & conditioning coaches, physical therapists, performance scientists, researchers — watch athletes move every day and make decisions from what they see. The instruments available to them are either gold-standard and impractical (force plates, marker-based capture: expensive, slow, lab-bound, useless for a daily warm-up read) or practical and untrustworthy (consumer video apps that render pretty skeletons and emit uncited scores). A working sport scientist at an NBA franchise said it directly: *"We don't have software that provides the posture metrics we want."*

> **Current markerless tools generate measurements. They don't generate trustworthy movement understanding.**

The missing product is explainable, validated movement analysis that fits real-world capture workflows — a phone or webcam aimed at an existing warm-up, guided by protocol rather than burdened by it.

## Why current tools fail

They fail on the same axis from both directions: **the relationship between what they claim and what they can know.**

- Consumer movement apps overclaim — injury risk scores, "load" measured from pixels, universal 0–100 grades — and professionals, who have been burned by overfit injury-prediction models, discard them on contact.
- Research-grade systems underdeliver — accurate numbers with no interpretation, delivered as joint-angle dumps that answer no coaching question, at a cost in time and hardware that excludes daily use.
- Neither says how it knows what it knows. No confidence, no validation evidence, no defined capture protocol, no conditions under which it declines to answer.

Pretty skeletons are commoditized. Pose estimation is rented infrastructure everyone shares. **Interpretation with earned trust is the moat.**

## The unique claim

> **KinematicIQ is a movement reasoning engine, not a pose estimation engine.**

It reconstructs human movement into evidence, evidence into validated movement understanding, and movement understanding into coaching decisions — while explicitly communicating confidence and abstaining when the evidence is insufficient.

Concretely: from ordinary video, under a defined capture protocol, the system answers a small set of coach-derived questions (did the movement meet its standard; what strategy did the athlete select; was posture organized throughout; was load shared evenly) with **verdict-or-abstain** outputs. Every verdict carries its evidence, its confidence, the decision it informs, and the counterfactual that would have flipped it. Every deviation is measured against **the athlete's own movement signature**, never a normative population. Abstention is an answer, and it comes with the capture fix that would unlock the read.

## What decisions our software changes

If a conclusion changes no coaching decision, it does not ship. The decisions we target:

- **Programming:** keep or modify the current block based on how the athlete is actually solving the movement (strategy selection, completion against standard).
- **Attention:** which athlete, which side, which phase deserves the coach's eyes today (organization drift, load asymmetry, deviation from own baseline).
- **The next question:** what to ask the athlete, the PT, or the workload data. The software sharpens staff judgment; it never substitutes for it.
- **Capture:** when we abstain, exactly what to change so tomorrow's read succeeds.

## What we refuse to claim

Never, at any confidence level: injury prediction or risk; force, load, torque, power, or joint stress "measured" from video; medical diagnosis or tissue/joint health; fatigue, mobility limits, motor-control deficits, or any inferred physiology; readiness to play; comparison to a "healthy" norm; replacement of a coach, PT, or sport scientist. The camera describes observable movement. These refusals are not legal hedging — **they are the product.** Credibility with professionals is purchased with what we decline to say.

## What KinematicIQ is not

Negative boundaries, so future feature proposals can be tested against them ("does this move us toward the thesis, or toward something we said we're not?"):

- **Not a pose estimation library.** Perception is rented and replaceable; our value begins where the skeleton ends.
- **Not a biomechanics simulator.** We do not estimate forces, torques, or internal loads from video, ever.
- **Not a medical diagnostic tool.** No pathology, no tissue claims, no clinical judgments.
- **Not an injury prediction system.** The field's own experts call it overfit; we call it out of scope.
- **Not an AI coach that invents explanations.** Every statement traces to typed evidence; if the evidence chain can't carry a conclusion, the system cannot say it.
- **Not a movement score generator.** No composite scores, no leaderboards, no 0–100 anywhere a human can see.

## What makes us different from "pose estimation with nicer graphs"

1. **Question-first, not metric-first.** No metric exists because it is computable. Every output traces to a question a movement professional asks, through evidence, to a verdict, to a decision.
2. **Validated, not merely defensible.** Types guarantee the system cannot say what it cannot support; only labeled data, inter-rater agreement, and test-retest reliability show that what it says is true and repeatable. We publish our validation tier per conclusion, in the product. Defensible-by-construction and validated are different properties, and we hold ourselves to the second.
3. **Abstention as a feature.** A tool that answers everything from one webcam angle is lying about something. We scope every conclusion to its protocol and abstain — instructively — outside it.
4. **Self-referenced.** The unit of analysis is this athlete against this athlete. No population percentiles.
5. **Movement-generic by ontology.** New movements are profiles over one reasoning framework — the same questions, re-grounded — not forked analyzers.

## Who this is for

The **movement professional**: S&C coaches, physical therapists, performance scientists, and researchers who make daily decisions from observed movement. Our first customer archetype (an NBA sport scientist) is the benchmark we review against — not the boundary of the product.

---

*Traces: field signal in `magic-context.md`; refusals in `safety-claims.md`; the reasoning framework in `docs/24_movement_ontology.md` (label contract §7 including decision consequence and counterfactual); validation commitments in `validation-strategy.md`.*
