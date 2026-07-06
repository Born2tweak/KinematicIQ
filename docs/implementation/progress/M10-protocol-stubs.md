# M10 — Protocol expansion stubs

## What changed

Proof that the protocol engine is multi-protocol without shipping any
unvalidated analysis (movement taxonomy from `01_Foundations...md`; domain
profiles from `07_Domain_Intelligence_Spec.md`).

- **`web/src/protocols/hipHinge/index.ts`** (new): planned stub, `kind:
  'cyclic'`, squat-like phase vocabulary, lower-body + shoulder landmarks.
- **`web/src/protocols/jump/index.ts`** (new): planned stub, `kind:
  'ballistic'`, phases `standing → countermovement → takeoff → flight →
  landing`.
- **`web/src/protocols/sprint/index.ts`** (new): planned stub, `kind: 'gait'`,
  phases `stance → toe-off → swing → touchdown`.
  All three carry real `ProtocolDefinition` metadata but `profile: null` and
  empty `metrics` / `findingRuleIds` — nothing claims validation.
- **`web/src/protocols/registry.ts`**: registers the three stubs; new
  `getProtocolProfile(id)` analyze entry point throws `NotImplementedError`
  for planned protocols, so no code path can run an unvalidated analysis.
  `getActiveProtocolProfile` now delegates to it (squat unchanged).
- **`web/src/protocols/registry.test.ts`**: status filtering across all four
  protocols, stub metadata assertions, `NotImplementedError` on the analyze
  entry point, and squat-path-untouched assertion. The old "unregistered
  sprint throws" test was replaced — sprint is now registered (as planned);
  the shim-level `getMovementProfile('sprint')` rejection is still covered by
  `analysis/movement/movementProfile.test.ts`.
- **`web/src/components/ProtocolPicker.tsx`** (new) + a "Movements" section on
  the landing page: squat card is clickable (→ `/camera`); planned cards are
  disabled with the literal copy "In development — not yet validated".
  Selecting a stub can never start a broken analysis — the buttons are
  disabled, and the engine throws before any pipeline could run.
- **`web/src/index.css`**: protocol card styles.

## Acceptance checks

- Selecting a stub never crashes into a broken analysis: planned cards are
  non-interactive; `getProtocolProfile` throws typed `NotImplementedError`.
- Registry tests cover status filtering: yes (available = squat only; planned
  = hipHinge/jump/sprint).
- Squat path untouched: active protocol still squat; `getProtocolProfile
  ('squat')` returns the same `SQUAT_PROFILE` object; replay-parity and tape
  regression suites unchanged and green.

## Tests

- Before: 43 files / 239 tests. After: 43 files / 240 tests. Build + tests green.
