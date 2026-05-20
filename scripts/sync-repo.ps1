# Pull the latest changes from GitHub for the current branch.
# Usage: .\scripts\sync-repo.ps1
#        .\scripts\sync-repo.ps1 -Quiet

param([switch]$Quiet)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $RepoRoot

function Log($msg) {
    if (-not $Quiet) { Write-Host $msg }
}

if (-not (Test-Path ".git")) {
    Write-Error "Not inside a git repository: $RepoRoot"
}

$Remote = if ($env:GIT_REMOTE) { $env:GIT_REMOTE } else { "origin" }
$Branch = git branch --show-current 2>$null
if (-not $Branch) {
    Write-Error "Detached HEAD — checkout a branch first"
}

$status = git status --porcelain
if ($status) {
    Log "warning: you have uncommitted changes; pull may require stash or commit"
}

Log "Fetching from $Remote..."
git fetch $Remote --prune

$upstream = "refs/remotes/$Remote/$Branch"
$refCheck = git show-ref --verify --quiet $upstream 2>$null
if ($LASTEXITCODE -ne 0) {
    Log "No remote branch $Remote/$Branch yet — fetch only."
    exit 0
}

$local = git rev-parse HEAD
$remoteSha = git rev-parse $upstream

if ($local -eq $remoteSha) {
    Log "Already up to date ($Branch @ $($local.Substring(0,7)))."
    exit 0
}

Log "Updating $Branch from $Remote/$Branch..."
git pull --rebase $Remote $Branch
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Log "Done. Now at $(git rev-parse --short HEAD)."
