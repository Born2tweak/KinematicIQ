# KinematicIQ Phase 3 Execution Roadmap

**Range:** M99-M115
**Objective:** implement inline lunge as the first executable non-squat research protocol without making it available.
**Availability invariant:** `squat` is the only available protocol until every external gate passes and the owner explicitly authorizes activation.

## Governing decisions

- One protocol ID, `inlineLunge`, carries required `leadSide: left | right` analysis metadata. LLM-FMS m05/m06 remain namespaced source terms, not separate product protocols.
- The executable seam is `analyzeInlineLungeResearch`. Public `getProtocolProfile` and `getProtocolRuntime` continue to throw `NotImplementedError` because the registry status is `planned` and capture input modes are empty.
- Side-view single-RGB output is limited to complete trial count, event/phase timing, projected lead-knee angle as a research estimate, and within-set timing variation. No FMS score, correctness grade, clinical interpretation, kinetics, risk, or composite score.
- Thresholds are provisional engineering hypotheses. Synthetic tests establish determinism, not biomechanical validity.

## Milestones

| ID | Objective / dependency | Class and principal files | Acceptance evidence | Rollback, risks, external gate |
|---|---|---|---|---|
| M99 | Audit Phase 2 and establish Phase 3 plan. Depends M98. | Docs: this roadmap, Phase 3 handoff. | Canonical decisions, commands, gates, and rollback recorded. | Revert docs only. Risk: stale baseline. |
| M100 | Define executable protocol specification and lead-side contract. Depends M99. | Contract: `core/protocol.ts`, `protocols/inlineLunge/types.ts`, `index.ts`. | One planned protocol; required side; six ordered events; no public input modes. | Remove additive ID/module. Activation remains external. |
| M101 | Build calibrated side-view signal model. Depends M100. | Algorithm: `signals.ts`. | Median standing calibration; readable foot displacement, pelvis drop, projected knee angle; explicit calibration failure. | Remove signal extractor. Risk: view/scale sensitivity. |
| M102 | Add deterministic bilateral synthetic fixture factory. Depends M101. | Test infrastructure: `fixtures.ts`. | Left/right, multi-trial, and dropout sequences reproduce exactly. | Test-only removal. Synthetic evidence cannot validate people. |
| M103 | Implement phase FSM. Depends M101-M102. | Algorithm: `segmenter.ts`. | standing→step→descent→bottom→ascent→return ordering with persistence. | Remove FSM. Risk: provisional thresholds. |
| M104 | Implement trial completion/rejection. Depends M103. | Algorithm/contracts: `segmenter.ts`, `outcome.ts` adapter. | Complete only after stable foot return; dropout and stream-end reject; outcomes ordered/non-overlapping. | Remove adapter. Timed labeled data required. |
| M105 | Implement research analysis assembly and abstention. Depends M104. | Runtime: `inlineLunge/index.ts`. | Calibration→signals→trials→outcomes→metrics→findings; zero complete trials yields no findings. | Remove research entry point. Public runtime stays blocked. |
| M106 | Add protocol-owned metric catalog and emission. Depends M104. | Metrics: `metrics.ts`. | Count, timing, bottom angle, and 3+-trial CV carry experimental tier, provenance, confidence, null abstention. | Remove metric module. 2D/3D validation required for angle claims. |
| M107 | Add bounded observation-language findings. Depends M106. | Findings: `findings.ts`. | Evidence-linked completion/timing/variation only; maximum three; invalid/no-complete output abstains. | Remove findings. Expert review pending. |
| M108 | Extend traceability and threshold ledger. Depends M106-M107. | Governance/docs: `traceability.ts`, progress note. | Every active research metric/rule maps to signals, provisional threshold basis, failures, and validation gate. | Remove research traces. No claim strengthening. |
| M109 | Add offline replay/evaluation harness. Depends M105. | Eval script + JSON schema/fixtures. | Deterministic per-sequence count/event output and negative/rejection rows; no raw restricted media committed. | Remove harness. Original timed UI-PRMD access external. |
| M110 | Bind LLM-FMS ontology provenance without scores. Depends M100. | Dataset adapter/tests/registry. | m05/m06 side terms remain ontology-only; score fields excluded; checksum retained. | Remove bridge. Licensing/source checksum gate. |
| M111 | Prepare subject-held-out validation package. Depends M109-M110. | Validation docs/forms/statistics. | Frozen split, two-rater/adjudication, count/event/dropout/false-activation commands and blank evidence forms. | Docs-only rollback. Human raters required. |
| M112 | Add research-only selection/setup UI metadata. Depends M100. | Picker model/protocol definition/UI tests. | Inline lunge appears informational under Research roadmap and is not keyboard/pointer actionable. | Remove registration. Device/AT checks pending human. |
| M113 | Prove result/replay compatibility without activation. Depends M105-M107. | Contract tests. | Neutral outcomes and metric/finding types serialize; existing squat session schema unchanged. | Remove additive adapter/tests. No persistence migration. |
| M114 | Prove shared architecture with two distinct engines. Depends M105, M113. | Architecture tests/docs. | Squat parity remains; inline research analysis runs through staged contract; public runtime remains fail closed. | Revert additive modules. Risk: accidental coupling. |
| M115 | Full verification, activation audit, handoff. Depends M99-M114. | All touched code/docs. | Unit, build, coverage, browser support, tapes, dataset evals, audit run; external gates explicitly pending; no availability change. | Revert Phase 3 commit(s). Commit/push authorized; merge/deploy forbidden. |

## Verification commands

Run after accepted implementation changes from `web/`:

```powershell
npm test -- --run src/protocols/inlineLunge/inlineLunge.test.ts src/protocols/registry.test.ts src/protocols/runtime.test.ts
npm test
npm run test:coverage
npm run build
npm run test:e2e:support
npm run eval:tapes
npm run eval:llm-fms
npm audit --audit-level=high
```

M109-M111 may add a dedicated inline-lunge evaluation command; its exact invocation must be recorded in the handoff after implementation. Generated `web/coverage/` and `web/test-results/` are evidence outputs and must remain untracked.

## Activation gate

Activation is not part of M99-M115. It requires original timed seed files and checksums, frozen independent labels, subject-held-out gates from `INLINE_LUNGE_LABELING_PROTOCOL.md`, physical Windows 11 Chrome/Firefox and iPhone Safari accessibility execution, expert biomechanics/claims review, and explicit owner approval. Passing autonomous tests is insufficient.
