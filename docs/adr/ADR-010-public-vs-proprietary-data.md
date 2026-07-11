# ADR-010: Public Data Is Evaluation Input; Proprietary Data Is Commercial Evidence

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

Public pose datasets provide scale, views, occlusion, or action labels. Biomechanics datasets provide marker/force references but are small or research-gated. Exercise-quality datasets provide coaching labels but usually lack anatomical ground truth. No public corpus combines consumer RGB, lab truth, expert faults/cues, edge cases, device diversity, and commercial consent.

## Decision

Classify public data by allowed role:

1. metadata-only reference;
2. local evaluation-only;
3. research/protocol-development only;
4. commercially reusable after legal confirmation;
5. future ML only;
6. excluded/too costly/irrelevant now.

Public data supports diagnosis of the system and external credibility; it does not by itself authorize product media, training, or universal claims. KinematicIQ's long-term evidence asset will be a consented proprietary corpus built in stages: product QA edge cases, expert-labeled protocol/fault data, synchronized lab validation, and prospective field reliability.

## Consequences

- No blanket “public dataset” folder or downloader.
- Participant privacy, consent scope, retention, de-identification, face handling, and derived-landmark reuse are recorded per corpus.
- Strong commercial claims require proprietary or explicitly commercial evidence, not research-only benchmark performance.

## Revisit when

Counsel approves specific commercial dataset use or product strategy adds training/hosted data.
