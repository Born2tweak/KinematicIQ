# Functional Assessment Safety Boundaries (M58)

**Status:** Canonical doctrine for any functional-assessment protocol
(sit-to-stand, TUG, chair-stand, reach/balance, gait screen, and future
functional modules from `docs/research/07_Domain_Intelligence_Spec.md` Part 4).
KinematicIQ observes functional **movement**; it is **not** a clinical or
diagnostic instrument. Any functional protocol must pass the checklist below
before it ships.

Sources: R07 (functional assessment modules), `05_...Validation Handbook`
(medical boundaries), `docs/doctrine/claims-policy.md`,
`docs/domain/DOMAIN_MODULE_BACKLOG.md` (M57).

## Allowed language (observation-grade)

Functional protocols may describe **what the camera saw**, scoped to the set,
in observation language:

- Movement **completion** ("completed 5 stands", "returned to seated").
- **Timing** ("about 12 s across five stands", segment times).
- **Consistency / variability** ("rep timing varied ~15%").
- **Symmetry / side-to-side difference** as an observation, within-athlete.
- **Range / depth / reach** as screening-grade estimates with confidence.
- **Trend vs. the athlete's own prior sessions** (local baseline, provisional
  noise thresholds — never population norms).

## Forbidden language (clinical claims) — never, at any confidence

- **Diagnosis** or pathology of any kind.
- **Fall risk** / fall-risk classification (TUG and 5xSTS alone do not classify
  fall risk — R07 geriatrics/World Falls Guidelines).
- **Frailty**, **impairment**, **dysfunction**, **decline** labels.
- **Return-to-play** / return-to-work clearance.
- **Clinical score** or normative grade (no composite, no 0–100, no population
  cutoff presented as a verdict).
- Injury risk / injury prediction (permanently rejected — deferred-scope).

These extend, and never relax, the global claims-policy forbidden list. The
M38 automated copy audit already flags `diagnos*`, `injury risk`, `return to
play`, etc.; functional copy must also avoid `fall risk`, `frailty`, and
`impairment` as affirmative claims.

## Validation gates for any normative comparison

A functional protocol may present a comparison **only** when:

1. The metric has a **reliability estimate** (SEM/MDC) for this task from
   KinematicIQ data or cited literature — otherwise thresholds stay marked
   "provisional / heuristic, not validated" (as squat does today).
2. Any **population reference** is population-, age-, sex-, and
   protocol-matched and is shown as *context*, never as a pass/fail verdict.
3. Capture quality passes the quality gate; invalid capture → **full abstain**.
4. Confidence gates the conclusion and can only weaken it, never strengthen it.

Absent these, the protocol shows within-athlete observations and trends only.

## Sit-to-stand linkage (first functional module, `next` in M57)

When sit-to-stand is implemented (M28 / backlog), its copy must:
- Report completion, timing, and consistency **only**.
- Carry **no** fall-risk, frailty, or clinical-score language.
- Reference this boundary doc in its protocol definition comment.
- Pass the M38 claims audit plus the extended forbidden terms above.

## Checklist every functional protocol must pass before shipping

- [ ] Copy uses only allowed observation language (completion/timing/consistency/symmetry/range/trend).
- [ ] No forbidden clinical term appears as an affirmative claim (audit green, incl. fall-risk/frailty/impairment).
- [ ] Every displayed threshold is either validated (with citation) or labeled provisional/heuristic.
- [ ] No population norm is presented as a verdict.
- [ ] Invalid capture fully abstains; questionable capture shows observations only.
- [ ] Confidence is attached to each claim and only weakens it.
- [ ] Protocol definition links to this doc; traceability updated in the same commit.
