# Evidence Log

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
