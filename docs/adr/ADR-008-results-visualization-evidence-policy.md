# ADR-008: Results Visualization Must Be Question- and Evidence-Led

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

The results screen already contains progressive tabs, findings, posture cards, keyed metrics, component summaries, coaching, root causes, replay, a rep timeline, exports, and baseline comparison. The Evidence view is highly repetitive and long. More charts would increase density unless each resolves a concrete interpretation problem.

## Decision

A visualization is allowed only when it names its audience question, uses a metric/event with sufficient validation status for that question, exposes confidence/abstention, and has a text/table alternative. The default Summary stays compact and narrative. Expert views may add rep comparisons, phase timelines, and waveforms only after benchmarked event alignment and coordinate definitions exist.

Every visualization proposal must define:

- question answered;
- source metric/event and validation tier;
- camera/protocol limitations;
- missing/low-confidence behavior;
- linked evidence/video moment where available;
- mobile, keyboard, screen-reader, reduced-motion, and performance acceptance;
- maximum samples/decimation strategy.

## Alternatives considered

1. Dashboard of every metric: rejected as data-display theater.
2. 3D avatar as the main report: deferred; interpretive value is not established.
3. Keep text only: rejected because phase timing and rep-to-rep variation can be clearer visually once validated.

## Consequences

- M68 reduces duplication before M69 adds charts.
- Experimental metrics may appear in Expert with explicit labeling, not as default coaching evidence.
- Visual regression and accessibility evidence are required for visualization milestones.

## Revisit when

User research identifies additional high-frequency questions or validated metrics support new explanatory views.
