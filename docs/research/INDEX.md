# Research Corpus Index

**Stable ids R01–R11.** These are the immutable source specs for the
platform. This index is a **navigation layer only** — it points into the
sources and deliberately avoids restating their content, so it cannot drift
far from them. When detail matters, read the source doc; when a summary here
disagrees with a source, the source wins.

## Rules

1. **Do not edit source specs.** `docs/research/R01–R11` are frozen. If
   implementation must deviate (owner constraint, validation finding,
   platform limitation), log the conflict in the milestone progress note —
   never by amending the source.
2. **Source specs vs implementation docs.** Everything in `docs/research/`
   is *source authority* (what the platform should be). Everything in
   `docs/doctrine/`, `docs/implementation/`, and the top-level `docs/*.md`
   is *implementation state* (what the repo actually does and why). Doctrine
   distills research into enforceable rules; progress notes record what was
   built against it.
3. **Citation convention for progress notes:** cite as
   `R<id> §<section>` — e.g. `R03 §12` (single-RGB exclusions),
   `R05 SEM/MDC` (reliability math). Where older notes cite
   `docs/research/03 §12` or `MD #3`, those are the same documents; new
   notes should use `R`-ids.

## The eleven sources

| Id | Document | One-line scope |
|---|---|---|
| R01 | `01_Foundations_of_Human_Movement.md` | Movement ontology: primitives, phase hierarchy, agnostic-vs-specific split |
| R02 | `02_Mathematical_Algorithmic_Biomechanics_Spec.md` | Angle math, filtering, segmentation FSMs, confidence propagation |
| R03 | `03_Metric_Engine_Spec.md` | Metric ontology, `MetricResult`, single-RGB defensibility exclusions, no-composite philosophy |
| R04 | `04_Coaching_Intelligence_Engine_Spec.md` | Evidence-strength framework, metrics→meaning, findings and cues |
| R05 | `05_Validation_Reliability_and_Scientific_Benchmarking_Handbook.md` | Validation tiers, benchmark harness, SEM/MDC, dataset QA |
| R06 | `06_CV_Subsystem_Technical_Spec.md` | Landmark quality, camera geometry checks, model-swap benchmarking discipline |
| R07 | `07_Domain_Intelligence_Spec.md` | Domain profiles, functional assessment modules, guardrails |
| R08 | `08_Software_Architecture_and_Engineering_Specification.md` | Module contracts, protocol engine, versioning, artifact strategy, testing |
| R09 | `09_Competitive_Intelligence_and_Product_Strategy.md` | Positioning, feature-gap priorities, what not to clone |
| R10 | `10_Future_of_Movement_Intelligence_Roadmap.md` | Long-horizon bets and the explicit do-not-build-yet list |
| R11 | `11_Product_Experience_Bible.md` | Capture UX, progressive disclosure, finding cards, anti-patterns |

## Where each theme lives

**Thesis.** The camera describes observable movement with honest confidence;
it never infers physiology, and it abstains rather than guess. Primary: R03,
R04, R09. Distilled into `docs/doctrine/claims-policy.md` ("the unifying
rule") and the verdict-or-abstain product commitment.

**Engineering constructs.** Protocol engine, `MetricResult`/`Finding`/
`Confidence`/`Provenance` schemas, versioned artifacts, pose-tape replay:
R08 (contracts), R02 (math), R06 (CV subsystem). Implemented in `web/src/core/`,
`protocols/`, `eval/` — see `docs/07_architecture.md`.

**Product constructs.** Progressive disclosure (Summary/Evidence/Expert),
finding cards, coach-question organization, capture-readiness UX: R11, R04.
Implemented in `web/src/screens/` and `components/report/`.

**Safety constraints.** Forbidden conclusions (diagnosis, injury risk,
kinetics, normative comparison, composite scores), tier-gated language: R03
§12, R05 (tiers), R07 (guardrails), R10 (do-not-build). Enforced by
`docs/doctrine/claims-policy.md` and `docs/doctrine/deferred-scope.md`;
mechanically checked from M38 onward.

**Validation requirements.** Labeled ground truth, benchmark-gated changes,
reliability (SEM/MDC), provenance-scoped claims: R05 primarily, R06
(model-swap discipline). Live in `eval-tapes/` labeling workflow (M15–M16),
the replay harness, and the M44–M49 roadmap wave.

**Deferred concepts.** Embeddings, digital humans, sensor fusion, clinical
integrations, backends: R10. Tracked with gates in
`docs/doctrine/deferred-scope.md` — the ledger, not this index, is the
authoritative do-not-build list.

## Roadmap linkage

The master roadmap (`docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`)
cites its research basis per milestone. Standing anchors: R05 drives the
validation wave (M44–M49), R08 drives the architecture wave (M39–M43,
M46–M47), R11 drives the experience wave (M51–M54), R07 drives the domain
wave (M55, M57–M58).
