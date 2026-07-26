# Technical Debt Ledger

Known costs accepted deliberately. Each entry records what is wrong, why it was
accepted rather than fixed, and what fixing it would require. Entries are
removed only when the underlying condition is gone, not when they stop being
convenient to look at.

## DEBT-001 — Program test suite runtime grew from ~178s to ~3949s

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
