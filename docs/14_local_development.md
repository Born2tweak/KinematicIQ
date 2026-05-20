# Local development — clone and stay in sync with GitHub

Use this guide to keep a **real copy of the repo on your computer** that tracks the same GitHub repository the team (and Cloud Agents) push to.

**Canonical remote:** https://github.com/Born2tweak/KinematicIQ.git  
(GitHub may redirect from older `born2tweak/kinematiciq` URLs — both point to the same repo.)

---

## Windows (start here)

### Prerequisites

- [Git for Windows](https://git-scm.com/download/win) (includes Git Bash)
- [Node.js](https://nodejs.org/) 18+ LTS
- [Cursor](https://cursor.com/) or VS Code

### One command — clone, sync, install (PowerShell)

Open **PowerShell** (not CMD) and paste:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
git clone https://github.com/Born2tweak/KinematicIQ.git $env:USERPROFILE\KinematicIQ
cd $env:USERPROFILE\KinematicIQ
git remote set-url origin https://github.com/Born2tweak/KinematicIQ.git
git pull origin master
.\scripts\setup-local-machine.ps1
```

Or run setup only if you already cloned:

```powershell
cd $env:USERPROFILE\KinematicIQ
.\scripts\setup-local-machine.ps1
```

### Run the app (PowerShell)

```powershell
cd $env:USERPROFILE\KinematicIQ\web
npm run dev
```

Open http://localhost:5173/

### Auto-sync while you work (second PowerShell window)

```powershell
cd $env:USERPROFILE\KinematicIQ
.\scripts\watch-and-pull.ps1
```

Manual pull anytime:

```powershell
.\scripts\sync-repo.ps1
```

### Open in Cursor

```powershell
cursor $env:USERPROFILE\KinematicIQ
```

Or **File → Open Folder** → `C:\Users\YOUR_NAME\KinematicIQ`

### Windows Task Scheduler (optional, every 5 min)

- **Program:** `powershell.exe`
- **Arguments:** `-NoProfile -ExecutionPolicy Bypass -File "C:\Users\YOU\KinematicIQ\scripts\sync-repo.ps1" -Quiet`

---

## macOS / Linux

## 1. One-time setup on your machine

### Prerequisites

- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/) 18+ (for `web/`)

### Clone the repo

```bash
git clone https://github.com/Born2tweak/KinematicIQ.git
cd KinematicIQ
```

SSH (if you use GitHub SSH keys):

```bash
git clone git@github.com:Born2tweak/KinematicIQ.git
cd KinematicIQ
```

### Confirm you are on the real remote

```bash
git remote -v
```

You should see `origin` → `Born2tweak/KinematicIQ` (HTTPS or SSH). If `origin` is wrong:

```bash
git remote set-url origin https://github.com/Born2tweak/KinematicIQ.git
```

### Run the web app locally

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173/

---

## 2. Manual sync (pull latest anytime)

From the repo root:

```bash
chmod +x scripts/sync-repo.sh
./scripts/sync-repo.sh
```

This fetches from `origin` and rebases your **current branch** onto `origin/<same-branch>`.

Switch branches when you need agent or feature work:

```bash
git fetch origin
git checkout master
./scripts/sync-repo.sh

# Example: operating system doc branch
git checkout cursor/project-operating-system-a6c8
./scripts/sync-repo.sh
```

---

## 3. Automatic sync while you work

### Option A — Background watcher (recommended)

In a **second terminal tab**, leave this running:

```bash
chmod +x scripts/watch-and-pull.sh
./scripts/watch-and-pull.sh
```

Default: checks every **120 seconds**. Change interval:

```bash
SYNC_INTERVAL_SEC=60 ./scripts/watch-and-pull.sh
```

Stop with `Ctrl+C`.

### Option B — Cursor / VS Code built-in

1. Open the cloned `KinematicIQ` folder in Cursor (not a copy without `.git`).
2. Enable **Git: Autofetch** in settings (`git.autofetch`: `true`).
3. Use **Source Control → Pull** or enable **Git: Auto Repository Refresh**.

This fetches often; you still pull (or use the sync script) to update files.

### Option C — macOS scheduled sync (every 5 minutes)

Save as `~/Library/LaunchAgents/com.kinematiciq.sync.plist` (edit `YOUR_USER` and path):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.kinematiciq.sync</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>cd /Users/YOUR_USER/KinematicIQ && ./scripts/sync-repo.sh --quiet</string>
  </array>
  <key>StartInterval</key>
  <integer>300</integer>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
```

Load:

```bash
launchctl load ~/Library/LaunchAgents/com.kinematiciq.sync.plist
```

### Option D — Windows Task Scheduler

See **Windows (start here)** above for PowerShell task settings.

---

## 4. How Cloud Agents relate to your local copy

| Environment | What it is |
|-------------|------------|
| **GitHub (`origin`)** | Source of truth — all pushes land here |
| **Cloud Agent workspace** | Temporary clone; commits and pushes to GitHub |
| **Your laptop** | Your local clone — must `git pull` (or use scripts above) to see agent changes |

Cloud Agents **cannot** push files directly to your laptop. Flow:

```
Agent commits → git push → GitHub → your machine pulls (manual or auto-sync)
```

After an agent finishes a PR or push, run `./scripts/sync-repo.sh` on the branch you care about.

---

## 5. Troubleshooting

| Problem | Fix |
|---------|-----|
| `permission denied` on scripts | `chmod +x scripts/*.sh` |
| Pull blocked by local edits | Commit, stash (`git stash`), or discard changes |
| Wrong repo / empty project | Re-clone from `Born2tweak/KinematicIQ` URL above |
| Branch missing locally | `git fetch origin && git checkout <branch-name>` |
| Only see old code on `master` | Feature work may be on `cursor/*` branches — fetch and checkout |

---

## 6. Quick reference

```bash
# Clone once
git clone https://github.com/Born2tweak/KinematicIQ.git && cd KinematicIQ

# Pull latest on current branch
./scripts/sync-repo.sh

# Auto-pull every 2 minutes while coding
./scripts/watch-and-pull.sh

# Web dev server
cd web && npm run dev
```
