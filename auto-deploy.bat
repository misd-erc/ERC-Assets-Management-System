@echo off

echo ============================
echo STASHING LOCAL CHANGES
echo ============================

git stash

echo ============================
echo GIT PULL LATEST CHANGES
echo ============================

git pull


echo ============================
echo BUILDING REACT PROJECT
echo ============================

cd WEB
call npm install
call npm run build
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
echo DEPLOYING TO IIS FOLDER
echo ============================

SET IIS_PATH=C:\inetpub\wwwroot\AMS-UAT

echo Removing existing contents...
del /q "%IIS_PATH%\*" >nul 2>&1
for /d %%x in ("%IIS_PATH%\*") do rmdir /s /q "%%x"

echo Copying new build...
xcopy /s /e /y "publish\*" "%IIS_PATH%\" >nul

echo ============================
echo DEPLOY COMPLETE
echo ============================
pause
