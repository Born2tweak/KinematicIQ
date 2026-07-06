# Foundations of Human Movement Science

## A research synthesis and R&D specification for KinematicIQ

### Executive Thesis

Human movement is not a library of isolated exercise labels. It is an adaptive, goal-directed process in which a biological body uses perception, neural control, musculoskeletal mechanics, environmental information, and task constraints to produce functional change in body state. The best scientific account is pluralistic: no single theory explains all movement. Bernstein explains degrees of freedom and coordination; Newell explains constraints; dynamical systems and ecological dynamics explain emergence and perception-action coupling; optimal feedback control explains task-relevant error correction under uncertainty; schema and motor program theories explain generalized action organization; motor learning theory explains practice-dependent change.

For KinematicIQ, the practical implication is clear: the platform should not be organized around a small set of gym patterns alone. It should use a universal, layered movement ontology that separates:

1. The task being attempted.
2. The body-environment constraints.
3. The movement primitives and phases.
4. The measurable kinematic, kinetic, temporal, and coordination features.
5. The task-specific success criteria and safety criteria.

The "seven foundational movement patterns" model, usually expressed as squat, hinge, lunge, push, pull, rotate, and gait, is useful for coaching strength-training templates. It is not sufficient as a universal ontology for walking, throwing, reaching, handwriting, balance recovery, dance, wheelchair propulsion, tool use, combat sport, occupational lifting, or neurological rehabilitation.

Throughout this document:

- **Evidence-supported conclusions** are claims directly supported by established motor control, biomechanics, rehabilitation, or sports science literature.
- **Engineering interpretations** are design implications for KinematicIQ inferred from the evidence.
- **Open research questions** are unresolved scientific or product questions requiring validation.

---

# Part 1. What Is Human Movement?

## 1.1 Core Definition

**Evidence-supported conclusion.** Human movement is the observable change in position, orientation, configuration, or force state of the body or its segments over time, produced by interactions among the nervous system, musculoskeletal system, task goals, and environment. Biomechanics typically describes movement through kinematics, kinetics, segmental dynamics, and energy transfer. Motor control describes how the nervous system produces goal-directed action despite noise, delays, redundancy, and changing body-environment dynamics. Shadmehr, Smith, and Krakauer summarize the core motor control problem as making accurate goal-directed movements despite noisy/delayed feedback and variable body-environment mappings [1].

**Engineering interpretation.** KinematicIQ should treat movement as a time-series state transition:

```text
Initial body-environment state
    + intent/task goal
    + individual constraints
    + environmental constraints
    + task constraints
    -> motor solution
    -> observed kinematics/kinetics
    -> outcome and adaptation signal
```

## 1.2 Definitions of Key Terms

| Concept | Working definition | Measurement implications |
|---|---|---|
| Movement | Change in body or segment state over time. | Positions, orientations, velocities, accelerations, joint angles, forces, contacts. |
| Functional movement | Movement organized to accomplish a meaningful task in context. | Requires task goal, environment, and outcome label, not kinematics alone. |
| Motor behavior | The broader study of motor control, motor learning, and motor development. | Combines performance, learning curves, variability, context, and adaptation. |
| Motor control | Processes by which the nervous system coordinates muscles, joints, and sensory information to produce action. | Feedback control, feedforward prediction, synergies, error correction. |
| Motor learning | Relatively durable change in movement capability caused by practice or experience. | Retention, transfer, reacquisition, adaptability, not just acute performance. |
| Movement variability | Trial-to-trial or within-trial variation in movement execution. | Variance, structure of variability, entropy, fractal scaling, task-relevant vs task-irrelevant variance. |
| Movement quality | A task-relative judgment or measurement of how movement is organized, controlled, efficient, safe, and adaptable. | Composite of dimensions, not a universal scalar. |
| Movement efficiency | Achieving a task with appropriate energetic, mechanical, attentional, or temporal cost. | Work, energy expenditure, jerk, co-contraction, time, force economy. |
| Coordination | Functional organization of many degrees of freedom into a task-relevant pattern. | Relative phase, inter-joint timing, synergies, covariance structure. |
| Stability | Capacity to maintain or return to a functional state under perturbation. | Margin of stability, center of mass/base of support, Lyapunov exponents, recovery steps. |
| Adaptability | Capacity to change movement organization when task, body, or environment changes. | Transfer tests, perturbation response, variable practice, generalization. |

## 1.3 How These Concepts Relate

Movement is the observable event. Functional movement is movement evaluated relative to purpose. Motor control produces movement in the moment. Motor learning changes the future control policy. Variability is not simply error; it is both noise and a resource for exploration, adaptation, and redundancy management. Coordination is how degrees of freedom become organized. Stability is the ability of that organization to resist or recover from disturbance. Adaptability is the ability to reorganize when the current solution no longer fits.

