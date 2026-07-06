# M05 — Protocol Engine v1 (squat as first protocol)

Date: 2026-07-05. Generalize `analysis/movement/` into a protocol engine; squat becomes `protocols/squat/`. Behavioral no-op for squat.

## What changed

- **`web/src/protocols/types.ts`** (new) — `Protocol = { definition: ProtocolDefinition, profile: MovementProfile | null }`, binding the movement-agnostic core definition to the runtime analysis config (the existing `MovementProfile`). Re-exports core protocol types + `NotImplementedError`/`isAvailable`.
- **`web/src/protocols/squat/index.ts`** (new) — `SQUAT_PROTOCOL` wrapping the existing `SQUAT_PROFILE` unchanged, plus `SQUAT_PROTOCOL_DEFINITION` (id squat, cyclic, available, phases standing/descending/bottom/ascending, 8 required lower-body landmarks, empty metrics/findingRuleIds until M6/M7, defaultObservationProtocolId front-view-squat-v1).
- **`web/src/protocols/registry.ts`** (new) — typed registry: `getProtocol(id)` (throws for unregistered), `listProtocols`, `listProtocolsByStatus`, `getActiveProtocol` (squat default), `getActiveProtocolProfile`, `registerProtocol` (M10/test seam).
- **`web/src/analysis/movement/registry.ts`** (modified) — now a **thin shim delegating to `protocols/registry.ts`**; keeps its existing API (`getMovementProfile`, `getActiveProfile`) and `/not registered/` throw message, so all existing call sites and `movementProfile.test.ts` stay green unchanged.
- **`web/src/session/types.ts`** + **`buildSessionResult.ts`** — added `protocolId: ProtocolId` to `SessionResult`, threaded through `buildSessionResult` (new optional param defaulting to the active protocol's id) into both return branches.
- **`web/src/protocols/registry.test.ts`** (new) — proves squat resolves as available/cyclic with its profile, active selection, unknown-protocol throw, status filtering, required-landmark count.

## Files touched

- `web/src/protocols/{types.ts,registry.ts,registry.test.ts}` (new), `web/src/protocols/squat/index.ts` (new)
- `web/src/analysis/movement/registry.ts` (modified — now a shim)
- `web/src/session/types.ts`, `web/src/session/buildSessionResult.ts` (modified — threaded protocolId)

## Decisions / conflicts

- **Smallest-diff migration:** the only consumers of `getActiveProfile`/`getMovementProfile` were their own test — the live pipeline uses module-level squat defaults directly. So I made `analysis/movement/registry.ts` delegate to the new protocols registry rather than migrating call sites; the shim keeps the old import surface stable and the old test passing verbatim.
- **No metric-shape or movement-selection UI changes** (deferred to M6 / M10 respectively), per the milestone's "explicitly NOT" list.
- No import cycles: `protocols/squat` → `analysis/movement/profiles/squat` (leaf) and `protocols/registry` → `protocols/squat`; `analysis/movement/registry` → `protocols/registry`. profiles/squat imports no registry.
- M2 tape regression output is **identical** (test is part of the suite and passed) — squat behavior preserved end-to-end.

## Tests

Before: 37 files / 206 tests. After: **38 files / 211 tests**, all green. `npm run build` clean.
