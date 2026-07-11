# M74 — Accessibility, performance, dependency, and release readiness

**Status:** Audit complete; release decision is **not ready** (2026-07-11).

The canonical evidence is `reports/audits/M74_RELEASE_READINESS_SCORECARD.md`.
M74 added automated 320 px reflow, keyboard-focus, reduced-motion, and landing
claims checks; corrected observed overclaims; measured production bundle and
local navigation timing; removed safe transitive advisories; triaged remaining
toolchain advisories; verified local COOP/COEP; and created the proprietary-corpus
governance prerequisite.

Release readiness remains blocked on a breaking toolchain decision, real
assistive-technology/device testing, target-browser ownership, and an authorized
production URL. No `npm audit fix --force`, deployment, or data collection ran.
