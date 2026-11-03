@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed on this computer.
  echo Install it from https://nodejs.org and then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo Starting Hurda Hisaab...
node server.js --open
echo.
echo The server has stopped.
pause
