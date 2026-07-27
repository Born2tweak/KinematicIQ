# Phase A Reverification Runbook

Any edit to `tools/program/evidence_integrity.py`, `tools/program/execution_authority.py`,
`tools/program/run_contract_checks.py`, or the program test modules those files
declare as evidence inputs drops every Phase A milestone to
`ReverificationRequired`. That is the controller working as designed: input
hashes are checked against both the working tree and the record's subject
commit, so a changed verifier can never keep attesting a verdict it no longer
produces.

The cost of that guarantee is one full reverification pass per controller
change. This runbook is the only supported way to pay it.

## Rule 1 — batch controller edits into one commit

Never reverify mid-change. Land every controller edit you intend to make as a
single commit, then reverify once. Two commits cost two passes.

## Rule 2 — drive the pass with the migration tool, never a per-milestone loop

```bash
python tools/program/migrate_phase_a_evidence.py --through 14 --command-cache <path>
```

`tools/program/run_contract_checks.py` is not a pass driver. Calling it directly
for each milestone in numeric order produces two failures that are expensive to
undo:

- **KQ-009 and KQ-013 fail on stale generated state.** Their declared checks are
  `compile_status.py --verify` and `generate_checkpoint.py --verify`, which
  compare the checked-in projection against a freshly compiled one. Both files
  are stale until the preceding milestones have been re-adopted, so the checks
  fail unless the projection is refreshed first. `migrate_phase_a_evidence.py`
  refreshes generated state immediately before those two IDs; a naive loop does
  not.
- **Downstream records bind to superseded dependency evidence.** A record
  written for KQ-011 before KQ-009 has been re-adopted pins
  `dependency_evidence.KQ-009` to the previous evidence ID. The record is then
  immutable *and* invalid, and `run_contract_checks.py` refuses to replace it.

`migrate_phase_a_evidence.py` also appends the `evidence_validity_events.ndjson`
transitions. Records alone change nothing: the projection follows the event
chain, so a new record that no event adopts is invisible.

## Rule 3 — a failed record from an out-of-order run is not history

Append-only applies to the committed ledger. An evidence record written to the
working tree by a mis-ordered run and never committed is a build artifact of a
procedure error. Delete it and re-run the pass in the correct order. Do not
commit it and do not work around it, and do not delete a record that any commit
already contains.

## Rule 4 — commit, then push, then run KQ-015

`tools/program/verify_clean_clone.py` defaults `--repository` to the published
GitHub remote, so KQ-015 proves the *pushed* tree. Running it against an
unpushed subject reproduces the older remote state and reports every milestone
as unverified. The gate now fails fast with an explicit ordering message
instead, but the ordering requirement itself is unchanged:

1. Commit the controller batch.
2. Run `migrate_phase_a_evidence.py --through 14`.
3. Commit the regenerated evidence, events, and status projections.
4. Push.
5. Run KQ-015.
6. Commit KQ-015's record plus the refreshed projections, and push again.

The projections in step 3 are not optional bookkeeping. The clean-clone gate
clones the remote and runs `python -m unittest discover -s tests/program`
inside it, and that suite compares the *checked-in* `program_status.json` and
`program_checkpoint.json` against a freshly compiled pair. Any pass that
appends a validity event without regenerating and pushing those two files
leaves the clone with a stale checkpoint, and KQ-015 fails on the mismatch
rather than on anything about the repository. If a pass fails partway, refresh
the projections and push before re-running the gate.

Refresh the projections **last**, after every other file is in its final state.
`program_checkpoint.json` hashes each evidence file present in the tree and
lists each record's subject commit, so regenerating it and *then* deleting a
failed record leaves a checkpoint naming a file that no longer exists. That
mismatch is invisible locally — `--verify` passed while the file was still
there — and only surfaces inside the clone.

## Rule 4a — regenerated status does not re-invalidate its own attestation

`docs/status/program_status.json`, `program_checkpoint.json`, and
`evidence_validity.json` appear in no record's `input_hashes` or
`output_hashes`. Refreshing them after adopting new evidence is therefore safe
and does not start a revocation loop. Refresh them last so the checked-in
projection matches the compiler and the program test suite stays green.

## Expected cost

One pass regenerates fourteen records. The declared web suite and production
build run once and are reused for every subsequent milestone through
`--command-cache`, so the dominant cost is the first milestone that declares
them (currently KQ-004) plus one `compile_projection` per milestone.
