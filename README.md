# KinematicIQ

**Athlete Movement Intelligence System**

KinematicIQ is a software-first platform for analyzing athlete movement quality — focused on **recovery**, **readiness**, **asymmetry detection**, and **biomechanics interpretation**.

> This is not a hardware product. KinematicIQ interprets movement data to surface actionable insights that coaches, trainers, and athletes can use to make better decisions.

---

## Vision

Most movement analysis tools are built around sensors and wearables. KinematicIQ flips that — starting with intelligent software that can ingest data from multiple sources and produce meaningful biomechanical assessments.

**Core domains:**

| Domain | What it answers |
|---|---|
| **Recovery** | Is the athlete physically ready to train again? |
| **Readiness** | How prepared is the athlete for high-intensity work today? |
| **Asymmetry** | Are there left/right or bilateral imbalances that signal injury risk? |
| **Biomechanics** | What does the movement pattern reveal about quality, efficiency, and risk? |

---

## Project Structure

```
KinematicIQ/
├── src/
│   ├── api/          # API layer — endpoints, request/response handling
│   ├── core/         # Core domain logic — recovery, readiness, asymmetry algorithms
│   ├── models/       # Data models and schemas
│   ├── services/     # Business logic and orchestration
│   └── utils/        # Shared helpers and utilities
├── docs/             # Documentation, architecture decisions, specs
├── tests/
│   ├── unit/         # Unit tests for isolated logic
│   └── integration/  # Integration tests for cross-module behavior
├── config/           # Environment configs, feature flags, constants
├── scripts/          # Dev scripts — setup, seeding, migrations
├── .gitignore
└── README.md
```

---

## Folder Guide

| Folder | Purpose |
|---|---|
| `src/api/` | HTTP endpoints and route definitions. The interface layer between clients and business logic. |
| `src/core/` | The heart of the system. Domain algorithms for scoring recovery, calculating readiness, detecting asymmetry, and interpreting biomechanics. |
| `src/models/` | Data structures, schemas, and type definitions that represent athletes, sessions, movements, and assessments. |
| `src/services/` | Service-layer orchestration. Coordinates between core logic, data access, and external integrations. |
| `src/utils/` | Shared utilities — math helpers, date formatting, data transformers, validation functions. |
| `docs/` | Architecture decision records (ADRs), design specs, API docs, and onboarding guides. |
| `tests/unit/` | Fast, isolated tests for individual functions and modules. |
| `tests/integration/` | Tests that verify multiple modules working together correctly. |
| `config/` | Environment-specific configuration, constants, and feature flags. |
| `scripts/` | Developer tooling — setup scripts, database seeding, CI helpers. |

---

## Local clone (your computer)

GitHub is the source of truth. Clone once, then keep your machine updated as the repo changes:

```bash
git clone https://github.com/Born2tweak/KinematicIQ.git
cd KinematicIQ
chmod +x scripts/sync-repo.sh
./scripts/sync-repo.sh          # pull latest now
./scripts/watch-and-pull.sh     # optional: auto-pull every 2 min
```

Full setup (auto-sync on macOS/Windows, Cursor settings): **[Local development guide](docs/14_local_development.md)**.

## Web app (Layer 1 MVP)

```bash
cd web && npm install && npm run dev
```

Open http://localhost:5173/

---

## Status

🟢 **Layer 1 in progress** — `web/` MVP (camera + MediaPipe overlay). See `docs/09_build_plan.md`.

---

## License

TBD
