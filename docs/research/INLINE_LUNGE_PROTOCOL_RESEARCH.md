# Inline Lunge Protocol Research Package

**Milestone:** M73  
**Status:** Research only; not approved for implementation or availability

## Product question

Can a single consumer RGB recording consistently identify complete inline-lunge
trials and expose their timing plus front-knee sagittal observations, while
abstaining when the line of travel, feet, or bilateral landmarks are unreadable?

The package does not ask whether a lunge is “correct,” safe, diagnostic, or
predictive of injury.

## Proposed capture and runtime

- Side view, camera near hip height, full body and both feet visible.
- Dominant/lead side declared before capture; left and right are separate sets.
- `cyclic` runtime with standing calibration and explicit
  step/descent/bottom/ascent/return phases.
- A trial completes only after the lead foot returns to the calibrated standing
  region. Static split-squat repetitions are a different future protocol.
- Front-view valgus, balance, pain, rear-knee contact, and floor contact are not
  inferred from this view.

## Candidate outcomes

| Outcome | Initial status | Required evidence |
|---|---|---|
| Complete trial count | experimental | subject-held-out exact-count labels |
| Trial duration and phase timing | experimental | independent event labels and tolerance |
| Lead-knee sagittal angle at bottom | research only | synchronized 2D/3D comparison and bias bounds |
| Within-set timing consistency | experimental with at least 3 trials | repeat-session reliability |
| Hip/ankle angle or “upright trunk” cue | excluded initially | metric-specific validity; current literature reports bias |
| Any injury, stability, mobility, or clinical score | forbidden | outside product doctrine |

## Dataset and label plan

1. Use the approved original UI-PRMD inline-lunge files when the official timed
   release is accessible (the UI-PRMD movement namespace must be recorded); preserve
   subject identity only as a pseudonymous split key and retain original timing.
2. Use approved LLM-FMS m05/m06 only to shape an annotation ontology; never
   import its aggregate FMS score as truth or confuse its IDs with UI-PRMD IDs.
3. Independently label standing, step initiation, descent start, bottom, stable
   return, lead side, occlusion, crop, and exclusion reason with two raters.
4. Split by subject. Predeclare count, event-lag, dropout, and runtime gates
   before running KinematicIQ.
5. Add local consumer-RGB negatives: squat, split squat without step, lateral
   lunge, partial step, leaving frame, side swap, bystander, and cropped feet.

## Hard gates for any future implementation milestone

- Approved, original timed seed files and captured checksums.
- Independent labels with inter-rater agreement report.
- Protocol-specific skeleton map and coordinate contract.
- Predeclared event/count/dropout acceptance criteria.
- Runtime parity/negative fixtures and protocol-owned camera copy.
- Claims review that rejects FMS score, injury risk, diagnosis, and “correct.”
- Explicit owner approval to add an implementation milestone and availability
  remains a separate final switch.

Until every gate closes, the existing production registry remains unchanged.
