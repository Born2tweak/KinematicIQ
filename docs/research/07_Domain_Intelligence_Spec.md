# KinematicIQ Research 07: Sports Performance, Clinical Applications, and Domain-Specific Movement Intelligence

Generated: July 6, 2026

## Executive Summary

KinematicIQ should treat movement intelligence as a layered decision system, not as a single universal "good movement" score. The product should first estimate universal human movement qualities, then interpret them through the constraints of a sport, clinical population, assessment protocol, user history, and data-capture context.

The strongest near-term product opportunities are:

- Browser-based functional assessments with clear protocols: sit-to-stand, Timed Up and Go, single-leg squat, countermovement jump, landing mechanics, Y Balance-style reach, and basic gait/run analysis.
- Return-to-play and rehabilitation dashboards that track trend, asymmetry, exposure, and movement quality rather than giving binary clearance.
- Sport modules for jumping/cutting athletes, running athletes, and overhead athletes before expanding into more equipment-dependent domains.
- Clinical and enterprise workflows that emphasize decision support, documentation, longitudinal monitoring, and referral triggers rather than diagnosis.

The core safety rule is simple: KinematicIQ can describe movement patterns, track changes, flag deviations from prior baseline or population norms, and suggest evidence-informed coaching priorities. It must not diagnose injuries, claim independent clearance for return to play, or infer pathology from pose data alone.

## Evidence Model

Use a three-tier evidence label in every module:

- Evidence-supported practice: supported by systematic reviews, guidelines, consensus statements, reliable measurement studies, or strong prospective evidence.
- Expert heuristic: common practice in coaching, rehab, or performance settings but supported mainly by mechanistic reasoning, cross-sectional work, or practitioner consensus.
- Open research question: plausible but not yet validated for browser-based, markerless, autonomous decision-making.

Important evidence anchors:

- FMS has reliability value but limited predictive validity for injury when used as a general composite screen. Use it for movement description, not injury prediction. Source: [Moran et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28360142/), [Dorrel et al., 2015](https://pubmed.ncbi.nlm.nih.gov/26502447/), [Bonazza et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27159297/).
- Y Balance and Star Excursion tests are useful dynamic balance tests, but general cutoffs should be avoided; population, sport, sex, age, and protocol matter. Source: [Powden et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34631241/), [Gribble et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22892416/), [Ko et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31629325/).
- LESS and landing screens can identify risky movement patterns, but validity varies by population and camera/protocol quality. Source: [Padua et al., 2009](https://pubmed.ncbi.nlm.nih.gov/19726623/), [Hanzlikova et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31961778/).
- TUG and chair-stand tests are clinically useful mobility/function measures, but TUG alone has limited fall-prediction ability in community-dwelling older adults. Source: [Barry et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24484314/), [Podsiadlo and Richardson, 1991](https://pubmed.ncbi.nlm.nih.gov/1991946/), [Jones et al., 1999](https://pubmed.ncbi.nlm.nih.gov/10380242/), [Bohannon, 2011](https://pubmed.ncbi.nlm.nih.gov/21904240/).
- Countermovement jump variables are useful for neuromuscular monitoring, especially trend-based fatigue/readiness workflows. Source: [Claudino et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27663764/), [Gathercole et al., 2015](https://pubmed.ncbi.nlm.nih.gov/24912201/).
- Markerless motion capture is promising but must be validated per task, view, body segment, camera, clothing, lighting, and population. Source: [Kanko et al., 2024](https://pubmed.ncbi.nlm.nih.gov/38894476/), [Cronin, 2021](https://pubmed.ncbi.nlm.nih.gov/34770620/), [Colyer et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30347335/), [Leporace et al., 2023](https://pubmed.ncbi.nlm.nih.gov/37541054/).

## Part 1: Universal Movement Demands

### Universal Movement Engine

The universal engine should estimate movement capability across ten core domains.

| Demand | Scientific rationale | Primary metrics | Browser feasibility | Evidence strength | Implementation recommendation |
|---|---|---|---|---|---|
| Force production | Human performance requires generating impulse through coordinated joints and muscles. | Jump height proxy, concentric velocity, rise time, limb symmetry, repetition count, tempo. | Moderate. Direct force requires force plates; video can estimate kinematic proxies. | Strong for lab/field testing, moderate for browser proxies. | Use "estimated power/impulse proxy," not force, unless paired with validated hardware. |
| Force absorption | Landing, deceleration, cutting, gait, and fall prevention depend on distributing load through ankle, knee, hip, trunk, and upper limb when relevant. | Peak flexion angles, time to stabilization, landing symmetry, trunk position, knee valgus proxy. | Moderate for sagittal/frontal kinematics; low for kinetics. | Strong conceptually; moderate for 2D/markerless measurement. | Score landing strategy and asymmetry; avoid estimating ACL risk as a diagnosis. |
| Balance | Balance integrates sensory input, strength, motor planning, and environment. | Center-of-mass sway proxy, stance time, reach distance, step errors, TUG turns. | High for gross tasks, moderate for fine sway. | Strong for validated clinical tests. | Use protocol-specific balance modules and age/population norms. |
| Coordination | Coordination is the timing and sequencing of segments under constraints. | Inter-segment timing, phase relationships, contralateral symmetry, smoothness, variability. | Moderate. | Moderate; task-specific. | Track repeatability and coordination signatures over time. |
| Mobility | Joint motion availability affects strategy options but is not equivalent to quality or safety. | ROM estimates, depth, trunk/pelvis angles, reach envelope. | Moderate. | Strong for goniometry; variable for camera estimates. | Treat video ROM as screening-grade unless validated for that joint/task. |
| Stability | Stability is the ability to maintain control under perturbation, fatigue, speed, or load. | Postural deviations, trunk lean, knee/foot alignment, wobble, time-to-control. | Moderate to high. | Moderate. | Use stability as task-control language, not "core weakness." |
| Sequencing | Efficient sport movement often depends on proximal-to-distal or distal-to-proximal sequencing depending on task. | Segment onset order, peak velocity timing, hip-shoulder separation, arm-leg timing. | Moderate for large segments; lower for wrists/hands. | Strong in overhead/rotational sports; task-specific. | Build sport profiles with expected sequence signatures. |
| Timing | Timing links movement to task outcome, opponent, apparatus, or environment. | Ground contact time, flight time, cadence, stroke rate, release timing. | High for event timing; moderate for exact contact events. | Strong for performance monitoring. | Use high-frame-rate capture guidance for fast events. |
| Rhythm | Repeated tasks require sustainable cadence and variability control. | Step cadence, stroke rate, repetition tempo, stride-time variability. | High. | Strong in gait/running/cycling/rowing contexts. | Make rhythm trendable and compare within athlete first. |
| Adaptability | Real-world movement requires changing strategy across fatigue, speed, terrain, load, and perturbation. | Variability under constraint, task switching, dual-task cost, fatigue slope. | Moderate. | Emerging for browser tools. | Offer controlled progressions and track response to constraints. |

### Universal Versus Domain-Specific Metrics

Universal metrics:

- Range of motion, symmetry, cadence, movement time, repetition count, stance time, jump height proxy, segment alignment, trunk control, smoothness, variability, and completion success.

Domain-specific metrics:

- Approach-jump mechanics for volleyball, deceleration angles for basketball/soccer, hip-shoulder separation for throwing/hitting, bar path for lifting, stroke cadence for swimming/rowing, run gait profiles for track, wheelchair propulsion metrics for para sport, and task-specific return-to-play criteria for clinical populations.

Design rule:

- Do not collapse domain-specific needs into a single global quality score. Use a universal feature vector plus a domain-specific interpretation layer.

## Part 2: Sports Performance Profiles

Each sport profile should include: primary movement patterns, assessments, performance indicators, compensations, injury correlates, coaching priorities, clinical constraints, browser feasibility, evidence strength, validation plan, and suggested modules.

### Sport Matrix

| Sport | Movement demands and population | Key assessments and metrics | Performance indicators | Common compensations and injury correlates | Coaching and clinical priorities | Browser feasibility | Suggested KinematicIQ modules |
|---|---|---|---|---|---|---|---|
| Basketball | Repeated acceleration, deceleration, jumping, landing, lateral shuffle, cutting, contact tolerance. Youth through elite. | CMJ/drop landing, LESS-style landing, single-leg squat, deceleration step, lateral shuffle, Y Balance. Metrics: landing symmetry, knee flexion, valgus proxy, trunk lean, ground contact time proxy. | Jump height, reactive ability, deceleration control, change-of-direction repeatability. | Dynamic knee valgus, stiff landings, trunk dominance, asymmetrical loading, fatigue-related control loss. ACL and patellofemoral risk correlates are relevant but not diagnostic. | Teach hip/knee flexion in landings, trunk control, progressive deceleration, bilateral and unilateral landing capacity. | High for jump/landing and gross COD; moderate for game-speed cutting. | Jump/Landing, Deceleration, Y Balance, Fatigue Trend, Return-to-Play. |
| Soccer | Sprinting, cutting, kicking, jumping, endurance, contact, frequent fatigue. Youth to elite. | Sprint mechanics, Nordic proxy workflow, single-leg hop/landing, cutting screen, adductor squeeze if hardware available, Y Balance. | Acceleration mechanics, sprint repeatability, change-of-direction control, asymmetry. | Hamstring strain risk relates to sprint exposure, prior injury, eccentric capacity; ACL risk relates to cutting/landing strategy; groin issues relate to adductor capacity. | Manage sprint exposure, progressive high-speed running, eccentric hamstring strength, deceleration mechanics. | High for sprint/cutting at submaximal speed; moderate for ball striking. | Sprint Mechanics, Hamstring Risk-Monitor, COD, Landing, Workload Integration. |
| American Football | High-velocity sprinting, collision, cutting, blocking, position-specific mass/power demands. | Position-specific acceleration, 5-10-5 style COD, landing, stance start, tackle/block posture proxy. | First-step quickness, deceleration/braking, COD symmetry, power proxies. | Knee/ankle injury risk affected by cutting mechanics, fatigue, shoe-surface traction, collision exposures. | Build position profiles; separate linemen, skill positions, kickers. Avoid universal norms across body types. | Moderate. Collision and contact quality are not browser-safe to infer. | Position Profile, COD, Landing, Sprint Start, RTP. |
| Baseball | Throwing/hitting rotation, sprint bursts, pitching-specific shoulder/elbow load, unilateral repetition. | Shoulder ROM workflow, trunk-hip rotation screen, single-leg balance, rotational sequencing, med-ball style if safe. | Ball velocity proxy only with external input; sequence consistency, mobility symmetry, trunk-pelvis control. | GIRD, altered shoulder ROM, kinetic-chain deficits, workload spikes; evidence for many shoulder risk factors is limited/conflicting. | Monitor ROM trends, trunk/hip contribution, workload, pain reporting, recovery. | Moderate for gross sequence; low for exact shoulder/elbow kinetics. | Overhead Athlete, Rotational Sequencing, Mobility Trend, Workload Notes. |
| Softball | Throwing, hitting, pitching windmill mechanics, sprinting, fielding, repetitive shoulder load. | Shoulder ROM, trunk/hip rotation, lunge, single-leg control, pitch/throw video markers. | Consistency, trunk timing, stride mechanics, mobility trend. | Shoulder overuse, anterior knee/lumbar symptoms from repetitive pitching/hitting mechanics. | Separate windmill pitching from baseball pitching assumptions. Track workload and symptoms. | Moderate. | Overhead/Throwing, Rotational, Lower-Limb Control. |
| Tennis | Multidirectional acceleration/deceleration, serve kinetic chain, repeated overhead and rotational strokes. | Lateral lunge, split-step landing, serve sequence, shoulder/trunk mobility, balance. | First-step response proxy, deceleration quality, serve sequence consistency. | Shoulder/elbow overload, trunk/hip mobility limits, asymmetrical loading, ankle sprain exposure. | Emphasize hip-trunk-shoulder sequencing, landing from serve, lateral deceleration. | Moderate to high for footwork; moderate for serve. | Court Movement, Overhead, Rotational Sequencing, Mobility. |
| Golf | Rotational power, segment sequencing, mobility-stability balance, repeated swing exposure. | Pelvis/trunk rotation, hip-shoulder separation, balance, squat/lunge, swing phase timing. | Club speed requires device input; video can estimate sequence consistency and sway. | Low back pain correlates are multifactorial; avoid blaming one posture. Mobility deficits may alter compensation strategy. | Improve repeatable sequence, hip/trunk mobility, load management, pain-aware modifications. | Moderate. Need camera setup and calibration. | Rotational Sequencing, Mobility, Low-Back-Aware Movement. |
| Volleyball | Approach jump, block jump, landing, overhead hitting/serving, diving. | Approach jump, repeated CMJ, LESS/drop landing, shoulder mobility, trunk control. | Jump height, approach rhythm, landing symmetry, fatigue slope. | Ankle sprains, patellar tendinopathy, shoulder symptoms, stiff/asymmetrical landings. | Landing mechanics, jump volume monitoring, shoulder scapular control, workload. | High for jump/landing; moderate for attack sequence. | Jump Volume, Landing, Overhead Athlete, Readiness. |
| Track and Field | Sprint, endurance, jumps, throws; event-specific profiles required. | Sprint mechanics, jump landing/takeoff, throw sequence, run gait, CMJ. | Step frequency/length proxies, contact time proxy, jump metrics, release sequencing. | Hamstring strain in sprinting, tendinopathy, stress injury, event-specific overload. | Do not use one track profile. Build sprint, distance, jump, throw subprofiles. | High for running/jumping; moderate for throws. | Sprint, Running Gait, Jump, Throwing/Rotational. |
| Swimming | Repeated shoulder rotation, trunk control, kick rhythm, start/turn power. Browser use mostly dryland unless pool video is supported. | Shoulder ROM, scapular control, trunk endurance, overhead mobility, dryland squat/jump. | Stroke metrics require in-water capture; dryland readiness and mobility trend. | Shoulder pain/overuse, ROM asymmetries, training volume. | Dryland screening plus workload/symptom tracking; avoid overclaiming in-water biomechanics from dryland data. | Moderate for dryland; low to moderate for pool unless specialized camera. | Overhead Mobility, Dryland Strength, Workload/Symptom Trend. |
| Weightlifting | Snatch/clean/jerk require mobility, bar path, timing, receiving position, force production. | Overhead squat, front squat, pull position, receiving depth, bar path by video, jerk landing. | Bar speed/path proxy, receiving stability, lift tempo, asymmetry. | Mobility restrictions, lumbar extension strategy, shoulder/wrist limitations, knee/hip control. | Technique feedback should be load-aware and coach-supervised at high loads. | Moderate; side/front camera helpful. | Bar Path, Overhead Squat, Catch Stability, Mobility. |
| Powerlifting | Squat, bench, deadlift: maximal strength with technical consistency and load management. | Squat depth/path, deadlift hip/knee timing, bench bar path if visible, velocity proxy. | Rep velocity trend, sticking region, depth consistency, asymmetry. | Low back pain evidence does not support simple posture fear messages; risk is multifactorial and load-related. | Use neutral, non-alarmist wording; emphasize consistent setup, progressive load, symptom response. | Moderate. | Lift Analyzer, Velocity Trend, Range/Depth, Load Notes. |
| CrossFit | Mixed high-skill gymnastics, Olympic lifting, endurance, fatigue-driven movement variability. | Movement library: squat, hinge, overhead, pull-up, jump, landing, fatigue circuit. | Technique consistency under fatigue, rep pacing, mobility constraints. | Shoulder, back, knee, Achilles exposures vary by workout; fatigue amplifies compensations. | Prioritize scaling, fatigue thresholds, movement consistency, safe progressions. | Moderate to high for standard movements. | Fatigue Movement Audit, Lift, Overhead, Jump/Landing. |
| Combat sports | Striking, grappling, stance switching, hip rotation, neck/trunk control, repeated weight cycling considerations. | Stance mobility, rotational strike sequence, single-leg balance, sprawls, shot entry mechanics. | Balance, hip rotation, reaction timing proxy, repeated effort. | Shoulder, knee, neck, low back, concussion not inferable from pose. | Do not assess head trauma; support movement readiness, mobility, asymmetry, fatigue. | Moderate. | Rotational, Balance, Mobility, Fatigue, Non-diagnostic Safety Flags. |
| Cycling | Repetitive sagittal-plane motion, posture tolerance, hip/knee/ankle tracking, cadence. | Bike fit video, knee travel, hip angle, trunk angle, cadence, asymmetry. | Cadence consistency, joint angle ranges, left/right pattern. | Knee pain, low back/neck symptoms, overuse; fit and load interact. | Needs bike setup metadata; use trend and comfort reporting. | High with fixed camera and bike. | Bike Fit, Cadence, Symmetry, Load/Symptom Trend. |
| Rowing | Cyclic leg-trunk-arm sequencing, stroke rhythm, trunk control, high volume. | Stroke phase timing, catch/finish positions, hip/trunk angles, rhythm, asymmetry. | Stroke rate, sequence consistency, range, fatigue drift. | Low back, rib, shoulder symptoms; volume and technique interact. | Evaluate sequence and fatigue drift; avoid posture-only pain claims. | High with side camera/erg; lower on-water. | Erg Rowing, Rhythm, Sequence, Fatigue Drift. |

## Part 3: Clinical Applications

Clinical modules must be framed as decision support for licensed professionals and self-monitoring support for consumers. They should support documentation, trend review, home exercise adherence, and referral triggers.

| Domain | Population | Functional assessments | Decision-support opportunity | Ethical limitations | Browser feasibility | Implementation recommendation |
|---|---|---|---|---|---|---|
| Physical Therapy | MSK rehab, pain, post-injury, chronic mobility limitations. | Sit-to-stand, squat, lunge, gait, reach, balance, ROM, hop/landing where appropriate. | Track baseline, progress, asymmetry, adherence, flare response, home-exercise form. | Do not diagnose, replace clinician judgment, or progress high-risk activities automatically. | High for common tasks. | Provide clinician notes, confidence scores, and patient-friendly trend summaries. |
| Orthopedics | Pre/post-op knees, hips, shoulders, spine; sports medicine. | TUG, sit-to-stand, gait, knee flexion, squat, step-down, hop tests, shoulder ROM. | Surgical readiness baselines, recovery milestones, comparison to contralateral limb and prior session. | Post-op restrictions must be clinician-configured. | High for gross tasks; moderate for precise ROM. | Make protocol builder with contraindications and phase limits. |
| Neurology | Stroke, Parkinson disease, MS, cerebral palsy, balance/gait disorders. | Gait, TUG, dual-task TUG, sit-to-stand, reach, balance, turning. | Detect change in mobility trend, freezing/turning difficulty proxies, fall-risk workflows. | Medical interpretation is high-stakes; movement patterns may reflect many diagnoses. | Moderate. Need accessibility and caregiver setup. | Use conservative language, high-quality setup checks, clinician review. |
| Geriatrics | Older adults, fall risk, frailty, community/home programs. | TUG, 5xSTS, 30s chair stand, gait speed proxy, balance stance, dual-task, reach. | Fall-prevention exercise targeting, functional decline alerts, adherence, home safety prompts. | TUG alone should not classify fall risk; combine history, meds, vision, cognition, environment. | High for chair and gait tests. | Use multifactorial risk model and "discuss with clinician" flags. |
| Pediatrics | Youth athletes, developmental movement, CP and other conditions with clinician oversight. | Age-appropriate balance, hop, squat, run, jump, gait. | Track maturation-aware progress and asymmetry; support engagement. | Norms vary by age, sex, maturation, diagnosis. Consent/privacy critical. | Moderate. | Separate youth norms; avoid adult thresholds. |
| Occupational Health | Workers exposed to lifting, carrying, repetitive work, prolonged postures. | Lift/carry simulation, squat/hinge, reach, balance, repetitive task endurance. | Ergonomic coaching, fatigue trend, return-to-work function. | Low back pain causality from posture alone is not supported; avoid punitive worker surveillance. | Moderate. | Focus on task demands, load, frequency, recovery, and self-reported symptoms. |
| Return-to-Play | Athletes after injury/surgery. | Strength/hop tests with clinician input, landing/COD, sport-specific movement, PROMs, workload. | Criteria checklist, asymmetry trend, movement quality, confidence/readiness. | KinematicIQ must not "clear" an athlete alone. | Moderate to high depending task. | Multi-domain readiness: symptoms, ROM, strength, function, movement quality, workload, clinician signoff. |
| Post-op Rehab | ACLR, meniscus, shoulder, hip, ankle, spine. | Phase-specific ROM, gait, STS, squat, step-down, hop/landing later. | Milestone tracking, compensation detection, home program support. | Protocol restrictions and red flags must override product suggestions. | High for simple tasks; moderate for advanced tests. | Build surgery-specific templates with clinician-editable restrictions. |

Evidence notes:

- Older adult fall prevention should prioritize multifactorial assessment and exercise involving balance, gait, and strength; exercise reduces fall rates in community-dwelling older adults. Sources: [World Falls Guidelines, 2022](https://pubmed.ncbi.nlm.nih.gov/36178003/), [Sherrington et al., 2019 Cochrane review](https://pubmed.ncbi.nlm.nih.gov/30703272/).
- Return-to-sport after ACL reconstruction requires more than time from surgery; late-stage rehab should include strength, explosive performance, movement quality, psychological readiness, workload, and sport-specific exposure. Sources: [Davies et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28078610/), [Buckthorpe et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31004279/), [King et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33840081/).
- AI rehabilitation tools are promising but clinical evidence and deployment standards are still developing. Source: [Gholami et al., 2023](https://pubmed.ncbi.nlm.nih.gov/38042593/).

## Part 4: Functional Assessment Modules

| Assessment | Purpose | Metrics | Scoring | Validity and evidence | Browser feasibility | Implementation recommendation |
|---|---|---|---|---|---|---|
| Functional Movement Screen | General movement screen across squat, hurdle step, lunge, shoulder mobility, active straight-leg raise, push-up, rotary stability. | Task completion, asymmetry, gross compensation, pain flag. | FMS uses 0-3 item scores, but KinematicIQ should not reproduce trademarked workflows unless licensed. | Reliability is fair to good in many studies; injury prediction by composite score is weak/inconsistent. | Moderate. | Use as movement-description inspiration; avoid injury prediction. |
| Y Balance Test | Dynamic single-leg reach and neuromuscular control. | Normalized anterior, posteromedial, posterolateral reach; asymmetry; stance errors. | Composite and direction-specific reach. | Reliable; prediction requires population-specific interpretation. | Moderate. Needs floor calibration and strict protocol. | Build guided setup with limb-length calibration and camera/floor markers. |
| Sit-to-Stand | Lower-limb function, strength/endurance proxy, mobility. | Completion time for 5xSTS, reps in 30s, trunk lean, knee strategy, asymmetry. | Time or count. | Reliable in many populations; 30s chair stand valid for lower-body function in older adults. | High. | First MVP clinical test. Requires chair height, arm-use rule, safety prompts. |
| Timed Up and Go | Functional mobility: stand, walk, turn, return, sit. | Total time, sit-to-stand time, gait speed proxy, turn time, step count, instability flags. | Seconds; often interpreted with population context. | Useful and reliable; limited as standalone fall predictor in community older adults. | High if camera captures full path; moderate in small rooms. | Include path-length calibration and turn segmentation. |
| Single-Leg Squat | Lower-limb control, hip/knee/trunk strategy. | Knee-over-foot proxy, pelvic drop, trunk lean, depth, repetitions, wobble. | Rubric or continuous kinematics. | 2D and rubric validity vary; reliable when standardized. | High to moderate. | Use trend and coaching, not pathology classification. |
| Countermovement Jump | Neuromuscular power/readiness and fatigue monitoring. | Jump height proxy, flight time, countermovement depth, arm swing rule, asymmetry if bilateral visible. | Continuous metrics and trends. | Strong in sport monitoring; video estimates require validation. | Moderate to high. | Use average of valid trials and trend from personal baseline. |
| Landing Error Scoring System | Identify potentially high-risk jump-landing movement patterns. | Knee flexion, hip flexion, trunk flexion/lateral lean, knee valgus, foot position, landing symmetry. | LESS item scoring if licensed/implemented per protocol; otherwise KinematicIQ landing quality vector. | Reliable screening tool; validity varies by implementation. | Moderate. Needs frontal and sagittal views for richer scoring. | Use guided camera views and report movement observations. |
| Star Excursion Balance Test | Dynamic postural control in multiple directions. | Directional reach distance normalized to limb length, stance errors. | Direction-specific and composite. | Reliable; SEBT and YBT are not directly interchangeable in all populations. | Moderate. | Prefer simplified YBT-style module for consumer browser implementation. |

## Part 5: Injury-Prevention Intelligence

KinematicIQ should never diagnose injuries. It should use wording such as:

- "This movement pattern has been associated with higher joint loading in some studies."
- "Your landing strategy is less knee/hip flexed than your prior baseline."
- "Consider discussing this trend with your clinician or coach, especially if pain, swelling, or performance loss is present."

Avoid:

- "You are at high risk of ACL tear."
- "You have patellofemoral pain."
- "Your spine posture is dangerous."
- "You are cleared."

| Concern | Evidence-supported correlates | Expert heuristics | Open questions | Monitoring strategy |
|---|---|---|---|---|
| ACL injury | Non-contact ACL risk is associated with landing/cutting mechanics, knee abduction moments, trunk control, sex and sport differences, and neuromuscular factors. Cutting/landing screening has some value but limited standalone prediction. Sources: [Boden et al., 2010](https://pubmed.ncbi.nlm.nih.gov/19452139/), [Dos'Santos et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33136207/), [Padua et al., 2009](https://pubmed.ncbi.nlm.nih.gov/19726623/). | Coach softer landings, hip/knee flexion, trunk control, progressive deceleration and cutting. | Can markerless browser data predict future ACL injury? Not yet at clinical-grade certainty. | Track landing/COD quality, asymmetry, fatigue drift, history, workload, symptoms. |
| Hamstring injury | Prior injury, sprint exposure, eccentric hamstring capacity, and high-speed running demands are central. Nordic hamstring programs reduce hamstring injury rates in multiple reviews. Sources: [van Dyk et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30808663/), [Al Attar et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27752982/). | Monitor sprint mechanics and progressive exposure; flag sudden high-speed load increases. | Video-only estimation of fascicle length or eccentric capacity is not valid. | Pair sprint exposure log, symptoms, strength hardware if available, and video mechanics. |
| Achilles injury | Tendinopathy risk is multifactorial; running biomechanics, dorsiflexion, training load, tendon capacity, age, sex, and morphology may interact. Sources: [Munteanu and Barton, 2011](https://pubmed.ncbi.nlm.nih.gov/21619710/), [Lorimer and Hume, 2014](https://pubmed.ncbi.nlm.nih.gov/24898814/), [Kakouris et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33862272/). | Watch calf capacity, ankle dorsiflexion, cadence, sudden hill/speed volume. | Which browser-visible gait features predict Achilles symptoms prospectively? | Monitor calf raise endurance, ankle ROM, running cadence, symptom response. |
| Patellofemoral pain | Hip strength deficits, altered hip/knee mechanics, and running kinematics are associated; causality varies. Sources: [Neal et al., 2016](https://pubmed.ncbi.nlm.nih.gov/26979886/), [Rabelo et al., 2023](https://pubmed.ncbi.nlm.nih.gov/36611559/), [Powers, 2010](https://pubmed.ncbi.nlm.nih.gov/PMC3102922). | Coach hip/trunk control, cadence changes in running, gradual load. | Individual subgrouping is still evolving. | Track single-leg squat, step-down, run gait, symptoms and load. |
| Low back pain | Posture and flexion are not simple causal explanations. LBP involves motor control, load, exposure, psychosocial and individual factors. Sources: [Saraceni et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31775556/), [Swain et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32621351/), [van Dieen et al., 2019](https://pubmed.ncbi.nlm.nih.gov/29895230/). | Encourage movement variability, graded exposure, technique options, symptom-guided loading. | Which movement phenotypes benefit from which cueing strategy? | Track function, repeated exposure, fatigue, pain reports, and confidence. |
| Shoulder overuse | Overhead shoulder risk evidence is limited/conflicting; ROM, strength, prior pain/injury, workload, and kinetic chain factors are relevant. Sources: [Asker et al., 2018](https://pubmed.ncbi.nlm.nih.gov/29581141/), [Edouard et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40041538/), [Kibler et al., 2013](https://pubmed.ncbi.nlm.nih.gov/26537804/). | Track shoulder ROM trends, scapular control, trunk/hip contribution, throwing volume. | Browser inference of shoulder joint loading is not mature. | Combine mobility, workload, symptoms, and clinician review. |
| Running injuries | Injury incidence is high and multifactorial. Prospective biomechanical risk evidence varies by sex and level; hip adduction/rearfoot variables may matter in some groups. Sources: [Ceyssens et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31028658/), [Napier et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32203864/), [Kakouris et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33862272/). | Track load spikes, cadence, asymmetry, overstride proxy, hip/trunk control. | Robust individual prediction remains unresolved. | Trend gait metrics, training load, shoes/surface, symptoms, recovery. |

## Part 6: Population Personalization

| Population | Personalization strategy | Metrics to emphasize | What to avoid |
|---|---|---|---|
| Youth athletes | Age, sex, growth/maturation, training age, sport, limb dominance, and prior injury should shape thresholds. Neuromuscular injury-prevention programs are effective in youth sport. Source: [Emery et al., 2015](https://pubmed.ncbi.nlm.nih.gov/26084526/), [Rossler et al., 2014](https://pubmed.ncbi.nlm.nih.gov/26673035/). | Movement literacy, landing, balance, sprint mechanics, progressive exposure. | Adult norms, scare language, early specialization assumptions. |
| Elite athletes | Individual baseline and smallest worthwhile change matter more than generic norms. | Trend stability, fatigue drift, readiness, asymmetry, sport-specific repeatability. | Generic "green/yellow/red" without context. |
| Recreational users | Safety, education, consistency, and simple progressions matter most. | Completion, trend, asymmetry, pain response, confidence. | Overly clinical language or elite thresholds. |
| Older adults | Use multifactorial fall risk; emphasize balance, gait, strength, function, dual task, medication/vision referral prompts where appropriate. | TUG segments, chair stand, gait speed proxy, stance balance, dual-task cost. | TUG-only fall labels. |
| Clinical patients | Clinician-configurable protocols, contraindications, phase restrictions, and red flags. | Function, symptoms, ROM, adherence, asymmetry, baseline changes. | Autonomous diagnosis or progression beyond protocol. |
| Individuals with disabilities | Adapt tasks to impairment, assistive devices, classification, sport role, and accessibility needs. Paralympic biomechanics requires impairment-specific interpretation. Source: [Fuss, 2016](https://pubmed.ncbi.nlm.nih.gov/27918675/), [Vanlandewijck et al., 2011](https://pubmed.ncbi.nlm.nih.gov/21936291/). | Task success, efficiency, fatigue, equipment interaction, individualized baseline. | Comparing against non-disabled norms by default. |

## Part 7: Longitudinal Athlete Intelligence

### Tracking Model

KinematicIQ should store each session as:

- User context: sport, age band, sex if relevant to norms, training level, injury/surgery history, symptoms, fatigue, sleep/readiness if available.
- Capture context: device, frame rate, camera angle, lighting, calibration confidence, view confidence, protocol version.
- Task context: assessment, warm-up status, footwear/surface, load, repetitions, valid trials.
- Feature vector: kinematic metrics, event timings, asymmetry, smoothness, variability, error flags.
- Interpretation: evidence label, comparison target, confidence, recommended next action.

### Dashboard Recommendations

| Dashboard | Best users | Signals | Output |
|---|---|---|---|
| Performance progression | Athletes/coaches | Jump height proxy, sprint mechanics, lift velocity, movement consistency. | Trend lines, personal bests, smallest meaningful change, notes. |
| Recovery/readiness | Team sport, lifting, rehab | CMJ average, movement variability, asymmetry, subjective fatigue. | Baseline comparison and trend direction, not a medical readiness verdict. |
| Motor learning | Coaches, PTs | Technique repeatability, error frequency, cue response. | Before/after cue comparisons and practice consistency. |
| Technique consistency | Elite/recreational sport | Variability across trials and under fatigue. | Consistency score with confidence and representative clips. |
| Fatigue trends | Sport, work, rehab | Decline in jump/rep speed, landing control drift, ROM changes. | Fatigue slope and "stop/reduce/review" suggestions. |
| Rehabilitation milestones | Clinical | ROM, gait, STS, step-down, hop/landing, PROMs. | Phase checklist and clinician review state. |

## Part 8: KinematicIQ Domain Architecture

### Layered Architecture

```text
Capture Quality Layer
  -> Universal Movement Engine
  -> Domain Profile Layer
  -> Assessment Module Layer
  -> Personalization Layer
  -> Decision-Support and Coaching Layer
  -> Validation and Audit Layer
```

### Module Interfaces

```ts
type CaptureContext = {
  device: string;
  frameRate: number;
  cameraView: "front" | "side" | "rear" | "multi" | "unknown";
  calibrationConfidence: number;
  lightingConfidence: number;
  occlusionRisk: number;
};

type UserContext = {
  ageBand: "youth" | "adult" | "older_adult";
  sport?: string;
  level?: "recreational" | "competitive" | "elite" | "clinical";
  clinicalRestrictions?: string[];
  symptoms?: { region: string; severity0to10: number }[];
};

type MovementFeatureVector = {
  taskId: string;
  protocolVersion: string;
  validTrials: number;
  kinematics: Record<string, number>;
  timing: Record<string, number>;
  asymmetry: Record<string, number>;
  variability: Record<string, number>;
  confidence: Record<string, number>;
};

type Interpretation = {
  evidenceTier: "supported" | "heuristic" | "open_question";
  comparisonBasis: "self_baseline" | "population_norm" | "clinical_protocol" | "sport_profile";
  findings: string[];
  riskLanguage: "none" | "association" | "refer";
  recommendations: string[];
  requiresClinicianReview: boolean;
};
```

### Extensibility Principles

- Domain profiles should be data/configuration-driven where possible.
- Assessment modules must declare required camera view, calibration method, contraindications, minimum confidence, and output limitations.
- Every model output should carry a confidence score and "why this may be wrong" metadata.
- Norms and thresholds must be versioned and population-specific.
- Clinical modules need audit logs, protocol versions, and clinician override.

### Validation Requirements

For each module:

1. Protocol validity: confirm users can perform setup correctly.
2. Pose validity: compare against marker-based or validated markerless systems where practical.
3. Metric reliability: test test-retest, intra-device, inter-device, and view-angle sensitivity.
4. Clinical/performance utility: prove the output changes decisions or improves monitoring.
5. Safety review: verify wording avoids diagnosis, shame, or overconfidence.
6. Equity review: test across body sizes, skin tones, clothing, mobility aids, disability status, and camera environments.

## Part 9: Product Strategy

### MVP Target Markets

1. Physical therapy and sports rehab clinics.
   - Highest willingness to pay for structured assessment, documentation, remote monitoring, and progress tracking.
   - Initial modules: sit-to-stand, TUG, squat, single-leg squat, gait, step-down, CMJ, landing.

2. Youth and high-school sports performance programs.
   - Need scalable, affordable screening and coaching.
   - Initial modules: landing, jump, COD, Y Balance-style reach, sprint mechanics, workload notes.

3. Running and recreational fitness.
   - Large market, easy browser capture, frequent longitudinal use.
   - Initial modules: running gait, cadence, asymmetry, strength/mobility screens, symptom/load tracker.

4. Overhead athlete clinics and academies.
   - Valuable but more specialized.
   - Initial modules: shoulder ROM trend, trunk/hip sequencing, workload/symptom tracker.

### Expansion Sequence

| Phase | Product focus | Rationale |
|---|---|---|
| Phase 1 | Functional assessment and rehab monitoring | Highest feasibility, clear protocols, defensible clinical value. |
| Phase 2 | Jump/landing and field-sport movement | Strong demand and feasible browser capture. |
| Phase 3 | Running gait and endurance sport modules | High consumer scale; must validate video metrics carefully. |
| Phase 4 | Overhead and rotational sports | Valuable but harder to validate at joint-load level. |
| Phase 5 | Lifting and CrossFit | Strong engagement; requires careful load/context handling. |
| Phase 6 | Adaptive/para sport and specialized clinical populations | High impact; requires co-design and impairment-specific validation. |

### Highest-Value Assessments

- Sit-to-stand: most feasible, broad clinical utility.
- TUG: high clinical familiarity; segment it for richer value.
- Single-leg squat/step-down: useful lower-limb control screen.
- CMJ: powerful for sport monitoring and readiness trend.
- Landing assessment: field-sport and ACL-rehab relevance.
- Y Balance-style reach: balance/asymmetry with careful setup.
- Running gait: large market, but be humble about injury prediction.
- Shoulder ROM/overhead screen: useful for overhead athlete trend monitoring.

### Research Opportunities

- Browser markerless validity by task and population.
- Prospective value of longitudinal trend features versus one-time screens.
- Fatigue-induced movement drift as a readiness signal.
- Combining PROMs, workload, and kinematics for better return-to-play decision support.
- Youth maturation-aware norms.
- Accessibility and adaptive sport movement intelligence.

### Enterprise Opportunities

- PT clinic remote monitoring and documentation.
- Sports academies and high-school athletic departments.
- Collegiate performance/recovery dashboards.
- Occupational health functional capacity monitoring.
- Orthopedic post-op programs.
- Insurers and digital MSK platforms, with strict privacy and non-punitive design.

## Implementation Guardrails

- Prefer personal-baseline trends over universal cutoffs.
- Use evidence labels visibly in internal tools and quietly in product logic.
- Require capture-quality gates before generating sensitive interpretations.
- Separate "movement observation" from "medical risk."
- Make clinician-configurable restrictions first-class.
- Store raw videos only with explicit consent and clear retention controls.
- Do not use body-size, disability, age, or sex attributes to penalize users; use them only to select appropriate norms or protocols.
- Validate before marketing a metric as clinical-grade.

## Reference Set

- FMS validity and reliability: [Dorrel et al., 2015](https://pubmed.ncbi.nlm.nih.gov/26502447/), [Bonazza et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27159297/), [Moran et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28360142/).
- Y Balance and SEBT: [Powden et al., 2021](https://pubmed.ncbi.nlm.nih.gov/34631241/), [Gribble et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22892416/), [Ko et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31629325/).
- LESS and landing screens: [Padua et al., 2009](https://pubmed.ncbi.nlm.nih.gov/19726623/), [Hanzlikova et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31961778/).
- CMJ monitoring: [Claudino et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27663764/), [Gathercole et al., 2015](https://pubmed.ncbi.nlm.nih.gov/24912201/).
- TUG and chair stand: [Barry et al., 2014](https://pubmed.ncbi.nlm.nih.gov/24484314/), [Jones et al., 1999](https://pubmed.ncbi.nlm.nih.gov/10380242/), [Bohannon, 2011](https://pubmed.ncbi.nlm.nih.gov/21904240/).
- Older adult falls: [World Falls Guidelines, 2022](https://pubmed.ncbi.nlm.nih.gov/36178003/), [Sherrington et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30703272/), [Clemson et al., 2012](https://pubmed.ncbi.nlm.nih.gov/22872695/).
- Markerless/video motion capture: [Cronin, 2021](https://pubmed.ncbi.nlm.nih.gov/34770620/), [Kanko et al., 2024](https://pubmed.ncbi.nlm.nih.gov/38894476/), [Leporace et al., 2023](https://pubmed.ncbi.nlm.nih.gov/37541054/), [Colyer et al., 2018](https://pubmed.ncbi.nlm.nih.gov/30347335/).
- ACL and return-to-sport: [Boden et al., 2010](https://pubmed.ncbi.nlm.nih.gov/19452139/), [Dos'Santos et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33136207/), [Davies et al., 2017](https://pubmed.ncbi.nlm.nih.gov/28078610/), [Buckthorpe et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31004279/), [King et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33840081/).
- Hamstring: [van Dyk et al., 2019](https://pubmed.ncbi.nlm.nih.gov/30808663/), [Al Attar et al., 2017](https://pubmed.ncbi.nlm.nih.gov/27752982/).
- Running and Achilles: [Ceyssens et al., 2019](https://pubmed.ncbi.nlm.nih.gov/31028658/), [Napier et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32203864/), [Kakouris et al., 2021](https://pubmed.ncbi.nlm.nih.gov/33862272/), [Lorimer and Hume, 2014](https://pubmed.ncbi.nlm.nih.gov/24898814/).
- Patellofemoral pain: [Neal et al., 2016](https://pubmed.ncbi.nlm.nih.gov/26979886/), [Rabelo et al., 2023](https://pubmed.ncbi.nlm.nih.gov/36611559/), [Powers, 2010](https://pubmed.ncbi.nlm.nih.gov/PMC3102922).
- Low back pain: [Saraceni et al., 2020](https://pubmed.ncbi.nlm.nih.gov/31775556/), [Swain et al., 2020](https://pubmed.ncbi.nlm.nih.gov/32621351/), [van Dieen et al., 2019](https://pubmed.ncbi.nlm.nih.gov/29895230/).
- Shoulder and overhead athletes: [Asker et al., 2018](https://pubmed.ncbi.nlm.nih.gov/29581141/), [Edouard et al., 2025](https://pubmed.ncbi.nlm.nih.gov/40041538/), [Kibler et al., 2013](https://pubmed.ncbi.nlm.nih.gov/26537804/).
- Youth and disability sport: [Emery et al., 2015](https://pubmed.ncbi.nlm.nih.gov/26084526/), [Rossler et al., 2014](https://pubmed.ncbi.nlm.nih.gov/26673035/), [Fuss, 2016](https://pubmed.ncbi.nlm.nih.gov/27918675/), [Vanlandewijck et al., 2011](https://pubmed.ncbi.nlm.nih.gov/21936291/).
