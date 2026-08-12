@echo off
title Hantakyro
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [x] Node.js غير مثبت على جهازك!
  echo     نزّله مجاناً من: https://nodejs.org  ثم افتح start.bat مرة ثانية.
  echo.
  pause
  exit /b
)

if not exist node_modules (
  echo تثبيت المكتبات لأول مرة... (مرة واحدة)
  call npm install
)

call node setup.js

echo.
echo [i] البوت يشتغل الآن... الداشبورد حيتفتح على جوجل كروم تلقائياً بعد ثواني.
echo [i] لا تقفل هذي النافذة (هذي هي البوت).
echo.

start "" /min cmd /c "timeout /t 8 /nobreak >nul & call dashboard.bat"
node index.js
pause
