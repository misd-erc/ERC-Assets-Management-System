@echo off
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
echo BUILD COMPLETE
echo ============================
pause
