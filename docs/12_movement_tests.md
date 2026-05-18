# KinematicIQ Movement Test Research Report

## Executive Summary

The best MVP movement tests for a camera-based athlete movement product are simple, repeatable, easy to standardize, and visually rich enough to reveal meaningful mechanics from one view. In practice, that means prioritizing bodyweight squat, countermovement jump, single-leg landing, single-leg squat, and a basic balance or split-stance test, while delaying more environment-sensitive tasks like sprint start, acceleration, cutting, and broad jump.

Movement screens are most useful when they reveal mobility limits, stability loss, asymmetry, compensation, landing control, and coordination under a standardized challenge — not when they try to predict injury or diagnose pathology. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC4595915/)

For KinematicIQ, the most defensible software value is **trend-based movement intelligence**: observable quality changes over time, bilateral differences, and repeatable mechanics under the same setup. The strongest camera-first tests are those where the key outputs are visible in 2D — trunk lean, knee tracking, depth, stance symmetry, jump height proxy, landing stiffness proxy, and timing consistency. The weakest are those that depend on forces, speed, or out-of-plane rotations that 2D video cannot capture reliably. [arxiv](https://arxiv.org/html/2509.17805v1)

---

## Foundations of Movement Testing

Movement tests expose how an athlete organizes force, posture, and control under a task — not just whether they can complete it. Coaches and sports scientists use them to find mobility restrictions, stability deficits, asymmetry, coordination issues, and compensation patterns that affect performance or training decisions.

A good movement test is standardized, repeatable, safe, easy to coach, and sensitive enough to show meaningful differences between athletes or over time. Clear, consistent failure modes are essential — vague or highly variable tasks reduce reliability. Tests become unreliable when setup changes, coaching cues differ, fatigue is uncontrolled, judges score subjectively, or the movement has too many degrees of freedom for the observation method. [jospt](https://www.jospt.org/doi/10.2519/jospt.2012.3838)

For longitudinal tracking, the best tests are quick, familiar, and repeatable, producing stable metrics with low measurement error. Jump tests and basic closed-chain tasks are often preferred for monitoring because some jump measures have shown sensitivity to fatigue and readiness trends when tracked consistently. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/32301681/)

**A movement test is suitable for computer vision when:**
- The main signals are externally visible
- The motion can be standardized
- Critical mechanics happen in the camera plane

**A movement test is unsuitable when it depends on:**
- Absolute force or internal joint loading
- Very fast events with motion blur
- Heavy occlusion
- Complex 3D rotations a single camera cannot infer reliably

The easiest tests to standardize — bodyweight squat, CMJ, single-leg landing, push-up, plank, and balance tasks — require little space, little equipment, and relatively fixed instructions. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10635560/)

---

## Movement Test Breakdowns

### Bodyweight Squat

A basic closed-chain test assessing ankle, knee, hip, trunk, and foot control under bilateral loading. Widely used in screening, warm-up assessment, and movement coaching because it is familiar and easy to repeat.

**Biomechanics:** Reveals ankle dorsiflexion, hip flexion, trunk control, knee tracking, and load symmetry — especially from front and side views.

**Common deficiencies:** Heel rise, knee valgus, hip shift, torso collapse, asymmetrical weight shift.

**Camera can reliably detect:** Depth, trunk angle, knee collapse, heel lift, stance width.

**Camera cannot reliably separate:** Ankle mobility from foot placement strategy; true joint moments from 2D alone.

**MVP verdict: Strong inclusion.** Easy to standardize, understandable to athletes, strong longitudinal baseline. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10635560/)

---

### Overhead Squat

Adds a shoulder and thoracic mobility demand to the squat pattern, making it a more global screen. Useful for revealing combined restrictions in ankle dorsiflexion, hip mobility, thoracic extension, shoulder flexion, and trunk control.

**Camera can detect:** Trunk lean, rib flare, shoulder compensation, heel rise.

