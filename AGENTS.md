# KinematicIQ Codex Loader

Operate under the global Aurelian loader at `C:\Users\acetu\.aurelian\AURELIAN_GLOBAL_LOADER.md` and its standard kernel before substantial work.

## Canonical project truth

- Program roadmap: `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
- Immediate work: `docs/implementation/NEXT_EXECUTION_PACKAGE.md`
- Product doctrine: `docs/doctrine/claims-policy.md`, `movement-ontology.md`, and `deferred-scope.md`
- Architecture: `docs/07_architecture.md`
- Research: `docs/research/INDEX.md` and `docs/research/PUBLIC_MOVEMENT_DATASET_RESEARCH.md`
- Decisions: `docs/adr/`
- Evidence and project state: `.aurelian/`

Do not create duplicate project-bible, roadmap, doctrine, or research systems. Update the canonical files above and use `.aurelian/*` as a compatibility index.

## Project boundaries

- Browser-only and local-first; no backend, auth, cloud persistence, or telemetry.
- MediaPipe remains the pose engine until an evidence-gated benchmark justifies change.
- No diagnosis, injury prediction, kinetics claims, normative clinical claims, fake precision, or composite movement score.
- Invalid capture fully abstains; questionable capture does not coach.
- Restricted or large datasets stay outside git. Never bypass registration, click-through terms, credentials, consent restrictions, or access controls.
- Preserve local work. Never push, deploy, publish, or accept external licenses without explicit approval.

## Verification

From `web/`:

```bash
npm run build
npm test
npm run test:coverage       # analysis/CV/session/eval changes
npm run eval:tapes          # behavior/filter/model/gate changes when local tapes exist
npm run test:e2e:camera     # camera workflow changes
```

Review the complete diff and record skipped or unavailable checks. UI claims require browser evidence at desktop and mobile widths.
