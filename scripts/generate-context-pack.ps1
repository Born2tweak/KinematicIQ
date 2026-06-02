# Generates docs/00_context_pack.md by introspecting the repo.
# Run from repo root: powershell -NoProfile -File scripts\generate-context-pack.ps1

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$packPath = Join-Path $repoRoot 'docs\00_context_pack.md'
$srcRoot  = Join-Path $repoRoot 'web\src'

# ── Helpers ─────────────────────────────────────────────────────────
function Get-TreeLines {
    param([string]$Root, [string]$Prefix = '')
    $lines = @()
    $entries = Get-ChildItem -Path $Root -Force |
        Sort-Object { -not $_.PSIsContainer }, Name
    foreach ($e in $entries) {
        if ($e.PSIsContainer) {
            $lines += "$Prefix$($e.Name)/"
            $lines += Get-TreeLines -Root $e.FullName -Prefix ($Prefix + '  ')
        } else {
            $lines += "$Prefix$($e.Name)"
        }
    }
    return $lines
}

function Has-Src { param([string[]]$Paths) foreach ($p in $Paths) { if (-not (Test-Path (Join-Path $srcRoot $p))) { return $false } }; return $true }
function Has-Dir { param([string]$Rel) Test-Path (Join-Path $srcRoot $Rel) -PathType Container }

# ── Derive milestone status from what exists ────────────────────────
$m1  = Has-Src 'App.tsx','components\AppShell.tsx'
$m2  = Has-Src 'screens\CameraScreen.tsx'
$m3  = Has-Src 'cv\poseEngine.ts'
$m4  = Has-Src 'cv\drawSkeleton.ts','cv\drawCalibration.ts'
$m5  = Has-Src 'analysis\angles.ts','analysis\geometry.ts'
$m6  = Has-Src 'analysis\phaseDetector.ts'
$m7  = Has-Src 'analysis\repCounter.ts'
$m8  = Has-Src 'analysis\autoStart.ts','cv\drawDebugOverlay.ts'
$m9  = (Has-Dir 'scoring') -and (Has-Src 'scoring\scoringEngine.ts')
$m10 = (Has-Dir 'feedback') -and (Has-Src 'feedback\feedbackEngine.ts')
$m11 = Has-Src 'session\buildSessionResult.ts' -and (Has-Src 'screens\ResultsScreen.tsx')
$m12 = Has-Src 'analysis\metricCollector.ts','session\types.ts'
$m13 = Has-Src 'analysis\autoFinish.ts','analysis\setActivation.ts','screens\cameraSessionUi.ts'
$m14 = @(Get-ChildItem -Path $srcRoot -Recurse -Filter '*.test.*' -ErrorAction SilentlyContinue).Count -gt 0
$m14c = Has-Src 'scoring\scoringExplanations.ts' -and (Test-Path (Join-Path $repoRoot 'docs\scoring_notes.md'))
$m14d = Has-Src 'components\SessionStatusCard.tsx'
$m15a = Test-Path (Join-Path $repoRoot 'docs\video_upload_plan.md')
$m15b = Test-Path (Join-Path $repoRoot 'docs\expert_outreach.md')

$milestones = @(
    @{ N=1;  Name='App shell + routing';  Done=$m1 }
    @{ N=2;  Name='Camera + preview';     Done=$m2 }
    @{ N=3;  Name='Pose estimation';      Done=$m3 }
    @{ N=4;  Name='Skeleton overlay';     Done=$m4 }
    @{ N=5;  Name='Joint angle math';     Done=$m5 }
    @{ N=6;  Name='Phase detection';      Done=$m6 }
    @{ N=7;  Name='Rep counting';         Done=$m7 }
    @{ N=8;  Name='Auto-start + debug';   Done=$m8 }
    @{ N=9;  Name='Scoring engine';       Done=$m9 }
    @{ N=10; Name='Feedback engine';      Done=$m10 }
    @{ N=11; Name='Results wiring';       Done=$m11 }
    @{ N=12; Name='Session metrics';      Done=$m12 }
    @{ N=13; Name='Polish + responsive';  Done=$m13 }
    @{ N=14; Name='Testing + scoring transparency'; Done=($m14 -and $m14c) }
    @{ N=15; Name='UI polish (results/camera)';    Done=$m14d }
    @{ N=16; Name='Planning (video + outreach)';    Done=($m15a -and $m15b) }
    @{ N=17; Name='Video upload impl';             Done=$false }
    @{ N=18; Name='Cleanup';                       Done=$false }
)