**Limitations:** Visual interpretation is confounded by mobility limitations above and below the trunk. Single-camera scoring becomes less reliable when arm position is partially out of frame or athlete proportions differ widely.

**MVP verdict: Secondary to regular squat.** Harder to standardize cleanly. [arxiv](https://arxiv.org/html/2509.17805v1)

---

### Countermovement Jump (CMJ)

One of the best readiness and neuromuscular monitoring tests — quick, familiar, and sensitive to changes in output and movement strategy. Used for weekly monitoring, match-to-match tracking, and readiness trend analysis.

**Biomechanics:** Rapid eccentric downward phase followed by concentric push-off, with strong contributions from ankle, knee, hip, and trunk.

**Camera can detect:** Jump height proxy, countermovement depth, arm swing behavior, time to takeoff, landing strategy.

**Camera cannot measure:** Force, impulse, or true power from video alone.

**MVP verdict: Excellent** — especially with hands-on-hips and fixed takeoff/landing view. [scienceforsport](https://www.scienceforsport.com/countermovement-jump-cmj/)

---

### Vertical Jump

Highly familiar to athletes and coaches; overlaps with CMJ but can be performed with different instructions (squat jump, CMJ, free arm swing). Jump height proxy is intuitive and easy to explain.

For readiness tracking, CMJ is usually better because the countermovement makes small strategy changes easier to observe consistently.

**Camera can capture:** Jump height proxy, takeoff timing, landing symmetry, trunk posture.

**MVP verdict: Treat as a family of tests.** The hands-on-hips CMJ is the most standardizable version. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/33900263/)

---

### Drop Jump

Valuable for reactive strength and landing mechanics — stresses stretch-shortening and deceleration qualities. More demanding than a simple jump because the athlete must absorb force quickly after stepping off a box.

**Camera can detect:** Landing depth, knee flexion strategy, trunk lean, time on ground.

**Limitations:** True reactive strength index requires jump height and contact time measured more precisely than most single-camera setups can guarantee. Box height, step-off behavior, and landing instructions strongly affect results.

**MVP verdict: Useful later** — especially for basketball and jumping athletes. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10625647/)

---

### Jump Landing

One of the most valuable tests for camera-based movement intelligence because landing mechanics are visually expressive and clinically meaningful. Used to assess dynamic knee valgus, trunk control, hip strategy, and symmetry during shock absorption. Research shows asymmetries are often more pronounced during landing than takeoff. [digitalcommons.sacredheart](https://digitalcommons.sacredheart.edu/cgi/viewcontent.cgi?article=1212&context=computersci_fac)

**Front/diagonal view:** Knee collapse, hip shift, trunk lean.

**Side view:** Landing depth, ankle strategy, stiffness.

**Camera cannot directly measure:** Ground reaction forces or ligament loading.

**MVP verdict: Excellent for coaching feedback and trend tracking.** Not for injury prediction claims. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8038785/)

---

### Single-Leg Squat

A strong test of unilateral control, hip stability, pelvic control, and limb strategy. Especially useful for asymmetry detection because left and right sides can be compared under the same movement demand.

**Biomechanics:** Challenges hip abductor control, knee alignment, ankle stability, and trunk balance.

**Camera can track:** Pelvic drop, knee valgus, trunk lean, hip shift, depth consistency, side-to-side differences.

**Camera limitation:** Transverse-plane hip rotation is less reliable in 2D.

**MVP verdict: Very strong asymmetry test** — especially from the front view. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/25128206/)

---

### Split Squat

Adds staggered unilateral loading without requiring full locomotion. Reveals hip mobility, trunk control, and stance-side load transfer. Easier to standardize than lunge variations for many athletes.

**Camera can observe:** Torso drift, knee track, balance, depth symmetry.

**Limitation:** Step length and foot placement strongly affect the movement.

**MVP verdict: Useful in Phase 2** as a controlled unilateral strength-mobility test.

