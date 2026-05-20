#!/usr/bin/env bash
# One-shot setup for your computer. Run from anywhere:
#   curl -fsSL https://raw.githubusercontent.com/Born2tweak/KinematicIQ/master/scripts/setup-local-machine.sh | bash
# Or after clone:
#   ./scripts/setup-local-machine.sh

set -euo pipefail

REPO_URL="${KINEMATIQ_REPO_URL:-https://github.com/Born2tweak/KinematicIQ.git}"
TARGET_DIR="${1:-${KINEMATIQ_DIR:-$HOME/KinematicIQ}}"

echo "==> KinematicIQ local setup"
echo "    Repo: $REPO_URL"
echo "    Directory: $TARGET_DIR"
echo ""

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo "==> Existing clone found — updating"
  cd "$TARGET_DIR"
else
  echo "==> Cloning repository"
  git clone "$REPO_URL" "$TARGET_DIR"
  cd "$TARGET_DIR"
fi

git remote set-url origin "$REPO_URL"
git fetch origin --prune
git checkout master 2>/dev/null || git checkout -b master origin/master
git pull --rebase origin master

chmod +x scripts/sync-repo.sh scripts/watch-and-pull.sh 2>/dev/null || true
if [[ -x scripts/setup-local-machine.sh ]]; then
  : # already in repo
else
  chmod +x scripts/*.sh 2>/dev/null || true
fi

echo "==> Installing web dependencies"
cd web
npm install

echo ""
echo "Done. Next steps:"
echo "  1. Open in Cursor:  cursor \"$TARGET_DIR\""
echo "  2. Dev server:      cd \"$TARGET_DIR/web\" && npm run dev"
echo "  3. Auto-sync:       cd \"$TARGET_DIR\" && ./scripts/watch-and-pull.sh"
echo ""
