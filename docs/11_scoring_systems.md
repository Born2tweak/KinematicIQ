# KinematicIQ Movement Scoring Systems Research Report

## Executive Summary

KinematicIQ should treat movement scores as **decision-support summaries**, not truth claims about injury, readiness, or biomechanics. Sports science supports using movement screens and jump/landing tests to identify visible movement deviations, asymmetry, variability, and trend changes, but the literature also shows that many composite scores are only modestly predictive and can be misleading when overinterpreted. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/27159297/)

The safest and most useful product design is a transparent scoring stack: score observable features separately, attach confidence to each, compare against the athlete's own baseline, and avoid medical language or one-session certainty. In practice, KinematicIQ should emphasize "movement quality," "symmetry," "stability," "consistency," and "trend change," while avoiding claims like injury diagnosis, fatigue diagnosis, compensatory pathology, or "optimal biomechanics". [massgeneralbrigham](https://www.massgeneralbrigham.org/en/about/newsroom/articles/biomechanics-in-sports)

## Foundations of Movement Scoring

Biomechanics is the study of how movement, force, and coordination interact, and sports biomechanics is used to identify inefficient patterns, quantify joint loading proxies, monitor fatigue, and track improvement over time. Movement screening systems such as the FMS and LESS became popular because they reduce complex movement into repeatable criteria, but their predictive power is limited and highly context-dependent. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/19726623/)

What makes scoring useful is not "perfect biomechanics," but consistency, transparency, and actionability. A useful score should map to a visible feature, be explainable in plain language, and be stable enough to track change across sessions. What makes scores misleading is hidden weighting, arbitrary 0–100 scales with no semantic meaning, and overconfident inference from a single camera view or a single rep. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737035/)

KinematicIQ scores should represent **observable movement features and trends**: alignment, control, symmetry, variability, and confidence in the observation. They should **not** represent diagnosis, tissue health, injury risk certainty, "good athlete/bad athlete" labels, or claims of internal force production unless those are explicitly modeled and validated. Language to avoid includes "abnormal," "pathological," "dangerous," "injury-prone," "fatigued" as a diagnosis, and "optimal" unless the system can define the comparator and the evidence base. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/26502447/)

## Movement Quality Scoring

Movement quality scoring works best when it is task-specific. A squat score should not be the same thing as a jump-landing score, because the visually important criteria differ by task. The best-known examples, like LESS, score landing errors from a rubric, while FMS scores general movement patterns with a limited ordinal scale. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/27159297/)

For a squat, "good" movement usually means controlled depth, stable trunk, knee tracking that is not obviously collapsing inward, and smooth ascent/descent without large compensations. For a countermovement jump, quality is less about deep knee angles and more about coordination, trunk control, symmetrical takeoff and landing, and landing stiffness/control. For a single-leg squat or lunge, frontal-plane control, pelvic stability, trunk lean, and foot/ankle control become more important because the test amplifies asymmetry and balance demands. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10142123/)

A robust scoring system should combine several families of signals:
- Joint angles and ranges.
- Timing and symmetry.
- Path deviation from centerline.
- Smoothness and repetition-to-repetition consistency.
- Depth or excursion.
- Visible compensation patterns.
- Confidence in landmark visibility.

Rule-based scoring is the most transparent starting point. Example: in a squat, award points for achieving a minimum depth band, penalize excessive trunk lean, penalize obvious knee valgus, and subtract for left-right hip shift. Weighted scoring is better when features have different importance; for example, knee collapse and trunk instability could count more than small heel rise if the user is an athlete and the task is a bodyweight squat. Normalized scoring can scale each feature to 0–1 relative to task norms, then combine them into a task-specific score; trend-based scoring should compare the same person to their own past performance rather than to a universal "ideal". [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5800724/)

## Asymmetry Scoring

Asymmetry is one of the most important and most easily misunderstood signals. The literature shows that asymmetry thresholds are not universal; they vary by task, variable, and population, and there is no single cut point that works everywhere. Some asymmetry is normal, especially in sport-specific dominance, and a single left-right difference should not be framed as a problem without context or longitudinal confirmation. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/34055168/)

The most meaningful asymmetries are the ones that are persistent, task-relevant, and large enough to exceed measurement noise. Examples include repeated hip shift to one side, consistent trunk lean, asymmetric jump height or impulse, asymmetric landing time, and unilateral control differences that show up across multiple sessions. The literature also suggests that unilateral or impulse-based asymmetry measures can be more informative than simplistic peak-angle comparisons in some jump tasks. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/35466266/)

Useful methods include:
- Joint angle comparison: compare left/right peak knee flexion, hip flexion, ankle dorsiflexion, or trunk angle at matched phases.
- Timing analysis: compare time-to-bottom, time-to-takeoff, time-to-stabilization, or movement phase duration.
- Centerline deviation: compare horizontal displacement of the pelvis, sternum, or knee relative to a midline.
- Landing symmetry: compare stance width, knee flexion angle, and impact timing across sides.
- Movement path comparison: compare the 2D trajectory of body segments across repeated reps.

