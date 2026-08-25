@echo off
REM ============================================================
REM  push.cmd - build, commit and push in one command.
REM
REM      push "Log every set"
REM
REM  The build runs FIRST and the script stops if it fails, so a
REM  commit that does not compile never reaches the branch. That
REM  ordering is the whole point; do not move it.
REM ============================================================

if "%~1"=="" (
  echo.
  echo   Usage:  push "your commit message"
  echo.
  exit /b 1
)

echo.
echo === Building ===
call npm run build
if errorlevel 1 (
  echo.
  echo   BUILD FAILED - nothing was committed or pushed.
  echo.
  exit /b 1
)

echo.
echo === Committing ===
git add -A
git commit -m "%~1"
if errorlevel 1 (
  echo.
  echo   Nothing to commit.
  echo.
  exit /b 1
)

echo.
echo === Pushing ===
REM -u origin HEAD works whether or not this branch has an upstream yet.
git push -u origin HEAD
if errorlevel 1 (
  echo.
  echo   PUSH FAILED - the commit is saved locally, try again.
  echo.
  exit /b 1
)

echo.
echo   Done. Vercel is building the preview now.
echo.
