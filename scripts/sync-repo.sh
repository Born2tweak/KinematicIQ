#!/usr/bin/env bash
# Pull the latest changes from GitHub for the current branch.
# Safe to run manually or on a schedule (see docs/14_local_development.md).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

QUIET=false
if [[ "${1:-}" == "--quiet" ]]; then
  QUIET=true
fi

log() {
  if [[ "$QUIET" == false ]]; then
    echo "$@"
  fi
}

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "error: not inside a git repository" >&2
  exit 1
fi

REMOTE="${GIT_REMOTE:-origin}"
BRANCH="$(git branch --show-current)"

if [[ -z "$BRANCH" ]]; then
  echo "error: detached HEAD — checkout a branch first" >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  log "warning: you have uncommitted changes; pull may require stash or commit"
fi

log "Fetching from $REMOTE..."
git fetch "$REMOTE" --prune

UPSTREAM="refs/remotes/$REMOTE/$BRANCH"
if ! git show-ref --verify --quiet "$UPSTREAM"; then
  log "No remote branch $REMOTE/$BRANCH yet — fetch only (nothing to pull)."
  exit 0
fi

LOCAL="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "$UPSTREAM")"

if [[ "$LOCAL" == "$REMOTE_SHA" ]]; then
  log "Already up to date ($BRANCH @ ${LOCAL:0:7})."
  exit 0
fi

log "Updating $BRANCH from $REMOTE/$BRANCH..."
git pull --rebase "$REMOTE" "$BRANCH"
log "Done. Now at $(git rev-parse --short HEAD)."
