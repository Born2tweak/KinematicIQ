@echo off
title KinematicIQ Auto-Sync
cd /d "%USERPROFILE%\KinematicIQ"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\watch-and-pull.ps1"
