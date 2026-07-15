# Evidence Log

## 2026-07-15 — Phase 4 P4-M00 reconciliation

- Git: `master` at `8d8a77d` had no unique commits relative to pushed `f49558e`; fast-forward integration preserved five Phase 2/3 commits.
- Dependencies: `npm ci` added 224 packages; audit reported 0 vulnerabilities.
- Full unit suite: 90 files passed, 1 skipped; 576 tests passed, 4 skipped (580 total).
- Coverage: 86.15% statements, 79.63% branches, 92.10% functions, 87.58% lines. The older 86.9% statement claim was not reproduced exactly.
- Targeted registry/governance/protocol/serialization set: 6 files, 51 tests passed after correcting one rejected registry-enum draft.
- Build: passed, 720 modules transformed; existing large-chunk warnings remained.
- Synthetic Forward Lunge evaluation: 3 sequences, exact-count rate 1, count MAE 0, false activation 0, dropout 0.
- Documentation checks: 33 changed Markdown files parsed as strict UTF-8; no replacement/mojibake markers; all local Markdown links resolved; no private absolute paths/contact emails; no raw participant/media extensions.
- Boundaries: no dataset acquired, terms accepted, participant activity performed, threshold changed, availability changed, deployment, or release.

## 2026-07-10: Post-dataset-research baseline

- Claim supported: repository and requested verification baseline were inspected before roadmap edits.
- Evidence type: command, test, build, browser, inspection.
- Commands/sources: `git fetch/pull/status/rev-parse`, `npm install`, `npm run build`, `npm test`, `npm run test:coverage`, `npm run eval:tapes`, `npm run test:e2e:camera`, direct source/doc reads, and a desktop/mobile browser walkthrough using the clean-squat and missing-feet fixtures.
- Result: repository current with origin and 17 local commits ahead; build passed with chunk warnings; 472 tests passed; coverage 88.56% lines/statements; 11 tapes/0 execution errors/9 of 9 labeled exact; camera e2e 3 of 3 passed. Browser audit found mobile navigation/camera density, repeated Evidence content, and contradictory front/side camera instructions.
- Confidence: high.
- Limitations: no real webcam/device matrix, screen-reader session, color-contrast measurement, visual-regression baseline, saved eval comparison baseline, or external public dataset was downloaded/run.

## 2026-07-10: Aurelian compatibility decision

- Claim supported: a full template install would duplicate stronger KinematicIQ canonical documents.
- Evidence type: source and repository inspection.
- Source: current Aurelian `INSTALL_AURELIAN_IN_PROJECT.md`, template tree, KinematicIQ `CLAUDE.md`, `docs/`, `docs/adr/`, `docs/implementation/progress/`, and absence of root `AGENTS.md`/`.aurelian/` before this audit.
- Result: compatibility layer selected: concise root `AGENTS.md` plus `.aurelian` indexes; existing roadmap/doctrine/research/ADR docs remain canonical.
- Confidence: high.
- Limitations: no Cursor/Claude auxiliary rule directories were changed because untracked user-owned agent scaffolds already exist.
