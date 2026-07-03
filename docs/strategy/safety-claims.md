# Safety & Claims Language Rules

**Status:** Canonical. Applies to **all user-facing copy in every phase** — UI strings, feedback templates, landing/marketing copy, docs, demos. Extends `docs/08_ai_rules.md` §6.

---

## Allowed language

Observation-first, self-referenced, confidence-qualified:

- "appears" / "suggests" / "in this set" / "relative to your reps"
- "from this camera angle" / "based on visible landmarks"
- "movement observation" / "coaching cue"
- "confidence was low / medium / high"
- "deviation from your own baseline" / "differs from your other reps"
- Performance and efficiency framing: "movement efficiency," "where momentum is lost," "position held through the rep"

## Prohibited language and claims

Never, in any copy, at any confidence level:

| Prohibited | Why |
|---|---|
| Medical diagnosis; "diagnosis," "abnormal," "pathological," "dysfunctional," "damaged" | Not a medical device |
| Injury prediction or injury risk, in any phrasing | Overfit, high false-positive science; explicitly warned off by field expert |
| Tissue or joint health claims | Not observable from video |
| Force, load, torque, power, joint stress "measured" from video | Video cannot measure kinetics |
| Internal biomechanics claims | Same |
| "Readiness to play" / return-to-play judgments | Staff judgment, not software |
| Replacing a coach, PT, athletic trainer, or sport scientist | Product is a question-surfacer, not a decision-maker |
| Fear-based or alarmist language ("dangerous," "at risk") | Safety boundary |

## Structural requirements

1. **Confidence chip on every rendered concept** (High / Medium / Low). Low confidence suppresses strong claims — degrade to neutral observation or hide.
2. **Disclaimer** (`components/DisclaimerBanner.tsx`) stays on results **and** is present on the camera screen.
3. **Thoracic honesty:** MediaPipe cannot resolve upper- vs lower-thoracic spine. Any spine-stability output is marked low-confidence trunk-level drift, never segmental spine claims.
4. **Deviation framing is self-referenced only**: compare an athlete to their own reps/sets, never to a normative "healthy" population.

## Copy-review checklist (run against every changed string)

- [ ] No prohibited word/claim from the table above
- [ ] Observational verb present ("appears/suggests") for any qualitative judgment
- [ ] Scope qualifier present where relevant ("in this set," "from this angle")
- [ ] Confidence level attached or inherited from the rendering component
- [ ] Performance/efficiency framing (not injury/risk framing)
- [ ] No implication of medical authority or coach replacement
- [ ] Movement-specific copy comes from the movement's own profile, not generic squat text
