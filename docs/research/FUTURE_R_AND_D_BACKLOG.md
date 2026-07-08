# Future R&D Backlog Ledger (M59)

**Status:** Living ledger of long-horizon research bets, kept **separate from
the product roadmap** so speculative concepts do not leak into implementation.
Presence here is visibility, not scope. Each item has a readiness grade and a
"gate to reconsider"; nothing here is buildable in the current browser-only,
local-first product without meeting its gate.

Sources: `docs/research/10_Future_of_Movement_Intelligence_Roadmap.md`,
`docs/doctrine/deferred-scope.md`, `docs/research/INDEX.md`. Owner decision
points are called out per row — scope changes require an explicit owner call,
not an agent's initiative.

## Readiness legend

| Grade | Meaning |
|---|---|
| `proven` | Mature enough to ship with clear confidence + limitations (not necessarily in scope) |
| `emerging` | Real research signal; suitable for pilots / validation datasets only |
| `speculative` | Long-horizon; concept-stage, no near-term build |
| `rejected` | Permanently out of product claims (doctrine prohibition) |

## The ledger

| Bet | Readiness | Why it's not current scope | Gate to reconsider | Owner decision point |
|---|---|---|---|---|
| **Motion embeddings / movement foundation model** (MotionBERT-style compact encoder) | `emerging` | No data flywheel or eval infra yet; a moat, not a shippable feature | A labeled motion dataset + eval harness + a compact-encoder pilot beating current metrics on the tape suite | Owner approves a dedicated research track with data governance |
| **Self-supervised / contrastive pretraining** | `emerging` | Depends on dataset scale | Sufficient opt-in captured tapes + a pretext-task pilot | Same research track as embeddings |
| **GNN / transformer skeletal models** | `emerging` | Current metrics are geometric + explainable; NN adds opacity | Embedding track underway + explainability plan | Owner sign-off on model opacity vs. claims-policy explainability |
| **World models / next-rep prediction** | `speculative` | Prediction is high-stakes; overlaps injury-risk prohibition | Validated embeddings + a bounded, non-clinical prediction endpoint | Owner + validation partner |
| **Multimodal / sensor fusion** (IMU, force, pressure, EMG) | `emerging` | Breaks the browser-only, single-camera constraint | Sensor-fusion architecture milestone post-core-platform (deferred-scope) | Owner scope change: hardware + backend |
| **Physics-informed / markerless kinetics** (force, torque, OpenSim) | `emerging`→`rejected for claims` | Kinetics not defensible from single RGB (R03 §12); forbidden by claims-policy | Multi-modal capture + validation; **never** as single-RGB claims | Owner + regulatory/validation |
| **Digital humans / SMPL / AMASS / mesh recovery** | `emerging` | Beyond the existing `PoseScene3D` inspection view, unvalidated presentation | WebGPU maturity + a validated use case beyond inspection | Owner product decision post-validation |
| **Retrieval-augmented reporting / agentic report generation** | `speculative` | Report copy must stay claims-safe and evidence-bound | A retrieval corpus that cannot emit forbidden claims + audit coverage | Owner sign-off on generated-copy safety |
| **Foundation/large general model** | `speculative` | Start compact, not giant (R10 recommendation) | Only after compact-encoder value is proven | Owner |
| **Browser AI / WebGPU on-device inference** | `emerging` | Aligns with local-first privacy; infra, not a claim | WebGPU stability + model compression benchmarks | Engineering call (no doctrine conflict) |
| **Injury / recovery / readiness prediction** | `rejected` | High false-positive science; forbidden conclusion (deferred-scope, claims-policy) | Prospective validation for a specific population + endpoint — effectively out of product scope | Owner + clinical validation; **default: do not build** |
| **Composite "movement quality" score** | `rejected` | Permanent prohibition (ADR-003, ontology §6) | **Never** | — |

## Relationship to product doctrine

- Everything `emerging`/`speculative` here is **deferred** by
  `docs/doctrine/deferred-scope.md`; this ledger adds readiness + gates, it does
  not grant permission.
- Everything `rejected` is a permanent claims-policy prohibition, not a timing
  deferral.
- The strategic point of R10 stands: the durable moat is the **canonical
  substrate + versioned metrics + proprietary labeled dataset**, not renting
  the newest model. Research investment should compound the substrate, not
  chase features.

## Update rule

Move an item's readiness only with evidence (a pilot result, a validation
study, a maturity benchmark). Record the owner decision that authorized any
scope change. Link to `docs/doctrine/deferred-scope.md` and traceability.
