# Traceability Graph

## Active chain

| ID | Type | Artifact | Status | Parents | Children | Confidence |
|---|---|---|---|---|---|---|
| TRACE-PDR-01 | research | `docs/research/PUBLIC_MOVEMENT_DATASET_RESEARCH.md` | active | User research brief | TRACE-PDR-02, ADR-006, ADR-010 | high |
| TRACE-PDR-02 | discovery/audit | `reports/audits/KINEMATICIQ_POST_DATASET_RESEARCH_AUDIT.md` | verified | TRACE-PDR-01, commit `d053203` | TRACE-PDR-03, TRACE-PDR-04 | high |
| TRACE-PDR-03 | engineering reasoning | `docs/implementation/PUBLIC_DATASET_RESEARCH_TO_EXECUTION_MAP.md` | active | TRACE-PDR-01, TRACE-PDR-02 | M61-M74 | high |
| TRACE-PDR-04 | risk | `docs/implementation/KINEMATICIQ_RISK_REGISTER.md` | active | TRACE-PDR-01, TRACE-PDR-02 | M61-M74 gates | high |
| TRACE-PDR-05 | decisions | `docs/adr/ADR-006` through `ADR-010` | accepted | TRACE-PDR-01, TRACE-PDR-02 | Roadmap M61-M74 | high |
| TRACE-PDR-06 | roadmap update | `docs/implementation/KINEMATICIQ_MASTER_EXECUTION_ROADMAP.md` post-M60 wave | active | TRACE-PDR-03, TRACE-PDR-04, TRACE-PDR-05 | `NEXT_EXECUTION_PACKAGE.md` | high |
| TRACE-PDR-07 | execution package | `docs/implementation/NEXT_EXECUTION_PACKAGE.md` | active | TRACE-PDR-06 | M61 then M62/M66 | high |

## Missing links

- External dataset versions, checksums, license snapshots, and adapter outputs do not exist yet; M61-M63 create them.
- A saved benchmark comparison baseline does not exist; M63 creates it before M64 diagnosis or M65 changes.
- Sit-to-stand expert labels and repeated-session reliability evidence do not exist; M71 is research-only until those gates close.
- Browser screenshots from this audit were inspected but are not committed; M67 defines CI-safe visual baselines.
