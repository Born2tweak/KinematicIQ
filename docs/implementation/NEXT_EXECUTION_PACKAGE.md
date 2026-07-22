# Next Execution Package — M75-M78

> **Expanded-10 Revision 4 authority (2026-07-21):** KQ-001 through KQ-009 are complete with repository-bound evidence. The dependency-ready Phase A frontier is KQ-010 through KQ-014, with capacity scheduling selecting KQ-014 (critical-path scheduler) as the next executable node; KQ-016 and KQ-017 are also ready as bounded Phase B corpus-freeze work. `docs/status/program_status.json` is now a deterministic concise frontier compiled from current milestone, resource, Wave 1, and locked-charter authorities. KQ-010 through KQ-015 remain the committed Phase A queue before scheduler authority is granted. Squat remains the only available protocol; Forward Lunge and every additional movement remain unavailable until their preregistered release gates produce `GATE_PASS`.

> The M75-M78 and Phase 4 material below is preserved as historical execution context. It no longer defines the immediate engineering queue, but its scientific and human gates remain binding inputs to the Expanded-10 program.

> **Phase 4 handoff (2026-07-16):** Autonomous repository work is complete through P4-M14. The next executable work requires the external inputs listed in `PHASE_4_HANDOFF.md`, beginning with signed P4-M06 privacy/legal/product/custodian/biomechanics prerequisites. Forward Lunge remains unavailable under ADR-016; no activation or release work is authorized.

> **Superseded as immediate authority (2026-07-15):** M75-M78 and Phase 3 are historical completed packages. The current package is P4-M00 documentation/authority reconciliation. After P4-M00 acceptance, the exact next milestone is P4-M01: additive migration from deprecated `inlineLunge` reads to canonical `forwardLungeStrideReturn`, with legacy artifacts preserved. P4-M02 and participant/dataset work are not authorized.

> **2026-07-16 update:** P4-M01 is complete. P4-M02 auditable evidence schemas is the active authorized milestone; participant collection and dataset acquisition remain prohibited.

## P4-M01 acceptance contract (pending)

1. Expand protocol identity types and registries to accept both IDs without changing availability or thresholds.
2. Write new artifacts with `forwardLungeStrideReturn`; read historical `inlineLunge` artifacts unchanged.
3. Migrate observation identity to `side-view-forward-lunge-stride-return-v1` additively.
4. Qualify source-native FMS `inline-lunge` dataset labels rather than renaming source truth.
5. Pass protocol, registry, runtime, pose-tape, evaluator, and serialization compatibility tests; Squat remains the only available protocol.
6. Do not begin P4-M02 or remove the alias in the same milestone.

**Issued:** 2026-07-11

**Authority:** M73 portfolio and M74 release-readiness scorecard

**State:** M75 complete; M76-M78 partially executed at their approved boundaries.
No deployment, further dataset acquisition, or protocol activation is authorized
by this document.

## Current evidence

- M63-M72 completed with sit-to-stand correctly remaining planned.
- M73 selects inline lunge for the next research track, not implementation.
- M74 remains not release-ready: manual assistive-technology and target-device
  checks are absent, and production headers are unverified.
- M75 is complete after owner approval. The Vite 8/Vitest 4 repository now has a
  zero-vulnerability audit and passes build, 529 tests, coverage, dataset/tape
  evaluations, and 10 camera/release Playwright tests.

## M75 — Approved dev-toolchain security migration

**Complete 2026-07-12.** Upgraded Vite 5→8, Vitest/coverage 2→4,
`@vitejs/plugin-react` 4→6, and added the separately versioned `vite-node` 6 CLI
used by evaluation scripts. Node >=20, COOP/COEP, coverage configuration, and
existing scripts were preserved.

Acceptance: clean `npm audit`, production build, 529+ unit tests, coverage gates,
11-tape baseline, UI-PRMD baseline, camera/release Playwright suites, lockfile
diff review, and rollback by reverting only `package.json`/lockfile.

## M76 — Named browser/device and assistive-technology validation

**Automated/code-level portion complete.** The selected matrix is Windows 11
Chrome + Firefox and iPhone Safari. Chromium, Firefox, desktop WebKit, and iPhone
WebKit emulation now run automated interaction and axe WCAG A/AA coverage.
Physical iPhone Safari and NVDA/VoiceOver rows remain pending human execution
under the exact script in `docs/validation/M76_SUPPORT_MATRIX_AND_MANUAL_VERIFICATION.md`.

## M77 — Target-device performance and bundle decision

Run only after M76 names targets. Capture model readiness, frame-loop p50/p95,
long tasks, memory/thermal behavior, route loads, and lazy 3D cost. Adopt worker,
chunking, or 3D changes only against predeclared budgets and replay/e2e parity.
The current local navigation sample is not a device budget.

## M78 — Inline-lunge data and label gate

**Acquisition/provenance portion partially complete after owner approval.** The
official CC BY 4.0 LLM-FMS release was acquired locally with verified hashes;
m05/m06 are its inline-lunge keyframes. Original timed UI-PRMD remains blocked by
the official site's HTTP 403. Independent event labels and subject splits remain
open under `docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md`. Keep inline lunge
research-only; do not enable the existing hip-hinge stub as a substitute.

## Approval boundaries

M75 is complete. M76 automated work is complete but still needs real
assistive/device execution. M78 acquisition approval is consumed; original timed
UI-PRMD access and independent human labels remain open. M77 may collect desktop
automation now, but its iPhone camera/performance decision needs physical-device
evidence. No other feature milestone should bypass these gates.
