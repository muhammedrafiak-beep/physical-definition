@echo off
REM ============================================================
REM  fix-branch.cmd  -  point the folder at GitHub's main.
REM
REM  The local main (8321e02) and GitHub's main (cfd3d34) have
REM  drifted apart, so "git pull" refuses to fast-forward and the
REM  folder stays on an old copy of the project. Every commit that
REM  matters is on GitHub, so the answer is simply to make the
REM  local main be GitHub's main.
REM
REM  Uncommitted edits in this folder are dropped. That is safe:
REM  the only ones are the scanner files, and Claude rewrites
REM  those as soon as this finishes.
REM ============================================================
cd /d "%~dp0"

echo === Fetching ===
git fetch origin || goto :fail

echo.
echo === Pointing main at origin/main ===
git checkout -f -B main origin/main || goto :fail

echo.
git log --oneline -3
echo.
dir /b push.cmd
echo.
echo   Done. If push.cmd is listed above, the folder is back.
echo.
pause
exit /b 0

:fail
echo.
echo   STOPPED. Send Claude everything printed above.
echo.
pause
exit /b 1
