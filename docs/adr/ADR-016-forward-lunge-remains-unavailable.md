# ADR-016: Forward Lunge remains unavailable after Phase 4 readiness work

**Status:** Recorded fail-closed disposition. This does not close G-AVAIL or authorize an alternative.

## Context

Phase 4 produced engineering contracts and reproducible tooling through P4-M14. It did not produce the consented field pilot, qualified raters, selected real-data candidate, signed freeze, independent locked results, approved synchronized reference, repeat-session evidence, independent claims approval, device/accessibility evidence, or domain-owner signatures required for availability.

## Decision

The protocol remains `planned`, has no capture input modes, has no profile/runtime mapping, exposes no product action, and remains unavailable. Squat remains the only available protocol. No gate is waived and no favorable synthetic fixture is treated as participant evidence.

| Gate family | Disposition |
|---|---|
| Identity, schemas, perturbations, diagnostics, label tooling | Engineering-ready; human/data gates remain applicable |
| G-PILOT / G-RATER / G-EXPERIMENT | `blocked` — no approved human development evidence |
| G-FREEZE / G-LOCK | `blocked` — no signed frozen package or locked run |
| G-ANGLE / G-REL | `blocked` — no approved reference or repeat sessions |
| G-CLAIMS | `blocked` — no independent signed review; proposed product copy suppressed |
| G-AVAIL | `blocked`; automatic decision is `remain unavailable` |

## Scope and residual risk

Supported scope is repository-local engineering evaluation with explicit synthetic/experimental labels. Product, coaching, clinical, injury, kinetic, normative, FMS, publication, training, data-reuse, and public-performance uses are not supported. Residual risks include unmeasured human capture feasibility, rater ambiguity, FPS/device sensitivity, event validity, projected-angle error, repeatability, accessibility, rights, and claims interpretation.

## Revalidation and rollback

This decision has no automatic expiry. It may be superseded only after every blocked hard gate has an immutable signed disposition and product/evidence, privacy/legal, validation, biomechanics/claims, accessibility, and engineering owners sign a new decision with an explicit review date. Any missing, expired, mismatched, failed, or inconclusive hard-gate artifact immediately retains or restores `remain unavailable`.

## Next authorized action

The next action is external evidence collection/review under the approved governance package, beginning with the signed P4-M06 prerequisites. Activation, integration, merge, deployment, release, or publication is not authorized.
