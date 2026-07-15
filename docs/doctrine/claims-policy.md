# Doctrine — Claims Policy

**Status:** Canonical doctrine. Consolidates `docs/strategy/safety-claims.md` (language rules), `docs/24_movement_ontology.md` §6 (reasoning-layer forbidden conclusions), MD #5 (`05_Validation...Handbook.md`, tiers + communication safety), and MD #7 (`07_Domain_Intelligence_Spec.md`, guardrails). This doc restates the standard for code reviewers; on any conflict of detail, `docs/strategy/safety-claims.md` governs copy and `docs/24_movement_ontology.md` §6 governs reasoning.

## The unifying rule

**The camera describes observable movement; it never infers underlying physiology.** Everything below follows from that plus three product commitments: verdict-or-abstain, self-reference only, and no composite score.

## Validation tiers gate language (MD #5)

Output language must match the evidence tier of the claim:

| Tier | Label | Permitted language |
|---|---|---|
| 0 | Experimental | "experimental estimate"; hidden from high-stakes recommendations |
| 1 | Production coaching | "movement estimate", "coaching cue", "screening insight" |
| 2 | Research grade | "validated for [task/population/setup]" |
| 3 | Clinical decision support | only within a cleared intended use (not in scope) |

KinematicIQ ships at **Tier 0–1** today. No copy may imply Tier 2/3 without the dataset and provenance to back it. `MetricResult.validationTier` (M3) and per-verdict tiers carry this in code.

## Allowed conclusions (all confidence-qualified, self-referenced, observation-verbed)

1. Completion descriptions — did reps meet the movement's stated standard, in this set.
2. Strategy descriptions — how this athlete organized this movement, in this set, from this capture.
3. Organization descriptions — whether posture held, drifted, or broke, and where in the movement.
4. Laterality observations — direction/magnitude of side-to-side differences, as kinematics only.
5. Within-set change — rep 1 vs rep N trends.
6. Repeatability statements — how consistent the pattern was across reps.
7. Capture-quality statements and abstentions — what the camera could/could not see, and the fix.

## Forbidden conclusions (any confidence, any phrasing, any layer)

Injury risk/prediction · diagnosis/pathology ("abnormal/dysfunctional/damaged") · tissue or joint-health states · kinetics (force/load/torque/power/joint stress from video) · muscle activation · anatomical cause attribution ("weak glutes") · fatigue *state* attribution (the kinematic trend is allowed; the physiological label is not) · mobility *capacity* claims (observed range is allowed) · motor-control deficits · compensation *causes* · neurological impairment · readiness/return-to-play · normative comparisons against a "healthy"/population standard (all deviation is self-referenced) · segmental spine claims (trunk-level drift only, sub-high confidence — thoracic honesty) · **cross-domain/cross-movement composites and any composite score within a pattern**.

## Structural requirements (enforced in code)

1. **Confidence chip on every rendered concept** (High/Medium/Low). Low confidence suppresses strong claims — degrade to neutral observation or hide (preserve commit `4df8ad4` gating).
2. **DisclaimerBanner** stays on results **and** camera screens (`components/DisclaimerBanner.tsx`).
3. **Full abstain on invalid capture** — `session/setQualityGate.ts` returns reasons/fixes/untrusted-reps and zero conclusions on an invalid set (commit `2408a58`). Every report-path milestone must preserve this.
4. **Thoracic honesty** — no upper/lower-thoracic resolution from MediaPipe; spine output is low-confidence trunk-level drift only.
5. **Self-referenced deviation only** — compare an athlete to their own reps/sets, never to a normative population.
6. **No composite 0–100 movement-quality score** — per-metric evidence + confidence only (codified in `session/types.ts`).

## Domain guardrails (MD #7)

Clinical/functional-assessment framing is explicitly out of scope in this build: **no diagnosis, no injury prediction, no return-to-play**. Domain profiles may add movement definitions and observation questions, never medical conclusions. Sport/clinical "norms" are deferred until per-(question, protocol) validation exists.

## Forward Lunge claim boundary

Forward Lunge is unavailable and unvalidated. Its Phase 3 outputs are internal
experimental observations only. No count, timing, projected angle, completion,
consistency, or event output may be used for coaching, clinical, injury,
kinetic, normative, or public-performance claims. Synthetic success is never a
substitute for participant validity.

## Copy-review checklist (run against every changed user-facing string)

- [ ] No forbidden word/claim above
- [ ] Observational verb ("appears/suggests") on any qualitative judgment
- [ ] Scope qualifier ("in this set", "from this angle") where relevant
- [ ] Confidence level attached or inherited from the rendering component
- [ ] Performance/efficiency framing, never injury/risk framing
- [ ] No implication of medical authority or coach replacement
- [ ] Movement-specific copy comes from the movement's own profile, not generic squat text
