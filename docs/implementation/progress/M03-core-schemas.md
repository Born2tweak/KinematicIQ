# M03 — Core Schemas

Date: 2026-07-05. The shared, movement-agnostic type vocabulary for everything after. Types + pure helpers only — no existing module changes behavior.

## What changed (all new, under `web/src/core/`)

- **`confidence.ts`** — `Confidence` (numeric value + derived `ConfidenceLevel` chip + machine-readable `ConfidenceBasis[]` + optional uncertainty). Helpers: `clampConfidence`, `confidenceLevel` (thresholds 0.75 High / 0.5 Medium), `makeConfidence`, `combineConfidence` (multiplicative, empty ⇒ 0 never 1). Reconciles the pipeline's numeric confidence with the UI's three-level chip. Sources: MD #3 confidence model, MD #8 §5 `Confidence`, claims-policy.
- **`provenance.ts`** — `Provenance` (captureSource, modelVersion, filterVariant, protocolId, tapeId, appVersion, recordedAt, algorithmVersion) + `makeProvenance` with sensible defaults (`DEFAULT_MODEL_VERSION = mediapipe-tasks-vision-0.10`). Mirrors `PoseTapeMeta` fields; the audit-trail seam. Sources: ontology P5, MD #5 production standard, MD #8 §5 `Versioned`.
- **`metric.ts`** — `MetricDefinition` (catalog entry: id, label, unit, evidenceCategory, validationTier, confidenceBasis, description, `exclusionReason`/`included` for documented single-RGB exclusions) and `MetricResult` (value nullable-for-abstain, unit, side, confidence, provenance, validationTier, window, qualityFlags) + `hasValue` narrowing guard. `ValidationTier = experimental | production | research | clinical` (MD #5 tiers). **No composite-score type by design** (claims-policy). Sources: MD #3 §1–3, MD #2 §5–6, MD #8 §3/§5.
- **`protocol.ts`** — `ProtocolDefinition` superset of `MovementProfile` (id, label, kind, status, phases, requiredLandmarks, metrics, findingRuleIds, defaultObservationProtocolId) + `ProtocolKind`/`ProtocolStatus`, `isAvailable`, and `NotImplementedError` (for M10 planned stubs). Sources: MD #8 §3 protocol engine, MD #1 §6.3.
- **`finding.ts`** — `Finding` (id, question?, observation-language statement, evidence: `FindingEvidenceRef[]`, confidence, `priority` as display-ordering hint — **not** risk/severity-of-harm, tryNext?) + `sortFindings` (primary→informational, then confidence desc). Sources: MD #4 §4–7/§9, claims-policy, docs/24 §3.10–3.16.

Colocated `*.test.ts` for each (construction, narrowing, ordering, clamp/combine, defaulting, exclusion-record).

## Files touched

- `web/src/core/{confidence,provenance,metric,protocol,finding}.ts` (new)
- `web/src/core/{confidence,provenance,metric,protocol,finding}.test.ts` (new)

## Decisions / conflicts

- **No `CompositeScore` type** even though MD #8 §5 defines one — this is a deliberate constraint win over the spec, logged here. The no-composite rule (claims-policy, MD #1 §4.4, `session/types.ts` comment) governs. Findings carry `priority` for ordering, never a risk score.
- `ConfidenceLevel` is redefined in `core/confidence.ts` (structurally identical to `session/types.ts`) so `core/` has zero dependency on the session layer; the two unions are mutually assignable, and M5+ can converge them without a breaking change.
- `ProtocolKind`/`ProtocolId` mirror `analysis/movement/types.ts` `MovementKind`/`MovementId` deliberately, so M5's adapter is a straight mapping. `core/` intentionally does not import from `analysis/` (foundation layer stays leaf-ward).
- No `any` anywhere; no runtime coupling into screens or the pipeline.

## Tests

Before: 31 files / 182 tests. After: **36 files / 202 tests**, all green. `npm run build` clean (zero TS errors).
