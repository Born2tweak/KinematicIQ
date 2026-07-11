# Next Protocol Portfolio (M73)

**Decision date:** 2026-07-11  
**Scope:** research ordering only; no protocol activation or acquisition approval

## Scoring model

Each factor is scored 1 (weak/high burden) to 5 (strong/low burden). Evidence
readiness and product value are weighted twice because a useful protocol that
cannot be validated is not executable. Claims safety is scored higher when a
narrow camera observation can avoid diagnostic or injury language.

| Candidate | Evidence ×2 | Value ×2 | RGB fit | Runtime pressure | Claims safety | Data feasibility | Total / 40 | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Inline lunge | 5 | 4 | 4 | 4 | 3 | 4 | **33** | next research package |
| Hip hinge | 2 | 5 | 5 | 3 | 2 | 2 | 24 | retain as next, needs labeled corpus |
| Push-up | 3 | 4 | 4 | 3 | 4 | 3 | 24 | research after lunge/hinge |
| Jump/landing | 3 | 4 | 3 | 5 | 1 | 3 | 23 | deferred until event/height reference |
| Gait/running | 4 | 4 | 2 | 5 | 2 | 2 | 25 | research; capture/runtime burden high |
| Overhead | 2 | 3 | 2 | 4 | 2 | 2 | 19 | deferred; out-of-plane weakness |
| Rotation | 2 | 3 | 1 | 5 | 2 | 2 | 18 | deferred; single-view depth ambiguity |
| Pull | 1 | 3 | 3 | 3 | 2 | 1 | 16 | deferred; apparatus/load context |
| Sprint | 3 | 4 | 1 | 5 | 1 | 2 | 21 | deferred; frame-rate/path constraints |

## Why inline lunge ranks first

UI-PRMD includes inline and side lunges with Vicon and Kinect skeletons and
defined non-optimal demonstrations. LLM-FMS separately includes inline-lunge
keyframes and reasoning labels. A 2024 simultaneous 2D/3D fencing-lunge study
found strong sagittal knee-angle correspondence but material ankle/hip bias,
which supports a narrow knee/event research question while explicitly blocking
blanket joint-angle validity claims.

Hip hinge remains valuable and simpler for a side-view product, but the current
evidence inventory has no approved labeled hinge corpus, no agreed event
definition, and a high temptation to imply spinal safety or load mechanics.

## Owner approval checkpoint

This ranking authorizes only the adjacent inline-lunge research specification.
It does **not** authorize downloading new UI-PRMD/LLM-FMS files, implementing a
runner, changing the existing hip-hinge stub, or making the protocol available.
Those actions require a later milestone and explicit data/availability approval.

## Primary sources

- Vakanski et al., *A Data Set of Human Body Movements for Physical
  Rehabilitation Exercises*, DOI `10.3390/data3010002`.
- Zhou et al., *LLM-FMS: A fine-grained dataset for functional movement screen
  action quality assessment*, DOI `10.1371/journal.pone.0313707`.
- Chida et al., *Assessing the validity of two-dimensional video analysis for
  measuring lower limb joint angles during fencing lunge*, DOI
  `10.3389/fspor.2024.1335272`.
