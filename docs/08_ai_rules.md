# KinematicIQ — AI Rules

> **Revised 2026-07-02.** This doc originally described the Layer 1 JavaScript MVP. The shipped app now uses **TypeScript, React Router, Vitest, and a `cv/` module layout** — those are the current standards, not violations. Video upload (`/upload`) is shipped. Movement expansion beyond squat (hip hinge, jump, sprint) is planned via the MovementProfile architecture in `docs/strategy/movement-expansion.md`. The safety/claims rules (Section 6) remain fully in force and are expanded in `docs/strategy/safety-claims.md`.

These rules govern all coding agent behavior when building KinematicIQ. Every agent session must follow these rules without exception. If a rule conflicts with a coding suggestion, the rule wins.

---

## 1. Non-Negotiable Build Rules

1. **Work on one milestone at a time.** Complete it, verify acceptance criteria, then move to the next.
2. **Do not skip milestones.** Each milestone builds on the previous one. Follow the build plan order.
3. **Do not add features not listed in the current milestone.** If something sounds useful but isn't in scope, leave it.
4. **Bodyweight squat is the reference movement.** New movements (hip hinge, jump, sprint) are added only as MovementProfiles per the roadmap — never as forked pipelines, and never ahead of their phase.
5. **The app is fully client-side.** No backend, no API, no server, no database, no network requests after page load.
6. **No data persistence beyond lightweight UI preferences.** No session/landmark/video data in localStorage, IndexedDB, or cookies. A small UI preference (e.g. Analyst mode toggle) may persist in localStorage; movement data lives in memory only.
7. **Use MediaPipe Pose as the pose engine.** Do not substitute another model without explicit approval.

---

## 2. Coding Agent Behavior Rules

1. **Read the milestone description and acceptance criteria before writing any code.**
2. **Read the architecture doc (`07_architecture.md`) before creating or modifying files.** Follow the folder structure and module boundaries exactly.
3. **Do not refactor code that works and is not part of the current milestone.**
4. **Do not rename files, folders, or functions from previous milestones unless the current milestone explicitly requires it.**
5. **Write clean, readable code.** Use meaningful variable names. Comment non-obvious logic.
6. **Each file should have a single responsibility.** Do not create god files or kitchen-sink modules.
7. **Do not create placeholder files.** Only create files when they are needed by the current milestone.
8. **Keep functions small and pure where possible.** Analysis, scoring, and feedback logic should be pure functions with no side effects.
9. **Use the naming conventions from the architecture doc.** camelCase for files/functions, PascalCase for components, UPPER_SNAKE_CASE for constants.

---

## 3. Scope Control Rules

### Do not add:
- Authentication (Clerk, Auth0, Firebase Auth, etc.)
- User accounts or profiles
- Payment processing
- Dashboards or admin panels
- Hardware or wearable integration
- Multi-camera support
- Session history or longitudinal tracking
- Movement types beyond the current roadmap phase (see `docs/strategy/execution-roadmap.md`)
- Custom ML model training or fine-tuning
- Backend server, API routes, or serverless functions
- Database (SQL, NoSQL, or any persistence layer)
- Analytics, telemetry, or tracking scripts
- CI/CD pipelines or deployment infrastructure beyond the existing Vercel setup
- Docker or containerization
- State management libraries (Redux, Zustand, Jotai, etc.)
- CSS frameworks (Tailwind, Bootstrap, etc.) unless explicitly approved
- Internationalization (i18n)
- PWA features or service workers

### Do not over-engineer:
- No abstraction layers beyond what the architecture doc specifies
- No plugin systems or provider patterns
- No event bus or pub/sub patterns
- No class hierarchies — prefer plain functions and objects
- No premature optimization
- No generic "framework" code that anticipates future features

---

## 4. File Modification Rules

1. **Only modify files listed in the current milestone's "files likely affected" section.** If you need to modify an unlisted file, explain why before making the change.
2. **Do not modify research docs** (`docs/09_*` through `docs/13_*`). They are reference material only.
3. **Do not modify control docs** (`docs/06_*` through `docs/09_*`) unless fixing a factual error.
4. **Do not modify the README** unless the current milestone explicitly includes it.
5. **Do not create files outside the `web/` directory** unless the milestone specifies otherwise.
6. **Do not delete files from previous milestones.** Milestone 15 (cleanup) is the only milestone that may consolidate or remove files.

