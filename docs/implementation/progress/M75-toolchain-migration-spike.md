# M75 — Toolchain security migration spike

**Status:** Complete (2026-07-12).

Following explicit owner approval, the KinematicIQ working tree was upgraded to
Vite 8.1.4, Vitest/coverage 4.1.10, plugin-react 6.0.3, and vite-node 6.0.0.
The manifest and lockfile are the only migration files; rollback is to restore
`web/package.json` and `web/package-lock.json` from pre-M75 commit `8d8a77d`.

Current-session acceptance evidence:

- `npm audit`: zero vulnerabilities.
- production build: 713 modules in 808 ms.
- unit suite: 529/529 tests across 79 files.
- coverage: 86.29% statements, 81.62% branches, 92.03% functions, 87.52% lines.
- UI-PRMD pilot: 90 trials/class and 2,527,200 paired samples.
- replay evaluation: 11 tapes, zero errors, 9/9 exact labeled counts.
- Playwright: 10/10 camera and release-readiness tests.

The initial spike also proved that Vitest 4 no longer supplies the standalone
CLI used by evaluation scripts. Explicit `vite-node` 6 preserves those scripts.
