# KinematicIQ Expanded-10 Capacity-Aware Execution Forecast

**Registry:** `KINEMATICIQ_MILESTONE_REGISTRY.yaml` schema v4
**Planning basis:** four bounded workers, dedicated-branch commits/pushes, no production deployment authority
**Forecast status:** must be regenerated after live-repository reconciliation and after each material velocity change

## 1. Correction to the former seven-day promise

The former six-package target is withdrawn. Its unique dependency closure was 339 modeled worker-hours; six `EngineeringComplete` packages required 476 worker-hours. Those totals cannot be represented honestly as a normal seven-day engineering commitment for four workers.

Revision 4 treats seven days as a capacity-constrained forecast window, not a deadline that can waive dependencies. Scientific validation remains evidence-driven and has no invented calendar date.

## 2. Capacity model

The scheduler must load these values from execution policy rather than hard-code them:

| Input | Initial planning value | Rule |
|---|---:|---|
| Workers | 4 | One synthesis/review slot is reserved when multiple research or integration jobs are active |
| Productive hours per worker/day | 6 | Remaining time covers review, coordination, environment recovery, and checkpointing |
| Seven-day gross capacity | 168 worker-hours | `4 × 6 × 7` |
| Planning utilization | 80% | Do not schedule the final 20% before execution evidence exists |
| Seven-day committed capacity | 134 worker-hours | Rounded down; external waiting contributes zero worker capacity and still blocks dependent work |
| Maximum concurrent code mutations | 2 | Reduces shared-file conflicts and review debt |
| Maximum concurrent research jobs | 3 | Fourth slot is reserved for synthesis/replan when needed |

The scheduler recomputes earliest start, resource feasibility, and ready work after every pass, block, failure, or estimate change. It may increase the forecast only from measured throughput; it may never silently lower a gate.

## 3. Scheduling algorithm

1. Reconcile the live repository and mark evidence-backed satisfied nodes.
2. Estimate remaining effort from observed comparable work; retain the registry estimate only when no observation exists.
3. Build a resource-constrained DAG using dependency status, task type, worker skills, mutation limits, manual/external availability, and review overhead.
4. Prioritize blocking-kernel work, parity preservation, and the smallest complete vertical slice.
5. Fill unused capacity with independent protocol A/B research and resource acquisition.
6. Produce three forecast bands: committed, probable, and stretch.
7. Record variance and reforecast; do not call a stretch miss a scientific or engineering failure.

## 4. Initial seven-day forecast bands

These bands are provisional until KQ-001 replaces estimates with live-repository evidence.

### Committed — capacity reserved first

- Reconcile code, documents, historical evidence, current protocol availability, and branch authority.
- Validate the schema-v4 registry, outcome-aware graph, ready-queue reducer, and status compiler.
- Pass synthetic happy, failed-gate, human-blocked, external-blocked, and technical-failure fixtures.
- Preserve current squat and forward-lunge behavior through the shared-contract migration.
- Convert squat and forward lunge into the first genuinely executable milestone vertical slices.
- Open every known resource track with named accountability, next action, and escalation behavior.

### Probable — scheduled only after committed work remains within 134 hours

- Complete the minimum Phase B compatibility contracts required by the first two protocol slices.
- Lock A/B identity, evidence, claim, and observability status for hinge and push-up.
- Start one additional internal protocol package chosen by the ready queue and measured leverage.
- Implement the shared setup, progress, and abstention UI slice required by completed protocol work.

### Stretch — never reported as promised

- Additional movement A/B contracts in priority order: jump, gait, landing, sprint, rotation, pull.
- A second additional internal package if measured throughput and shared-contract reuse create capacity.
- Deferred hardening that becomes necessary because of an observed failure cluster.

No challenger pose model, hybrid service, or production release belongs in the initial window unless its registered trigger fires and displaces lower-priority stretch work.

## 5. Seven-day checkpoints

| Checkpoint | Required evidence |
|---|---|
| Start | Live frontier, observed test/build commands, satisfied-node import, resource availability, and branch write status |
| Daily | Completed evidence, actual hours, estimate-to-actual ratio, ready queue, blockers, conflicts, and forecast-band changes |
| Mid-wave | Registry/state fixtures pass; squat/lunge slice status; remaining committed capacity; explicit descoping of probable/stretch work if needed |
| End-wave | Clean-clone graph compile, current-commit evidence, exact completed IDs, unresolved owned blockers, observed velocity, and regenerated next forecast |

The executor does not ask the owner to approve routine checkpoint changes. It interrupts only for consent/privacy, credentials, real relationship commitments, fees, qualified/instrumented evidence, materially conflicting product choices, or a failed preregistered gate requiring a new product decision.

## 6. Scientific execution track

- **S1 — Preregistration ready:** dedicated evidence pack; task and core claims frozen; numeric thresholds and participant-level sample rule justified; supported cells frozen; reference and privacy access confirmed.
- **S2 — Development freeze:** code, model, configuration, datasets, exclusions, and checksums frozen using development participants only.
- **S3 — Locked validation:** untouched evidence executes once against accuracy, reliability, abstention, generalization, parity, performance, UX, accessibility, privacy, and claim gates.
- **S4 — Terminal disposition:** signed outcome becomes `ReleaseEligible`, `FailedGate`, `BlockedHuman`, or `BlockedExternal`. Merge, deployment, and public exposure remain separate.

Equal rigor means each claim uses a justified direct reference and preregistered decision rule. It does not require every protocol to use the most expensive instrument when qualified raters, contact timing, or another lower-tier reference directly measures the claim.

## 7. Rolling and final audits

- Each protocol receives an independent terminal-disposition audit as soon as its evidence allows.
- A rolling program dashboard compiles mixed protocol outcomes and never waits for all ten to pass.
- KQ-174 is the final Expanded-10 completeness audit; it records all ten dispositions but does not gate an independently eligible protocol's earlier release workflow.
- KQ-175 verifies continuous operation, ownership, and the next ready queue after closeout.

## 8. Forecast acceptance

The schedule is acceptable only when it:

1. fits the declared worker capacity and mutation limits;
2. distinguishes committed, probable, stretch, and external-wait work;
3. contains no production or scientific-release promise unsupported by resources;
4. derives from current dependency and outcome semantics;
5. reports observed variance and regenerates automatically;
6. keeps unrelated protocol work moving when one protocol is blocked or fails;
7. preserves every scientific, privacy, accessibility, and safety gate.
