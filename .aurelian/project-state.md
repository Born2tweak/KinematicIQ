# Project State

## Authoritative frontier

- Authoritative branch: `master`.
- Expanded-10 program integration branch: `agent/expanded-10-revision-4`.
- Revision 4 is the canonical candidate execution contract in `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`, backed by the machine-readable registries in `docs/program/`; it does not receive scheduler authority until KQ-001 through KQ-015 prove repository-bound validation and clean-clone behavior.
- Expanded-10 integration frontier: remote branch commit `0702e842d9e22e537bc06f65c8acaca7219cae5f`; KQ-001 status/evidence follows in the next evidence commit.
- Preserved pre-Expanded-10 implementation frontier: `f49558edec40ca6a972ec65bd6ff07898c161c4b`.
- Frontier reconciliation: remote `master` at `8d8a77d8ab0a6ab0c240f8327ef51e467dfd4cc2` had no unique commits and was fast-forwarded locally through the five pushed commits on `origin/agent/phase2-runtime-and-validation`; no history was discarded.
- Current documentation authority: the Phase 4 package and canonical repository files at `master` HEAD. The exact resulting commit is recorded in the Phase 4 handoff and Git history because a commit cannot contain its own hash.

## Protocol state

- Available: Squat only.
- Experimental and unavailable: Forward Lunge, scientifically named **Forward lunge with stride and return**.
- Canonical protocol ID approved for the additive P4-M01 migration: `forwardLungeStrideReturn`.
- Current Phase 3 runtime ID: deprecated historical `inlineLunge`; retained until P4-M01 for legacy-read compatibility.
- Dataset/task version: `forward-lunge-stride-return-v1`.
- Observation protocol ID: `side-view-forward-lunge-stride-return-v1`.
- Public, coaching, clinical, injury, kinetic, and normative use: not authorized.

## Verified implementation evidence (2026-07-21)

- Revision 4 control kernel: all 175 records pass the authoritative schema and cross-field semantic verifier.
- Controlled decisions: only KQ-042, KQ-054, and KQ-168 can produce `SkippedByDecision`; only four typed conditional edges consume those skips.
- Execution fixtures: all ten normative pass/fail/block/invalidation/isolation cases pass in the repository and a clean clone.
- Wave 1: KQ-001 through KQ-015 require 58 milestone hours plus 16 review/synthesis/replan hours, totaling 74 of 134 committed hours.
- Clean clone at `0702e84`: production build passed; 104 test files passed and 1 skipped; 626 tests passed and 4 skipped; synthetic Forward Lunge evaluation remained 3 sequences with exact-count rate 1 and zero count MAE, false activation, and dropout.
- PoseTape replay remains explicitly unavailable in a clean clone because private athlete tapes are gitignored. No replay or participant-evidence pass is claimed.

### Preserved Phase 4 baseline (2026-07-15)

- Phase 3 source: `web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, `metrics.ts`, and `findings.ts` at `f49558e`.
- Six ordered runtime states: standing, stepping, descending, bottom, ascending, returning.
- Fail-closed evidence: `web/src/protocols/inlineLunge/inlineLunge.test.ts`; status is `planned`, `capture.inputModes` is empty, profile is null, and public profile/runtime lookup throws `NotImplementedError`.
- Full unit run: 91 files discovered; 90 passed and 1 skipped; 576 tests passed and 4 skipped (580 total).
- Coverage: 86.15% statements, 79.63% branches, 92.10% functions, 87.58% lines. The prior 86.9% statement claim is not exactly reproducible with the current locked toolchain.
- Build: passed with 720 modules transformed and existing large-chunk warnings.
- Synthetic evaluator: 3 sequences; exact-count rate 1; count MAE 0; false activation 0; dropout 0.

## Scientific blockers

- No separately validated visible-plant or return-initiation event.
- Stable-standing evidence is incomplete.
- Bottom is currently pelvis-drop-based, not validated maximum lead-knee flexion.
- Confirmation frames may not equal first sustained event frames.
- Rejection, temporal-discontinuity, and reacquisition coverage are incomplete.
- No participant-derived labels, synchronized criterion validity, repeat-session reliability, or claims review exists.
- Synthetic success is engineering verification, not scientific validation.

## Active milestone and gates

- Completed Expanded-10 milestones: KQ-001 through KQ-015. Phase A and its clean-clone integration gate are complete; KQ-016 squat golden-corpus freeze is selected next, while KQ-017 forward-lunge corpus freeze remains independently ready.
- Phase A scheduler authority is active on the dedicated execution branch only; production deployment and direct merge to master remain unauthorized.
- Completed milestone: P4-M00 documentation and authority reconciliation. Its acceptance evidence is recorded in `docs/implementation/progress/P4-M00-phase4-documentation-reconciliation.md`.
- Completed milestone: P4-M01 additive naming migration with legacy-read compatibility.
- Completed milestone: P4-M02 auditable evidence schemas.
- Completed milestone: P4-M03 deterministic perturbation library; CV-owner sign-off remains a human gate.
- Completed milestone: P4-M04 temporal diagnostics baseline; owner classification remains a human gate.
- Completed engineering milestone: P4-M05 independent event-labeling tool; usability, accessibility, and blinding-owner reviews remain human gates.
- P4-M06 autonomous preflight/report tooling is implemented; collection remains blocked on signed human/privacy/data prerequisites.
- P4-M07 autonomous qualification tooling is implemented; human qualification remains blocked on approved M06 recordings and owner sign-off.
- P4-M08 autonomous experiment tooling is implemented; candidate selection remains blocked on qualified real development labels and owner review.
- P4-M09 autonomous freeze/gate/precision tooling is implemented; no real package is frozen and G-FREEZE remains blocked.
- P4-M10 autonomous locked-run preflight/report tooling is implemented; no confirmatory run occurred and G-LOCK remains blocked.
- P4-M11 autonomous synchronized-angle tooling is implemented; G-ANGLE remains blocked on approved reference data and signatures.
- P4-M12 autonomous reliability tooling is implemented; G-REL remains blocked on real repeat sessions and signatures.
- P4-M13 autonomous claims-review lint/packet is implemented; G-CLAIMS remains blocked and product copy is suppressed.
- P4-M14 fail-closed availability disposition is recorded in ADR-016: Forward Lunge remains unavailable and G-AVAIL is blocked.
- Phase 4 autonomous repository work is complete through M14. Work stops at P4-M06 external-input gates until signed approvals and real authorized evidence are supplied.
- Next manual gate: dataset-custodian/privacy review before any human collection; schema work itself is authorized.
- P4-M01 through P4-M05 engineering work is authorized by the user's 2026-07-16 instruction; human/research gates remain non-autonomous.

## Prohibited actions

No participant recruitment or recording; no dataset acquisition, terms acceptance, registration, or researcher contact; no production threshold or event-construct change; no lunge activation; no coaching/clinical/injury/kinetic/normative claims; no deployment or release.
