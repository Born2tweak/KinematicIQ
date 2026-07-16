# P4-M10 locked validation readiness

Status: autonomous preflight/report/recomputation tooling complete; confirmatory run blocked and not executed.

The runner preflight requires a signed frozen certificate and exact package hashes, consented frozen locked sources, and three frozen A/B/adjudication label records per source. The report requires one visible row per source, verifies subject/source and exclusion accounting, recomputes count/completion/abstention/safety summaries, requires every named count/event gate, and rejects a `pass` without a confidence interval.

Tests use in-memory schema fixtures and mark every gate `inconclusive`; they are not locked evidence. Because M09 is not frozen and no independent locked human sequences, custodian witness, or statistics reproduction exists, no confirmatory outcome was inspected or created and `G-LOCK` remains blocked.
