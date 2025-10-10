@echo off
for /r src %%f in (*.tsx) do (
    powershell -Command "(Get-Content '%%f') -replace '@[0-9]+\.[0-9]+\.[0-9]+', '' | Set-Content '%%f'"
)
echo Done fixing imports
