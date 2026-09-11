@echo off
REM Installs the barcode decoder the iPhone needs (@zxing/browser).
REM Run once; after that push-now.cmd builds with it like anything else.
cd /d "%~dp0"
echo Installing the barcode decoder...
call npm install
echo.
echo   Done. Now run push-now.cmd.
echo.
pause