---

## 5. Testing and Checkpoint Rules

1. **After each milestone, verify every acceptance criterion before proceeding.**
2. **Run the app in the browser and confirm the milestone's manual test passes.**
3. **If a milestone's acceptance criteria cannot be met, stop and report the issue.** Do not proceed to the next milestone with broken functionality.
4. **Automated tests exist and must stay green.** The Vitest suite (`npm --prefix web run test`) covers analysis, scoring, session, and CV modules. Extend it for new analysis logic; never mark a milestone complete with failing tests.
5. **If a previous milestone breaks while working on a new one, fix the regression before continuing.**

---

## 6. Safety and Claims Rules

1. **Never generate text that includes:** "diagnosis," "injury," "risk," "abnormal," "pathological," "dangerous," "dysfunctional," "broken," "damaged," or "predicts injury."
2. **Never generate text that claims to measure:** force, load, joint stress, torque, power, internal biomechanics, or tissue health.
3. **Never suggest** the app can replace a doctor, physical therapist, athletic trainer, or medical professional.
4. **Always include** a disclaimer on any screen that shows movement analysis results.
5. **Use observational language:** "appears," "suggests," "in this set," "relative to your reps."
6. **Attach confidence levels** (High / Medium / Low) to every movement observation.
7. **Suppress strong claims** when landmark confidence is below threshold.

---

## 7. Data and Privacy Rules

1. **No video frames leave the device.** All processing is in-browser.
2. **No landmark data is transmitted** to any server.
3. **No data is persisted** after the browser tab closes.
4. **No third-party analytics or tracking scripts** may be added.
5. **No cookies** may be set.
6. **The app must function entirely offline** after the initial page load (excluding MediaPipe model download).

---

## 8. Documentation Rules

1. **Add a brief JSDoc comment to every exported function** describing its purpose, inputs, and outputs.
2. **Do not remove existing comments** unless they are factually wrong.
3. **Update the milestone's acceptance criteria status** after completion (in a summary, not by editing the build plan).
4. **If you discover something that should be documented, note it** — do not create new doc files without approval.

---

## 9. Anti-Overengineering Rules

1. **Do not build for scale.** This is a single-user, single-session, single-movement MVP.
2. **Do not abstract prematurely.** If something is only used once, don't wrap it in a factory, provider, or higher-order function.
3. **Do not create config files for things that don't change.** Exception: `scoringConfig.js` exists because scoring thresholds are explicitly designed to be tunable.
4. **Do not add libraries or dependencies** beyond React, Vite, and MediaPipe unless the milestone explicitly requires one and explains why.
5. **Prefer inline styles or a single CSS file** over complex CSS architectures for Layer 1.
6. **Do not create an error boundary, logging system, or crash reporting** for Layer 1. Use console.error and simple UI error states.
7. **Do not create a design system, component library, or theme provider.** Use CSS variables in one file if needed.

---

## 10. Banned Behaviors

The following actions are explicitly prohibited:

| Banned action | Why |
|--------------|-----|
| Adding a backend server | Layer 1 is fully client-side |
| Training or importing custom ML models | Use MediaPipe pretrained only |
| Creating user accounts | No auth in Layer 1 |
| Adding payments or subscriptions | No monetization in Layer 1 |
| Creating a database schema | No persistence in Layer 1 |
| Building a dashboard | No dashboards in Layer 1 |
| Adding hardware integration | No sensors/wearables in Layer 1 |
| Claiming medical diagnosis | Safety boundary violation |
| Using fear-based language | Safety boundary violation |
| Skipping milestones | Build plan violation |
| Creating placeholder/stub files for future features | Anti-overengineering violation |
| Installing npm packages not needed by current milestone | Scope violation |
| Modifying research documents | Read-only reference material |
| Removing TypeScript types or reverting to JS | TypeScript is the current standard |
| Replacing React Router with ad-hoc routing | React Router is the current standard |
| Modifying files outside current milestone scope | File modification violation |

---

## Summary

Build exactly what the milestone says. Verify it works. Move to the next milestone. Stay honest about what the software can and cannot know. Keep it simple.
