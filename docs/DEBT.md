# Technical Debt Ledger

Known costs accepted deliberately. Each entry records what is wrong, why it was
accepted rather than fixed, and what fixing it would require. Entries are
removed only when the underlying condition is gone, not when they stop being
convenient to look at. Resolved entries are kept and marked, because the
reasoning that accepted them is the record of why the fix was worth its cost.

## DEBT-001 — Program test suite runtime grew from ~178s to ~3949s

**Status: RESOLVED at subject `505c751`.** Verification is memoised inside a
single read-only projection pass: working-tree hashes are reused for the
duration of one `compile_projection`, JSON Schema validators are compiled once
per distinct canonical schema content, and commit trees are cached only for
full 40-hex object names. No binding was weakened to buy this — every input is
still hashed against both the working tree and the record's subject commit on
every pass, and a mutation between passes still revokes.

Measured on the same machine, Windows, Python 3.14.0, best of three warm calls
with the projection compiled over the full Phase A record set:

| | subject `833f65d` | subject `24bec2e` |
|---|---|---|
| milestones `Current` | 15 | 15 |
| `compile_projection`, cold | 4.98s | 3.03s |
| `compile_projection`, warm | 3.30s | 1.57s |
| `executable_frontier` | 7.91s | 5.39s |

The suite that named this entry, `python -m unittest discover -s tests/program`,
ran 72 tests in 140.1s at `24bec2e` with all fifteen milestones `Current`,
against the 3948.9s / 63 tests recorded at `ff41350` under the same condition.
The two runs are not the same test count — this branch adds nine regression
tests for the memoisation and scheduler work — so read the figure as roughly a
twenty-eight-fold reduction, not a precise ratio. The same suite completed
inside a 1m00s `ubuntu-latest` CI job on run 30212213983, which also
reproduced the projection from a clean checkout in 1.8s.

