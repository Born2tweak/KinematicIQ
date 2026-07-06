# KinematicIQ

**Protocol-driven movement intelligence, in your browser**

KinematicIQ turns any camera into a movement-analysis layer: on-device pose
estimation, per-metric evidence with honest confidence, rule-based findings in
observation language, and a replayable audit trail — no hardware, no uploads,
no backend.

> Not a medical device. KinematicIQ reports observations for training and
> education; it never diagnoses, predicts injury, or emits a composite
> "movement quality" score. See `docs/doctrine/claims-policy.md`.

---

## How it's built

The platform is organized as a **protocol engine**: each movement (squat
today; hip hinge, jump, and sprint are defined-but-planned stubs) is a
`ProtocolDefinition` binding phases, required landmarks, metric definitions,
and finding rules to a runtime analysis profile.

| Layer | What it does |
|---|---|
| **Capture** (`cv/`) | MediaPipe pose estimation, landmark filtering, capture-readiness checks |
| **Analysis** (`analysis/`) | Pure math: angles, phase FSM, rep counting + validation gates, asymmetry |
| **Protocols** (`protocols/`) | Registry of movements: squat available; hipHinge/jump/sprint planned (analyze throws) |
| **Metrics** (`metrics/`) | Per-protocol `MetricResult[]` — value, confidence, provenance, validation tier |
| **Findings** (`findings/`) | Rules that turn metrics into observation-language findings + coaching cues |
| **Session** (`session/`) | Set quality gate (full abstain on untrustworthy recordings), result assembly |
| **Storage** (`storage/`) | Opt-in local history (IndexedDB) with delete-all; nothing leaves the device |
| **Eval** (`eval/`) | Pose tapes: deterministic replay, live/replay parity, tape regression tests |

---

## Repository layout

```
KinematicIQ/
├── web/                  # The entire application (Vite + React + TypeScript)
│   ├── src/
│   │   ├── core/         # Movement-agnostic schemas: Confidence, Provenance, Metric, Protocol, Finding
│   │   ├── cv/           # MediaPipe pose engine, filtering, capture readiness
│   │   ├── analysis/     # Pure biomechanics: angles, phases, reps, asymmetry, posture
│   │   ├── protocols/    # Protocol registry (squat + planned stubs)
│   │   ├── metrics/      # Metric definitions + MetricResult builders
│   │   ├── findings/     # Finding engine + per-protocol rules
│   │   ├── scoring/      # Per-component evidence (no composite total)
│   │   ├── feedback/     # Confidence-gated coaching cues
│   │   ├── session/      # Quality gate + SessionResult assembly
│   │   ├── storage/      # Local-only session history (IndexedDB)
│   │   ├── eval/         # Pose-tape record/replay harness
│   │   ├── screens/      # Landing, Camera, Upload, Results, History
│   │   └── components/   # UI building blocks (report cards, tabs, picker…)
│   └── vite.config.ts    # COOP/COEP headers (load-bearing for MediaPipe WASM)
├── docs/
│   ├── research/         # 11 immutable source specs (see docs/research/README.md)
│   ├── doctrine/         # Movement ontology, claims policy, deferred scope
│   └── implementation/   # Implementation plan + per-milestone progress notes
├── eval-tapes/           # Recorded pose tapes for regression (gitignored payloads)
└── src/, tests/          # Empty legacy scaffolds — do not use; code lives in web/
```

---

## Develop, build, test

```bash
cd web
npm install
npm run dev      # http://localhost:5173/
npm run build    # tsc + vite build
npm test         # vitest run (+ coverage thresholds)
```

---

## Local clone (your computer)

GitHub is the source of truth. Full guide: **[Local development](docs/14_local_development.md)**.

**Windows (PowerShell):**

```powershell
git clone https://github.com/Born2tweak/KinematicIQ.git $env:USERPROFILE\KinematicIQ
cd $env:USERPROFILE\KinematicIQ
.\scripts\setup-local-machine.ps1
cd web; npm run dev
```

**macOS / Linux:**

```bash
git clone https://github.com/Born2tweak/KinematicIQ.git && cd KinematicIQ
./scripts/setup-local-machine.sh
cd web && npm run dev
```

## Status

🟢 **Protocol platform v1** — squat analysis end-to-end (live + upload +
replay), core schemas, protocol/metric/finding engines, progressive-disclosure
report, local history, and planned-protocol stubs. See
`docs/implementation/progress/` for the milestone-by-milestone record and
`docs/doctrine/deferred-scope.md` for what is deliberately not built.

---

## License

TBD
