@echo off
cd /d "%~dp0"
echo KinematicIQ install >> "%USERPROFILE%\kinematic-setup-transcript.txt"
echo Started %date% %time% >> "%USERPROFILE%\kinematic-setup-transcript.txt"
git pull origin master >> "%USERPROFILE%\kinematic-setup-transcript.txt" 2>&1
cd web
call npm install >> "%USERPROFILE%\kinematic-setup-transcript.txt" 2>&1
echo npm install exit: %ERRORLEVEL% >> "%USERPROFILE%\kinematic-setup-transcript.txt"
start "KinematicIQ" cmd /k "cd /d %~dp0web && npm run dev"
echo Done. Open http://localhost:5173/
pause
