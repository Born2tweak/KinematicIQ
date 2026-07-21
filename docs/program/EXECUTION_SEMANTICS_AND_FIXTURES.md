# KinematicIQ Revision 4 — Execution Semantics and Required Fixtures

**Authority:** companion contract for `KINEMATICIQ_MILESTONE_REGISTRY.yaml` schema v4
**Status:** integration specification; fixtures must pass in a clean clone before the registry is declared canonical

## 1. Three independent state dimensions

The scheduler must never treat scientific failure as executor failure.

| Dimension | Examples | Meaning |
|---|---|---|
| Milestone status | `Pending`, `Ready`, `Running`, `Passed`, `BlockedExternal`, `FailedTechnical` | Whether the executor completed the bounded work correctly |
| Result code | `ACCEPTED`, `GATE_PASS`, `GATE_FAIL_RECORDED`, `BLOCKED_EXTERNAL_WITH_OWNER` | What the completed work found |
| Protocol lifecycle | `Researched`, `ProtocolLocked`, `EngineeringComplete`, `Validated`, `FailedGate`, `ReleaseEligible` | The derived scientific/product state of one protocol version |

A locked study that runs correctly and misses a preregistered threshold has milestone status `Passed`, result code `GATE_FAIL_RECORDED`, and protocol lifecycle `FailedGate`. It is not `FailedTechnical`. A study that cannot start because instrument access is missing remains `BlockedExternal`; its release-decision node may consume that explicit blocker and record a terminal blocked disposition, but it cannot emit `ReleaseEligible`.

## 2. Dependency semantics

- Dependencies are authoritative. `unlocks` is a generated reverse index and must match exactly.
- Normal edges accept `Passed` or an explicitly authorized `SkippedByDecision`.
- A release-disposition node may additionally accept `BlockedHuman` or `BlockedExternal` from its locked-study predecessor solely to record the blocker.
- `FailedTechnical` never unlocks downstream scientific or release work. It opens diagnosis/retry/replan.
- Program dashboards and closeout consume per-protocol disposition records, not an assumption that every protocol passed.
- `ReleaseEligible` requires the upstream result code `GATE_PASS`; no blocked, failed, skipped, absent, or stale result is equivalent.

## 3. Protocol-state reducer

Protocol lifecycle is derived, not copied from the latest milestone label. The reducer consumes immutable milestone evidence and resource state in this precedence order:

1. `Invalidated` or `Retired` explicit decisions.
2. `ReleaseEligible` only from a signed release-decision record whose locked-study input is `GATE_PASS`.
3. `FailedGate` from a signed failed-gate disposition.
4. `BlockedHuman` or `BlockedExternal` from a current owned blocker disposition.
5. `Validated`, `FrozenCandidate`, `EngineeringComplete`, `ImplementedInternal`, `DataReady`, `ProtocolLocked`, or `Researched` from the highest passed evidence-bearing stage.
6. `Candidate` otherwise.

`DataReady` is an orthogonal readiness flag until both data and engineering are ready. The displayed lifecycle may advance to `ValidationReady` only when `EngineeringComplete && DataReady && preregistration_locked` are all true.

## 4. Required clean-clone fixtures

| Fixture | Setup | Required result |
|---|---|---|
| Happy path | All dependencies pass; locked study emits `GATE_PASS` | Release decision emits `RELEASE_ELIGIBLE`; protocol becomes `ReleaseEligible` only |
| Scientific failure | Locked study executes and misses a frozen threshold | Study milestone is `Passed`; result is `GATE_FAIL_RECORDED`; disposition records `FailedGate`; other protocols continue |
| External blocker | Required instrument is unavailable with named owner and next action | Affected study is `BlockedExternal`; disposition records `BlockedExternal`; no release; unrelated ready queue continues |
| Human blocker | Consent or qualified signature is missing | Affected node is `BlockedHuman`; no capture or release; unrelated engineering continues |
| Technical failure | Command or predicate fails | Milestone is `FailedTechnical`; descendants do not unlock; retry/replan runs within budget |
| Negative model decision | Challenger trigger is not met | Challenger implementation is `SkippedByDecision`; downstream baseline work continues |
| Dataset license rejection | Candidate dataset fails legal/suitability review | Dataset is excluded; affected evidence node replans; locked evidence remains untouched |
| Locked-data contamination | Locked evidence is opened before manifest freeze | Candidate version becomes `Invalidated`; new version/repreregistration required |
| Public-claim invalidation | New primary evidence invalidates a released claim | Public version is frozen/withheld per policy; candidate update opens; no silent mutation |
| Cross-protocol isolation | One protocol is failed or blocked | Rolling dashboard and other protocol trains continue; final program audit records mixed dispositions |

## 5. Repository-integration gate

Revision 4 becomes scheduler-authoritative only when a clean clone proves:

1. schema validation for all 175 records;
2. unique IDs, one intended root, no cycles, and reversible generated unlocks;
3. every declared command exists and produces current-commit evidence;
4. all ten fixtures above pass;
5. squat and forward lunge execute as the first real vertical slice;
6. a resource-constrained schedule is regenerated from observed completion times;
7. branch commit/push behavior works without production deployment authority.

Until then, the bundle is the canonical candidate specification—not evidence that the scheduler, validation, or release machinery has run.
