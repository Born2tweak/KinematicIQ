# KinematicIQ Forward-Lunge Dataset and Capture Specification

> **Canonical reconciliation (2026-07-15):** Original repository-status observations below refer to the audited `8d8a77d` snapshot unless a later commit is named. Phase 3 at `f49558e` superseded the no-implementation conclusion with an unavailable experimental six-state seam (`web/src/protocols/inlineLunge/index.ts`, `segmenter.ts`, and `inlineLunge.test.ts`). It did not provide human labels, criterion validity, reliability, live/upload/session/results integration, coaching authority, or public availability. The approved identity is **Forward lunge with stride and return**; `inlineLunge` is historical pending P4-M01. Squat remains the only available protocol. This specification authorizes no collection, acquisition, threshold change, activation, or claim.
**Status:** implementation-ready research specification; collection and acquisition remain approval-gated
**Movement working name:** forward lunge with stride and return
**Protocol research ID/version:** `forward-lunge-stride-return` / `flsr-v0`
**Schema family:** `kinematiciq-lunge-dataset-manifest` v1, `kinematiciq-lunge-label` v1
**Repository basis:** `master` at `8d8a77d`, 2026-07-14

## 1. Dataset purpose and roles

This specification defines the artifacts needed to develop and validate KinematicIQ's proposed stride-and-return forward lunge without participant leakage, silent collection, fake truth, unsupported licensing, or accidental public activation.

It implements the four dataset roles in `INLINE_LUNGE_FIELD_VALIDATION_PROTOCOL.md`:

1. deterministic synthetic regression;
2. approved field development;
3. locked subject-held-out pre-activation validation;
4. an optional synchronized reference subset.

The audited `8d8a77d` snapshot contained no lunge implementation and called the research track “inline lunge.” Phase 3 later added the unavailable `f49558e` seam; the canonical identity decision supersedes that name. Evidence review shows that the proposed stepping task is not the fixed-stance FMS inline lunge. The owner must approve the identity before any participant capture or external acquisition. This specification does not authorize either action.

Raw participant media, participant-linked landmarks, local manifests, contact keys, and reference-system data never enter git. KinematicIQ remains browser-only and local-first. Only schemas, synthetic/redacted fixtures, and non-identifying aggregate reports may be tracked.

## 2. Dataset-family definitions

### A. Synthetic regression suite

Generated landmarks/timestamps and deliberately transformed synthetic pose tapes. Every artifact has `synthetic: true`, a generator name/version/seed, a parent fixture hash when transformed, and no participant identity. It may verify deterministic event order, serialization, rejection, abstention, and monotonic sensitivity. It is ineligible for scientific, reliability, device, usability, or activation gates.

Required cases:

- valid left lead and valid right lead;
- shallow excursion with complete return;
- aborted after step and aborted after visible plant;
- incomplete ascent and incomplete return;
- missing lead/rear leg or foot by event window;
- ambiguous/contradictory lead side;
- one- and multi-frame temporary occlusion;
- long dropout and reacquisition mismatch;
- user leaves and returns;
- squat, static split squat, FMS inline lunge, lateral/reverse/walking lunge, step-only, and other non-target motion;
- mirrored coordinates with correct and incorrect metadata;
- timestamp equality, reversal, large gap, irregular cadence, low effective rate, stale inference queue;
- camera/skeleton translation, scale/rotation proxy, crop, and orientation epoch change;
- spike, bilateral swap, bone-length discontinuity, and phase-boundary perturbations.

### B. Field-development dataset

An approved, intentionally imperfect corpus used for capture/tool/schema debugging, rater training and qualification, failure discovery, threshold/filter experiments, and sample-size estimates. It may change engineering decisions. It cannot satisfy the final activation endpoints, and none of its subjects may enter the locked dataset.

Development deliberately includes valid and invalid recordings across both lead sides, named devices, view/height/distance/roll/crop perturbations, cadence/gaps, lighting, clothing/occlusion, body presentation, mirror states, bystanders, camera movement, and negative movements. All thresholds and matching windows become frozen after development.