```text
Task goal + constraints
        |
        v
Motor control policy <---- sensory feedback and prediction error
        |
        v
Coordinated movement pattern
        |
        +--> performance outcome
        +--> movement quality features
        +--> variability structure
        |
        v
Motor learning and adaptation over repeated exposure
```

**Evidence-supported conclusion.** The body has more mechanical degrees of freedom than are strictly required for most tasks. Bernstein made this "degrees of freedom problem" central to coordination theory, arguing that skill involves organizing redundant degrees of freedom rather than issuing isolated commands to every element [2]. Modern optimal feedback control reframes redundancy as abundance: task-irrelevant variation can be tolerated while task-relevant error is corrected [3].

**Engineering interpretation.** KinematicIQ should not score all deviation from a template as bad. It must distinguish:

- Variation that preserves the task goal.
- Variation that improves adaptability.
- Variation that threatens tissue tolerance, balance, performance, or task success.

**Open research question.** For each movement class, what amount and structure of variability is healthy, adaptive, or risky for a given population?

---

# Part 2. Taxonomy of Human Movement

## 2.1 Why a Universal Ontology Is Needed

A universal ontology must support gross locomotion, fine manipulation, sport skills, occupational tasks, rehabilitation tasks, expressive movement, balance recovery, and mixed behaviors. Exercise categories alone do not cover this space because they classify common training movements, not the full action repertoire.

## 2.2 Proposed Universal Ontology

The ontology should be hierarchical but multi-label. A baseball pitch is not only "rotation"; it is also stance, weight transfer, sequential segmental acceleration, object projection, balance recovery, and perception-action timing. A toddler standing from the floor is transitional movement, postural control, support management, and locomotion preparation.

```text
Human movement
|
+-- Posture and orientation
|   +-- quiet stance
|   +-- seated posture
|   +-- kneeling/quadruped
|   +-- reaching posture
|
+-- Balance and stability control
|   +-- anticipatory postural adjustments
|   +-- reactive balance recovery
|   +-- single-leg stance
|   +-- landing and deceleration
|
+-- Locomotion
|   +-- walking
|   +-- running
|   +-- stair negotiation
|   +-- crawling
|   +-- swimming
|   +-- cycling/wheelchair propulsion
|   +-- climbing
|
+-- Transitional movements
|   +-- sit-to-stand
|   +-- stand-to-sit
|   +-- floor-to-stand
|   +-- rolling
|   +-- getting in/out of vehicles or beds
|
+-- Manipulation
|   +-- reach
|   +-- grasp
|   +-- carry
|   +-- push/pull
|   +-- tool use
|   +-- fine motor control
|
+-- Load management
|   +-- lifting
|   +-- lowering
|   +-- carrying
|   +-- bracing
|   +-- absorbing impact
|
+-- Object and projectile skills
|   +-- throw
|   +-- strike
|   +-- kick
|   +-- catch
|   +-- intercept
|
+-- Athletic and expressive skills
|   +-- jump
|   +-- cut/change direction
|   +-- rotate/twist
|   +-- dance/gymnastics
|   +-- combat/contact skills
|   +-- sport-specific sequences
|
+-- Communication and expression
    +-- gesture
    +-- facial/orofacial movement
    +-- sign language
    +-- artistic movement
```

## 2.3 Cross-Cutting Tags

Every movement instance should also be tagged by:

| Dimension | Examples |
|---|---|
| Goal | transport body, manipulate object, stabilize, evade, express, recover balance |
| Environment | flat ground, incline, stairs, water, unstable surface, opponent, tool |
| Support condition | bilateral, unilateral, suspended, seated, prone, quadruped |
| Contact state | open-chain, closed-chain, mixed, impact, sliding, rolling |
| Load | bodyweight, external load, partner/opponent load, tool load |
| Speed/intensity | slow control, ballistic, cyclic, sustained, maximal |
| Predictability | planned, reactive, perturbation-driven, externally paced |
| Sensory demands | visual tracking, vestibular challenge, proprioceptive uncertainty |
| Skill level | novice, intermediate, expert, impaired, recovering |
| Risk domain | balance, joint load, tissue capacity, collision, fatigue |

## 2.4 Are the Seven Foundational Patterns Sufficient?

**Evidence-supported conclusion.** The seven-pattern model is a useful coaching simplification, but it is not a scientific ontology of all human movement. It overrepresents strength and conditioning tasks and underrepresents posture, balance, locomotor transitions, object manipulation, fine motor control, reactive behavior, perception-action coupling, aquatic movement, assisted mobility, and expressive action.

