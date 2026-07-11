# M61 — Dataset governance and local data boundary

**Status:** Complete (2026-07-10).

**Authority:** `docs/implementation/NEXT_EXECUTION_PACKAGE.md` (M61/M62),
ADR-006, ADR-010.

## Objective

Make external movement evidence *registrable* without making it acquirable:
a metadata-first registry, a validator that enforces provenance/license/
access/intended-use, ignore rules that keep raw bytes out of git, and an
operator runbook that names the manual approval boundary. No dataset is
downloaded by this milestone.

## What was built

- **Registry schema + validator** — `web/src/eval/datasetRegistry.ts`.
  Types the required fields (stable id + version, source URL + citation,
  license/commercial-use/redistribution/access, approval status, content
  descriptor with modalities/skeleton/views/subjects/splits/movement labels,
  allowed vs prohibited-claim uses, local-only path convention, optional
  checksums). Modeled on `corpusManifest.ts`: throws on the first structural
  problem, tolerates unknown extra fields, refuses unknown versions.
  Enforced **safety invariants** beyond field presence:
  - `localPathConvention` must be relative — no drive letter, root, `~`, or
    `..` — so no absolute path or user name can enter git.
  - `checksums` are refused unless `approvalStatus === 'approved'`; checksums
    imply acquisition, and acquisition requires human approval.
  - a `metadata-only` role cannot be marked `approved`.
- **Committed registry** — `web/eval/datasets/registry.json`. Four
  metadata-only pilot candidates drawn from the research report: `ui-prmd`,
  `opencap-validation`, `ochuman`, `sportspose`. Every entry is
  `approvalStatus: metadata-only`, carries no checksums, and declares both
  allowed and prohibited-claim uses.
- **Validator unit tests** — `web/src/eval/datasetRegistry.test.ts`, 18
  tests. Cover: the committed file validates and has ≥2 metadata-only
  records; nothing is `approved` and no checksums exist; missing license,
  missing provenance, and missing intended-use are rejected; unsafe local
  paths (absolute, home-dir, `..`) are rejected; invalid enums rejected;
  checksums refused on un-approved entries and accepted once approved;
  non-hex digests rejected.
- **Ignore rules** — `.gitignore` now blocks `web/eval/datasets/local/`,
  common raw media/motion extensions (`*.mp4`, `*.mov`, `*.avi`, `*.mkv`,
  `*.c3d`, `*.trc`, `*.bvh`, `*.mot`, `*.sto`), and everything under
  `web/eval/datasets/` except `registry.json`. Verified with
  `git check-ignore`: `registry.json` stays tracked; a probe
  `local/ui-prmd/archive.zip` and a `.mp4` are ignored.
- **Operator runbook** — `docs/validation/DATASET_OPERATOR_RUNBOOK.md`.
  Documents the approval-status boundary, where data lives, and the
  approve → acquire → verify → extract → reproduce → delete procedure,
  including that a second operator reproduces by re-acquiring from source,
  never by receiving data.
- **Traceability** — `docs/implementation/RESEARCH_TO_CODE_TRACEABILITY.md`
  updated in this change (M61 row).

## Acceptance evidence (this session)

- Validator rejects missing license/provenance fields and unsafe tracked
  paths — `datasetRegistry.test.ts`, 18/18 pass.
- Four metadata-only candidate records validate (≥2 required).
- A fresh-clone operator can identify the approval boundary
  (`approvalStatus` table in the runbook) and the expected local path
  (`localPathConvention` resolved under `web/eval/`) without guessing.
- `git status` shows no raw dataset artifact staged or tracked; the ignore
  probe confirmed raw files are ignored while `registry.json` is not.
- Build clean (`npm run build`: tsc + vite). `npm test`: **73 files, 490
  tests** green (was 72/472 at the M60 baseline; +1 file, +18 tests).

## Boundaries honored

- No license accepted, no account created, no dataset downloaded.
- No tracking/filter/gate/threshold/model/copy change.
- Registration authorizes nothing — acquisition remains manual per the
  runbook and ADR-006/ADR-010.

## Handoff to M62

The registry identity (`id` + `version`) and the local-path contract are now
stable, which is the M62 start precondition. M62 builds the neutral
benchmark-sequence schema and source-to-canonical skeleton maps against these
identities, using tiny synthetic fixtures only (still no corpus download).
