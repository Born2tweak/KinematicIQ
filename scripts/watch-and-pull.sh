#!/usr/bin/env bash
# Poll GitHub and pull when the remote branch has new commits.
# Run in a terminal tab while you work, or install as a scheduled job (see docs).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_SCRIPT="$REPO_ROOT/scripts/sync-repo.sh"
INTERVAL="${SYNC_INTERVAL_SEC:-120}"

if [[ ! -x "$SYNC_SCRIPT" ]]; then
  chmod +x "$SYNC_SCRIPT"
fi

echo "KinematicIQ auto-sync — interval ${INTERVAL}s (Ctrl+C to stop)"
echo "Repo: $REPO_ROOT"
echo ""

while true; do
  "$SYNC_SCRIPT" --quiet || echo "[sync] pull skipped or failed — check git status"
  sleep "$INTERVAL"
done
