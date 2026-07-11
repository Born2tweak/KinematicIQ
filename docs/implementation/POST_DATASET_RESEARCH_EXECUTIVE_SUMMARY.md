# Post-Dataset-Research Executive Summary

**Date:** 2026-07-10

**Audited baseline:** `master` at `d0532036216f78c2194723b55a10159880909993`

## Decision

KinematicIQ should not add another movement protocol or change tracking defaults
next. The highest-leverage next investment is a governed evidence layer: dataset
metadata and access controls (M61), neutral benchmark contracts and skeleton
mappings (M62), then narrow pilot adapters and failure diagnosis (M63-M64).
Camera and results simplification can proceed in parallel after those contracts
stabilize. Tracking changes remain conditional on benchmark evidence.

## What is working

- The app builds and the full unit/integration suite passes.
- Squat works end to end across live camera, upload, replay, results, export, and
  opt-in local history.
- Verdict-or-abstain, claims policy, capture readiness, pose-tape replay, metric
  confidence, and functional-assessment boundaries provide a strong safety base.
- The 2026-07-10 tape run completed without replay errors and matched all nine
  labeled rep counts.

## Material gaps

- Live camera and upload still bypass the intended protocol runtime and call
  squat-specific phase, rep, and result builders directly. The platform is not
  protocol-complete despite having protocol definitions and stubs.
- Dataset use lacks a registry, license/access boundary, neutral sequence schema,
  skeleton mappings, adapter provenance, and immutable benchmark baseline.
- Tracking quality mostly measures per-frame visibility/jumps; dropout duration,
  recovery, bone-length consistency, view sensitivity, and filter lag are not
  first-class benchmark outputs.
- Camera guidance conflicts between front-view readiness and side-view copy.
  Mobile setup is dense, and results repeat the same evidence across a document
  exceeding 6,500 CSS pixels in the audited mobile rendering.
- Public-facing “movement lab” and physical-therapy framing outruns current
  validation. Stronger claims must wait for evidence, not additional copy.
- Dependency audit reported nine known package vulnerabilities, including two
  critical; remediation requires an isolated, regression-tested maintenance change.

## Product direction

1. **Evidence first:** M61-M64 create reproducible, license-aware benchmarks and
   distinguish tracking failures from segmentation, metric, and UX failures.
2. **Conditional CV change:** M65 runs only if M64 identifies a concrete failure;
   test one variable at a time and keep current defaults if evidence is neutral.
3. **Simplify the user journey:** M66-M69 separate camera orchestration, resolve
   view guidance, improve mobile hierarchy, compress results, and add only visuals
   that expose evidence and uncertainty.
4. **Complete the protocol boundary:** M70 removes live/upload squat bypasses.
5. **First expansion:** M71 researches sit-to-stand as either a cyclic or
   transition-trial protocol; M72 implements only after evidence and claims gates.
6. **Release discipline:** M74 adds accessibility, performance, dependency, and
   end-to-end release gates.

## Immediate authorized package

Execute M61 and M62 only. They require no dataset download and should leave all
current product behavior unchanged. Any license acceptance, account creation,
large download, default algorithm change, new protocol, or strengthened claim
requires a later explicit decision.

## Source documents

- `reports/audits/KINEMATICIQ_POST_DATASET_RESEARCH_AUDIT.md`
- `docs/research/PUBLIC_MOVEMENT_DATASET_RESEARCH.md`
- `docs/implementation/PUBLIC_DATASET_RESEARCH_TO_EXECUTION_MAP.md`
- `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
- `docs/implementation/NEXT_EXECUTION_PACKAGE.md`
- `docs/implementation/KINEMATICIQ_RISK_REGISTER.md`
- `docs/implementation/POST_DATASET_RESEARCH_GAPS.md`
- `docs/adr/ADR-006-dataset-benchmark-governance.md` through `ADR-010-public-vs-proprietary-data.md`
