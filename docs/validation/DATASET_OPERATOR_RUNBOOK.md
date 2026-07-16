# Dataset Operator Runbook (M61)

**Audience:** an approved operator acquiring a public movement dataset for
LOCAL evaluation. **Authority:** ADR-006 (dataset/benchmark governance),
ADR-010 (public data is evaluation input, not commercial evidence), and the
M61/M62 execution package.

**The one rule this runbook exists to enforce:** registering a dataset is
*not* permission to acquire it. `web/eval/datasets/registry.json` describes
what a dataset is and what it may be used for. Accepting a license, creating
an account, and downloading bytes are **manual human-approval steps** that
happen here, on one machine, and never in git.

## The approval boundary (read this first)

Every registry entry carries an `approvalStatus`:

| Value | Meaning | May bytes exist locally? |
|---|---|---|
| `metadata-only` | Registered; terms **not** accepted, nothing downloaded. Default. | No |
| `requested` | Approval sought, not yet granted. | No |
| `approved` | A human approved acquisition. Checksums may be recorded. | Yes |
| `declined` | Deliberately not acquiring. | No |

A fresh clone ships **only** `metadata-only` entries. If you did not
personally move an entry to `approved`, treat its data as not authorized to
download. Automated tooling must never bypass registration, click-through
agreements, credentials, consent restrictions, or non-commercial terms.

## Where data lives

- **Tracked (git):** `web/eval/datasets/registry.json` — metadata only.
- **Local-only (gitignored):** each entry's `localPathConvention`, resolved
  relative to `web/eval/`. Example: `datasets/local/ui-prmd/` →
  `web/eval/datasets/local/ui-prmd/`.
- `.gitignore` blocks `web/eval/datasets/local/`, common raw media/motion
  extensions (`*.mp4`, `*.c3d`, `*.trc`, `*.bvh`, `*.mot`, `*.sto`, …), and
  everything under `web/eval/datasets/` except `registry.json`. Do not weaken
  these rules to "temporarily" commit a sample.

## Procedure

### 1. Approve

1. Read the entry's `license` block and the official terms at
   `source.officialUrl`. Confirm `commercialUse`, `redistribution`, and
   `accessRequirement` still match reality — recheck at download time; terms
   drift.
2. Confirm the intended work is inside `use.allowedUses` and does not touch
   `use.prohibitedClaimUses`.
3. If access needs registration/agreement/credentials, complete it **as a
   human** under your own identity. Record nothing secret in the repo.
4. Edit the entry: set `approvalStatus` to `approved`. Commit that metadata
   change with the rationale. This is the auditable approval record.

### 2. Acquire

1. Download to the resolved `localPathConvention` directory only.
2. Keep the original archive until integrity is verified.
3. Never place raw data anywhere outside the gitignored local cache.

### 3. Verify integrity

1. Compute a digest of each downloaded archive:
   ```
   sha256sum <archive>        # or: shasum -a 256 <archive>
   ```
2. Add a `checksums` array to the entry (`algorithm`, lowercase-hex `value`,
   `covers` = the bare archive filename). The validator refuses checksums on
   any entry whose `approvalStatus` is not `approved`, so this step forces
   the approval record to exist first.
3. If a published checksum exists upstream, compare against it and record the
   source in `notes`.

### 4. Extract

1. Extract into the same local cache directory.
2. Strip or avoid retaining faces and raw video where the evaluation only
   needs derived landmarks (ADR-010 privacy stance). Prefer de-identified,
   derived artifacts.
3. Do not copy extracted frames, video, or participant-linked landmarks into
   any tracked path.

### 5. Reproduce (without redistributing)

1. Record the dataset `id` + `version`, adapter/skeleton mapping, and the
   MediaPipe/model/filter/algorithm versions in any benchmark output (ADR-006
   requires every result to identify these). Benchmark *aggregates* that
   contain no participant media may be tracked; source media may not.
2. A second operator reproduces by re-approving and re-acquiring from
   `source.officialUrl` using the recorded version and checksums — never by
   receiving the data from you.

### 6. Delete

1. When done, delete the local cache directory. Because it is gitignored,
   nothing needs to be un-committed.
2. If the dataset should not be acquired again, set `approvalStatus` to
   `declined` and note why.
3. Deleting local bytes does not require removing the registry entry — the
   metadata record is the durable, shareable part.

## Adding a new candidate

Add a `metadata-only` entry to `registry.json` with full provenance,
license, content, `localPathConvention`, and both `allowedUses` and
`prohibitedClaimUses`. Run `npm test` — `datasetRegistry.test.ts` validates
the file. Registration alone authorizes nothing; acquisition still runs this
runbook.

## Local event-label storage

Keep source media, draft labels, frozen labels, and `.recovery` files in the approved local study directory; all are ignored by Git. Initialize labels from the original media so its SHA-256 is captured. Work in blinded mode only, freeze two independent raw records before comparison, and write adjudication to a new third file. Never put participant paths, names, media, raw labels, or recovery files in a tracked directory. Verify exports with the label parser before backup or custody transfer.
