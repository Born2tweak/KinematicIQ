# Run after closing Cursor/terminals that might have old clones open.
# powershell -ExecutionPolicy Bypass -File "C:\Users\acetu\KinematicIQ\scripts\remove-duplicate-clones.ps1"

$targets = @(
    'C:\Users\acetu\KinematicIQ-1',
    'C:\Users\acetu\_DELETE_ME_KinematicIQ-1',
    'C:\Users\acetu\Downloads\KinematicIQ',
    'C:\Users\acetu\Downloads\_DELETE_ME_KinematicIQ'
)

foreach ($p in $targets) {
    if (Test-Path $p) {
        Remove-Item -LiteralPath $p -Recurse -Force
        if (Test-Path $p) { Write-Warning "Still exists (close apps using it): $p" }
        else { Write-Host "Removed: $p" }
    }
}
