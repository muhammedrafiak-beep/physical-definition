@echo off
cd /d "%~dp0"
echo Taking "Claude outputs" out of git (the files stay on disk).
git rm -r --cached "Claude outputs" >nul 2>&1
git add -A
git commit -m "Stop tracking the Claude outputs scratch folder"
git push -u origin HEAD
echo.
echo Done. The folder is still in Explorer, just no longer in the repo.
pause