### C. Locked pre-activation validation dataset

An approved corpus from subjects absent from development, example creation, tuning, and rater qualification. Before predictions are run, freeze and hash its subject split, manifests, original source checksums, label packets, A/B labels, adjudication, protocol/capture/label versions, KinematicIQ commit, model/filter/algorithm versions, gate registry, and analysis code.

The locked dataset contains standard valid attempts plus prespecified invalid/adversarial cases. Every attempted recording remains in the analysis flow. Unreadable, aborted, shallow, wrong-movement, or algorithm-failure cases are outcomes rather than discretionary exclusions.

### D. Optional reference subset

Synchronized reference measurements are attached to subjects already assigned to development or locked roles; the reference subset is not a fifth split. Use:

- synchronized high-rate/original RGB for event-frame reference;
- calibrated marker-based 3D projected into the camera plane or a separately validated manual 2D process for projected angle agreement;
- force plate/contact sensor only for physical contact event research;
- validated timing hardware for synchronization verification.

Force plates do not enable force, load, moment, power, injury, or muscle claims. A reference modality must support the endpoint it is used for; motion capture does not replace human task-category labels.

## 3. Directory and filename contract

### 3.1 Storage roots

Tracked repository:

```text
docs/validation/                         # specifications and aggregate reports
web/src/eval/                            # schemas/validators/tooling
web/src/eval/fixtures/forward-lunge/     # approved synthetic-only fixtures
eval-tapes/MANIFEST.example.json         # athlete-free example only
```

Local-only, gitignored storage:

```text
web/eval/datasets/local/forward-lunge/
  development/
    source/
    pose-tapes/
    labels/rater-a/
    labels/rater-b/
    labels/adjudicated/
    references/
    manifests/
  locked-validation/
    source/
    pose-tapes/
    labels/rater-a/
    labels/rater-b/
    labels/adjudicated/
    references/
    manifests/
  reports/
```

Contact details and the subject re-link key live in a separately encrypted custodian system, never under this tree.

### 3.2 Identifiers

- `subjectId`: random pseudonym such as `S-7F4K2M`; stable across that person's sessions and never derived from name/date/email.
- `sessionId`: `<subjectId>-SE-<random>`.
- `recordingId`: `<sessionId>-R-<random>`; one source recording/capture attempt.
- `trialId`: `<recordingId>-T-<zero-padded sequence>`; label-level interval, not necessarily completed.
- `artifactId`: random stable ID plus artifact role; filenames may contain only this ID and non-identifying role.

Do not encode age, sex/gender, diagnosis, location, date of birth, device serial, or movement outcome in identifiers/filenames.

Bare filenames:

```text
<artifactId>.source.<ext>
<artifactId>.posetape.json
<artifactId>.labels.rater-a.v1.json
<artifactId>.labels.rater-b.v1.json
<artifactId>.labels.adjudicated.v1.json
<artifactId>.reference.<ext>
```

Manifest links use IDs and SHA-256, not absolute paths or user names.

## 4. Manifest schemas

The current `CorpusManifest` v1 and `PoseTapeMeta.truth` are too small for subject splits, lunge events, two raters, adjudication, and retention. Extend them additively in a future authorized engineering milestone; old tapes remain readable. Unknown schema versions are refused, not guessed.

### 4.1 Dataset manifest v1

Each manifest is an object with `schema`, `schemaVersion: 1`, `datasetId`, `datasetVersion`, `role`, `createdAt`, `protocol`, `storageNote`, `approval`, `freeze`, and `recordings[]`.

Each `recordings[]` entry requires:

| Field | Contract |
|---|---|
| `recordingId`, `subjectId`, `sessionId` | Non-empty pseudonymous IDs; globally unique where applicable |
| `datasetRole`, `split` | `synthetic-regression`, `field-development`, `locked-validation`; split must agree with subject ledger |
| `synthetic` | Boolean; `true` requires generator provenance and prohibits consent/person fields |
| `movementId`, `protocolId`, `protocolVersion` | Exact frozen identity; aliases stored separately |
| `captureSource`, `provenance` | `live`, `upload`, `external-approved`, or `synthetic`; operator/source citation and acquisition approval ID |
| `leadSideDeclared` | `left`, `right`, `unknown`, or `not-applicable`; never inferred silently |
| `device` | Class/model where approved, browser/version, OS/version; no serial/advertising ID |
| `video` | Width, height, orientation, raw/display mirror flags, nominal fps, effective fps summary, duration, lens/FOV/zoom where available |
| `cameraSetup` | View label; lead side nearest; measured height/distance/yaw/pitch/roll when available; full-body/feet/travel framing; standard/perturbation condition IDs |
| `captureConditions` | Lighting, clothing/occlusion, background/bystander, surface/footwear, pace/load/arm instruction versions; non-identifying controlled vocabulary |
| `consentLicenseUsage` | Consent/terms class, allowed uses, prohibited claim uses, approval ID, retention policy ID; no identity |
| `software` | App, algorithm, MediaPipe/model, filter/parameters, tape schema, manifest schema, generator versions |
| `artifacts` | Artifact ID, role, bare filename/local locator, media type, byte count, SHA-256, parent SHA-256, created time, immutable/frozen state |
| `labels` | Label schema version, packet ID, A/B/adjudication artifact IDs and hashes, agreement report ID; may be pending |
| `reference` | System/type/version/rate/calibration/synchronization artifact and residual; nullable |
| `missingness`, `exclusions` | Append-only coded records with scope, interval, author, rationale, time; never deletion-by-omission |
| `rawVideo` | Availability, custodian, retention state (`retained`, `scheduled-delete`, `deleted`, `withdrawn`), approved deletion date/reason |
| `freeze` | Freeze status/time/authority and manifest/source hash |

`approval` includes `status` (`metadata-only`, `requested`, `approved`, `declined`), named authority role, decision record ID, allowed purpose, and terms snapshot hash. Checksums on acquired external/participant material are valid only when approved.

### 4.2 Trial/event linkage

Labels remain separate immutable artifacts. A manifest entry may summarize counts for navigation, but it cannot embed a mutable “truth” object. The adjudicated file references both A/B label artifact IDs/hashes and preserves ambiguity. Prediction artifacts reference the exact adjudication and software hashes but never modify them.

### 4.3 Pose-tape additive metadata

Future vNext tape fields should include frame dimensions, orientation/mirror transform, clock source, capture/orientation epoch, effective cadence/gap summary, exact filter parameters, model version, declared lead side, raw missing callbacks, temporal quality events, inference/callback timestamps, protocol version, source artifact hash, and manifest/recording ID. Frames remain raw; filtered/interpolated values are separate derivatives.

## 5. Capture protocol

### 5.1 Before the participant arrives

1. Confirm protocol identity/version, approved study role, consent form, privacy plan, device list, capture-condition assignment, retention policy, and stop/incident procedure.
2. Generate subject/session/recording IDs outside contact data. Confirm the subject is not in another split.
3. Verify local storage is access-controlled and gitignored. Record software/model/filter versions and device/browser/OS.
4. Calibrate reference synchronization when applicable. Capture a synchronization event visible to all systems and record residual error.

### 5.2 Standard camera setup

1. Use one fixed consumer RGB camera in near-sagittal view, with the declared lead side nearest where feasible.
2. Start near hip height with optical axis approximately perpendicular to travel. This is a field-development hypothesis, not a validated numeric tolerance.
3. Position far enough to keep head, both feet, and the entire forward travel/return corridor visible with margin; do not use digital zoom.
4. Level roll and record measured height, horizontal distance, orientation, resolution, nominal fps, and any available lens/FOV/zoom metadata.
5. Use a stable surface/background and lighting sufficient to distinguish the body/limbs without collecting unnecessary environmental detail.
6. Clothing must allow hips, knees, ankles, heels, and feet to remain visually distinguishable; record—not judge—occlusion/clothing class.
7. Confirm raw recording mirror state and preview mirror state separately. Confirm anatomical lead side aloud/on the local operator record without embedding identity.

