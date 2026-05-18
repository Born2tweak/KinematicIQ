# KinematicIQ Biomechanics Research Report

## Executive Summary

KinematicIQ can translate biomechanics into software by treating human movement as a sequence of observable proxy signals: pose landmarks, segment orientations, joint angles, timing, and side-to-side differences. The strongest MVP path is not "diagnosing technique" in a medical sense, but estimating movement constraints, control quality, and consistency from camera-visible patterns, then attaching confidence to each estimate. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

The most software-friendly concepts are joint angles, trunk and limb alignment, range of motion, movement timing, symmetry, and simple COM proxy behaviors such as torso shift or center-of-mass drift relative to the base of support; the least reliable are true joint moments, GRF, stiffness, and internal force production without force plates, sensors, or strong modeling assumptions. [sciencedirect](https://www.sciencedirect.com/topics/immunology-and-microbiology/ground-reaction-force)

A practical MVP should start with a small set of camera-visible movements that are highly structured and lower-risk: bodyweight squat, countermovement jump/landing, single-leg squat, lunge, hip hinge, and push-up/plank posture. These movements expose many of the exact mechanics KinematicIQ wants to score: trunk control, knee tracking, pelvic control, bilateral symmetry, landing absorption, and consistency across reps. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC2547867/)

## Foundations of Biomechanics

### Core concepts

Joint angles are the relative positions between body segments, and they are the easiest measurable layer from pose landmarks because they are directly derivable from 2D or 3D keypoints. Segment alignment describes how segments are oriented relative to each other or the environment, such as trunk lean, tibial angle, or foot turnout, and matters because it changes how load is distributed through the chain. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)

Center of mass and base of support govern balance and stability; if the COM projection stays within the base of support, balance is easier to maintain, while rapid COM shifts or narrow support make control more demanding. Mobility vs. stability is a useful software concept because some compensations reflect insufficient motion at one joint and excessive demand on another segment, such as ankle limits driving trunk compensation in squat or landing tasks. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12476310/)

Force production, force absorption, ground reaction force, torque, velocity, acceleration, and impulse are all real biomechanical quantities, but only some can be inferred from video. Camera-only systems can estimate timing and kinematic proxies, but not true internal force or moment output with high confidence unless they use a validated predictive model and clearly label outputs as estimates. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12758755/)

### What matters visually

Visible signs of good or poor mechanics include excessive trunk lean, knee collapse, pelvic shift, asymmetrical depth, inconsistent tempo, reduced balance, and abrupt "stiff" or "soft" landings. Posture and alignment matter because they change the line of action of the ground reaction force relative to the joints, which changes demand at the hip, knee, and trunk. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)

Kinetic chains describe how force and motion travel from foot to ankle to knee to hip to pelvis to trunk and, in upper-body tasks, through shoulder and head/neck. Compensation patterns occur when one region cannot contribute normally and another region takes over, such as a trunk shift replacing hip control or a foot collapse showing up upstream as knee valgus. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12730016/)

Neuromuscular control and proprioception are not directly visible, but their consequences are. Software can observe the outputs of poor control—wobble, delayed stabilization, asymmetry, repeated errors, and inconsistent joint paths—but should not claim the underlying sensory or neural cause from video alone. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

### Software mapping

A camera-based system can estimate many of these concepts at a useful level if it stays honest about fidelity. The best software representation is a hierarchy: pose landmarks → derived angles and positions → movement metrics → pattern scores → confidence-weighted feedback. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

Good coaching feedback should be concrete and external: "your trunk is drifting left," "your knees are collapsing inward on the descent," "your left landing is stiffer than your right," or "your reps are less consistent after rep 4." It should avoid diagnosis language and avoid claiming hidden pathology. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

## Movement Pattern Research

### Bodyweight squat

The squat is a high-value starting movement because its biomechanics are well studied and it reveals trunk, hip, knee, ankle, and foot behavior in a controlled task. Key joints include the ankle, knee, hip, pelvis, and trunk, with visible features such as depth, trunk inclination, tibia inclination, knee tracking, stance width, and foot turnout. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)

Common deficiencies include excessive trunk flexion, limited depth, heel rise, knee valgus, hip shift, and poor left-right depth symmetry. Camera systems can usually detect trunk angle, knee path, stance width, and gross asymmetry, but they cannot reliably infer compressive load, ligament stress, or exact joint moments from a single 2D view. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10899431/)