**Engineering interpretation.** KinematicIQ should use the seven patterns as one "training pattern" layer, not as the root taxonomy.

Recommended mapping:

| Seven-pattern term | Keep as | Limitation |
|---|---|---|
| Squat | Vertical lower-body load-management pattern | Does not cover sit-to-stand, landing, stairs, or crouching unless phase/context is modeled. |
| Hinge | Hip-dominant trunk-lower-body coordination | Not universal; many lifts blend hinge, squat, reach, and balance. |
| Lunge | Split-stance load-management and transition | Does not cover running gait, cutting, or stair ascent fully. |
| Push | Upper/lower force application away from body | Needs contact, load, direction, posture, and object behavior. |
| Pull | Upper/lower force application toward body | Same as push. |
| Rotate | Axial and transverse-plane coordination | Too broad; rotation appears in throwing, gait, reaching, turning, and balance recovery. |
| Gait | Cyclic locomotion | Walking/running are only part of locomotion. |

**Open research question.** Can a commercially useful movement ontology remain simple enough for users while preserving enough structure for scientific validity?

---

# Part 3. Major Theories

## 3.1 Comparative Summary

| Theory | Core idea | Mathematical or formal concepts | Strength | Criticism | Relevance to AI movement analysis |
|---|---|---|---|---|---|
| Bernstein | Skill organizes many degrees of freedom into coordinated functional units. | Redundancy, synergies, freezing/freeing degrees of freedom. | Explains coordination and motor learning complexity. | Broad and sometimes hard to operationalize. | AI must model multi-segment coordination, not isolated joint angles. |
| Newell constraints | Movement emerges from individual, task, and environment constraints. | Constraint spaces, self-organization. | Strong ontology for context-aware movement analysis. | Can become descriptive if not measured precisely. | Core product architecture: movement quality is constraint-relative. |
| Fitts and Posner | Learning progresses through cognitive, associative, autonomous stages. | Stage model, performance error reduction. | Useful coaching and UX model. | Oversimplifies nonlinear learning. | AI feedback should adapt to learner stage. |
| Dynamical systems | Coordinated patterns self-organize from interacting components. | Attractors, order parameters, phase transitions, stability landscapes. | Explains coordination transitions and emergent patterning. | Less direct for intentional planning and cognition. | Useful for detecting stable/unstable coordination states. |
| Ecological dynamics | Behavior emerges from perception-action coupling and affordances. | Affordance landscapes, organism-environment systems. | Strong for sport, real-world tasks, and representative design. | Harder to reduce to lab-style variables. | AI should evaluate information, environment, and action opportunities. |
| Constraints-led approach | Practice design manipulates constraints to invite desired solutions. | Individual/task/environment constraints. | Practical coaching framework. | Evidence quality varies by domain. | AI can recommend constraint changes instead of only cueing errors. |
| Optimal feedback control | The nervous system corrects task-relevant errors efficiently under uncertainty. | Cost functions, state estimation, stochastic control, minimum intervention. | Explains redundancy and flexible correction. | Depends on assumed cost functions and internal models. | AI should infer task goals and penalize task-relevant errors more heavily. |
| Motor program/schema theory | Generalized motor programs and schemas parameterize classes of actions. | Recall schema, recognition schema, invariant features. | Explains rapid actions and transfer from variable practice. | Underplays real-time perception-action dynamics. | Movement templates should be parameterized, not rigid. |
| Perception-action coupling | Perception and movement are mutually coupled in real time. | Optical flow, tau, affordances, control laws. | Essential for sport and environmental interaction. | Difficult to capture with body-only sensors. | AI needs visual/environmental context for open skills. |

## 3.2 Bernstein

**Core ideas.** Bernstein argued that the central problem of movement is coordination under redundancy. The body has many joints, muscles, and possible trajectories, so skill cannot be understood as commanding each element independently. Learning often involves reducing or constraining degrees of freedom early, then gradually freeing them into flexible coordination [2, 4].

**Practical implications.**

- Novices may appear stiff because they reduce complexity.
- Experts may show more adaptable coordination, not less movement.
- Good analysis should examine inter-segment timing and task success, not just whether one segment matches a static ideal.

**Relevance to KinematicIQ.** Model "degrees of freedom management" as a measurable feature: joint coupling, range utilization, timing, compensatory strategies, and task-relevant variability.

## 3.3 Newell's Constraints Model

**Core ideas.** Newell proposed that coordination emerges from interacting constraints: organism/individual, task, and environment [5].

```text
Individual constraints: anatomy, strength, pain, fatigue, skill, cognition
Task constraints: goal, rules, equipment, load, speed, accuracy demand
Environment constraints: surface, gravity, light, space, weather, opponents
```