Numeric setup ranges are frozen only after the development yaw/pitch/height/distance/roll/crop/device sweeps. Until then, record continuous measurements and `setupClass: field-development`; do not label a provisional range validated.

### 5.3 Recording sequence

1. Begin recording before the participant enters stable bilateral standing; retain original timestamps.
2. Hold neutral setup long enough for the frozen calibration procedure; both feet and required chains must be readable.
3. Record the declared lead side and mirror transform.
4. On a neutral cue, perform the assigned forward lunge with stride and return at the protocol's frozen self-selected or paced instruction. Do not cue a target knee angle, “correct depth,” trunk posture, knee-over-toe rule, or rear-knee contact.
5. Return both feet to the calibrated standing region and hold for the frozen stable-return dwell.
6. Capture at least three attempted standard trials per lead in field development and the locked standard condition, unless the signed sample schedule specifies more. Record every attempt, including false starts and incomplete trials.
7. End only after the post-trial standing interval. Do not trim failed attempts from source media.
8. Perform assigned negative/adversarial recordings in randomized or counterbalanced order with rest/stopping rules from the approved manual.
9. Review technical completeness without viewing KinematicIQ predictions. Repeats are allowed only for prespecified acquisition failures and both original/repeat records remain in the manifest.

### 5.4 Variation and perturbation capture

Development records controlled yaw, pitch/height, roll, distance/occupancy/lens, crop, occlusion, mirror/side, frame-rate/gap, device, lighting, clothing, and background changes one factor at a time where possible. Locked validation uses the frozen standard range plus a prespecified distribution of in-range and out-of-range cases. Do not tune after viewing locked predictions.

## 6. Required positive, negative, and adversarial cases

| Family | Required cases | Truth intent |
|---|---|---|
| Positive | Left/right lead; varied self-selected excursion/tempo; pause/slow reversal; multiple near-equal bottom frames; valid extra recovery step if protocol permits or rejects it explicitly | Test complete chain and event ties without normative judgment |
| Partial | Shallow complete; aborted after step/plant; incomplete ascent; incomplete return; clip starts late/ends early; false start | Preserve category and partial events; never silently count |
| Wrong movement | Squat, static split squat, actual FMS inline lunge, reverse/lateral/walking lunge, step-only, alternating/side switch | High tracking quality must still produce protocol invalidity |
| View/framing | Oblique/out-of-range yaw, roll, pitch/height, crop head/lead foot/rear foot/travel margin, far-side lead, zoom/camera movement | Validate view-specific abstention |
| Tracking | Lead/rear occlusion, loose clothing, bystander, single-joint spike, coherent jump, L/R swap, dropout/reacquisition, leave/return | Validate dependency-specific missingness and discontinuity policy |
| Timing | Low/variable effective fps, duplicate/equal/reversed timestamps, large gap, stale backlog | Events cannot advance through invalid time |
| Metadata | Correct/incorrect mirror declaration, lead-side contradiction, orientation epoch change, missing provenance/checksum/version | Validators reject unsafe artifacts before analysis |

No participant is instructed to create pain or unsafe conditions. The capture lead may stop any trial. KinematicIQ does not interpret discomfort.

## 7. Split and leakage rules

1. Assign split by `subjectId` before processing or labeling.
2. A subject and every session/trial/derivative/reference from that subject belong to exactly one of `field-development` or `locked-validation`.
3. Rater training/qualification examples come only from development subjects.
4. Thresholds, filters, event definitions, camera bands, examples, and model choices use development only.
5. Synthetic parent/child variants share a fixture group and cannot straddle tune/test roles in an engineering comparison.
6. External dataset subject keys must survive pseudonymization sufficiently to enforce grouping.
7. Duplicate or near-duplicate source hashes cannot cross roles. Derived crops/filters retain the same source group.
8. Device holdout and condition holdout are additional labels; neither substitutes for subject holdout.