The squat review shows that trunk inclination and tibia inclination strongly influence hip- vs knee-biased loading, and foot rotation/stance width also alter frontal and transverse plane demands. That means software can produce meaningful feedback like "more upright trunk biases the knees more" or "wider stance reduced knee valgus appearance," but it should not claim a medical outcome from that alone. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)

### Countermovement jump and landing

Jump and landing tasks are useful because they expose force absorption, trunk control, limb symmetry, and dynamic stability under time pressure. The literature emphasizes that asymmetries become more visible as task demand rises, and squat asymmetry can transfer to jump/landing asymmetry. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12170558/)

Visible deficiencies include stiff landings, excessive trunk flexion, asymmetrical knee flexion, dynamic valgus, and uneven limb loading proxies. A camera can estimate landing depth, time to stabilization proxies, bilateral hip/knee angle differences, and trunk sway, but it cannot directly measure force absorption or vertical ground reaction force without extra instrumentation. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12170558/)

### Single-leg squat

Single-leg squats are valuable because they amplify control deficits and asymmetries. The movement strongly involves hip, knee, ankle, pelvis, and trunk, and the literature supports its use as a functional performance test for neuromuscular control. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/21317-the-single-leg-squat-test-a-top-down-or-bottom-up-functional-performance-test)

Common deficiencies include contralateral pelvic drop, trunk lean, knee valgus, foot pronation/collapse, and loss of balance. Camera systems can detect frontal-plane pelvic and trunk deviation fairly well if the view is appropriate, but cannot determine whether the limiting factor is strength, pain, motor control, or joint pathology. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC2547867/)

### Lunge

Lunges are useful for unilateral control and can reveal asymmetry in step length, trunk position, hip stability, and knee tracking. 2D lunge analysis has validation challenges because camera placement and the chosen angle calculation method materially affect the result, so software must be careful about viewpoint constraints and metric definitions. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10899431/)

### Hip hinge

Hip hinge patterns are useful for posterior-chain mechanics, trunk control, and pelvis-to-spine coordination. Camera-based systems can measure trunk inclination, hip flexion proxy, and spine-pelvis alignment, but not true lumbar loading or posterior chain force production. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

### Sprint acceleration posture

Sprint acceleration posture depends on forward trunk inclination, shin angle, push-off orientation, and the coordination of hip extension with ground contact. The key visible cues are forward body angle, shin angle during stance, step timing, and asymmetry in drive mechanics; a single camera can estimate these visually, but not true horizontal force or block-like acceleration impulse without modeling support. [cdn.uksca.org](https://cdn.uksca.org.uk/assets/pdfs/UkscaIqPdfs/technical-models-for-change-of-direction-biomechanical-principles-637212405997453524.pdf)

### Deceleration and cutting

Deceleration and change of direction tasks are especially informative because they reveal braking, trunk inclination, center-of-mass lowering, and reorientation control. Research on COD performance highlights greater braking forces, lower COM height, trunk inclination, and coordinated hip-knee-ankle moments as key contributors to performance. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12476310/)

Software can detect plant position, trunk lean, shin angle, braking-like reduction in COM speed proxy, and asymmetrical turn mechanics. It cannot directly compute braking force or joint power from one camera with high confidence, so those outputs should be estimates or trends only. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12476310/)

### Push-up and plank posture

Push-up and plank tasks are best for trunk control, shoulder position, scapular stability proxies, and pelvic control. The visible signals are anterior pelvic tilt, trunk sag, head/neck alignment, and shoulder asymmetry; these are much more measurable than internal core strength. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/28055-the-effect-of-a-novel-training-program-to-improve-trunk-stability-push-up-performance-in-active-females-a-pilot-study)

## Kinetic Chain Analysis

The kinetic chain is easiest to think of as a force and control pipeline. When one segment is weak, stiff, or misaligned, the body redistributes motion and load to neighboring segments, often producing a visible compensation pattern. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12730016/)

A foot or ankle restriction can alter tibial progression and push the trunk forward in squat or landing. A hip control deficit can show up as knee valgus, pelvic drop, or trunk shift; a trunk control deficit can reduce the body's ability to keep the COM over the base of support, which increases instability. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12476310/)

Examples that are especially useful for software:

