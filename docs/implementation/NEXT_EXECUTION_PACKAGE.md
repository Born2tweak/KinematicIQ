# Next Execution Package — M75-M78

**Issued:** 2026-07-11

**Authority:** M73 portfolio and M74 release-readiness scorecard

**State:** planning/approval package; no deployment, dataset acquisition, or
breaking dependency migration is authorized by this document

## Current evidence

- M63-M72 completed with sit-to-stand correctly remaining planned.
- M73 selects inline lunge for the next research track, not implementation.
- M74 is not release-ready: production dependencies audit clean and local gates
  pass, but the dev toolchain has six advisories, manual assistive-technology and
  target-device checks are absent, and production headers are unverified.
- An isolated copy proved the proposed Vite/Vitest migration can build, run all
  529 tests, meet coverage, and reproduce dataset/tape evaluations. This lowers
  technical uncertainty but does not replace owner approval for the breaking slice.

## M75 — Approved dev-toolchain security migration

**Requires explicit owner approval before repository mutation.** Upgrade Vite
5→8, Vitest/coverage 2→4, `@vitejs/plugin-react` 4→6, and add the separately
versioned `vite-node` 6 CLI used by evaluation scripts. Preserve Node >=20,
COOP/COEP, coverage include/thresholds, and every existing script.

Acceptance: clean `npm audit`, production build, 529+ unit tests, coverage gates,
11-tape baseline, UI-PRMD baseline, camera/release Playwright suites, lockfile
diff review, and rollback by reverting only `package.json`/lockfile.

## M76 — Named browser/device and assistive-technology validation

**Requires owner support-matrix choice and human/device access.** Minimum
recommended initial target: current Chromium desktop plus one real iOS Safari or
Android Chrome device. Run camera permission/model load, upload, results,
keyboard/high zoom, rendered contrast, and NVDA or VoiceOver flow. Record exact
versions and limitations; do not claim unsupported targets.

## M77 — Target-device performance and bundle decision

Run only after M76 names targets. Capture model readiness, frame-loop p50/p95,
long tasks, memory/thermal behavior, route loads, and lazy 3D cost. Adopt worker,
chunking, or 3D changes only against predeclared budgets and replay/e2e parity.
The current local navigation sample is not a device budget.

## M78 — Inline-lunge data and label gate

**Requires separate dataset approval.** Acquire only approved original timed
UI-PRMD m03 and/or approved LLM-FMS metadata/media. Capture checksums and terms,
create independent event labels and subject splits, then predeclare benchmark
criteria. If any gate fails, keep inline lunge research-only; do not enable the
existing hip-hinge stub as a substitute.

## Approval boundaries

The next autonomous code change is M75 only after approval. M76 needs a support
choice and real assistive/device access. M78 needs data/license approval. M77 is
not meaningful before M76. No other feature milestone should bypass these gates.