**Practical implications.** A movement cannot be evaluated fairly without knowing the constraints. A deep squat under no load, a heavy front squat, and squatting to pick up a child are related but not equivalent tasks.

**Relevance to KinematicIQ.** This should be the root framework for metadata and model conditioning.

## 3.4 Fitts and Posner

**Core ideas.** Fitts and Posner's classic stage model describes learning as cognitive, associative, and autonomous [6]. It remains useful, though modern learning is often nonlinear and task-dependent.

**Practical implications.**

- Cognitive stage: feedback should be sparse, simple, and goal-oriented.
- Associative stage: feedback can target coordination patterns and consistency.
- Autonomous stage: feedback should emphasize adaptability, pressure, transfer, and fine constraints.

**Relevance to KinematicIQ.** The same detected feature should not always produce the same feedback. A beginner needs a different cue than an expert.

## 3.5 Dynamical Systems Theory

**Core ideas.** Dynamical systems theory explains movement as emergent coordination among many interacting components. Kelso's work on coordination dynamics and the Haken-Kelso-Bunz model showed that rhythmic bimanual coordination can exhibit attractors, loss of stability, and phase transitions as control parameters change [7, 8].

**Mathematical concepts.**

- State space.
- Attractors and repellors.
- Order parameters such as relative phase.
- Control parameters such as movement frequency.
- Stability and phase transitions.

**Practical implications.** Movement patterns can switch abruptly when speed, load, fatigue, pain, or environmental demands cross a threshold.

**Relevance to KinematicIQ.** KinematicIQ should detect coordination modes and transitions, not only mean joint angles.

## 3.6 Ecological Dynamics and Perception-Action Coupling

**Core ideas.** Ecological dynamics combines ecological psychology, dynamical systems, and constraints theory. It emphasizes affordances: action opportunities defined by the relation between an individual and environment. Gibson's ecological approach is foundational for affordance theory [9]. In sport and open skills, skilled action is tightly coupled to information in the environment [10].

**Practical implications.**

- Training should preserve representative perception-action information.
- A technically "good" movement in a sterile lab may fail in game context.
- Open skills require analyzing both body motion and environmental information.

**Relevance to KinematicIQ.** Video-only skeleton analysis is incomplete for open skills unless it also models ball, opponent, target, surface, timing, and affordances.

## 3.7 Constraints-Led Approach

**Core ideas.** The constraints-led approach uses manipulation of individual, task, and environmental constraints to guide learners toward functional solutions, often through exploration rather than prescriptive correction [11].

**Practical implications.**

- Change task constraints to change movement behavior.
- Let learners search for stable solutions.
- Use representative practice.

**Relevance to KinematicIQ.** Recommendations should include "change the task" options: reduce range, alter tempo, adjust stance, change target, modify load, or constrain degrees of freedom.

## 3.8 Optimal Feedback Control

**Core ideas.** Todorov and Jordan proposed optimal feedback control as a theory of motor coordination. The system corrects deviations that matter for the task while allowing variability in task-irrelevant dimensions [3].

**Mathematical concepts.**

- Cost function.
- State estimation.
- Control policy.
- Stochastic noise.
- Minimum intervention principle.

**Practical implications.**

- Not all variability is error.
- "Good" control depends on the task objective.
- Feedback gains can be selective.

**Relevance to KinematicIQ.** Scoring should be task-weighted. For example, bar path in a heavy lift may matter more than small arm-angle variation; hand endpoint accuracy may matter more than elbow trajectory in reaching.

## 3.9 Motor Program and Schema Theory

**Core ideas.** Schmidt's schema theory proposed that discrete motor skills are governed by generalized motor programs and schemas that parameterize action classes from prior experience [12]. It helped explain rapid actions and the value of variable practice.

**Practical implications.**

- Skills are not stored as one rigid template per movement.
- Variable practice can improve generalization.
- Some invariant features may define a skill while parameters vary.

**Relevance to KinematicIQ.** Templates should be parameterized by morphology, load, speed, goal, and context. A "throw" model should support many throws.

---

# Part 4. Movement Quality

## 4.1 Is There an Accepted Scientific Definition?

**Evidence-supported conclusion.** There is no single universally accepted scientific definition of movement quality across all human movement domains. Recent reviews treat movement quality as a latent, task-specific construct and note that assessments vary widely in content and measurement approach [13, 14]. In practice, movement quality often means the classification or grading of acceptable versus aberrant task performance, using visual ratings, sensor features, clinical criteria, or sport-specific standards [14].

**Engineering interpretation.** KinematicIQ should not claim to measure "movement quality" as a universal scalar. It should define a movement quality profile:

