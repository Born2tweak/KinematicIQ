# KinematicIQ — shared local workspace (all agents)

**Canonical folder (every agent uses this):**

`C:\Users\acetu\KinematicIQ`

**GitHub:** https://github.com/Born2tweak/KinematicIQ.git

---

## One terminal command (paste into any agent with shell access)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1" -StartDev -StartWatcher
```

First time on a machine (no clone yet), same command — it clones automatically.

Sync only (no dev server):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1" -SyncOnly
```

---

## Paste this at the start of any agent chat

```
KinematicIQ shared workspace

- Local repo (ONLY work here): C:\Users\acetu\KinematicIQ
- Remote: https://github.com/Born2tweak/KinematicIQ.git branch master
- App code: web/ (Vite + React). Run bootstrap before coding:

powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acetu\KinematicIQ\bootstrap.ps1" -SyncOnly

Rules:
1. cd C:\Users\acetu\KinematicIQ before any git or file edits
2. git pull origin master (or run bootstrap -SyncOnly) before starting work
3. Commit/push to GitHub when done so other agents pick up changes
4. Dev server: cd web && npm run dev → http://localhost:5173/
5. Do not use a different clone path unless I say so

Read docs/00_context_pack.md first (live repo state), then docs/08_ai_rules.md and docs/09_build_plan.md.
```

---

## Keep repo updated in the background

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acetu\KinematicIQ\bootstrap.ps1" -StartWatcher
```

Or double-click: `scripts\Start-AutoSync.bat`
