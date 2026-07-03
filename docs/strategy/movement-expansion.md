# Movement Expansion — MovementProfile Architecture

**Status:** Canonical design for Phases 3–5. Principle (from the field): *"Every movement you look at different things."* Therefore a movement is **configuration, not a forked codebase**.

---

## The abstraction

```ts
MovementProfile {
  id: 'squat' | 'hipHinge' | 'jump' | 'sprint'
  label: string
  kind: 'cyclic' | 'ballistic' | 'gait'   // selects the segmentation engine
  joints: ...          // which angles to compute/prioritize
  phaseConfig: ...     // used by cyclic engine (thresholds, hysteresis)
  repGates: ...        // validation gates for rep counting (cyclic)
  metrics: ...         // which posture concepts to surface (movement-specific priorities)
  scoringWeights: ...  // + thresholds
  feedbackBuilders: ...// per-concept coach copy
}
```

### Segmentation engine kinds

Movements break the rep-cycle assumption differently:

- **cyclic** — reps with a clear bottom (squat, hip hinge) → the existing 4-state phase/rep FSM, parameterized.
- **ballistic** — flight + landing absorption, no "bottom" (jump/landing) → takeoff/landing detection.
- **gait** — continuous, no reps (sprint) → stride segmentation; metrics over a window.

### What stays generic (already movement-agnostic)

`analysis/angles.ts`, `geometry.ts`, `stats.ts`, `metricCollector.ts`, `asymmetryDetector.ts`, `feedback/confidenceCalculator.ts`, `cv/landmarkFilter.ts`, `session/buildSessionResult.ts`.

### What gets parameterized (currently squat-hardcoded)

`analysis/phaseDetector.ts` (FSM thresholds), `repCounter.ts` (~14 gates), `autoStart.ts`, `autoFinish.ts`, `setActivation.ts`, `scoring/scoringConfig.ts`, `scoring/scoringEngine.ts`, `feedback/feedbackReasoning.ts`.

The pipeline reads the active profile from a new `analysis/movement/` registry (`types.ts` + `profiles/*.ts`). Phase 3 re-expresses squat as `profiles/squat.ts` **behavior-preservingly** — all existing tests stay green, proving the abstraction before any new movement lands.

## Per-movement metric priorities

| Movement | Kind | Priority posture concepts | Notes |
|---|---|---|---|
| **Squat** (reference) | cyclic | depth, tall chest/trunk, even base, even drive, repeatable; + hinge-ratio, smoothness (P2) | current thresholds move into `profiles/squat.ts` unchanged |
| **Hip hinge** (Phase 4) | cyclic | hip-flexion dominance, minimal knee bend, trunk angle central, spine drift, repeatable | same joints as squat, different priorities — "bending at hips vs knees" |
| **Jump/landing** (Phase 5) | ballistic | landing-absorption timing ("stiff vs absorbed"), trunk at landing, even base on landing | performance framing only, never injury; takeoff/landing detection replaces the bottom |
| **Sprint** (Phase 5) | gait | **arm clearance**, tall chest/trunk through stride, smoothness | matches the warm-up-run read; time-boxed, may defer behind jump |

## Non-goals for the abstraction

No plugin system, no dynamic loading, no per-movement forks of the pipeline, no universal cross-movement score. A profile is a typed configuration object plus copy builders — nothing more.
