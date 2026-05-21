@echo off
setlocal

set BUILD_SCRIPT=

echo ============================
echo SELECT DEPLOYMENT ENVIRONMENT
echo ============================
echo [1] staging
echo [2] production
set /p ENV_CHOICE=Enter choice (1 or 2): 

if "%ENV_CHOICE%"=="1" (
	set BUILD_SCRIPT=build:staging
) else if "%ENV_CHOICE%"=="2" (
	set BUILD_SCRIPT=build:production
) else (
	echo Invalid choice. Please run again and choose 1 or 2.
	pause
	exit /b 1
)

echo ============================
echo GIT PULL LATEST CHANGES
echo ============================

git pull


echo ============================
echo BUILDING REACT PROJECT
echo ============================

cd WEB
call npm install
call npm run %BUILD_SCRIPT%
if errorlevel 1 (
	echo React build failed.
	cd ..
	pause
	exit /b 1
)
cd ..


echo ============================
echo BUILDING C# API PROJECT
echo ============================

cd API
dotnet clean
dotnet build
dotnet publish -c Release -o ../publish
if errorlevel 1 (
	echo API build/publish failed.
	cd ..
	pause
	exit /b 1
)
cd ..

echo ============================
echo BUILD COMPLETE
echo ============================
pause
