# Poll GitHub and pull when the remote branch has new commits.
# Usage: .\scripts\watch-and-pull.ps1
# Stop with Ctrl+C

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$SyncScript = Join-Path $PSScriptRoot "sync-repo.ps1"
$IntervalSec = if ($env:SYNC_INTERVAL_SEC) { [int]$env:SYNC_INTERVAL_SEC } else { 120 }

Write-Host "KinematicIQ auto-sync (Windows) — every ${IntervalSec}s (Ctrl+C to stop)"
Write-Host "Repo: $RepoRoot"
Write-Host ""

Set-Location $RepoRoot

while ($true) {
    try {
        & $SyncScript -Quiet
    } catch {
        Write-Host "[sync] pull skipped or failed — check git status"
    }
    Start-Sleep -Seconds $IntervalSec
}
