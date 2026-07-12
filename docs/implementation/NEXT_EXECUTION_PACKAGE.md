# Next Execution Package — M75-M78

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