---

### Lunge

Evaluates stepping mechanics, midline control, and lower-limb symmetry. Reveals the quality of the transition from stance to step rather than pure strength. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/120199-comparing-the-scores-of-the-functional-movement-screen-in-individuals-with-low-back-pain-versus-healthy-individuals-a-systematic-review-and-meta-ana)

**Camera can detect:** Stride length, trunk angle, knee alignment, balance loss.

**Limitation:** Sensitive to step length and sequencing errors.

**MVP verdict: Useful but not as strong** as squat, CMJ, or single-leg squat for initial scope.

---

### Hip Hinge

Exposes trunk control, hip flexion strategy, and spinal posture. Maps to deadlift mechanics, acceleration posture, and landing preparation.

**Camera can detect:** Torso angle, lumbar-pelvic control proxy, knee bend, hip displacement.

**Best view:** Side.

**MVP verdict: Strong posture-control test** — especially for athletes needing better posterior-chain mechanics.

---

### Broad Jump

A horizontal power test reflecting hip extension power, projection, and landing control. Complements vertical jump by emphasizing horizontal force production. [scholarworks.utep](https://scholarworks.utep.edu/cgi/viewcontent.cgi?article=4336&context=open_etd)

**Camera can measure:** Takeoff/landing distance proxies, hop strategy, trunk angle, landing symmetry.

**Limitations:** Exact force output not inferable from 2D; sensitive to floor marking accuracy and camera parallax.

**MVP verdict: Useful but not as clean** as vertical jump or CMJ.

---

### Sprint Start

High-value athletic skill test, but difficult for one-camera analysis — early acceleration is fast, occlusion-prone, and spatially demanding.

**Camera can capture:** Trunk angle, shin angle, step timing, first-step posture (from side/diagonal).

**Cannot reliably capture:** True acceleration, force, or split-second asymmetry.

**MVP verdict: Delay.** Not a first-priority test.

---

### Acceleration Sprint

More informative than sprint start over multiple steps, but still hard to standardize in ordinary camera conditions. Affected by camera distance and motion blur.

**Camera can estimate:** Body lean, step frequency, stride length proxy, timing consistency.

**MVP verdict: Delay.** Not suitable for initial product scope.

---

### Deceleration Test

Assesses how well an athlete absorbs speed without collapsing, rotating, or losing alignment. Highly relevant for basketball — hard braking is a common game action. Reveals eccentric control, trunk stability, knee alignment, and braking strategy.

**Camera can observe:** Foot placement, torso lean, knee collapse, center-of-mass control over the plant foot.

**MVP verdict: Valuable later** — especially in sport-specific modules.

---

### Lateral Shuffle or Cut

Exposes frontal-plane control, trunk control, and change-of-direction mechanics. Relevant for basketball and other court sports. Reveals asymmetry, knee valgus, and poor force redirection.

**Camera can detect:** Trunk lean, knee collapse, step strategy.

**Limitation:** Approach speed and plant angle vary significantly.

**MVP verdict: Advanced layer.** Belongs in a sport-specific module, not MVP.

---

### Push-Up

Good upper-body and trunk control test — easy to standardize and visually clear. Used in screening to assess trunk stiffness, scapular control, and symmetrical upper-body loading. [jospt](https://www.jospt.org/doi/10.2519/jospt.2012.3838)

**Camera can track:** Torso sag, hip pike, elbow symmetry proxy, tempo consistency.

**MVP verdict: Strong supplementary test.**

---

### Plank

Static trunk endurance and posture-control test. Identifies lumbar collapse, pelvic rotation, shoulder support strategy, and fatigue-related form loss. Because the task is static, it is easier to standardize than many dynamic tests.

**Camera can detect:** Line quality, hip drop, shoulder shift, sway over time.

**MVP verdict: Optional but useful** — good fatigue-sensitive posture benchmark.

---

### Balance Test

Simple way to expose postural control and sway. Easy to standardize and interpret at a basic level. Reveals deficits in ankle, hip, and trunk control.

**Camera can estimate:** Sway, foot repositioning, upper-body compensation.

**Limitation:** Small sway signals can be noisy in 2D video.

**MVP verdict: Useful as auxiliary test** for trend tracking.

---

### Single-Leg Landing

One of the most informative and visually rich tests for asymmetry and landing control. Used to examine knee valgus, trunk lean, hip strategy, and shock absorption. Research suggests landing errors and trunk lean can reflect mechanics associated with ACL risk — though KinematicIQ should not claim injury prediction. [sciencedirect](https://www.sciencedirect.com/science/article/abs/pii/S0268003323000736)

**Camera can detect:** Initial contact strategy, knee collapse, trunk lean, pelvic motion, landing symmetry (front/diagonal view).

**Cannot measure:** Actual ligament loading or internal joint moments.

**MVP verdict: Top-tier test.** Visually meaningful and highly coachable.

---

## Ranking Movement Tests

### Best Overall MVP Tests

| Rank | Test | Why It Ranks Highly |
|------|------|---------------------|
| 1 | Bodyweight squat | Easy to standardize, familiar, strong posture and alignment signal |
| 2 | CMJ | Excellent readiness and repeatability, strong longitudinal value [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/32301681/) |
| 3 | Single-leg landing | Very rich asymmetry and landing-control signal [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8038785/) |
| 4 | Single-leg squat | Strong asymmetry and unilateral control test [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/25128206/) |
| 5 | Push-up | Simple, repeatable, easy to camera-capture [jospt](https://www.jospt.org/doi/10.2519/jospt.2012.3838) |

### Best Asymmetry Tests

1. Single-leg landing
2. Single-leg squat
3. Split squat
4. Lunge
5. Balance test

These expose left-right differences in stance, trunk control, pelvic control, and landing strategy better than bilateral tests. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/141870-between-day-reliability-of-kinematic-variables-using-markerless-motion-capture-for-single-leg-squat-and-single-leg-landing-tasks)

### Best Readiness Tests

1. CMJ
2. Vertical jump (standardized setup)
3. Drop jump
4. Landing mechanics under repeated trials
5. Plank or balance (supporting fatigue markers)

[pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/32301681/)

### Best Landing Mechanics Tests

1. Single-leg landing
2. Jump landing
3. Drop jump
4. CMJ landing phase
5. Lateral landing variants

[pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8136551/)

### Best Posture-Control Tests

1. Bodyweight squat
2. Overhead squat
3. Hip hinge
4. Push-up
5. Plank

[pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC4595915/)

### Best Single-Camera Tests

1. Bodyweight squat
2. CMJ
3. Single-leg landing
4. Single-leg squat
5. Push-up

These are the most robust because key mechanics are visible in one plane and the movement can be standardized. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/40756794/)

### Best Basketball Tests

1. CMJ
2. Single-leg landing
3. Deceleration test
4. Lateral shuffle/cut
5. Drop jump

Basketball rewards vertical power, landing control, braking, and unilateral stability — these tests align with those demands. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10625647/)

### Best Longitudinal Tracking Tests

1. CMJ
2. Bodyweight squat
3. Single-leg landing
4. Single-leg squat
5. Push-up or plank

Best for repeated measurement because they are easy to repeat consistently and likely to show real trend changes rather than noise. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12023505/)

