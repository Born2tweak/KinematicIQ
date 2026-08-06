# ADR-018: Automatic local session persistence

- **Status:** Accepted
- **Date:** 2026-08-05
- **Supersedes:** the explicit-save clause of M9 (local session history)
- **Does not supersede:** anything else in M9 — the store, its schema
  versioning, the local-only guarantee, and delete-all all stand unchanged.

## Context

M9 shipped local session history with one deliberate constraint: a finished
set was written to IndexedDB only when the athlete tapped **Save to history**
on the results screen. The store's own header recorded the reasoning —
"saving is an explicit user action ... never silent persistence" — and
`IMPLEMENTATION_PLAN_AND_FABLE_PROMPT.md` restated it at the milestone level.

Two things were true by the P1/P2 launch work that were not true when M9 was
written:

1. **The consent argument was aimed at the wrong risk.** The concern behind
   "never silent persistence" is that a recording of someone's body might
   leave their control. That risk lives in *upload*, and there is none here:
   the record is written to this browser's IndexedDB, no network path exists,
   and `docs/doctrine/deferred-scope.md` defers all backend persistence.
   Withholding a local write does not protect the athlete from anything; it
   only loses their session.

2. **A session had no address.** `ResultsScreen` could read a result only out
   of `location.state`, so a refresh, a History row, or a shared link all
   rendered the empty state. Fixing that requires the record to exist before
   the screen renders — an id cannot be minted for something that was never
   written. Manual save and `/results/:id` are mutually exclusive.

The observed cost of the old behavior: every session the athlete did not
explicitly save was destroyed by the next navigation, and the History screen's
own empty state had to instruct them to go back and tap a button they had
already navigated away from.

## Decision

Completed analyses are persisted to local storage automatically, at the moment
the results screen receives them.

- `useResultsSession` writes the record and then **replaces** the URL with
  `/results/:id`. Replace, not push, because the hand-off entry holds an
  in-memory result that cannot survive a reload.
- The **Save to history** button is removed. Its slot carries a quiet status
  line — `Stored on this device` — which reports what actually happened rather
  than promising it.
- A failed local write (private mode, quota) never costs the athlete the
  report they are looking at. The screen renders, and the status line says
  plainly that it was not stored.
- Consent is now expressed through **deletion**, not through withheld writes:
  `SessionStore.delete(id)` is added alongside the existing `deleteAll()`, and
  History surfaces both.

## Consequences

- `SessionStore` gains `get(id)` and `delete(id)`. `get` refuses a record
  whose `schemaVersion` this reader does not understand, matching `list()` —
  a stale link must not render a record we cannot interpret.
- More records accumulate, including low-confidence and abstained sets. This
  is correct: an abstained set is evidence about capture conditions, and
  hiding it would bias the athlete's own history toward their good captures.
- History becomes the delete surface and therefore the privacy surface. It
  must always offer per-record and delete-all controls; that is now a
  requirement of this ADR, not a nicety.
- Nothing about the claims policy, the quality gate, or the abstain behavior
  changes. Persisting an abstained set stores the abstention — it does not
  turn it into a result.

## Alternatives rejected

**Keep manual save, add a separate id.** Would require minting an identifier
for an unsaved session and reconciling it with the record's key if the athlete
later saved. Two identifiers for one session, drifting.

**Auto-save with an undo toast.** Adds a timed, dismissable control to
withdraw a write that carries no risk, and the athlete would have to catch it.
Delete-from-History is the same capability without the deadline.
