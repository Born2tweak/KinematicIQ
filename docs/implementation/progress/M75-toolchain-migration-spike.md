# M75 — Toolchain security migration spike

**Status:** Compatibility spike complete; repository migration approval-blocked.

An isolated copy—not the KinematicIQ working tree—was upgraded to Vite 8.1.4,
Vitest/coverage 4.1.10, plugin-react 6.0.3, and vite-node 6.0.0. It produced a
clean audit, successful build, 529/529 tests, passing coverage thresholds,
UI-PRMD pilot output, and 11-tape/9-of-9 parity.

The first spike omitted standalone `vite-node`, proving that Vitest 4 no longer
supplies the CLI used by evaluation scripts. Adding explicit vite-node 6 restored
those scripts. The exact repository change is now small and understood, but the
roadmap marks a breaking dependency migration as an owner approval checkpoint.
No major package change was applied to the repository.
