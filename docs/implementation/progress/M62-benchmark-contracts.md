# M62 — Neutral benchmark contracts and skeleton mappings

**Status:** Complete (2026-07-10).

**Authority:** `docs/implementation/NEXT_EXECUTION_PACKAGE.md` (M62), ADR-006,
ADR-007. Started on the stable M61 registry identity + local-path contract.

## Objective

Define a source-agnostic way to represent an external movement trial —
separate from `PoseTape`/`RepMetrics` — plus versioned source-to-canonical
skeleton maps, deterministic validation, and a conservative bridge into the
existing replay layer. Only tiny hand-authored fixtures are used; no public
corpus is downloaded (ADR-006).

## What was built (all under `web/src/eval/benchmark/`)

- **Canonical skeleton + coordinate conventions** — `canonicalSkeleton.ts`.
  A small canonical joint vocabulary (`kinematiq-canonical-v1`) mirroring the
  joints KinematicIQ reasons about plus one explicitly derived `pelvis_mid`.
  Explicit `CoordinateSystem` (units + per-axis direction + origin) so a
  sagittal metric is never computed against a mislabeled axis. Deliberately
  NOT MediaPipe's 33 landmarks and NOT a universal anatomy.
- **Neutral benchmark-sequence schema + validator** — `benchmarkSequence.ts`
  (`BENCHMARK_SEQUENCE_VERSION = 1`, kept next to its reader). Represents
  source dataset/version/sequence/subject-pseudonym/split; verbatim
  (possibly nonuniform) timestamps and declared-or-null source frame rate;
  coordinate system, view, and image dimensions; source + canonical skeleton
  refs; per-joint availability/confidence with explicit
  `observed`/`derived`/`missing`/`dropout`/`unavailable` state; arbitrary
  labels/events (including non-cyclic `transition`); and transformation
  provenance. Missingness is mandatory-explicit: every frame lists every
  canonical joint; a null-state joint may not carry coordinates.
  Frame indices and timestamps must strictly increase, so no missing frame is
  silently compressed.
- **Versioned skeleton maps** — `skeletonMap.ts`. Every canonical joint is
  `direct` / `derived` / `ambiguous` / `unavailable`; direct/derived
  references must name joints the source skeleton actually declares (no
  invented anatomy). Deterministic serialization reconstructs a fixed key
  order so round-trip is byte-for-byte stable regardless of input key order.
- **Adapter contract** — `adapter.ts`. Applies a map to raw source frames;
  abstains (explicit `missing`, null coords) whenever an input is absent or a
  derivation is unknown; passes timestamps/indices through verbatim; and
  round-trips its own output through the validator so a bad adapter fails
  loudly.
- **Bridge** — `benchmarkBridge.ts`. Decides, conservatively, whether a
  sequence can feed the cyclic squat replay (squat activity, no transition
  events, all sagittal lower-limb joints observed) and abstains with reasons
  otherwise. It never turns a sequence into a `PoseTape` or assumes every
  task is cyclic squat (ADR-007). Turning eligibility into an actual replay
  is a later gated milestone.
- **Example maps (fixtures)** — `exampleMaps.ts`. Two materially different
  source skeletons: COCO-17 (has ears, no feet, pelvis derived from hips) and
  Kinect-25 (real pelvis + feet, no ears, only-ambiguous nose). They exercise
  every mapping kind and show the same canonical joint (`pelvis_mid`) derived
  in one source and direct in the other.
- **Tests** — `benchmark.test.ts`, 19 tests.

## Acceptance evidence (this session)

- **≥2 materially different source skeletons + a dropout sequence:** COCO-17
  and Kinect-25 both adapt; a dropped hip yields a `missing` hip *and* a
  `missing` derived pelvis while neighboring frames stay `derived`.
- **Round-trip serialization is deterministic:** byte-for-byte equal, and
  equal under shuffled input key order.
- **Unavailable joints remain unavailable; derived joints retain
  derivation provenance:** COCO feet stay `unavailable`; `pelvis_mid` carries
  `derivedFrom: [left_hip, right_hip]`.
- **Nonuniform timestamps and missing frames survive adaptation:** indices
  `[0,1,3,4]` and timestamps `[0,33,140,152]` pass through verbatim; the
  validator rejects non-increasing timestamps.
- **Sit-to-stand without fabricated squat phases:** a `transition`-labeled
  Kinect sequence serializes with no `DESCENDING/ASCENDING/BOTTOM/repNumber/
  RepMetrics` vocabulary, and the bridge abstains on it with explicit reasons.
- **Build/tests/coverage/tape eval, squat baseline unchanged:**
  `npm run build` clean; `npm test` **74 files, 509 tests** (was 73/490 after
  M61); `npm run test:coverage` 88.7% lines overall; `npm run eval:tapes`
  11 tapes / 0 errors / 9-of-9 exact rep count — identical to the recorded
  baseline (no squat threshold, gate, or model touched).

## Decision record (per package)

- **Registry + local cache locations:** `web/eval/datasets/registry.json`
  (tracked); raw bytes under each entry's `localPathConvention` resolved from
  `web/eval/` (gitignored). Set in M61.
- **Canonical joint vocabulary + coordinate convention:**
  `kinematiq-canonical-v1` (16 joints, `pelvis_mid` derived) with an explicit
  per-sequence `CoordinateSystem`; no global default axis is assumed.
- **New schema vs extend existing artifact:** a **new** schema ID
  (`BENCHMARK_SEQUENCE_VERSION = 1`), deliberately separate from `PoseTape`
  and `RepMetrics` (ADR-007 — `PoseTape` is not a universal container).
- **Pseudonymization + split preservation:** `subjectPseudonym` (never a real
  ID) and a preserved `split` so leakage-safe evaluation stays possible.
- **Pilots metadata-only vs approved for M63:** all four M61 pilots remain
  metadata-only; M62 authorizes none for acquisition.
- **Acceptance tolerances exact vs exploratory:** M62 asserts EXACT structural
  contracts (deterministic serialization, explicit missingness, mapping
  integrity). Numeric biomechanical tolerances remain exploratory and are out
  of scope until a dataset is actually adapted under M63.

## Boundaries honored

- No dataset license accepted, account created, or corpus downloaded.
- No MediaPipe/One-Euro/phase-gate/threshold/model/copy change; squat
  baseline byte-identical on tape eval.
- No sit-to-stand/hinge/jump/gait analysis implemented — the schema can only
  *represent* such a trial; the bridge abstains on it.

## Handoff

M63 (if authorized) can approve a specific pilot via the M61 runbook and
write a real adapter against these contracts. M66 camera-workflow
decomposition may proceed in parallel now that the benchmark contracts are
stable.