```text
Movement Quality Profile =
    control
    coordination
    stability
    mobility
    symmetry
    smoothness
    efficiency
    consistency
    rhythm
    adaptability
    task outcome
    confidence/measurement quality
```

## 4.2 Dimensions of Movement Quality

| Dimension | Definition | Evidence and measures | Limitations |
|---|---|---|---|
| Control | Ability to regulate movement toward task goals despite noise and perturbation. | Endpoint error, corrective submovements, tracking error, task-relevant variance, perturbation response. Optimal feedback control supports selective correction [3]. | Requires task goal; over-control may be inefficient. |
| Coordination | Functional timing and organization among segments, muscles, or actions. | Relative phase, inter-joint coupling, synergy analysis, uncontrolled manifold, principal components. | Different coordination patterns can be equally functional. |
| Stability | Ability to maintain or recover a functional state. | Center of mass/base of support, margin of stability, sway, step recovery, local dynamic stability. | Stability is task-relative; too much rigidity can reduce adaptability. |
| Mobility | Available and usable range of motion for the task. | Joint ROM, segment excursion, end-range control, active/passive discrepancy. | More ROM is not always better; task-specific sufficiency matters. |
| Symmetry | Similarity between sides or phases. | Limb symmetry index, step length/time symmetry, joint angle symmetry. | Perfect symmetry is not required; asymmetry may reflect task, dominance, or adaptation. |
| Smoothness | Absence of unnecessary arrests, discontinuities, or high-frequency corrections. | Jerk-based measures, spectral arc length, number of velocity peaks. Hogan and Sternad warn that smoothness metrics can be sensitive to duration/amplitude choices [15]; Balasubramanian et al. propose spectral arc length as robust [16]. | Smoothness can conflict with speed, power, or tactical deception. |
| Efficiency | Accomplishing the task with appropriate energetic/mechanical cost. | Oxygen cost, work, impulse, co-contraction, movement time, path length, force economy. | Efficiency depends on goal; maximal performance may sacrifice economy. |
| Consistency | Repeatability of task-relevant features across attempts. | Standard deviation, coefficient of variation, repeatability, phase consistency. | Excessive consistency can indicate poor adaptability. |
| Rhythm | Temporal organization and periodicity. | Cadence, stride timing, relative phase, spectral features, beat synchronization. | Some tasks require irregular timing. |
| Adaptability | Ability to alter movement when constraints change. | Perturbation tests, transfer, variable practice, split-belt or visuomotor adaptation, environmental changes. | Harder to measure in one trial. |

## 4.3 Variability: Error or Feature?

**Evidence-supported conclusion.** Variability is inherent in biological movement and can be functional. Stergiou and Decker argue that healthy motor behavior has an optimal amount and structure of variability, balancing stability with flexibility [17]. The implication is that both too little and too much variability may be problematic depending on task and context.

**Engineering interpretation.** KinematicIQ should compute variability in categories:

- **Task-relevant variability:** affects outcome or safety.
- **Task-irrelevant variability:** does not affect outcome and may reflect healthy flexibility.
- **Exploratory variability:** appears during learning and may support adaptation.
- **Pathological variability:** disrupts goal achievement, safety, or repeatability.

## 4.4 Why Movement Quality Scores Fail When Oversimplified

Functional Movement Screen research illustrates a broader warning. FMS-style screens can be reliable for some observational scoring contexts, but evidence for injury prediction is mixed and often limited. One systematic review concluded that findings did not support FMS predictive validity as a standalone injury prediction tool [18]. Later reviews are more nuanced but still caution against using one screen as a universal injury forecast.

**Engineering interpretation.** KinematicIQ should avoid a single "injury risk score" from movement form alone. A credible risk model requires prior injury, pain, training load, tissue capacity, fatigue, exposure, sport demands, and longitudinal change.

---

# Part 5. Universal Movement Model

## 5.1 First-Principles Model

A universal model should treat movement as a constrained, goal-directed control problem over a body-environment system.

```text
Inputs
  Individual: morphology, capacity, pain, fatigue, skill, history
  Task: goal, rules, load, speed, accuracy, equipment
  Environment: surface, gravity, obstacles, affordances, opponents

Control architecture
  Perception -> state estimation -> goal selection -> control policy
  Feedforward prediction + feedback correction
  Synergies and movement primitives

Body mechanics
  Segments, joints, muscles/tendons
  Degrees of freedom
  Kinematic chains
  Contacts and external forces

Observed behavior
  Movement phases
  Coordination pattern
  Variability structure
  Outcome and quality profile

Adaptation
  Error, reward, fatigue, pain, confidence
  Learning, compensation, or deterioration over time
```