The validator builds a global subject/source-group index across all manifests and fails closed on collisions, missing group keys, or role disagreement.

## 8. Label and adjudication linkage

- Packet generation reads source manifests and emits randomized packet IDs without predictions.
- Rater A and B artifacts each include schema/version, packet/recording IDs, rater pseudonym/qualification version, source SHA-256, tool version, labels, confidence/comments, submission time, and file SHA-256.
- Raters cannot read each other's directory or algorithm outputs before both submissions lock.
- The agreement report references the two immutable hashes.
- Adjudication requires two locked source labels, references both hashes, records each resolution and rationale, and preserves `ambiguous`/`missing` when unresolved.
- Any correction is a new version with `supersedes`; no file is overwritten.
- Predictions reference the adjudication hash and are stored separately.

The complete event and trial schema is defined in `INLINE_LUNGE_EVENT_LABELING_HANDBOOK.md`.

## 9. Checksums, immutability, and provenance

- SHA-256 is required for source media, tapes, manifests, labels, adjudication, reference files, gate registry, analysis code bundle, and reports.
- Compute source hash immediately after acquisition/capture; verify before derivation and before analysis.
- Every derivative records parent artifact ID/hash, transform name/version/parameters/seed, creator role, and time.
- Frozen locked artifacts are read-only. A changed byte yields a new artifact/version and invalidates the prior run linkage.
- Store chain-of-custody events append-only: acquired/captured, verified, derived, labeled, frozen, accessed/exported, deleted/withdrawn.
- External source citation, official URL, version, terms snapshot, allowed uses, approval ID, and checksum are mandatory. Registration is not acquisition permission.
- Never modify labels in place, hide failed recordings, backfill missing callbacks, or serialize interpolated coordinates as observed.

## 10. Privacy, consent, retention, and licensing

Follow `PROPRIETARY_CORPUS_GOVERNANCE.md` and `DATASET_OPERATOR_RUNBOOK.md`.

- Written adult consent must cover raw recording, derived pose landmarks, rater review, purpose, retention, withdrawal limits, and any contemplated sharing.
- Record the minimum data needed. No name, birth date, diagnosis, injury history, medication, precise location, contacts, or device identifier enters study artifacts.
- Store contact/re-link key separately and encrypted; ordinary evaluators receive only pseudonymous IDs.
- Raw media and linked pose data are access-controlled, encrypted in transit/at rest, and never placed in git or public links.
- The current 90-day raw/12-month derived retention proposal is not active until privacy/legal approval; manifest the approved dates and deletion state.
- Withdrawal/deletion produces a signed tombstone record where permitted; it never leaves a dangling prediction presented as evidence.
- Research-only, non-commercial, unclear, or per-source terms are enforced at artifact/report level and cannot support commercial activation.
- No automation accepts click-through terms, uses credentials, downloads restricted bytes, recruits, records, or grants access.

## 11. Schema validation and automatic rejection

Reject the artifact/run on:

- duplicate subject/session/recording/trial/artifact IDs;
- missing subject ID on any non-synthetic artifact;
- cross-split subject/source-group or duplicate-hash leakage;
- unsupported schema/protocol/label version;
- invalid/non-monotonic frame ranges or event order;
- out-of-range indices/timestamps or labels outside source duration;
- source/parent/checksum mismatch;
- modified or overwritten source labels;
- adjudication without two independent locked source labels;
- missing provenance, approval, consent/license usage class, software/model/filter version, or source hash;
- `synthetic: true` without generator provenance, or synthetic fixtures presented as scientific evidence;
- non-synthetic media with `synthetic: true`;
- research-only/unclear licensing used for a commercial/activation report;
- raw-video persistence without an approved retention state and custodian;
- unknown mirror/orientation/lead side where the endpoint depends on them;
- locked data analyzed with a code/gate hash different from preregistration;
- an exclusion reason outside the validation protocol's permitted list.

