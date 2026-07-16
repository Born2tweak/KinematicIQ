# P4-M02 — Auditable Evidence Schemas

**Status:** Complete 2026-07-16 for schema/tooling readiness; human collection remains unauthorized.

PoseTape v2 adds canonical protocol/observation identity, lead side, raw-frame authority, source SHA-256, pseudonymous subject/session/visit keys, device/view metadata, capture/processing versions, transformation lineage, detached label checksums, split, and freeze state. Legacy tapes normalize in memory without on-disk rewriting. Corpus Manifest v2 adds checksum, pseudonymous subject, split, and observation fields while continuing to read v1.

`protocolStudyManifest.ts` validates safe relative paths, SHA-256, consent/use boundaries, subject split isolation, lunge lead side, frozen/tuning separation, referential integrity, and acyclic transformation lineage. Checked-in examples are synthetic placeholders only.

This milestone authorizes no collection, acquisition, license acceptance, filtering change, validation, or availability.
