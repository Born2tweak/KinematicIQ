# KinematicIQ — canonical local bootstrap (run from any agent terminal on Windows)
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1"
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1" -SyncOnly
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1" -StartDev
#   powershell -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\KinematicIQ\bootstrap.ps1" -StartWatcher

param(
    [switch]$SyncOnly,
    [switch]$StartDev,
    [switch]$StartWatcher,
    [string]$RepoDir = $(if ($env:KINEMATIQ_DIR) { $env:KINEMATIQ_DIR } else { Join-Path $env:USERPROFILE 'KinematicIQ' })
)

$RepoUrl = 'https://github.com/Born2tweak/KinematicIQ.git'
$ErrorActionPreference = 'Stop'

function Ensure-Repo {
    if (-not (Test-Path (Join-Path $RepoDir '.git'))) {
        Write-Host "Cloning -> $RepoDir"
        git clone $RepoUrl $RepoDir
    }
    Set-Location $RepoDir
    git remote set-url origin $RepoUrl
    git fetch origin --prune
    git checkout master 2>$null
    if ($LASTEXITCODE -ne 0) { git checkout -b master origin/master }
    git pull --rebase origin master
    Write-Host "Repo ready: $RepoDir @ $(git rev-parse --short HEAD)"
}

function Ensure-WebDeps {
    Set-Location (Join-Path $RepoDir 'web')
    if (-not (Test-Path 'node_modules')) {
        Write-Host 'npm install...'
        npm install
    } else {
        Write-Host 'node_modules present (run npm install manually if deps changed)'
    }
}

# Persist path for other tools / agents on this machine
[Environment]::SetEnvironmentVariable('KINEMATIQ_DIR', $RepoDir, 'User')
$env:KINEMATIQ_DIR = $RepoDir

Ensure-Repo

if ($SyncOnly) { exit 0 }

Ensure-WebDeps

if ($StartWatcher) {
    Start-Process powershell -ArgumentList @(
        '-NoProfile', '-NoExit', '-ExecutionPolicy', 'Bypass',
        '-File', (Join-Path $RepoDir 'scripts\watch-and-pull.ps1')
    )
    Write-Host 'Auto-sync started (pull every 120s).'
}

if ($StartDev) {
    Start-Process powershell -ArgumentList @(
        '-NoProfile', '-NoExit', '-Command',
        "Set-Location '$RepoDir\web'; npm run dev"
    )
    Write-Host 'Dev server starting -> http://localhost:5173/'
}

Write-Host ''
Write-Host "WORKSPACE (open this in Cursor): $RepoDir"
Write-Host "Sync only:    bootstrap.ps1 -SyncOnly"
Write-Host "Dev server:   bootstrap.ps1 -StartDev"
Write-Host "Git watcher:  bootstrap.ps1 -StartWatcher"