## 5.2 Shared Movement Primitives

The term "primitive" can mean different things. For engineering, KinematicIQ can use primitives as reusable computational units, not necessarily as literal neural modules.

Recommended primitive families:

| Primitive family | Examples | Why it matters |
|---|---|---|
| Postural primitives | align, brace, stabilize, orient gaze/head/trunk | Most actions require a postural base. |
| Support primitives | shift weight, change base of support, step, grip, contact | Locomotion and manipulation depend on contact management. |
| Propulsive primitives | push ground, pull object, extend limb, accelerate segment | Generates movement or object motion. |
| Absorptive primitives | decelerate, land, yield, eccentrically control | Key for injury risk and performance. |
| Transport primitives | carry body, carry object, swing limb, reposition COM | Links phases over time. |
| Manipulative primitives | reach, grasp, release, strike, throw, catch | Needed for object interaction. |
| Rotational primitives | turn, twist, counter-rotate, transfer angular momentum | Appears in gait, throwing, cutting, dance. |
| Reactive primitives | recover balance, evade, intercept, adjust online | Essential for real-world movement. |

## 5.3 Kinematic Chains

Human movement is organized through linked segments. Chains may be:

- **Open chain:** distal segment moves freely, such as kicking or reaching.
- **Closed chain:** distal segment is fixed or constrained, such as stance phase, push-up, squat.
- **Hybrid chain:** multiple contacts or changing contacts, such as climbing, grappling, or getting off the floor.

**Engineering interpretation.** KinematicIQ should detect contact state because the same joint angle has different meaning in open-chain and closed-chain contexts.

## 5.4 Degrees of Freedom and Synergies

The human system is redundant: many joint and muscle configurations can achieve similar endpoints. Rather than seeing redundancy as a problem only, modern motor control often treats it as abundance. Synergies stabilize task-relevant variables while allowing flexibility in other dimensions. The uncontrolled manifold framework formalizes this by separating variance that affects a performance variable from variance that does not [19].

**Engineering interpretation.** Instead of scoring a movement only by similarity to a template, KinematicIQ should estimate:

- Which variables define task success.
- Which segmental variations preserve those variables.
- Which variations destabilize them.

## 5.5 Movement Phases

Most meaningful actions are phase-structured. Example:

```text
Jump
  preparation -> countermovement -> propulsion -> flight -> landing -> recovery

Throw
  stance -> wind-up -> stride -> cocking -> acceleration -> release -> deceleration/follow-through

Gait
  initial contact -> loading response -> mid-stance -> terminal stance
  -> pre-swing -> initial swing -> mid-swing -> terminal swing
```

**Engineering interpretation.** KinematicIQ should use phase-aware models. A knee valgus angle, trunk lean, or pelvis rotation can have different meaning depending on phase.

## 5.6 Hierarchical Representation

Recommended hierarchy:

```text
Level 0: Raw sensor/video data
Level 1: Pose, segments, contacts, objects, environment
Level 2: Kinematic and kinetic features
Level 3: Phases and events
Level 4: Coordination and quality dimensions
Level 5: Task outcome and constraints
Level 6: Coaching/clinical/performance interpretation
Level 7: Longitudinal adaptation and personalization
```

---

# Part 6. Implications for KinematicIQ

## 6.1 Recommended Universal Movement Ontology

KinematicIQ should implement a multi-axis ontology:

1. **Action class:** locomotion, manipulation, posture, balance, transition, load management, object skill, athletic skill, expressive movement.
2. **Task goal:** move body, move object, stabilize, recover, evade, strike, communicate.
3. **Constraint profile:** individual, task, environment.
4. **Contact/support state:** open-chain, closed-chain, mixed, impact, suspended, assisted.
5. **Phase structure:** start, preparation, execution, transition, recovery, cyclic phases.
6. **Quality profile:** control, coordination, stability, mobility, symmetry, smoothness, efficiency, consistency, rhythm, adaptability.
7. **Risk/performance domain:** balance, tissue load, fatigue, precision, power, endurance, reaction.

## 6.2 Conceptual Architecture for a Movement Intelligence Engine

```text
Capture layer
  video, IMU, force plate, wearables, manual labels

Perception layer
  pose estimation
  object/environment detection
  contact inference
  event detection

Movement representation layer
  segment model
  joint angles
  velocities/accelerations
  phase segmentation
  coordination features

Ontology layer
  action class
  task goal
  constraints
  population/context

Inference layer
  quality profile
  task-relevant errors
  compensations
  uncertainty/confidence
  longitudinal trends

Recommendation layer
  feedback cue
  task modification
  progression/regression
  referral/safety flag where appropriate

Learning layer
  personalization
  normative database updates
  outcome-linked model calibration
```

