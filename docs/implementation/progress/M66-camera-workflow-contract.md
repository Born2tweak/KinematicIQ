# M66 — Camera workflow contract and decomposition

**Status:** Complete (2026-07-11).

Protocol definitions now own capture modes, camera view, view instruction, and
setup instructions. Camera and upload copy consume that metadata, eliminating
the front/side contradiction; squat uses a front-facing, hip-height setup.
`cameraSessionController.ts` owns the display-state mapping and
`CameraSessionHud.tsx` contains the readiness, analyst, and action presentation.

Evidence: controller tests and the production build pass. The extraction kept
the existing frame-analysis behavior and thresholds unchanged.
