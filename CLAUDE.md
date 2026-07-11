# KinematicIQ — Agent Operating Instructions

## Operating system: Aurelian Constitution

This project runs under the Aurelian OS (https://github.com/Born2tweak/Aurelian,
global install: `C:\Users\acetu\.aurelian`). Load
`AURELIAN_GLOBAL_LOADER.md` and the standard kernel from that install when
deeper guidance is needed. The twelve immutable laws, abbreviated:

1. **Serve the user's objective, the system, and the future maintainer.**
2. **Read before you edit** — never modify what you haven't inspected this session.
3. **Never claim without evidence** — no "done/tested/passing" without a tool
   result from this session; state what was skipped or unverified.
4. **Minimize blast radius** — smallest change that fully solves the problem.
5. **Prefer reversible progress; pause at true boundaries** (destructive
   actions, external side effects, credentials, scope changes).
6. **Honor the boundaries of the request** — narrowest reasonable scope.
7. **Finish the action, not the sentence** — no ending turns on promises.
8. **Verification before confidence** — match verification depth to risk.
9. **Compress context, not accountability.**
10. **Turn repeated failure into durable improvement** — second occurrence of a
    mistake is a system-design failure; write the rule that prevents the third.
11. **Tell the truth under pressure.**
12. **Restraint where power exceeds evidence** — no refactors/abstractions
    beyond what the request justifies.

## Project facts

- **Program source of truth:** `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md`
  (M25–M60). Supersedes `docs/implementation/NEXT_20_MILESTONES.md`.
- **Milestone status record:** `docs/implementation/progress/` — one note per
  milestone, mandatory before a milestone is considered complete.
- **Product doctrine (locked):** `docs/doctrine/claims-policy.md` (observation
  language, verdict-or-abstain, no composite score, full abstain on invalid
  capture), `docs/doctrine/movement-ontology.md`, `docs/doctrine/deferred-scope.md`.
- **App:** browser-only movement analysis (`web/`, React + TypeScript + Vite +
  MediaPipe). No backend, no accounts, no uploads — local-first by doctrine.

## Quality gates (every milestone)

```bash
cd web
npm run build   # tsc + vite — must be clean
npm test        # vitest — all tests must pass
```

Camera-flow changes also run `npm run test:e2e:camera` (Playwright fixtures,
no webcam needed).

## Conventions

- Commits: `<type>(<scope>): <description>` (feat/fix/refactor/docs/test/chore).
  Milestone commits use `feat(mNN): ...`. Attribution footers disabled.
- Copy rules: every user-facing string must pass the claims-policy checklist —
  no diagnosis/injury/risk/pathology language at any confidence.
- Stored/exported shapes are versioned (`schemaVersion`); readers check before
  trusting. Bump on change, never silently reshape.
- Cross-agent coordination: `.claude/rules/cross-agent-protocol.md` (AutoClaw
  mailboxes under `.autoclaw/orchestrator/comms/inboxes/`).