## 6.3 Movement-Agnostic vs Movement-Specific Components

| Movement-agnostic | Movement-specific |
|---|---|
| Pose/skeleton representation | Movement event definitions |
| Segment coordinate systems | Phase segmentation rules |
| Contact inference framework | Success criteria |
| Constraint metadata schema | Joint/segment thresholds |
| Quality dimension schema | Coaching cues |
| Variability decomposition | Risk interpretation |
| Confidence and uncertainty reporting | Sport/clinical norms |
| Longitudinal trend tracking | Equipment-specific rules |

## 6.4 Design Principles

### Principle 1: Score task-relevant error, not template deviation

Grounded in Bernstein and optimal feedback control, the system should ask: "What variable was the mover trying to stabilize?" before scoring error.

### Principle 2: Context precedes interpretation

A movement feature without task, load, environment, and user context is only a measurement, not an interpretation.

### Principle 3: Movement quality is multidimensional

Use a quality profile rather than a single universal grade. Composite scores can be offered, but they should be transparent and domain-specific.

### Principle 4: Build phase-aware models

Movement phase determines meaning. The platform should segment actions before applying criteria.

### Principle 5: Separate evidence from coaching convention

Some cues are evidence-supported; others are useful heuristics; some are tradition. The product should mark confidence levels.

### Principle 6: Treat variability intelligently

Do not punish all variability. Identify whether variation is harmful, neutral, adaptive, or exploratory.

### Principle 7: Use constraints to generate recommendations

The system should recommend changes to task, environment, or load, not only tell the user what joint angle was "wrong."

### Principle 8: Track longitudinal adaptation

Single-session analysis has limited meaning. KinematicIQ's strongest value will come from detecting change over time: improved capacity, reduced compensation, better rhythm, increased adaptability, or emerging fatigue.

## 6.5 Example: Squat Analysis Under the Universal Model

| Layer | Squat example |
|---|---|
| Action class | Load management, posture, balance, lower-body closed-chain task |
| Goal | Lower and raise center of mass under control |
| Constraints | Load, stance, depth requirement, ankle mobility, pain, fatigue |
| Phases | Setup, descent, bottom transition, ascent, lockout/recovery |
| Quality dimensions | Control, stability, mobility, symmetry, rhythm, efficiency |
| Task-relevant variables | COM over base, foot pressure/contact, trunk-bar relationship, knee/hip/ankle coordination |
| Interpretation | Depends on morphology, load, goal, and pain, not one ideal shape |

## 6.6 Example: Throwing Analysis Under the Universal Model

| Layer | Throwing example |
|---|---|
| Action class | Object projection, rotation, balance, sequential acceleration |
| Goal | Project object with speed/accuracy |
| Constraints | Object, target, distance, rules, arm health, surface |
| Phases | Wind-up, stride, cocking, acceleration, release, deceleration |
| Quality dimensions | Sequencing, rhythm, mobility, control, efficiency, adaptability |
| Task-relevant variables | Release speed/angle, trunk-hip-shoulder timing, deceleration capacity |
| Interpretation | Requires ball and target context, not skeleton alone |

---

# Recommendations

1. Use Newell's constraints model as the top-level organizing framework.
2. Use a multi-axis ontology rather than a single tree of exercise labels.
3. Preserve the seven foundational patterns as a coaching/training subcategory only.
4. Represent movement as phase-aware, contact-aware, task-aware time-series behavior.
5. Define movement quality as a transparent multidimensional profile.
6. Use optimal feedback control as the scoring philosophy: prioritize task-relevant deviations.
7. Use Bernstein's degrees-of-freedom problem to guide coordination and compensation analysis.
8. Use ecological dynamics for open skills where environment, object, opponent, or target information matters.
9. Report uncertainty and avoid overclaiming injury prediction from form alone.
10. Build longitudinal personalization: user-specific baselines, trend detection, and response to interventions.

---

# Open Research Questions for KinematicIQ

1. Which movement quality dimensions are most predictive of meaningful outcomes for each domain: pain, performance, injury, return-to-play, independence, or learning?
2. How much individual variation should be accepted for morphology, sport, disability, age, and cultural movement practice?
3. Can video-only systems infer contact, load, and force well enough for high-stakes feedback?
4. What normative data should be population-specific versus task-specific?
5. How should uncertainty be communicated to users without weakening trust?
6. How can the platform distinguish compensation from legitimate task adaptation?
7. What is the minimum sensor set needed for each movement class?
8. Which feedback styles improve motor learning rather than merely improving immediate form?

---

# References

