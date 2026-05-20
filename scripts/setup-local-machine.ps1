# One-shot Windows setup. Run in PowerShell:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   irm https://raw.githubusercontent.com/Born2tweak/KinematicIQ/master/scripts/setup-local-machine.ps1 | iex
# Or after clone:
#   .\scripts\setup-local-machine.ps1

param(
    [string]$TargetDir = $(if ($env:KINEMATIQ_DIR) { $env:KINEMATIQ_DIR } else { Join-Path $env:USERPROFILE "KinematicIQ" })
)

$ErrorActionPreference = "Stop"
$RepoUrl = if ($env:KINEMATIQ_REPO_URL) { $env:KINEMATIQ_REPO_URL } else { "https://github.com/Born2tweak/KinematicIQ.git" }

Write-Host "==> KinematicIQ local setup (Windows)"
Write-Host "    Repo: $RepoUrl"
Write-Host "    Directory: $TargetDir"
Write-Host ""

if (Test-Path (Join-Path $TargetDir ".git")) {
    Write-Host "==> Existing clone found — updating"
    Set-Location $TargetDir
} else {
    Write-Host "==> Cloning repository"
    git clone $RepoUrl $TargetDir
    Set-Location $TargetDir
}

git remote set-url origin $RepoUrl
git fetch origin --prune
git checkout master 2>$null
if ($LASTEXITCODE -ne 0) { git checkout -b master origin/master }
git pull --rebase origin master

Write-Host "==> Installing web dependencies"
Set-Location (Join-Path $TargetDir "web")
npm install

Write-Host ""
Write-Host "Done. Next steps:"
Write-Host "  1. Open in Cursor:  cursor `"$TargetDir`""
Write-Host "  2. Dev server:      cd `"$TargetDir\web`"; npm run dev"
Write-Host "  3. Auto-sync:       cd `"$TargetDir`"; .\scripts\watch-and-pull.ps1"
Write-Host ""