A simple asymmetry formula is:

Asymmetry % = (|L - R| / max(L, R)) × 100

This works for many magnitude variables, but it should not be used blindly for angles where direction matters or for variables where a baseline zero has special meaning. For timing variables, a ratio or phase difference is often better than a percentage difference. For confidence weighting, reduce score weight when one side is partially occluded, when camera angle is poor, or when the athlete is turned away from the camera.

Pseudocode logic can be:
1. Detect visible bilateral landmarks.
2. Validate phase alignment.
3. Compute left/right metric pairs.
4. Reject or downweight if camera reliability is low.
5. Convert difference to a task-specific asymmetry band.
6. Compare against athlete baseline and session history.
7. Output "persistently asymmetric" only after multiple valid sessions.

## Movement Consistency

Movement consistency reflects motor control, coordination, and repetition quality. Rep-to-rep variation is not automatically bad; some variability is normal and can even be functional, but large or increasing variability during a session can indicate fatigue, loss of control, or poor movement automation. The key is distinguishing healthy variability from drift. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC3960345/)

KinematicIQ can track consistency at three levels:
- Rep consistency: how similar repeated reps are within a set.
- Session consistency: how similar today's movement is to prior sessions.
- Pattern consistency: whether the athlete uses the same strategy each time, even if it is not ideal.

A useful rep consistency score could combine variance in depth, trunk angle, knee valgus, landing width, and timing across reps. Session-to-session comparison is often more valuable than within-set variability because it can reveal drift in a stable athlete profile. Fatigue proxy metrics can come from increasing variability, slower movement, reduced jump height, or deteriorating landing control across the set. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/35741462/)

## Readiness and Fatigue Proxies

Movement can support readiness monitoring, but only as a proxy. The CMJ literature supports jump testing as a practical tool for neuromuscular monitoring, with sensitivity varying by variable and athlete population. The safest interpretation is trend-based: a drop in jump performance, slower concentric action, more asymmetry, or worse landing control may indicate reduced performance state, but it does not prove physiological fatigue or overtraining. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8607773/)

Useful proxy signals include:
- Lower jump height relative to baseline.
- Lower takeoff velocity or reduced propulsive impulse proxy.
- Increased landing instability.
- Increased asymmetry under load or under repeated trials.
- Reduced squat depth consistency.
- Slower movement tempo or longer stabilization time.

What cannot be inferred reliably from video alone includes blood lactate, central nervous system state, injury presence, recovery status, or medical fatigue diagnosis. The product should say "movement appears less explosive than your baseline" rather than "you are fatigued". Baseline comparison matters because one athlete's normal is another athlete's low score, and a single session is a weak estimate of the athlete's true movement state. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC11268923/)

## Confidence and Uncertainty

Confidence scoring matters because movement analysis is only as good as the view, visibility, and phase detection. Automated landing systems show that fixed algorithms can be reliable, but scoring quality still depends on clear visibility and stable capture conditions. KinematicIQ should attach confidence to each score and refuse or soften interpretation when capture quality is poor. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737035/)

Low-confidence conditions include:
- Occlusion of joints or limbs.
- Poor lighting.
- Camera misalignment.
- Partial body visibility.
- Large perspective distortion.
- Frames with motion blur or missed keypoints.

A practical logic layer could use three outputs:
- Capture confidence: is the video usable?
- Feature confidence: is a specific metric trustworthy?
- Interpretation confidence: is the suggested meaning stable enough to show?

If capture confidence is low, the system should either not score or present only very limited feedback. If feature confidence is medium, the system should show the observation but avoid strong coaching claims. If feature confidence is high and repeated across sessions, the system can become more assertive about trend change. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5800724/)

## Human-Readable Feedback

Feedback should sound like a good coach, not a lab report. The best structure is: observation, possible meaning, confidence, cue, and a safety note. This keeps the system practical while avoiding false certainty. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737035/)

Example patterns:
- Knee valgus: "Your knees drift inward during the descent. This may suggest reduced frontal-plane control in this pattern. Confidence: medium. Cue: 'Push your knees gently out over your toes as you lower.' Note: this is a movement observation, not a diagnosis."
- Trunk lean: "Your trunk leans forward more than your recent baseline. This can happen when balance, ankle mobility, or hip strategy changes. Confidence: medium-high. Cue: 'Keep your chest tall and ribcage stacked over your pelvis.'"
- Hip shift: "You shift slightly to the right on the bottom of the squat. That may reflect a loading preference or a stability strategy. Confidence: medium. Cue: 'Try to keep pressure even through both feet.'"
- Landing control: "You land with a small wobble and extra knee collapse. This may indicate reduced landing control in this trial. Confidence: high. Cue: 'Stick the landing quietly and hold for two seconds.'"
- Heel rise: "Your heels rise early in the squat. That can happen with ankle mobility limits or a strategy change. Confidence: medium. Cue: 'Keep the whole foot grounded if that feels natural and pain-free.'"