[1] Shadmehr, R., Smith, M. A., & Krakauer, J. W. (2010). Error correction, sensory prediction, and adaptation in motor control. *Annual Review of Neuroscience*. https://pubmed.ncbi.nlm.nih.gov/20367317/

[2] Bernstein, N. A. (1967). *The Coordination and Regulation of Movements*. Pergamon Press. Background and discussion: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01295/full

[3] Todorov, E., & Jordan, M. I. (2002). Optimal feedback control as a theory of motor coordination. *Nature Neuroscience*, 5, 1226-1235. https://pubmed.ncbi.nlm.nih.gov/12404008/

[4] Vereijken, B., van Emmerik, R. E. A., Whiting, H. T. A., & Newell, K. M. (1992). Free(z)ing degrees of freedom in skill acquisition. *Journal of Motor Behavior*. Related review: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01295/full

[5] Newell, K. M. (1986). Constraints on the development of coordination. In Wade & Whiting (Eds.), *Motor Development in Children: Aspects of Coordination and Control*. https://grants.hhp.uh.edu/clayne/HistoryofMC/Newell1986.pdf

[6] Fitts, P. M., & Posner, M. I. (1967). *Human Performance*. Brooks/Cole. Bibliographic record: https://books.google.com/books/about/Human_Performance.html?id=XtFOAAAAMAAJ

[7] Kelso, J. A. S. (1995). *Dynamic Patterns: The Self-Organization of Brain and Behavior*. MIT Press. Bibliographic record: https://books.google.com/books/about/Dynamic_Patterns.html?id=zpjejjytkiIC

[8] Haken, H., Kelso, J. A. S., & Bunz, H. (1985). A theoretical model of phase transitions in human hand movements. *Biological Cybernetics*. Overview: https://www.scholarpedia.org/article/Haken-Kelso-Bunz_model

[9] Gibson, J. J. (1979). *The Ecological Approach to Visual Perception*. Houghton Mifflin. Overview/source excerpt: https://cs.brown.edu/courses/cs137/2017/readings/Gibson-AFF.pdf

[10] Davids, K., Araújo, D., et al. Ecological dynamics and perception-action coupling in sport. Recent open-access discussion: https://pmc.ncbi.nlm.nih.gov/articles/PMC12011958/

[11] Renshaw, I., Davids, K., Newcombe, D., & Roberts, W. (2019). *The Constraints-Led Approach: Principles for Sports Coaching and Practice Design*. Routledge. https://www.routledge.com/The-Constraints-Led-Approach-Principles-for-Sports-Coaching-and-Practice-Design/Renshaw-Davids-Newcombe-Roberts/p/book/9781138104075

[12] Schmidt, R. A. (1975). A schema theory of discrete motor skill learning. *Psychological Review*, 82, 225-260. Bibliographic record: https://link.springer.com/rwe/10.1007/978-1-4419-1428-6_870

[13] Wijekulasuriya, N., et al. (2025). The development and content of movement quality assessments in athletic populations: a systematic review and multilevel meta-analysis. https://pmc.ncbi.nlm.nih.gov/articles/PMC11757847/

[14] van der Kruk, E., et al. (2022). Human movement quality assessment using sensor technologies in recreational and professional sports: a scoping review. *Sensors*. https://pmc.ncbi.nlm.nih.gov/articles/PMC9269395/

[15] Hogan, N., & Sternad, D. (2009). Sensitivity of smoothness measures to movement duration, amplitude, and arrests. *Journal of Motor Behavior*. https://pmc.ncbi.nlm.nih.gov/articles/PMC3470860/

[16] Balasubramanian, S., Melendez-Calderon, A., & Burdet, E. (2012). A robust and sensitive metric for quantifying movement smoothness. *IEEE Transactions on Biomedical Engineering*. https://pubmed.ncbi.nlm.nih.gov/22180502/

[17] Stergiou, N., & Decker, L. M. (2011). Human movement variability, nonlinear dynamics, and pathology. *Human Movement Science*. https://pubmed.ncbi.nlm.nih.gov/21802756/

[18] Dorrel, B. S., Long, T., Shaffer, S., & Myer, G. D. (2015). Evaluation of the Functional Movement Screen as an injury prediction tool among active adult populations: a systematic review and meta-analysis. *Sports Health*. https://pubmed.ncbi.nlm.nih.gov/26502447/

[19] Latash, M. L. Uncontrolled manifold hypothesis and motor synergies. Recent review: https://socibracom.com/bjmb/index.php/bjmb/article/view/433

[20] Cavuoto, L. A., Chen, H., & Schall, M. C. (2022). Wearable inertial sensors for objective kinematic assessments: a brief overview. https://stacks.cdc.gov/view/cdc/231127

