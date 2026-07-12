# M76 Support Matrix and Manual Verification

**Support target:** Windows 11 with current Chrome and Firefox; current iPhone
Safari. Record exact OS/browser/assistive-technology versions in the execution
record below. “Current” means a vendor-supported version at the test date.

## Automated evidence boundary

The repository runs the same Playwright interaction and axe WCAG A/AA checks in
Chromium, Firefox, desktop WebKit, and iPhone 13 WebKit emulation. WebKit
emulation is useful compatibility evidence but is not a physical iPhone Safari
result. Axe detects only automatable rules and is not a screen-reader result.

Run from `web/`:

```powershell
npm run build
npm run test:e2e:a11y
npm run test:e2e:support
```

## Script A — Windows 11 keyboard and 400% reflow

Run once in current Chrome and once in current Firefox.

1. Record Windows version (`winver`) and browser version (`chrome://version` or
   `about:support`). Set browser zoom to 100%, Windows display scale to the
   tester's normal setting, and open the authorized KinematicIQ URL.
2. Use only `Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys, and `Escape`.
3. On Landing, traverse every control. Confirm the focus indicator is always
   visible, focus order follows reading order, and no focus is trapped.
4. Operate Play/Pause and the depth slider. Confirm the slider has an announced
   name/value and responds to arrow keys.
5. Open Camera. Deny permission once; confirm “Camera error,” recovery copy, and
   “Try again” are keyboard reachable. Then allow permission and confirm setup
   guidance remains available as text rather than canvas-only information.
6. Open Upload. Choose a local test video with the keyboard, start analysis, and
   confirm progress and any error are exposed as text/status.
7. Complete the approved fixture or test flow to Results. Operate Summary,
   Evidence, and Expert tabs; confirm the active tab is identifiable. Exercise
   replay controls and JSON/HTML/CSV export controls.
8. Open History and keyboard through empty or saved-session state.
9. Set browser zoom to 200%, then 400%. At each level repeat Landing, Camera,
   Upload, Results, and History. Confirm content reflows, text is not clipped,
   two-dimensional scrolling is not required, and fixed controls do not cover
   instructions.
10. Enable Windows “Show animations” off and repeat Landing plus replay. Confirm
    no essential state depends on animation.

Pass only if every item succeeds in both browsers. Record defects with route,
control, exact keystrokes, screenshot, and expected/actual result.

## Script B — Windows 11 NVDA

Run with the latest stable NVDA once in Chrome and once in Firefox.

1. Record NVDA version, speech synthesizer, browser version, Windows version,
   URL/build identifier, and whether NVDA browse or focus mode is active.
2. Start at Landing. Use NVDA heading (`H`), landmark (`D`), link (`K`), button
   (`B`), and form-field (`F`) navigation. Confirm one clear main landmark,
   logical headings, named controls, and no unexplained graphic/canvas output.
3. Read the live demo. Confirm Play/Pause, rep count, and depth slider names and
   states are understandable without looking at the screen.
4. On Camera, deny permission. Confirm the error is announced once and the
   recovery action is discoverable. Allow permission and confirm readiness,
   calibration, set status, rep count, and finish state changes are announced
   without continuous/repeated speech that prevents operation.
5. On Upload, select a file and run analysis. Confirm file identity, progress,
   error/abstain state, and completion are announced.
6. On Results, use tab navigation and NVDA element navigation. Confirm each
   report tab exposes selected state, findings include confidence text, charts
   and timelines have useful text alternatives, and export buttons announce
   format/purpose.
7. On History, confirm empty state or each saved session is understandable and
   operable. Open one saved session if available.
8. Repeat the critical Camera → Results → Export flow with the screen hidden or
   tester looking away. Any step requiring visual guessing fails the script.

## Script C — physical iPhone Safari with VoiceOver

Run on a physical, vendor-supported iPhone—not Simulator or Playwright WebKit.

1. Record iPhone model, iOS version, Safari version/build, orientation, text
   size, display zoom, VoiceOver on/off, URL/build identifier, network type, and
   Low Power Mode state.
2. With VoiceOver off, load Landing in portrait and landscape. Confirm no
   horizontal overflow, clipped navigation, overlapping controls, or unsafe-area
   collision. Repeat with Settings → Accessibility → Display & Text Size →
   Larger Text at the largest accessibility size.
3. Enable VoiceOver. Use left/right swipe, rotor Headings, rotor Landmarks,
   rotor Links, and double-tap activation across Landing. Confirm labels, order,
   values, and selected/expanded states.
4. Open Camera and allow permission. Confirm the correct camera opens, preview
   orientation is correct, setup copy and actions remain reachable, and rotating
   the phone does not lose state or cover controls.
5. Run at least one complete set. Record time from Camera open to model-ready,
   time from model-ready to usable setup guidance, visible/announced rep updates,
   dropped/stalled preview behavior, device temperature warning, and battery
   change over a 10-minute continuous session.
6. Deny camera permission in Settings, return to Safari, reload, and confirm the
   error and recovery instructions are accurate for iOS. Restore permission.
7. Upload a supported local video. Confirm picker, progress, completion/error,
   and screen-lock/background-return behavior.
8. On Results, exercise report tabs, replay, 3D toggle if available, and every
   export. Confirm files open/share locally and VoiceOver announces each action.
9. Turn Reduce Motion on and repeat Landing and replay. Turn Increase Contrast
   on and inspect all routes. Confirm state is never conveyed by color alone.
10. Repeat the critical Camera → Results → Export flow using VoiceOver without
    visual guidance.

## Pending human execution record

| Script | Target | Tester/date | Exact versions | Result | Evidence/defects |
|---|---|---|---|---|---|
| A | Windows 11 Chrome | pending | pending | pending human execution | — |
| A | Windows 11 Firefox | pending | pending | pending human execution | — |
| B | NVDA + Chrome | pending | pending | pending human execution | — |
| B | NVDA + Firefox | pending | pending | pending human execution | — |
| C | Physical iPhone Safari + VoiceOver | pending | pending | pending human execution | — |

No support or accessibility claim may convert these pending rows to pass without
the named human evidence.