See [DEBT-001 original entry](#debt-001-original-entry) below for the accepted
reasoning at the time.

## DEBT-001 original entry

**Observed:** 2026-07-25, subject `ff41350`, Windows, Python 3.14.0.
`python -m unittest discover -s tests/program` ran 63 tests in 3948.9s. The same
suite ran in 177.6s earlier the same day at the same commit range.

**Cause:** not a regression in test logic. Verification is now genuinely live.
With all fifteen milestones `Current`, every `compile_projection` call re-verifies
each record by hashing its full declared scope, and the suite recompiles status
and checkpoint state across many tests. When every milestone was
`ReverificationRequired`, `verify_record` short-circuited and the work never ran.
The cost is therefore proportional to how much evidence is valid — the suite got
slow precisely because the evidence became real.

**Impact:** `.github/workflows/evidence-integrity.yml` runs this suite on both
`windows-latest` and `ubuntu-latest`, so CI jobs should be expected to approach an
hour. Below the 360-minute GitHub job ceiling, so it fails nothing today, but it
makes the feedback loop poor and will worsen as milestones accumulate.

**Accepted because:** the correct fix is memoization, which touches
`evidence_integrity.py`. Any controller change revokes all fifteen records and
costs a further full reverification pass plus a push. Not worth spending during
Phase A closure.

**Fix direction:** memoize `verify_record` per process, keyed by
`(evidence_id, subject_commit)`, and reuse one compiled projection across tests
within a module. Do not reduce cost by narrowing scope or by trusting a cached
`Current` verdict across a controller change — that would reintroduce exactly the
stale-evidence class this branch exists to eliminate.

## DEBT-002 — A failed KQ-015 record is preserved that reflects an operator error

**Observed:** `docs/status/evidence/KQ-015/KQ-015-865c5a49931d.json`, committed in
`ff41350`, has `all_required_checks_passed: false`.

**Cause:** `tools/program/verify_clean_clone.py` defaults `--repository` to
`https://github.com/Born2tweak/KinematicIQ.git`, so the gate proves the published
remote, not the local working branch. It was run against subject `865c5a4` before
that commit had been pushed, so the clone reproduced the older remote state and
correctly reported fifteen milestones as `ReverificationRequired`. The gate
behaved properly; the run was ordered wrongly.

**Impact:** a reader auditing KQ-015 history sees a failure that looks like a
repository defect and is not one. The negative record is otherwise legitimate
history and was preserved rather than deleted, consistent with the append-only
evidence principle.

**Accepted because:** rewriting it out of history would contradict the immutability
guarantee the evidence schema is built on. Documenting it is the cheaper and more
honest correction.

**Fix direction:** none for the record itself. To prevent recurrence, make the
clean-clone milestone fail fast with an explicit message when the local subject
commit is not present on the configured remote, so the ordering error is reported
as a precondition rather than as fifteen misleading verification failures.

**Recurrence closed at subject `505c751`.** `verify_clean_clone.py` now compares
local `HEAD` against the configured remote branch before cloning and exits with
`operator ordering failure: local subject <sha> is absent from <branch> on
<repository>`. Covered by `tests/program/test_clean_clone_gate.py`, including the
negative cases of an unpushed subject and a missing remote branch. The failed
record itself remains, as designed.

## DEBT-003 — Reverification order is enforced by procedure, not by the tools

**Observed:** 2026-07-26, during the reverification of subject `505c751`.

**Cause:** `tools/program/run_contract_checks.py` accepts any milestone ID at any
time. Called per milestone in numeric order it produces two failures that the
supported driver, `tools/program/migrate_phase_a_evidence.py`, avoids by
construction: KQ-009 and KQ-013 fail their `--verify` status and checkpoint
checks against a projection that has not yet been refreshed, and records written
for KQ-011, KQ-012 and KQ-014 bind `dependency_evidence` to superseded upstream
evidence IDs. Because records are immutable per `(milestone, subject_commit)`,
each such record must be deleted before the pass can be redone — recoverable
only because none had been committed.

**Impact:** an operator who reaches for the obvious tool gets four records that
are simultaneously immutable and invalid, and no message explains why. The
controller is correct at every step; the sequence is what is unenforced.

**Accepted because:** the enforcement would live in `run_contract_checks.py`,
which is a declared evidence input for all fifteen milestones. Adding it costs a
further full reverification pass and a push. `docs/program/REVERIFICATION_RUNBOOK.md`
records the required order at zero controller cost, and no evidence produced
under the correct order is affected.

**Fix direction:** have `run_contract_checks.py` refuse to write a record whose
`dependency_evidence` does not bind to the currently adopted upstream evidence
ID, and have it refresh generated state before any milestone whose declared
checks include a `--verify` compiler. Batch that change with the next unavoidable
controller edit rather than paying a dedicated pass for it.

## DEBT-004 — BlockedExternal masks the resource that caused the block

**Observed:** 2026-07-26, after moving KQ-016 and KQ-017 to `BlockedExternal`
with `resource_dependencies: [RES-CORPUS]`.

**Cause:** `dependency_ready_ids` in `tools/program/execution_authority.py`
checks `milestone_status` before it checks resource readiness, so a milestone
that is both `BlockedExternal` and resource-blocked reports only
`{"reason": "not_open_for_execution", "detail": {"milestone_status":
"BlockedExternal"}}`. The unresolved resource that actually caused the block —
the fact an operator needs — never reaches the scheduling reason.

**Impact:** the frontier still explains itself, but one indirection short. A
reader has to open `milestone_registry.yaml` to learn that RES-CORPUS is the
blocker. No decision is made wrongly; the answer is just one lookup away
instead of present.

**Accepted because:** the fix lives in `execution_authority.py`, a declared
evidence input for all fifteen milestones, so it costs a full reverification
pass. The registry entry, `docs/program/resource_registry.yaml`, and the
milestone's own `requirements` all name RES-CORPUS explicitly.

**Fix direction:** merge the resource check into the status branch so
`not_open_for_execution` carries an `unresolved_resources` list when one exists.
Batch with DEBT-003's `run_contract_checks.py` change, which needs the same pass.