---

## Camera Angle and Setup

**Front view** is best for: symmetry, knee valgus, hip shift, pelvic drop, shoulder level, bilateral comparisons.

**Side view** is best for: depth, trunk lean, hip hinge, landing stiffness proxy, sagittal-plane mechanics.

**Diagonal view** can capture both trunk orientation and lower-limb alignment, but is less standardized than pure front or side.

**Camera height:** Mid-thigh to waist level for squat and landing tasks; closer to hip height for jump landing and single-leg work to reduce perspective distortion.

**Distance:** Far enough to keep the whole body in frame through the full movement, with space for takeoff, landing, and lateral sway. Good lighting and a plain background reduce false asymmetry from occlusion and low contrast. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10635560/)

**KinematicIQ setup requirements:**
- Clear on-screen setup instructions before each test
- Automatic verification that the full body stays in frame
- Camera stability check
- Movement-plane match for the selected test
- Rep count confirmation

**View requirements by test:**
- CMJ, hip hinge, landing depth: require side view
- Squat symmetry, single-leg landing asymmetry, valgus observations: require front view

Poor setup is most damaging for fast tests, occlusion-heavy movements, and any movement where the body rotates away from the camera. [arxiv](https://arxiv.org/html/2509.17805v1)

---

## Standardization and Reliability

Reliable movement testing depends on consistent instructions, camera setup, footwear, and rep count across sessions. Warm-up and fatigue should be standardized because both can materially change movement quality, especially for jumps and landing tasks. [scienceforsport](https://www.scienceforsport.com/countermovement-jump-cmj/)

**Practical defaults:**
- Dynamic tests: 2–3 practice reps, then 3 recorded reps; use best or median rep
- Static tests (plank, balance): fixed time window with clear stop rule

**KinematicIQ should invalidate a test when:**
- Camera angle is wrong
- Athlete leaves the frame
- Rep count is incomplete
- Movement is materially different from the instruction
- Athlete clearly loses balance or pauses mid-rep

**Software should detect poor test quality by checking:**
- Movement completeness
- Temporal consistency
- Body visibility
- Rep-to-rep variance
- Capture match to the selected movement type

**Flag likely false asymmetry when:**
- Camera angle is oblique
- One limb is occluded
- Athlete rotates out of the plane

Reliability is highest when the movement is simple, repeatable, and largely contained in a single visual plane. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/40756794/)

---

## Readiness and Fatigue Testing

CMJ is the most useful readiness test — fast, repeatable, and sensitive to changes in performance or neuromuscular state when tracked consistently. Landing mechanics also matter because athletes often change landing stiffness and control under fatigue. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8136551/)