Warnings that remain reportable rather than auto-excluded include poor tracking, shallow/aborted/incomplete motion, wrong movement, missing events, device failure, and algorithm abstention. They are study outcomes.

## 12. Tooling requirements

Future authorized tooling should add:

1. manifest/label/adjudication JSON Schema or TypeScript validators with unknown-version refusal;
2. global split/source-hash leakage scanner;
3. SHA-256 and immutable freeze command;
4. packet generator and independent local rater workspaces;
5. frame-accurate labeling UI that never shows predictions;
6. agreement/adjudication report generator;
7. additive pose-tape vNext reader/writer preserving v1;
8. deterministic perturbation generator with seed/parent hashes;
9. capture metadata/effective-fps/gap diagnostic export;
10. locked evaluation runner verifying every preregistered hash before execution;
11. subject-clustered analysis and missingness/stratification reports;
12. local deletion/withdrawal audit support.

Until implementation is authorized, these are requirements, not permission to change `web/src`.

## 13. Human instructions for obtaining and placing files

### External source

1. Read official terms and registry entry; confirm intended use and claim restrictions.
2. Obtain explicit human approval and update metadata status to `approved` before bytes exist.
3. As a human, complete any allowed registration/agreement; store no credentials in the repo.
4. Download only into the approved local-only role/source directory.
5. Compute SHA-256, compare any publisher hash, snapshot terms/citation/version, and record approval.
6. Extract locally; minimize or remove raw video/faces when only derived landmarks are approved and sufficient.

### Original field capture

1. Verify signed consent/privacy/retention and split assignment.
2. Capture into local-only source storage using generated IDs.
3. Hash immediately, append the manifest row, and preserve the source unchanged.
4. Derive a raw pose tape with parent hash and exact software/model versions.
5. Generate blind packets; do not add algorithm truth/predictions.
6. After A/B lock and adjudication, freeze artifacts and run the readiness checklist.

## 14. Acceptance-readiness checklist

- [ ] Owner approved the stride-and-return identity or replaced this specification.
- [ ] Collection/acquisition, consent/license, privacy, retention, custodian, and incident plans are signed.
- [ ] Development and locked subjects/source groups are disjoint and globally scanned.
- [ ] Standard camera ranges and perturbation labels are frozen from development only.
- [ ] Required positive/partial/wrong-movement/view/tracking/timing/metadata cases are represented.
- [ ] Source and derivative SHA-256 chains verify.
- [ ] Two qualified blind raters submitted immutable labels; agreement precedes adjudication.
- [ ] Adjudication preserves both originals and unresolved ambiguity.
- [ ] Locked manifest, gate registry, code/model/filter versions, and analysis plan hashes match.
- [ ] Missingness/exclusions/abstentions are complete and reason-coded.
- [ ] Synthetic artifacts are excluded from scientific gates.
- [ ] External/reference rights permit the exact reported use.
- [ ] No raw participant data, absolute paths, credentials, or contact identifiers are tracked.
- [ ] Public activation remains a separate unsigned gate.

## 15. Known limitations

- No approved target-task corpus, KinematicIQ lunge implementation, direct MediaPipe lunge validity study, camera tolerance, event tolerance, or reliability estimate exists yet.
- MediaPipe visibility is not calibrated coordinate accuracy; self-occluded rear landmarks may look plausible.
- One uncalibrated side view cannot support frontal knee, COM, kinetics, muscle, injury, or normative claims.
- Near-hip camera height, distance, repetitions, and setup bands are provisional research choices until development sensitivity results are frozen.
- Human event labels contain uncertainty; the handbook preserves plateaus, ambiguity, missingness, and rater disagreement rather than fabricating precision.
- A small convenience sample or favorable aggregate cannot establish population or device generality.
- Passing this dataset system does not authorize implementation, metric promotion, coaching, or public availability.
