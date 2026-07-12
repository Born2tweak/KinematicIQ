# M78 — Inline-lunge data and label gate

**Status:** Acquisition/provenance gate partially complete; independent label
gate remains open (2026-07-12).

The owner approved the inline-lunge dataset gate. The PLOS paper's official
data-availability statement resolves LLM-FMS to Figshare collection 7601630 v1.
Its three CC BY 4.0 artifacts were acquired into the gitignored local cache;
local MD5 values match Figshare's published hashes and SHA-256 values are stored
in the dataset registry. The keyframe and label archives are readable. Archive
inspection found 135 label/keyframe pairs for each of LLM-FMS m05 (left inline
lunge) and m06 (right inline lunge). LLM-FMS m03 is hurdle step, so movement IDs
must never be transferred between UI-PRMD and LLM-FMS by number alone.

A checksum-gated `eval:llm-fms` command now extracts only the six m05/m06
source rules into the deterministic M78 ontology report. The adapter rejects
movement-ID drift and unsupported/empty rule fields and structurally excludes
per-keyframe `score` and `ruleResults` fields. The report is research metadata,
not a runner, coaching library, or validation result.

The original UI-PRMD site returned HTTP 403 in the current session. The approved
deep-learning repository contains only reduced, time-normalized matrices and is
not a substitute for original timed m03 trials, so no mirror was acquired.

LLM-FMS remains ontology input only. It does not provide independent event
labels or synchronized 2D/3D angle truth. Two-rater labels, subject-held-out
splits, agreement, and predeclared count/event/dropout gates remain required
before runner implementation or protocol availability. The executable labeling
instructions and acceptance contract are in
`docs/validation/INLINE_LUNGE_LABELING_PROTOCOL.md`.
