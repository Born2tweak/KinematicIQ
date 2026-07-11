# ADR-009: Aurelian Compatibility Layer, Not Full Scaffold Duplication

- **Status:** Accepted
- **Date:** 2026-07-10

## Context

The current Aurelian template proposes project brief, bible, technical spec, experience bible, constitution, agent context, roadmap, research gaps, resource atlas, and durable logs. KinematicIQ already has mature canonical equivalents under `docs/`, including doctrine, architecture, roadmap, research, validation, UX, ADRs, and milestone progress. It had a Claude loader but no root Codex `AGENTS.md` or `.aurelian/` indexes.

## Decision

Install a compatibility layer:

- root `AGENTS.md` for Codex behavior, canonical paths, boundaries, and verification;
- update the stale Aurelian path in `CLAUDE.md`;
- `.aurelian/project-state.md`, `evidence-log.md`, `decision-log.md`, `resource-index.md`, and `traceability.md` as indexes into existing truth.

Do not copy the generic Aurelian `docs/00`-`08` set or Cursor/Claude templates over existing structures. Do not modify untracked user-owned agent scaffolds.

## Consequences

- Agents share Aurelian behavior without a second roadmap/doctrine system.
- `.aurelian` stays concise and points outward; canonical product facts remain in existing KinematicIQ docs.
- Future updates should remove duplication rather than expand the compatibility layer.

## Revisit when

The project intentionally consolidates its canonical documentation hierarchy.