**KinematicIQ must not claim medical fatigue detection.** The safe framing is trend-based interpretation:

> "This movement looks lower than your baseline."
> "Your landing symmetry has changed relative to prior sessions."

**What the software can realistically track:**
- Jump height proxy
- Countermovement depth
- Time-to-takeoff
- Asymmetry
- Rep-to-rep variability

**What to avoid claiming:** Recovery status, injury risk, or physiological fatigue without direct evidence.

A useful pattern is **baseline comparison over time** — especially before practice or games. A trend of reduced jump height proxy, increased landing stiffness, or greater asymmetry across repeated sessions can be presented as a movement quality change, not a diagnosis. That is the right level of certainty for a video-only system. [diva-portal](https://www.diva-portal.org/smash/get/diva2:1830887/FULLTEXT01.pdf)

---

## Movement Test Progression Strategy

| Layer | Tests | Rationale |
|-------|-------|-----------|
| **Layer 1 (MVP)** | Bodyweight squat, CMJ, single-leg landing | Most standardizable, visually rich, easy to explain |
| **Layer 2 (Phase 2)** | Single-leg squat, push-up, plank, lunge | Deepen asymmetry and control analysis without overwhelming setup |
| **Advanced (Future)** | Drop jump, deceleration, lateral cut, sprint start, acceleration | Sport-specific; require tighter capture conditions |

**Recommended onboarding order:**
1. **Bodyweight squat** — easiest universal test to understand and standardize
2. **CMJ** — adds readiness and power monitoring while remaining camera-friendly
3. **Single-leg landing + single-leg squat** — unlocks unilateral analysis

---

## Recommended MVP Test Suite

### Movement Scan (3 tests, ~5 minutes)

A short, coach-guided assessment — one test at a time, clear setup visuals, simple rep counter, immediate feedback after completion.

| Test | Reps | Key Outputs |
|------|------|-------------|
| Bodyweight squat | 3 recorded (1 practice) | Depth, trunk angle, knee tracking, heel rise, control consistency |
| CMJ | 3 recorded | Jump height proxy, takeoff consistency, landing stiffness proxy, symmetry |
| Single-leg landing | 2–3 per side | Trunk lean, pelvic drop, knee tracking, side-to-side differences |

### Jump Readiness Scan

Centers on CMJ plus landing quality. Main outputs: jump height proxy, takeoff consistency, landing stiffness proxy, side-to-side landing symmetry.

**Instructions:** Hands on hips, 3 reps, baseline-vs-today trend display.

### Asymmetry Scan

Single-leg landing and single-leg squat on both sides, 2–3 reps per side. Output emphasizes side-to-side differences in trunk lean, pelvic drop, knee tracking, stance stability, and landing control.

### Historical Storage

Prioritize: baseline averages, best rep, median rep, and change-over-time trends — not a single lifetime score.

---

## Open Problems and Limitations

The biggest limitation is that **2D video cannot directly measure force, torque, impulse, or internal joint loading.** KinematicIQ should never imply laboratory-grade biomechanics from a phone camera alone.

**Major risks:**

- **False asymmetry** — when the camera is not perpendicular to the movement plane, when limbs are occluded, or when athlete body proportions create perspective error
- **Anatomy vs. dysfunction** — some movements look "bad" because of limb length, anatomy, or sport-specific style rather than actual dysfunction
- **Hardest tests for MVP** — sprint acceleration, cutting, and any movement with rapid speed changes or strong out-of-plane rotation; these need better environmental control, more camera coverage, or external sensors

**KinematicIQ must avoid overclaiming:**
- Injury prediction
- Fatigue diagnosis
- Medical readiness

**Correct framing:** Movement observations, baseline changes, and coaching cues — not diagnoses. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8038785/)

