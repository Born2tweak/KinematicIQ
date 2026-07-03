# Product Direction — Posture-First Movement Intelligence

**Status:** Canonical. Written 2026-07-02 following the Daniel Yu (Sport Scientist, Orlando Magic) meeting.
**Supersedes:** the "squat analyzer" framing in `docs/06_prd.md` §1 (PRD retained for Layer 1 requirements).

---

## Thesis

> Pretty skeletons are commoditized. **Interpretation is the moat.**

KinematicIQ turns markerless video into **coach-relevant posture and movement-quality concepts** — tall chest, hinge-vs-squat strategy, spine stability, arm clearance, smoothness/efficiency — with **honest confidence**, and surfaces **meaningful deviations** rather than raw joint angles, so performance staff can ask better questions.

Each movement declares **its own** metric priorities. There is no universal metric set.

## Why this direction (signal from the field)

The 2026-07-02 meeting with an NBA sport scientist reframed the product (full notes: `magic-context.md`):

1. **Markerless is the category, not the compromise.** "We're never going to do anything with markers."
2. **Posture is the product.** "We don't care about knee valgus. We care about posture" — tall chest, arm clearance, bending at knees vs hips, stable/neutral spine throughout, trunk angle throughout.
3. **Deviation beats absolute.** Injury links to "deviation from that athlete's normal movement signature," not any single "bad" movement. We surface deviations; we never predict injury.
4. **Performance framing wins.** "There's more data showing bad movement leads to worse performance than injuries" — movement efficiency, where momentum is lost.
5. **Movement-specific reads.** "Every movement you look at different things." One universal score across movements is not credible.
6. **The gap is real.** "We don't have software that provides the posture metrics we want." That sentence is the product opening.

## What we measure now vs. what we avoid claiming

**Measure and surface (observation language, confidence-gated):**
- Working depth, trunk angle / tall chest, even base (hip shift), even drive (L/R knee symmetry), repeatability (depth CV) — shipping from existing metrics.
- Hinge-vs-squat strategy, spine-stability drift, movement smoothness/efficiency — from 3D world landmarks (Phase 2).
- Deviation from the athlete's own within-set pattern.

**Never claim (see `safety-claims.md`):**
- Injury prediction or risk ("everyone overfits… high false-positive rate").
- Force, load, torque, power, or internal biomechanics from video.
- Medical diagnosis, tissue/joint health, readiness to play.
- Replacing a coach, PT, or sport scientist.

## Product posture

- **Surface the right questions, not verdicts.** Their daily read comes off a set warm-up; context (workload, sleep, warm-up) lives with the staff, not in the app. The software's job is to make a coach's next question sharper.
- **Honest confidence is a feature.** Every concept carries a confidence chip; low confidence suppresses strong claims. Credibility with performance staff comes from what we refuse to claim.
- **Two audiences, one surface.** Normal mode speaks coach language (concepts + cues). Analyst mode exposes joint angles, 3D, and raw traces for staff who want them.

## Roadmap shape

Squat (reference movement, polished) → hip hinge → jump/landing → sprint, all as **MovementProfiles** (configuration, not forked code) — see `movement-expansion.md` and `execution-roadmap.md`.
