@echo off
title JIJAU SCHOOL CONNECT PORTAL - Tungi (B.K.)
color 0E
echo.
echo  ========================================================
echo     JIJAU ENGLISH SCHOOL - CONNECT PORTAL
echo     TUNGI (B.K.), Maharashtra
echo     Warm Sunset Glass / Peach Horizon Theme
echo  ========================================================
echo.

REM --- Change to script directory ---
cd /d "%~dp0"

REM --- Check Node.js ---
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found!
  echo  Please install Node.js v18+ from https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo  [1/4] Node version:
node -v
echo  [2/4] Checking dependencies...
if not exist "node_modules\" (
  echo        Installing dependencies - please wait...
  call npm install
  if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed
    pause
    exit /b 1
  )
) else (
  echo        Dependencies OK
)

echo  [3/4] Building production bundle...
if not exist ".next\" (
  call npm run build
) else (
  echo        Build exists - skipping (delete .next to rebuild)
)

echo  [4/4] Starting server on http://localhost:3000 ...
echo.
echo  ========================================================
echo   Portal will open in your browser automatically
echo   Press Ctrl+C to STOP the server
echo  ========================================================
echo.

REM open browser after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000/login"

REM start server (production)
call npm start

pause

