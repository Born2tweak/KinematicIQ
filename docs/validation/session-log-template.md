# Validation Session Log

One entry per recorded set. Fill it in immediately after filming, while you still remember the set — this is the informal ground truth that gate diagnostics and detected counts get audited against. Copy the blank entry block for each new session.

Companion files per session: the raw video (if uploaded) and the downloaded `.posetape.json` (Results → Analyst → Save pose tape).

---

## Entry template (copy me)

```
### Session: <name or filename>            e.g. garage-front-2026-07-04-a
- Date/time:
- Source: live | upload
- View / protocol: front (docs/25) | side | other: ___
- Tape file: <filename>.posetape.json | none
- ACTUAL reps performed (your count):
- Detected reps:
- Rejected candidates shown in analyst mode: <count and gates, e.g. "3 × bottom, 1 × knee-lift">
- Movement intent: normal | induced pattern: ___ (e.g. deliberate shallow, lean left)
- Capture issues: (backlight, clipped feet, too close, camera moved, second person, ...)
- Protocol compliant (docs/25 checklist)? yes / no — what failed:
- Notes: (anything the numbers won't tell you — fatigue, humor, surprises in the report)
```

---

## Sessions

### Session: example-garage-2026-07-04
- Date/time: 2026-07-04 12:30
- Source: live
- View / protocol: front-ish, garage, strong backlight
- Tape file: none (pre-tape-capture build)
- ACTUAL reps performed: ~13
- Detected reps: 11
- Rejected candidates: unknown (diagnostics not yet built)
- Movement intent: normal
- Capture issues: strong backlight from driveway; walked toward camera mid-set
- Protocol compliant? no — distance and lighting
- Notes: first real-world session; several "Bottom not held long enough" rejections observed live