# Find highest completed milestone number
$lastDone = 0
foreach ($m in $milestones) {
    if ($m.Done -eq $true -and $m.N -gt $lastDone) { $lastDone = $m.N }
}
$nextN = $lastDone + 1

# Build milestone table rows
$msRows = foreach ($m in $milestones) {
    $status = if ($m.Done) { '**Done**' } else { 'Not started' }
    "| $($m.N) | $($m.Name) | $status |"
}

# ── File tree ───────────────────────────────────────────────────────
$tree = (Get-TreeLines -Root $srcRoot -Prefix '') -join "`n"

# ── Count files ─────────────────────────────────────────────────────
$fileCount = (Get-ChildItem -Path $srcRoot -Recurse -File).Count

# ── Detect key patterns in code ─────────────────────────────────────
$hasAutoStart   = Has-Src 'analysis\autoStart.ts'
$hasAutoFinish  = Has-Src 'analysis\autoFinish.ts'
$hasDebugHUD    = Has-Src 'cv\drawDebugOverlay.ts'
$hasLiveResults = $m11

$cameraSrc = ''
if (Test-Path (Join-Path $srcRoot 'screens\CameraScreen.tsx')) {
    $cameraSrc = Get-Content (Join-Path $srcRoot 'screens\CameraScreen.tsx') -Raw
}
$hasDebugToggle = $cameraSrc -match 'showDebug'

$sessionStart = if ($hasAutoStart) {
    if ($hasAutoFinish) {
        'Auto-start + auto-finish (calibrate -> squat -> stand still to end; Finish Now backup)'
    } else {
        'Auto-start (body detect -> 2s calibrate -> first descent)'
    }
} else { 'Manual button' }

# ── Gaps ────────────────────────────────────────────────────────────
$gaps = @()
if (-not $hasLiveResults) { $gaps += '- ResultsScreen not wired to live session data' }
if (-not $m9)  { $gaps += '- No scoring engine' }
if (-not $m10) { $gaps += '- No feedback/coaching cues' }
if (-not $m14) { $gaps += '- No automated tests' }
if ($hasDebugHUD -and -not $hasDebugToggle) {
    $gaps += '- Debug overlay always drawn (needs toggle)'
}
if ($gaps.Count -eq 0) {
    $gaps += '- Video upload (see docs/video_upload_plan.md) not implemented'
    $gaps += '- Expert outreach is doc-only (docs/expert_outreach.md)'
}
$gapsBlock = $gaps -join "`n"

$docsRoot = Join-Path $repoRoot 'docs'
$planningDocs = @(
    'scoring_notes.md'
    'video_upload_plan.md'
    'expert_outreach.md'
) | Where-Object { Test-Path (Join-Path $docsRoot $_) }
$planningDocsBlock = if ($planningDocs.Count -gt 0) {
    ($planningDocs | ForEach-Object { "- ``docs/$_``" }) -join "`n"
} else { '- (none)' }

$resultsRow = if ($hasLiveResults) {
    '| Results | mock in early docs | **live ``buildSessionResult`` via router state** |'
} else {
    '| Results | from pipeline | **mock data** |'
}

# ── Build the pack ──────────────────────────────────────────────────
$date = Get-Date -Format 'yyyy-MM-dd HH:mm'
$nextMilestone = ($milestones | Where-Object { $_.N -eq $nextN })
$nextName = if ($nextMilestone) { $nextMilestone.Name } else { 'All done' }

$pack = @"
# KinematicIQ Context Pack
<!-- AUTO-GENERATED $date — do not hand-edit, run scripts/generate-context-pack.ps1 -->

