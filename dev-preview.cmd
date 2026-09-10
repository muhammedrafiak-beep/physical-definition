@echo off
cd /d "%~dp0"
set PD_API_ORIGIN=https://physical-definition-git-faster-map-rafi-s-projects19.vercel.app
echo Dev server, talking to the faster-map preview API...
call npm run dev
pause
