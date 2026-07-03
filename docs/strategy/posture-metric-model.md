# Posture Metric Model — Canonical Glossary

**Status:** Canonical glossary of posture concepts. Each concept = coach vocabulary term → computable definition → honest limits. Tiers reference `validation-strategy.md`. Ship phases reference `execution-roadmap.md`.

Every rendered concept carries a **confidence chip** and uses observation language ("appears," "in this set").

---

## Concept table

| # | Coach concept | Input data | Formula / rule | Tier | Ships |
|---|---|---|---|---|---|
| 1 | **Working depth** | min knee angle per rep (`avgDepth`) | deeper = more hip/knee flexion; band vs. movement profile thresholds | observation | P1 (existing) |
| 2 | **Tall chest / trunk angle through rep** | shoulder→hip angle vs vertical (`avgTrunkLean`); per-rep variance | upright & stable = tall chest; high variance through descent = losing position | observation | P1 (mean) / P2 (through-rep stability) |
| 3 | **Even base / weight centered** | hip-center horizontal shift at bottom (`avgHipShift`) | centered over feet = even base | observation | P1 (existing) |
| 4 | **Even drive** | \|L−R\| min knee angle (`avgKneeAsymmetry`) | balanced left/right bend — **not** a valgus or medical claim | observation | P1 (existing) |
| 5 | **Repeatable** | rep-to-rep depth CV (`depthCV`) | low spread = repeatable pattern | observation | P1 (existing) |
| 6 | **Hinge vs squat strategy** | 3D world landmarks: hip-flexion : knee-flexion ratio at bottom | "bending at knees vs hips" — the coach's exact framing | expert-review | P2 |
| 7 | **Spine stability / neutral** | 3D trunk-segment angular variance through rep | flag drift only; markerless **cannot** resolve upper- vs lower-thoracic — always low confidence, never segmental claims | expert-review / partly unsafe | P2 (honest-confidence only) |
| 8 | **Movement smoothness / efficiency** | hip/COM trajectory over rep | normalized jerk; "where are you losing momentum" | expert-review | P2 |
| 9 | **Arm clearance** | arm swing vs torso during gait (3D) | arms clearing the body while running | expert-review | P5 (sprint) |
| 10 | **Deviation from own baseline** | any concept vs. athlete's own set/session mean | self-referenced z-score-style flagging; deviation > absolute | observation (within-set) | P2 rep-to-rep; longitudinal = future |

## Per-concept copy pattern

Each concept, when rendered, provides:

- **Definition** (internal): the formula row above.
- **User copy** (normal mode): coach language + observation verb. E.g. #2: "Chest stayed tall through the set" / "Chest appears to drop as you descend — in this set."
- **Coach/analyst copy** (analyst mode): the number behind it (angle, ratio, CV) with per-rep breakdown.
- **What not to claim**: no injury, no force/load, no medical language; #7 additionally never claims segmental spine detail.
- **Confidence requirement**: minimum landmark visibility/frame coverage before the concept renders at all; below it, the chip reads Low and copy degrades to neutral or hides.

## Data sources

- Concepts 1–5: `analysis/metricCollector.ts` → `SetMetricsSummary` (already computed in 2D pipeline).
- Concepts 6–8: MediaPipe `worldLandmarks` (3D, metric space), captured on every `PoseFrame` in `cv/poseEngine.ts`, helpers in `cv/pose3d.ts` — wired into `analysis/posture/` in Phase 2.
- Concept 9: gait-window 3D analysis (Phase 5 sprint profile).
- Concept 10: derived layer over any of the above.
