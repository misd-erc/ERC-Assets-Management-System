@echo off
setlocal enabledelayedexpansion
echo 🔍 Converting relative imports to alias paths based on tsconfig.json...

for /r src %%f in (*.ts *.tsx) do (
    echo "%%f" | findstr /i "\\node_modules\\ \\dist\\ \\build\\ \\.next\\ \\out\\" >nul
    if errorlevel 1 (
        powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "$file='%%~f';$content=Get-Content $file -Raw;$map=@{'components/'='@/components/';'ui/'='@/ui/';'common/'='@/common/';'types/'='@/types/'};$fixed=$content;foreach($k in $map.Keys){$regex='(?<=from\s+[''''""])(\.\./)+'+[regex]::Escape($k);$fixed=[regex]::Replace($fixed,$regex,$map[$k])};$generic='(?<=from\s+[''''""])(\.\./)+';$fixed=[regex]::Replace($fixed,$generic,'@/');if($fixed -ne $content){Set-Content $file $fixed -Encoding UTF8;Write-Host ('✔ Fixed: '+$file)}"
    )
)

echo.
echo ✅ Done! Import paths updated.
pause
