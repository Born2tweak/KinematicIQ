# ADR-017: Forward Lunge ships as Experimental, superseding ADR-016's availability clause

**Status:** Accepted on owner direction (2026-07-29). Supersedes the availability
clause of [ADR-016](ADR-016-forward-lunge-remains-unavailable.md) **only**. Every
hard gate ADR-016 recorded as blocked stays blocked, and this ADR closes none of
them.

## Context

ADR-016 was written against a binary vocabulary. `ProtocolStatus` had exactly two
values — `available` and `planned` — so "not scientifically validated" and "not
implemented" were the same flag. Given only those two options, and no consented
pilot, no qualified raters, no frozen corpus and no locked results, the only
honest disposition was `remain unavailable`.

KQ-026 removed that constraint. A protocol package now separates three
independent axes:

| Axis | Question | Forward lunge today |
|---|---|---|
| engineering | does the code exist and run end to end? | `complete` |
| validation | has it been measured against evidence? | `blocked` on RES-CORPUS |
| release | what may a user be told? | `experimental` (derived) |

Release state is derived, never declared, and `deriveReleaseState` is one-way:
engineering completeness alone reaches `experimental` and stops there. Only
validation evidence can reach `released`, and a blocked validation can never
reach it however finished the code is.

The forward-lunge analysis has been engineering-complete since Phase 4 — signals,
calibration, six-phase segmentation, trial outcomes, metrics, abstention and
findings, all covered by tests. ADR-016's disposition meant that working,
honestly-labelled software stayed unreachable, and the only remaining reasons for
that were the two connections nobody had made: no declared input mode and no
registered `ProtocolRuntime`.

## Decision

Forward Lunge becomes selectable and runnable through the upload and stored-tape
paths, surfaced as **Experimental — results have not yet been benchmarked**.

What this decision explicitly does **not** do:

- It does not set `status: 'available'`. That flag now tracks scientific
  validation only, and forward lunge remains `planned` under it.
- It does not close G-PILOT, G-RATER, G-EXPERIMENT, G-FREEZE, G-LOCK, G-ANGLE,
  G-REL, G-CLAIMS or G-AVAIL. Each stays blocked exactly as ADR-016 recorded.
- It does not permit an accuracy, clinical, diagnostic, injury, kinetic,
  normative, FMS or reliability claim. `assertClaimsPermitted` refuses accuracy
  language on any package that is not `released`, and the package's
  `allowedClaims` list is empty.
- It does not treat a synthetic or fixture recording as participant evidence.
  Fixture-derived verification is labelled as such wherever it is reported.
- It does not enable a live-camera path. The live surface drives the cyclic rep
  engine; forward lunge has no cyclic runtime, and the movement picker routes it
  to upload for that reason rather than by preference.

Confidence is ceilinged below the "High" chip (`UNVALIDATED_CONFIDENCE_CEILING`)
so an unvalidated protocol cannot render a high-confidence read, and every metric
it emits carries `validationTier: 'experimental'`.

## Consequences

The invariant ADR-016 was really protecting — a user must not be able to reach an
analysis that does not exist — moves from the `status` flag to two enforced
places: `deriveEngineeringState`, which refuses to call a protocol complete
without both a registered runtime and a declared input path, and
`lintProtocolCompleteness`, which fails a definition that exposes an input mode
with no runtime behind it. Both are tested.

The residual risks ADR-016 listed are unchanged and unmeasured: human capture
feasibility, rater ambiguity, FPS/device sensitivity, event validity,
projected-angle error, repeatability, accessibility, rights, and claims
interpretation. Users are told the results are not benchmarked; they are not told
how wrong the results might be, because nobody knows.

## Revalidation and rollback

Rollback is a one-line change with no migration: removing the forward-lunge entry
from the runtime registry drops the derived engineering state to `partial` and the
release state to `unavailable`, and the movement disappears from the picker.
A test asserts exactly that.

Promotion past `experimental` still requires everything ADR-016 demanded: an
immutable signed disposition for every blocked hard gate plus product/evidence,
privacy/legal, validation, biomechanics/claims, accessibility and engineering
sign-off with an explicit review date.
