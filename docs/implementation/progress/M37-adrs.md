# M37 — Architecture Decision Records Foundation

**Date:** 2026-07-06
**Status:** Complete
**Roadmap:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`

## What was built

`docs/adr/` (new) with one shared template (status / context / decision /
consequences / references) and four ADRs, each citing R-id sources and the
source files that enforce it:

- **ADR-001 — Browser-only, local-first.** No backend/accounts/uploads;
  opt-in IndexedDB persistence; client-side export artifacts. Enforced by
  `storage/sessionStore.ts`, the download-only export paths, and the absence
  of any network layer.
- **ADR-002 — Verdict-or-abstain.** Invalid recordings fully abstain across
  screen, history, and export (`movement: null` in M33 artifacts); the
  classification never mutates counted reps or tapes. Enforced by
  `session/setQualityGate.ts` + report/export tests.
- **ADR-003 — No composite score, ever.** Marked **permanent, not
  supersedable** — the README's supersede mechanism explicitly does not
  apply. Component evidence only; no aggregate anywhere, including
  "internal-only" composites.
- **ADR-004 — Pose tape as audit artifact.** Frames never rewritten;
  additive-only schema changes with version bumps; analysis changes
  validated by replay against the labeled suite (the M27/model-swap gate).

`docs/adr/README.md` carries the template, the id rules (sequential, never
reused), and the rule that ADRs record settled decisions rather than reopen
them (roadmap "do not do").

The traceability matrix (M36) now links the four ADRs in its "where
decisions were recorded" section.

## Verification

- Ids ADR-001…004 unique; every relative link in `docs/adr/README.md`
  resolves to a file created this milestone.
- All four ADRs cite research sources (R-ids) and enforcing source files
  (acceptance criteria).
- `npm run build` clean; `npm test` 353 passing (docs-only; gates per
  roadmap).
