@echo off

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
dotnet publish -c Release -o publish

echo ============================
echo DEPLOYING TO IIS FOLDER
echo ============================

SET IIS_PATH=C:\inetpub\wwwroot\AMS-UAT

rmdir /s /q "%IIS_PATH%"
mkdir "%IIS_PATH%"

xcopy /s /e /y publish\* "%IIS_PATH%\"

echo ============================
echo DEPLOYMENT DONE!
echo ============================
pause
