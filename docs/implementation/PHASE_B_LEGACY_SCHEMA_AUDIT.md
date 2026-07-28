# KQ-018 — Legacy PoseTape / session schema audit

**Milestone:** KQ-018 (Phase B, lane B, sequence 1)
**Scope:** structural audit of schema definitions, readers, writers, and migration
risk as declared in the repository.
**Not in scope:** any claim about the contents, accuracy, representativeness, or
biomechanical validity of recorded movement data. Those remain gated on
RES-CORPUS through KQ-016, KQ-017, and KQ-176.

This audit reads code only. It downloads nothing, records nothing, and asserts
nothing about a dataset.

## 1. Schemas in scope

| Schema | Declared in | Version field | Range |
| --- | --- | --- | --- |
| `PoseTape` | `web/src/eval/poseTape.ts` | `schemaVersion?: 1 \| 2` | optional, union |
| `PoseTapeEvidenceV2` | `web/src/eval/poseTape.ts` | implied by tape v2 | — |
| `SessionArtifact` | `web/src/session/sessionArtifact.ts` | `schemaVersion: number` | required, unbounded |
| `StoredSession` | `web/src/storage/sessionStore.ts` | `schemaVersion: number` | gated by `READABLE_SCHEMA_VERSIONS` |

## 2. Reader / writer coverage

`PoseTape` is referenced by 21 non-test modules:

- **Writers:** `eval/poseTape.ts` (`createTape`, `createEvidenceTapeV2`),
  `eval/tapeStore.ts`, `eval/downloadTape.ts`, `eval/labelTape.ts`.
- **Readers:** `analysis/frameTrace.ts`, `analysis/videoAnalyzer.ts`,
  `camera/cameraSourceFactory.ts`, `camera/sources/poseTapeCameraSource.ts`,
  `components/replay/SessionReplay.tsx`, `eval/batchEval.ts`,
  `eval/benchmark/benchmarkBridge.ts`, `eval/benchmark/benchmarkSequence.ts`,
  `eval/replayHarness.ts`, `eval/shortGapRecoveryExperiment.ts`,
  `eval/trackingRobustness.ts`, `screens/CameraScreen.tsx`,
  `screens/UploadScreen.tsx`.
- **Fixtures:** `camera/fixtures/cleanSquatPoseTape.ts`,
  `camera/fixtures/missingFeetPoseTape.ts`.

`SessionArtifact` is referenced by 4 non-test modules: `core/versioning.ts`,
`session/sessionArtifact.ts`, `session/types.ts`, `storage/sessionStore.ts`.

The asymmetry matters. The session path has a single, narrow read boundary. The
PoseTape path has thirteen independent readers and no single normalization
chokepoint they are all required to pass through.

## 3. Migration risks

Each risk below was confirmed by reading the current source.

### R1 — `createTape` never stamps `schemaVersion` (high)

`createTape()` returns `{ meta, frames }` or `{ meta, frames, diagnostics }`. It
sets `appVersion` and `algorithmVersion` on `meta` but never sets
`schemaVersion` on the tape. Every tape produced by the ordinary writer is
therefore untagged.

### R2 — untagged is ambiguous with v1 (high)

`schemaVersion` is optional. A tape without the field cannot be distinguished
between "written by a pre-versioning build" and "written by current
`createTape`". `normalizePoseTapeV2` resolves the ambiguity by defaulting to
`tape.schemaVersion ?? 1`, which is a guess, not a recovered fact. Combined with
R1 this means current-build tapes are read back as v1.

### R3 — normalization silently skips tapes without `meta.protocolId` (high)

```ts
if (tape.schemaVersion === 2 && tape.evidence) { ...; return tape }
if (!tape.meta.protocolId) return tape          // <- returns unstamped
return { ...tape, schemaVersion: tape.schemaVersion ?? 1, ... }
```

The middle branch returns the tape without stamping `schemaVersion` and without
normalizing anything. A tape lacking `protocolId` stays permanently untagged and
silently bypasses `normalizeObservationProtocolId`.

### R4 — a v2-tagged tape without `evidence` bypasses validation (medium)

The v2 branch requires `schemaVersion === 2` **and** `tape.evidence`. A tape
tagged v2 whose `evidence` is missing falls through and is handled by the v1
path, so `validatePoseTapeEvidence` — which enforces the SHA-256 source
checksum, pseudonymous key format, `frozen`/`development` split exclusion, and
acyclic transformation lineage — never runs. Its version tag is preserved, so
downstream readers may treat it as validated when it was not.

### R5 — no readable-version gate on PoseTape (medium)

`sessionStore` gates reads with `READABLE_SCHEMA_VERSIONS.has(record.schemaVersion)`.
`PoseTape` has no equivalent. A tape carrying an unknown future
`schemaVersion` is accepted by the `?? 1` fallback rather than refused.

### R6 — inconsistent version typing across the two schemas (low)

`PoseTape.schemaVersion` is a closed union `1 | 2`; `SessionArtifact.schemaVersion`
and `StoredSession.schemaVersion` are open `number`. The closed union cannot
express a v3 tape without a type change, while the open number accepts anything.

## 4. Patterns worth preserving

- Stored session records are **normalized in memory and never rewritten on
  disk** (`storage/sessionStore.ts`, `session/sessionArtifact.ts`). Legacy
  records stay byte-stable and readable.
- Missing algorithm versions are stamped `unversioned-legacy` rather than
  guessed (`LEGACY_ALGORITHM_VERSION`).
- `metricResultsForArtifact` returns existing keyed results untouched and
  returns `[]` for protocols without metric definitions rather than inventing
  values.

These are the behaviours `PoseSequence` v3 and the PoseTape v3 writer/reader
(KQ-022, KQ-023, KQ-024) should inherit.

## 5. Consequences for the Phase B spine

1. **KQ-019 (`FramePacket` v1)** must carry an explicit, required version
   discriminator. R1–R3 all trace to optionality.
2. **KQ-022 (`PoseSequence` v3)** should define a closed readable-version set
   and refuse unknown versions, mirroring `READABLE_SCHEMA_VERSIONS` (R5).
3. **KQ-023 (PoseTape v3 writer)** must stamp the version at construction, not
   at normalization (R1).
4. **KQ-024 (PoseTape legacy reader)** must treat "untagged" as its own case,
   distinct from v1, and must not let a version tag imply validation (R2, R4).
5. **KQ-025 (execution-segment provenance)** inherits the transformation
   lineage rules already enforced by `validatePoseTapeEvidence`; that validator
   is the model to extend, but it must become unconditional (R4).

## 6. Status

Every reader/writer and migration risk is mapped. No corpus was required to
produce this audit and none of its findings depends on one.
