@echo off
set BUILD_TARGET=%~1
if "%BUILD_TARGET%"=="" set BUILD_TARGET=staging

echo ============================
echo GIT PULL LATEST CHANGES
echo ============================

git pull


echo ============================
echo BUILDING REACT PROJECT
echo ============================
echo Build target: %BUILD_TARGET%

cd WEB
call npm install
call npm run build:%BUILD_TARGET%
if errorlevel 1 (
  echo Frontend build failed for target %BUILD_TARGET%
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
  echo API publish failed
  exit /b 1
)
cd ..

echo ============================
echo BUILD COMPLETE
echo ============================
pause
