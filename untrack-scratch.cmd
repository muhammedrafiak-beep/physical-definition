@echo off
REM ============================================================
REM  untrack-scratch.cmd
REM
REM  Takes the "Claude outputs" folder out of git. --cached means
REM  git forgets it; the files stay exactly where they are in
REM  Explorer. Nothing is deleted from the disk.
REM
REM  It was reaching the repo because push.cmd runs "git add -A",
REM  and the repo is public.
REM ============================================================
cd /d "%~dp0"

echo === Taking it out of git (files stay on disk) ===
git rm -r --cached "Claude outputs" >nul 2>&1

echo === Committing ===
git add -A
git commit -m "Stop tracking the Claude outputs scratch folder" || goto :nothing

echo === Pushing ===
git push || goto :fail

echo.
git status --short
echo.
echo   Done. The folder is still in Explorer, just not in the repo.
echo.
pause
exit /b 0

:nothing
echo.
echo   Nothing to commit - already done.
echo.
pause
exit /b 0

:fail
echo.
echo   Push failed. The commit is saved locally.
echo.
pause
exit /b 1
