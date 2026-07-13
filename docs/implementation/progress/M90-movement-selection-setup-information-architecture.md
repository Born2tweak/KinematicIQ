# M90 — Movement selection and setup information architecture

**Status:** complete

The landing movement selector now separates “Available now” from the “Research
roadmap.” Squat is the only interactive movement and carries view/setup text
directly from its protocol metadata. Planned definitions render as non-interactive
articles with explicit “Research only — validation pending” status; they cannot
navigate or enter analysis. A pure grouping model prevents UI lifecycle drift.

## Verification

- Picker model, protocol completeness, and claims: 3 files / 9 tests passed.
- Production build: 715 modules transformed.
- Axe WCAG A/AA routes: 16/16 passed across Chromium, Firefox, desktop WebKit,
  and iPhone WebKit.
- Full support matrix: 56 passed; 4 expected fake-webcam skips on non-Chromium
  projects.
- The 320 px reflow, keyboard focus, reduced motion, contrast, camera fixture,
  permission recovery, and clean-squat result paths all passed.

Physical VoiceOver and NVDA scripts remain pending human execution per the
Phase 2 validation boundary; no physical-device result is claimed.
