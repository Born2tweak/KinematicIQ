# Validation Strategy — What Video Can and Cannot Claim

**Status:** Canonical. This is the credibility differentiator: we tier every metric by what it would take to trust it, and we say so out loud. Gold standards named here (force plates, marker-based capture) are the ones performance staff actually use.

---

## Validation tiers

| Tier | Meaning | Bar to ship |
|---|---|---|
| **(a) Observation-only** | Directly visible in 2D landmarks; low interpretation risk | Ships with confidence chip + observation language; no external validation needed |
| **(b) Expert review** | Computable but interpretation-sensitive; a coach/sport scientist should sanity-check outputs on real clips before we lean on them | Ships flagged; collect expert feedback before promoting copy strength |
| **(c) Instrument comparison** | Claims that would need force-plate / marker-based / multi-camera comparison to be quantitative | Do not present as measurement until compared; may ship as qualitative observation only |
| **(d) Unsafe to claim** | Not observable from monocular video at all | Never ship |

## Metric tiering

| Metric / concept | Tier | Notes |
|---|---|---|
| Working depth, trunk lean (mean), hip shift, L/R knee symmetry, depth CV | **a** | 2D image-space; already shipping |
| Trunk-angle stability through rep | **a/b** | Observation, but "losing position" phrasing should get coach review |
| Hinge-vs-squat ratio (3D) | **b** | MediaPipe world landmarks are noisy in depth; expert review on real hinge clips |
| Spine stability / neutral (3D trunk drift) | **b, partly d** | Trunk-level drift is reviewable; **upper- vs lower-thoracic segmentation is (d)** — markerless cannot resolve it; always low-confidence, never segmental |
| Smoothness / normalized jerk of hip/COM | **b/c** | Rankings within an athlete are (b); absolute efficiency claims would need instrumented comparison (c) |
| Arm clearance (sprint) | **b** | Definition itself needs confirming with the practitioner (see `magic-context.md` §4) |
| Within-set deviation flags | **a/b** | Statistics are (a); "meaningfulness" of a flagged rep is (b) |
| Ground reaction force, load, power, torque | **d** | Force-plate territory; video never claims these |
| Injury risk / prediction | **d** | Prohibited outright (`safety-claims.md`) |
| Jump height (flight-time proxy, Phase 5) | **c** | Classic force-plate comparison candidate if a validation pass ever happens |

## What the gold standards give that we don't pretend to

- **Force plates:** kinetics — GRF, impulse, asymmetry of force production, true jump metrics. Video sees kinematics only; we never dress kinematics up as kinetics.
- **Marker-based capture:** millimeter-level segmental kinematics, including spine segments. Markerless landmark models track joints coarsely; this is exactly why concept #7 is capped at low-confidence trunk drift.
- **Multi-camera systems:** out-of-plane accuracy. Single camera means camera-angle sensitivity — hence "from this camera angle" in the allowed language.

## Scientific Validation program (scheduled — runs in parallel with remaining Phase 1 work)

Renamed from "Phase 1.5 — ground truth" (2026-07-03 design review, owner-accepted): ground-truth data is one input; **validation is the goal**. This is a data operation, not a coding phase — its lead time (recruiting, filming, labeling) cannot be compressed by engineering, so its clock starts now. No verdict vocabulary freezes (Phase 2) and no verdict label reaches `validated` (ontology §7) before the relevant deliverable below exists.

### Deliverables

1. **Dataset** — 20–30 real recorded squat sessions across **≥5 different bodies** (varied body types, clothing, lighting, settings), each captured as a pose tape (`PoseTapeMeta`) plus raw video, under the defined front-view protocol. Include deliberately induced patterns (hip-led, knee-led, trunk collapse, lateral shift) for tuning; wild/natural clips are **holdout-only**.
2. **Labeling rubric + hand labels** — written rubric per question; qualified raters label rep count, bottom frames, and the four question verdicts per set. Rubric must state each label's counterfactual (§7 field 7) *before* labeling begins — a label whose counterfactual can't be written can't be validated.
3. **Inter-rater agreement** — ≥2 qualified raters on the same clips, agreement measured per label **before the Phase 2 verdict vocabularies freeze**. If humans can't agree on `progressive-collapse`, no threshold rescues it — the label gets redefined, not retuned.
4. **Test-retest reliability** — same athlete, same protocol, two recordings: report verdict stability. This is the foundation of the deviation-from-own-baseline pitch; a deviation flag is meaningless until it exceeds the instrument's own session-to-session noise.
5. **Counterexample log** — clips/conditions that fool each label, maintained per §7 (`eval-clips/README.md`).

### Recruiting clock (starts immediately — human lead time, no code dependency)

- [ ] Identify 5–8 athletes willing to be filmed (varied bodies/settings); consent covering pose-tape storage and labeling.
- [ ] Identify ≥2 qualified raters (S&C coach / PT / sport scientist) for the labeling and agreement study.
- [ ] Fix the front-view capture protocol document (camera height, distance, framing) so every recording is protocol-compliant — protocol drift invalidates the dataset.
- [ ] Schedule the first recording sessions; each athlete records two sessions (enables test-retest from the same collection effort).

### Later tiers (unchanged in spirit)

1. Expert (coach) review sessions on real clips for all tier-(b) concepts — cheapest, runs alongside labeling.
2. If a partner offers instrumented facilities: side-by-side force-plate session for jump metrics and smoothness proxies (tier c).
3. Publish the tiering openly in the product (analyst mode) — the willingness to show this table **is** the trust story (rendered per `report-design.md` §2.5).
