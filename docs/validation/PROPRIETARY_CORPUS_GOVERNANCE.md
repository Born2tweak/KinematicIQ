# Proprietary Validation Corpus Governance

**Status:** Required plan before any participant recruitment or recording  
**Owner checkpoint:** privacy/legal/product approval; this document is not consent

## Purpose limitation

Collect the minimum consumer-RGB movement recordings needed to test capture
failures that public datasets do not cover: device/browser variation, camera
height/distance, lighting, clothing, partial framing, occlusion, bystanders, and
protocol-specific negative movements. The corpus is evaluation-only by default;
model training requires a separate consent purpose and approval.

## Pre-collection gates

1. Written study purpose, protocol list, sampling matrix, and exclusion criteria.
2. Adult informed consent covering recording, derived pose landmarks, review,
   retention, withdrawal limits, and whether any de-identified redistribution is
   contemplated. No implied health care or performance benefit.
3. Privacy review of biometric/state law obligations and recording location.
4. Named data controller/custodian and access list; no collection into personal
   cloud drives or source repositories.
5. Participant ID generated independently of contact details. The re-link key is
   encrypted, separately stored, and unavailable to ordinary evaluators.
6. Approved deletion/incident procedure and final owner sign-off.

## Data minimization and storage

- Do not collect name, birth date, diagnosis, injury history, medication, or
  precise location with movement media.
- Record only the view, duration, and protocol needed for a declared test.
- Store raw media in an access-controlled corpus outside git. Store derived pose
  tapes separately with pseudonymous subject/session identifiers.
- Repository artifacts contain only aggregate reports or expressly approved,
  non-identifying synthetic/redacted fixtures with provenance.
- Encrypt in transit and at rest; log access and exports. No public-link sharing.

## Retention and withdrawal

Default proposal: raw media for 90 days after label/quality acceptance, derived
pose data for 12 months, aggregate benchmark reports indefinitely. Final periods
require privacy/legal approval before collection. Delete rejected captures early.
A participant may request deletion while the re-link key exists; aggregate results
already incorporated into non-identifying reports may be non-retractable only if
the consent form says so clearly.

## Labeling and claims

At least two raters label observable events without seeing KinematicIQ output.
Labels never encode diagnosis, injury risk, pain interpretation, or a universal
“correct” movement. Report agreement, exclusions, missingness, subject-held-out
results, and worst cases. A corpus result cannot promote a metric tier or enable a
protocol without its separate predeclared acceptance and claims gates.

## Incident and deletion checklist

On unauthorized access or accidental repository inclusion: stop processing,
preserve audit logs, notify the custodian/privacy owner, revoke access, remove the
material from ordinary and backup workflows under the approved procedure, assess
notification duties, and document corrective action. Git history rewriting or
external notifications are destructive/external actions requiring explicit owner
authorization.
