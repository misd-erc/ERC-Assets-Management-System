@echo off
echo ============================
echo GIT PULL LATEST CHANGES
echo ============================

git pull


echo ============================
echo SELECT BUILD ENVIRONMENT
echo ============================
echo [1] Staging   (ams-uat.erc.ph)
echo [2] Production (ams.erc.ph)
echo.
set /p ENV_CHOICE="Enter choice (1 or 2): "

if "%ENV_CHOICE%"=="1" (
    set BUILD_CMD=npm run build:staging
    set ENV_LABEL=STAGING
) else if "%ENV_CHOICE%"=="2" (
    set BUILD_CMD=npm run build:production
    set ENV_LABEL=PRODUCTION
) else (
    echo Invalid choice. Exiting.
    pause
    exit /b 1
)

echo.
echo Building for: %ENV_LABEL%
echo.


echo ============================
echo BUILDING REACT PROJECT
echo ============================

cd WEB
call npm install
call %BUILD_CMD%
cd ..


echo ============================
echo BUILDING C# API PROJECT
echo ============================

cd API
dotnet clean
dotnet build
dotnet publish -c Release -o ../publish
cd ..

echo ============================
echo BUILD COMPLETE
echo ============================
pause
