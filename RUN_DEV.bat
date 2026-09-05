@echo off
title JIJAU PORTAL - DEV MODE
cd /d "%~dp0"
echo Starting JIJAU PORTAL in DEV mode (hot reload)...
where node >nul 2>nul || (echo Node.js missing - install from nodejs.org & pause & exit /b 1)
if not exist "node_modules\" call npm install
start "" http://localhost:3000/login
call npm run dev
pause

