# ADR-012: Legacy `inlineLunge` Compatibility

**Status:** Accepted contract; execution pending P4-M01.

## Decision

Treat `inlineLunge` as a deprecated historical identifier. P4-M01 must use an additive expand-migrate-contract approach: read old artifacts, write the canonical `forwardLungeStrideReturn` identity for new artifacts, test every serializer/registry/evaluator boundary, and retain source-native `inline-lunge` labels only when explicitly qualified.

P4-M00 performs no production-code rename and deletes no legacy artifact.
