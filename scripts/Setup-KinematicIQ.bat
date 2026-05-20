@echo off
title KinematicIQ Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-local-machine.ps1"
if errorlevel 1 (
  echo.
  echo Setup failed. Install Git and Node.js, then run again.
  pause
  exit /b 1
)
echo.
echo Starting dev server...
cd /d "%USERPROFILE%\KinematicIQ\web"
start "KinematicIQ Dev" cmd /k "npm run dev"
echo.
echo Opening folder in Explorer...
explorer "%USERPROFILE%\KinematicIQ"
echo Done. Browser: http://localhost:5173/
pause
