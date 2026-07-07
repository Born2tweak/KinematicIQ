# Reliability Study Template (M49)

Purpose: collect repeated local sessions so KinematicIQ can replace M32
heuristic change thresholds with evidence-backed SEM/MDC estimates. This
template prepares the workflow; it does not upgrade product claims by itself.

## Study Question

For a stated protocol and metric, how much repeated-session variation appears
when the same participant records under the same capture protocol?

Record the question narrowly:

- Protocol: squat / future protocol id.
- Metric id: for example `squat.depth.min-knee-angle`.
- Capture mode: live, upload, or replay.
- Filter variant: raw, one-euro-live, butterworth-offline.
- Population/context: internal pilot, trained lifters, public-stock clips, etc.

## Minimum Dataset Shape

Each participant should have at least two protocol-compliant sessions recorded
under the same setup.

| Field | Required | Notes |
|---|---:|---|
| participantId | yes | Local pseudonym only; no names in git. |
| sessionId | yes | Stable local id. |
| protocolId | yes | Must match the analyzed protocol. |
| metricId | yes | Use registry ids from `web/src/metrics/`. |
| value | yes | Null when the metric abstained; do not coerce to zero. |
| captureSource | yes | live / upload / replay. |
| filterVariant | yes | Must match metric provenance. |
| qualityVerdict | yes | valid / questionable / invalid. |
| notes | optional | Capture drift, lighting, clothing, camera movement. |

Invalid recordings stay in the study log as evidence about capture reliability,
but metric reliability summaries should only use values whose metric actually
read and whose quality verdict is appropriate for the study question.

## Offline Calculator

Pure helpers live in `web/src/eval/reliability.ts`.

They currently compute:

- mean;
- sample standard deviation;
- SEM-like estimate (`sample SD / sqrt(n)`);
- MDC95-like estimate (`1.96 * sqrt(2) * SEM-like`);
- mean absolute repeat difference across consecutive sessions per participant.

Known limitation: this is not ICC. ICC requires a stronger study design
(balanced repeated measures, rater/session factors, and explicit model choice).
Do not report these values as formal reliability coefficients.

## Promotion Use

Before a metric can move from `experimental` to `production` in
`docs/validation/METRIC_VALIDATION_STATUS.md`, the study packet should include:

1. Dataset manifest row(s) in the local `eval-tapes/MANIFEST.json`.
2. Batch eval report for the included sessions.
3. Reliability summary from `web/src/eval/reliability.ts`.
4. A written interpretation that states sample size, limitations, and whether
   M32 heuristic thresholds should change.
5. Claims-policy review for any affected copy.

## Forbidden Uses

- Do not expose SEM/MDC values to normal users in v1.
- Do not treat a discomfort note, sport, age, or clinical context as a
  reliability adjustment.
- Do not upgrade a metric tier without the evidence packet above.
- Do not call any value "validated" unless an external reference comparison
  exists for the stated question.