Language should stay observational: "appears," "suggests," "relative to your baseline," and "in this task." Avoid "your ACL is at risk" or "this is dysfunctional," because the software cannot know that from video alone. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/19726623/)

## Longitudinal Tracking

Longitudinal tracking is where movement scoring becomes truly valuable. One-off scores are noisy, but repeated measures let the system learn an athlete's movement signature and notice drift, asymmetry persistence, or task-specific change. Personalized baselines are essential because athletes differ in anatomy, sport, and style. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/27663764/)

A simple baseline framework can use:
- Rolling average of the last 5–10 valid sessions.
- Session variability bands.
- Baseline asymmetry by task.
- Best recent score and typical score.
- Drift indicator when the current trend diverges from baseline.

Meaningful change should be detected relative to the athlete's own history, not only against universal thresholds. Trend visualization can show direction, magnitude, and confidence over time, which is more useful than a single "movement score" badge. Movement drift can be flagged when multiple features worsen together across sessions, such as reduced depth, increased trunk sway, and increased asymmetry. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC3960345/)

## MVP Scoring Recommendations

For Layer 1, the best first-pass scoring set is small and explainable. I would include:
- Movement quality.
- Asymmetry.
- Stability/control.
- Consistency.
- Capture confidence.

I would avoid:
- Injury risk scores.
- Medical fatigue scores.
- "Biomechanical efficiency" as a single global number.
- Hidden black-box composites with no observable basis.

For a bodyweight squat, the MVP should score depth consistency, trunk control, knee alignment, and left-right loading shift. For a countermovement jump, it should score jump coordination proxy, landing stability, asymmetry, and rep-to-rep consistency. For landing mechanics, it should score contact control, knee/trunk alignment, and stabilization time, using a LESS-like logic where visible errors are counted and weighted. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/19726623/)

A realistic output model:
- Inputs: video, joint landmarks, frame timing, capture quality.
- Metrics: joint angles, centerline deviation, symmetry, tempo, stability proxy.
- Thresholds: task-specific bands, not one-size-fits-all cutoffs.
- Outputs: score, confidence, top 2–3 observations, one cue, one comparison to baseline.
- Confidence logic: withhold or soften output when visibility is poor or when one trial is not representative.

## Future Scoring Possibilities

Realistic today:
- Explainable rule-based scoring from video.
- Athlete-specific baselines.
- Simple trend detection.
- Landmark-derived asymmetry and control proxies.
- Session comparison dashboards. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC8607773/)

Possible later:
- Movement embeddings that cluster movement styles.
- Personalized biomechanics models trained per athlete.
- Better force and impulse estimation from video plus learned priors.
- Predictive trend models for performance decline or technique drift.

Speculative or research-grade:
- Digital twins with individualized forward simulation.
- Robust force estimation in unconstrained environments.
- General-purpose movement foundation models that infer coaching-relevant latent states from video alone.

The product should treat future models as probabilistic helpers, not authority. The more inferential the model, the stronger the need for uncertainty displays, validation studies, and conservative language. [massgeneralbrigham](https://www.massgeneralbrigham.org/en/about/newsroom/articles/biomechanics-in-sports)

## Open Questions

The biggest open questions are thresholding, normalization, and generalization. Which asymmetry thresholds matter for which tasks, and which should be athlete-specific rather than global ? How much of movement quality can be inferred reliably from monocular video, and where should the system simply abstain? [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC7863609/)

Another open question is how to separate useful coaching signals from noisy biomechanical details. In practice, a product succeeds when it gives stable, understandable, repeatable feedback, not when it tries to sound like a lab-grade clinical system. A final question is product language: how to remain precise without becoming sterile, and how to sound confident without overstating what the software truly knows. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5800724/)

## Sources

- Functional Movement Screen reliability, validity, and injury predictive value. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/27159297/)
- Landing Error Scoring System validity and reliability. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/19726623/)
- Automated LESS scoring with video and depth camera. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5737035/)
- Biomechanics in sport and movement assessment overview. [massgeneralbrigham](https://www.massgeneralbrigham.org/en/about/newsroom/articles/biomechanics-in-sports)
- Movement quality screening and HLLMS reliability. [eprints.soton.ac](https://eprints.soton.ac.uk/439616/2/S0218957719500088.pdf)
- FMS vs LESS comparison. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/32454929/)
- FMS predictive meta-analysis and limitations. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/26502447/)
- FMS not recommended as standalone injury prediction in NCAA athletes. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC5800724/)
- Asymmetry in CMJ and phase-specific asymmetry measures. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/35466266/)
- Asymmetry thresholds and task-specific limitations. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/33264407/)
- CMJ as neuromuscular monitoring tool. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/27663764/)
- Daily readiness/fatigue sensitivity of vertical jump. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/28902119/)
- Fatigue effects on movement variability and control. [pubmed.ncbi.nlm.nih](https://pubmed.ncbi.nlm.nih.gov/35741462/)
- Fatigue and asymmetry changes in jump testing. [pmc.ncbi.nlm.nih](https://pmc.ncbi.nlm.nih.gov/articles/PMC10694723/)