- Knee valgus during squat: biomechanically this is an inward knee collapse or reduced knee abduction control; possible causes include hip control deficit, stance issues, foot collapse, or task strategy. Software logic can look for medial knee drift relative to foot center and compare left/right repeatability. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)
- Trunk collapse during landing: visually, the torso folds excessively or cannot resist forward motion; software can track trunk angle at contact and rate of trunk angle change after landing. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12476310/)
- Hip shift during squat: one hip travels laterally or one side unloads; software can compare pelvis midpoint to foot midpoint and detect asymmetrical centerline drift. [ijspt](https://ijspt.org/lower-limb-ground-reaction-force-and-center-of-pressure-asymmetry-during-bodyweight-squats/)
- Unstable single-leg control: visible as pelvis wobble, trunk sway, foot repositioning, and variable knee path; software can score variability, stabilization time, and repeated error rate. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/21317-the-single-leg-squat-test-a-top-down-or-bottom-up-functional-performance-test)

These patterns spread because movement is coordinated, not isolated. A visible foot fault may be the entry point, but the measurable outcome is often in the pelvis or trunk, so good software should score both local and global effects of compensation. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

## Symmetry and Asymmetry

Bilateral symmetry is the ideal reference, but not every asymmetry is problematic. Small, stable differences can be normal, while large, changing, or task-dependent differences are more meaningful—especially if they increase with fatigue or higher task demand. [ijspt](https://ijspt.org/lower-limb-ground-reaction-force-and-center-of-pressure-asymmetry-during-bodyweight-squats/)

The asymmetries that matter most for KinematicIQ are trunk lean, hip shift, pelvic drop/tilt, knee tracking differences, landing asymmetry, and limb-to-limb consistency across reps. Research suggests that asymmetry in lower-demand tasks can transfer to more demanding tasks, which makes trend tracking valuable. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12170558/)

### What to measure

A camera system can estimate asymmetry by comparing mirrored joint angles, segment angles, timing, and displacement between left and right sides. The best metrics are often normalized differences, side-to-side ratios, and consistency over repeated trials rather than a single raw number. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

### Example formulas

- Joint-angle comparison:  
  Asymmetry = |θ_L - θ_R|  

- Normalized asymmetry score:  
  Score = (|θ_L - θ_R| / max(θ_L, θ_R, ε)) × 100  

- Hip-shift detection:  
  HipShift = x_pelvis_center - (x_left_foot + x_right_foot) / 2  

- Trunk lean detection:  
  trunk angle relative to vertical, then compare left/right or rep-to-rep deviation.  

- Movement consistency:  
  compute variance or coefficient of variation across reps for peak depth, trunk angle, landing angle, and timing.  

A useful asymmetry score should be confidence-weighted and context-aware. The same asymmetry might be normal in one athlete and meaningful in another, so the software should emphasize change over time and within-athlete deviation rather than universal absolutes. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12170558/)

## Posture and Alignment

Static posture and dynamic posture are related but not identical. Static posture can be captured at rest, while dynamic posture is the pattern the body uses while moving, and the latter is usually more relevant for athletic performance. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

Important patterns include spinal alignment, anterior pelvic tilt, rounded shoulders, forward head posture, trunk lean, pelvis control, and foot position. Camera-based systems can estimate these as visible segment relationships, but they cannot reliably infer pain, structural diagnosis, or true spinal loading from posture alone. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12733711/)

For athletics, posture should be framed as a movement strategy, not a moral good or medical label. A software product should say "more trunk lean," "greater pelvic tilt," or "reduced trunk control" rather than "bad posture" or anything that implies diagnosis. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

## Software Translation Layer

This is the core design principle for KinematicIQ: turn biomechanics into a layered interpretation system. The most reliable flow is landmarks → kinematics → pattern metrics → scores → feedback, with confidence attached at each stage. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

### What to score first

The highest-value first metrics are:

- Joint angles: knee flexion, hip flexion proxy, trunk lean, ankle dorsiflexion proxy.  
- Symmetry: left-right knee angle, hip height, pelvis shift, landing timing.  
- Consistency: rep-to-rep variability in depth, alignment, and tempo.  
- Control: sway, wobble, stabilization time, abrupt collapse or drift.  
- Range proxy: how far the athlete moves in the tested pattern. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

### What is noisy

