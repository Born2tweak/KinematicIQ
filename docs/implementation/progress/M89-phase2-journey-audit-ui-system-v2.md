# M89 — Phase 2 journey audit and UI system v2

**Status:** complete for autonomous code/automation audit; in-app screenshot capture unavailable

## Evidence boundary

The current support automation measured 320 px mobile, tablet, desktop Chromium,
Firefox, desktop WebKit, and iPhone WebKit camera states. The camera suite passed
20/20 immediately before this audit; the broader support/axe baseline is 56
applicable passes with four intentional fake-webcam skips. A separate attempt to
capture fresh in-app-browser screenshots failed because the browser rejected its
own newly created tab as outside the current session. No visual result is
claimed for that unavailable surface.

## Journey findings

| Priority | Journey | Measured/code evidence | Contract for M90–M92 |
|---|---|---|---|
| P0 | Movement entry | `ProtocolPicker` mixes one available action with four disabled research items; disabled cards expose lifecycle but not the evidence reason. | Separate “Available now” from “Research roadmap”; every planned item gets concise evidence-status text and can never navigate. |
| P0 | Active analysis | 320 px and tablet action-overlap assertions pass; status and rep feedback already use live regions. Multiple analyst/debug layers still compete with the one-action HUD. | Default hierarchy: phase/status → one correction → rep count → primary finish action. Put analyst evidence behind disclosure. |
| P1 | Results | Results exposes verdict, quality, findings, metrics, confidence, provenance, replay, export, and save across many sections. Confidence is repeated in hero, camera panel, metrics, and cues. | First viewport contains verdict, up to three cues, camera limitation, and replay link. Detailed evidence remains accessible through tabs/disclosure without deletion. |
| P1 | Landing | Marketing explanation, pipeline tabs, evidence statements, and protocol picker all precede task entry at varying depths. | One primary “Analyze a squat” path; evidence explanation follows the action, while claims and disclaimer remain visible. |
| P1 | History | Rows expose protocol, verdict, and camera confidence, but not a concise evidence/replay affordance in the row contract. | One compact row: date/movement, verdict, confidence, and open-result action; empty state remains explicit. |
| P2 | Upload/error | Upload has explicit progress and error semantics, but setup wording can diverge from camera unless derived from protocol metadata. | All setup/error recovery copy comes from the same protocol capture contract where applicable. |

## UI system v2 rules

- Keep the existing color, spacing (`xs` through `2xl`), radius, focus, success,
  warning, and confidence tokens; M89 adds no visual token values.
- Use `report-section` for evidence groups, not repeated hero summaries.
- Color never carries status alone; confidence always includes its text label.
- One primary action per state. Secondary evidence actions use disclosure or
  tabs and remain keyboard reachable.
- Planned protocol cards are non-interactive and explain research/validation
  state in text. Availability is derived from the registry only.
- Camera copy is a text live region; canvas overlays are supplementary.
- Invalid sets fully abstain. No layout may turn missing evidence into a score,
  cue, or anatomical claim.
- Responsive acceptance remains 320 px, 390 px, tablet, desktop, and iPhone
  WebKit with no horizontal overflow or primary-action overlap.

## Wire contracts

1. Landing: value statement → primary squat action → trust/disclaimer → how it
   works → available/research movements.
2. Selection/setup: available group → research group → selected protocol view
   and setup instructions → camera/upload choice.
3. Active: status → one tracking correction → count → finish; analyst detail is
   collapsed.
4. Results: verdict → up to three cues → confidence limitation → replay/evidence
   tabs → export/save.
5. History: compact result rows → open evidence-linked result; honest empty state.
