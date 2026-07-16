# Protocol Status Board

| Protocol | Canonical ID | Runtime state | Availability | Evidence state | Allowed claims |
|---|---|---|---|---|---|
| Squat | `squat` | Implemented | Available | Existing experimental/production metric tiers apply per metric board | Only tier-appropriate observational language |
| Forward Lunge | `forwardLungeStrideReturn`; deprecated read alias `inlineLunge` | Six-state experimental research seam; P4-M01 identity migration complete | Unavailable; no live/upload/session/results runtime | Synthetic verification only; participant, synchronized-validity, reliability, and claims gates open | None for coaching, clinical, injury, kinetics, norms, or public performance |
| Sit to stand | `sitToStand` | Planned stub | Unavailable | Guarded outcome only | None |
| Hip hinge | `hipHinge` | Planned stub | Unavailable | None | None |
| Jump | `jump` | Planned stub | Unavailable | None | None |
| Sprint | `sprint` | Planned stub | Unavailable | None | None |

Forward Lunge uses standing, stepping, descending, bottom, ascending, and returning at runtime. These states are not substitutes for the Phase 4 human-label ontology. Availability remains pinned by `web/src/protocols/inlineLunge/inlineLunge.test.ts`, `web/src/protocols/registry.ts`, and `web/src/protocols/runtime.ts`.
