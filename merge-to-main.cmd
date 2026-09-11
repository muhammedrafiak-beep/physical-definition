@echo off
REM ============================================================
REM  merge-to-main.cmd
REM
REM  Does on the command line exactly what the green button on a
REM  pull request does: brings this branch into main and pushes,
REM  which is what makes Vercel deploy to production.
REM
REM  untrack-scratch.cmd only committed to THIS branch, and a
REM  commit on a branch does not reach the live site. main does.
REM ============================================================
cd /d "%~dp0"

for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo Current branch: %BRANCH%

git diff --quiet && git diff --cached --quiet
if errorlevel 1 (
  echo.
  echo   You have uncommitted changes. Run push-now.cmd first,
  echo   then run this again.
  echo.
  pause
  exit /b 1
)

echo.
echo === Switching to main ===
git checkout main || goto :fail
git pull --ff-only || goto :fail

echo.
echo === Merging %BRANCH% ===
git merge --no-ff %BRANCH% -m "Merge %BRANCH%" || goto :fail

echo.
echo === Pushing ===
git push || goto :fail

echo.
echo === Back to %BRANCH% ===
git checkout %BRANCH%
git merge main -m "Catch up with main"

echo.
echo   Done. Vercel is building production now.
echo.
pause
exit /b 0

:fail
echo.
echo   STOPPED. Nothing was pushed. Read the message above.
echo.
pause
exit /b 1