## Workspace
| Key | Value |
|-----|-------|
| Repo | ``C:\Users\acetu\KinematicIQ`` / https://github.com/Born2tweak/KinematicIQ.git |
| Branch | ``master`` |
| App | ``web/`` — Vite + React + TS — ``npm run dev`` -> http://localhost:5173/ |
| Pose engine | MediaPipe ``@mediapipe/tasks-vision`` (on-device, no backend) |
| Session start | $sessionStart |

## Product
Browser-only **bodyweight squat** analyzer. Camera -> MediaPipe Pose -> angles -> phases -> reps -> metrics -> score -> coaching. No backend, no auth, no persistence.

## Milestones (1-$($lastDone) done, next: $nextN - $nextName)
| # | Name | Status |
|---|------|--------|
$($msRows -join "`n")

## Divergences (repo vs docs)
| Topic | Docs say | Repo has |
|-------|----------|----------|
| Language | JS | **TypeScript** |
| Routing | State in App | **react-router-dom** ``/`` ``/camera`` ``/results`` |
| Pose folder | ``pose/`` | **``cv/``** |
| Analysis | not specified | **``analysis/``** |
| Session start | manual button | **auto-start FSM** |
$resultsRow

## Key contracts
``poseEngine``: ``initialize()`` / ``getReadyState()`` / ``detect(video, ts, frame)`` -> ``PoseFrame | null``
``PoseFrame``: ``{ landmarks, worldLandmarks, poseConfidence, timestamp, frameIndex }``
``updatePhaseDetector(state, { kneeAngle, hipY, timestamp })`` -> ``{ phase, transitioned, smoothedKneeAngle, state }`` (learns ``standingKneeAngle``)
``updateRepCounter(state, { phase, transitioned, frame, angles, hipY, smoothedKneeAngle, standingKneeBaseline, standingHipY })`` -> ``{ repCount, reps, completedRep, state }``
``updateAutoStart(state, ...)`` -> ``{ phase, transitioned, activatedByDescent, state }``
``activateAnalysisPipeline(...)`` — seeds rep 1 when ACTIVE starts mid-descent
``buildSessionResult(reps, poseConfidenceSamples)`` -> ``SessionResult`` (scoring + feedback + metrics)
``updateAutoFinish(...)`` — stand still 5s then 3s countdown -> navigate ``/results``

## Architecture
**Phase FSM**: calibrated lockout knee (upright baseline -12 deg, min 152) | BOTTOM <105 deg | EMA 0.35 | 4-frame lockout debounce
**Auto-start**: WAITING -> CALIBRATING (60 frames) -> READY -> ACTIVE (``activatedByDescent`` preserves first rep)
**Rep completion**: phase STANDING transition OR 4 near-standing frames after bottom (grace lockout)
**Auto-finish**: >=1 rep + stable STANDING 5s + countdown 3..1 (squat again cancels)
**Rejection**: knee-lift, chair/seated, duration 500ms-8s, avg pose confidence, must reach bottom
**Debug** (toggle in CameraScreen): candidate rep, blocking gate, missed-rep reason, validation gates

## Gaps
$gapsBlock

## Planning & reference docs
$planningDocsBlock

## File tree ($fileCount files in ``web/src/``)
``````
$tree
``````

## Rules
1. Squat only, client-side only, no persistence
2. Extend TS + ``cv/`` + ``analysis/`` + router structure
3. One milestone at a time
4. Do not invent backend, auth, storage, or extra movements
5. Do not refactor unrelated working code

## Agent paste block
``````
KinematicIQ — Repo: C:\Users\acetu\KinematicIQ (master, pull first)
App: web/ — npm run dev -> http://localhost:5173/
READ: docs/00_context_pack.md (auto-generated ground truth)
State: M1-$lastDone done. Next: M$nextN ($nextName).
$(if ($hasLiveResults) { 'Results: live session via buildSessionResult.' } else { 'Results: still mock.' })
No backend/auth/storage. Folders: cv/, analysis/, scoring/, feedback/, session/.
``````
"@

Set-Content -Path $packPath -Value $pack -Encoding UTF8 -NoNewline
$charCount = $pack.Length
Write-Host "Generated docs/00_context_pack.md ($charCount chars, $fileCount src files)"
if ($charCount -gt 8000) {
    Write-Warning "Pack exceeds 8000 char limit ($charCount chars)!"
}
