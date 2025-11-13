@echo off
setlocal

echo Running Import Fixer...

powershell -NoProfile -ExecutionPolicy Bypass -File fix_imports.ps1

echo.
echo Done!
pause
