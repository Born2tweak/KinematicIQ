# M76 — Named support and accessibility validation

**Status:** Automated/code-level portion implemented; physical-device and
screen-reader execution pending human evidence (2026-07-12).

The owner selected Windows 11 Chrome + Firefox and iPhone Safari. Playwright now
runs Chromium, Firefox, desktop WebKit, and iPhone WebKit emulation. Axe WCAG
A/AA scans cover Landing, Upload, History, and Camera setup. The exact Windows
keyboard/zoom, NVDA, and physical iPhone Safari/VoiceOver procedures and evidence
fields are in `docs/validation/M76_SUPPORT_MATRIX_AND_MANUAL_VERIFICATION.md`.

Automated WebKit does not prove physical iPhone Safari support. Axe does not
prove screen-reader usability. Those rows remain explicitly pending human
execution.

Current automated evidence: 16/16 axe route scans pass across four browser
projects; 20/20 release-readiness interaction checks pass; all four projects
complete the clean pose-tape workflow. The fixture source now guarantees 75
calibration observations before resuming wall-clock playback, preventing
headless WebKit throttling from skipping the frame-counted preroll. Automated
WebKit still does not replace the pending physical Safari pass.

The optional real `getUserMedia` acquisition smoke also passes in Chromium when
fed a locally generated three-second FFmpeg test pattern. The synthetic `.y4m`
was deleted after the run and contained no participant footage. Firefox/WebKit
do not expose Chromium's fake-camera launch flags, so this smoke is not portable
to those engines.