Single-view 2D systems are weakest for transverse-plane and depth-dependent estimates, especially when limbs occlude each other or the camera angle is poor. Lower-limb angle errors can differ substantially by model and exercise, so the software must include viewpoint checks and landmark-quality scoring. [sjsp.aearedo](https://sjsp.aearedo.es/index.php/sjsp/article/view/pose-estimation-models-validated-lower-body-kinematics)

### What should be trend-based

Any score related to fatigue, readiness, or adaptation should be trend-based, not single-session based. Repetition quality, asymmetry drift, and loss of consistency across a set are better fatigue proxies than one isolated movement score. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12170558/)

### What should be confidence-scored

Every estimate should carry confidence: landmark visibility, camera angle suitability, movement speed suitability, and metric reliability. If confidence is low, the software should suppress strong conclusions and default to "insufficient signal" rather than overclaiming. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC12749503/)

### What should not be claimed

Software should not claim:
- injury diagnosis.  
- pain source.  
- tissue damage.  
- exact joint moments or forces from monocular video.  
- medical or rehab clearance.  

That keeps the product in the movement-intelligence lane rather than the medical device lane. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10987311/)

## Practical MVP Recommendations

KinematicIQ should start with movements that are simple, repeatable, and highly informative from one camera: bodyweight squat, single-leg squat, lunge, countermovement jump/landing, and plank/push-up posture. These reveal the widest range of visible mechanics with the lowest setup complexity. [ijspt.scholasticahq](https://ijspt.scholasticahq.com/article/28055-the-effect-of-a-novel-training-program-to-improve-trunk-stability-push-up-performance-in-active-females-a-pilot-study)

### Required camera angles

- Squat, lunge, hinge, plank: sagittal view first; frontal view as a second option for asymmetry and knee tracking.  
- Jump/landing: frontal plus sagittal if possible, or a standardized front angle if only one view is allowed.  
- Single-leg work: frontal view is especially useful for pelvic drop and knee tracking, while sagittal view helps with trunk collapse. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10899431/)

### First tracked metrics

- Trunk angle and trunk change rate.  
- Knee angle and knee tracking relative to foot center.  
- Pelvic tilt/shift proxies.  
- Depth proxy and range consistency.  
- Left-right asymmetry across reps.  
- Stabilization after landing or at the bottom of a rep. [ijspt](https://ijspt.org/lower-limb-ground-reaction-force-and-center-of-pressure-asymmetry-during-bodyweight-squats/)

### Good first feedback

Feedback should be direct, technical, and actionable:
- "Your trunk is leaning farther forward than your prior reps."
- "Your left and right landing patterns are uneven."
- "Your knees drift inward near the bottom of the squat."
- "Your pelvis shifts left during single-leg control."
- "Your rep quality drops after the first few repetitions."  

### What to leave for later

Leave true force estimation, readiness scoring, fatigue inference, and individualized risk prediction for later phases unless they are clearly labeled as experimental. Force plates, IMUs, pressure insoles, or multi-camera setups become more useful when the product needs real force, loading, or multi-planar precision. [sciencedirect](https://www.sciencedirect.com/topics/immunology-and-microbiology/ground-reaction-force)

## Open Questions

The main unresolved research questions are calibration and generalization: how to make scores robust across body types, camera heights, clothing, speeds, and spaces. Another major question is how to separate true movement deficiency from task preference, coaching style, fatigue, and strategy without overinterpreting the signal. [sjsp.aearedo](https://sjsp.aearedo.es/index.php/sjsp/article/view/pose-estimation-models-validated-lower-body-kinematics)

The biggest implementation challenge is deciding when the software should speak in absolutes versus probabilities. For KinematicIQ, the safest and most credible approach is to score visible movement patterns, report confidence, and frame feedback as movement observations rather than medical interpretation. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8588262/)

## Sources

Key sources used for this report include a 2024 squat biomechanics review in the *International Journal of Sports Physical Therapy*, a 2021 review on pose estimation in human health and performance, a 2024 review on change-of-direction biomechanics, a 2024 study on lower-body pose-estimation validation, a single-limb squat biomechanics paper, a single-leg squat functional performance review, a squat symmetry/asymmetry study, and recent validation/implementation papers on video-based movement analysis and movement scoring. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC9632818/)

A useful next step is to turn this into a product requirements draft with a feature-by-feature mapping from biomechanics concept to metric, confidence rule, and user-facing feedback.