---

## Sources

- FMS task reliability and utility: [lermagazine](https://lermagazine.com/article/clinical-utility-of-the-fms-and-its-component-tasks), [jospt](https://www.jospt.org/doi/10.2519/jospt.2012.3838)
- CMJ as readiness monitor: [scienceforsport](https://www.scienceforsport.com/countermovement-jump-cmj/), [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/32301681/), [diva-portal](https://www.diva-portal.org/smash/get/diva2:1830887/FULLTEXT01.pdf)
- Landing mechanics and asymmetry: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8038785/), [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8136551/)
- Single-leg squat and landing camera feasibility: [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/40756794/), [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/141870-between-day-reliability-of-kinematic-variables-using-markerless-motion-capture-for-single-leg-squat-and-single-leg-landing-tasks)
- Markerless motion capture reliability: [arxiv](https://arxiv.org/html/2509.17805v1), [digitalcommons.sacredheart](https://digitalcommons.sacredheart.edu/cgi/viewcontent.cgi?article=1212&context=computersci_fac)
- Squat and posture-control research: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC4595915/), [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10635560/)
- Longitudinal tracking reliability: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12023505/)
- Drop jump and reactive strength: [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10625647/)
- Broad jump and horizontal power: [scholarworks.utep](https://scholarworks.utep.edu/cgi/viewcontent.cgi?article=4336&context=open_etd)
- Single-leg landing and ACL mechanics: [sciencedirect](https://www.sciencedirect.com/science/article/abs/pii/S0268003323000736)
- LBP and FMS comparison: [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/120199-comparing-the-scores-of-the-functional-movement-screen-in-individuals-with-low-back-pain-versus-healthy-individuals-a-systematic-review-and-meta-ana)
- Vertical jump literature: [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/33900263/)
- Camera-based biomechanics overview: [papers.ssrn](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4694104)
