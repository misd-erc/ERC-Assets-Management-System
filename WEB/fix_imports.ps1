param($root = "src")

Write-Host "Normalizing import paths..."

$majorFolders = @(
    "api",
    "components",
    "hooks",
    "lib",
    "pages",
    "services",
    "store",
    "types",
    "utils"
)

function Convert-ToRelativePath($filePath) {
    $projectRoot = (Resolve-Path ".").Path
    $relative = $filePath.Replace($projectRoot, "").TrimStart("\","/")
    return $relative
}

Get-ChildItem -Recurse -Include *.ts, *.tsx -Path $root | ForEach-Object {

    $file = $_.FullName
    $relativeFilePath = Convert-ToRelativePath $file
    $currentDir = Split-Path $relativeFilePath
    $currentDir = $currentDir -replace "^src[\/\\]", ""
    $content = Get-Content $file -Raw
    $fixed = $content

    # ================================================================
    # PART 0 — Fix SAME-FOLDER IMPORTS (“./file” → alias)
    # ================================================================
    $pattern = "(?<=from\s+['""])\.\/([^'""]+)"
    $fixed = [regex]::Replace($fixed, $pattern, {
        param($m)
        $fileName = $m.Groups[1].Value
        $fullPath = "@/" + ($currentDir + "/" + $fileName).Replace("\","/")
        return $fullPath
    })

    # ================================================================
    # PART 1 — RELATIVE imports → @/folder/...
    # ================================================================
    foreach ($folder in $majorFolders) {
        $regex = "(?<=from\s+['""])(\.\./)+$folder(/|$)"
        $fixed = [regex]::Replace($fixed, $regex, "@/$folder/")
    }

    # ================================================================
    # PART 2 — ALIAS FIX (NO slash)
    # ================================================================
    foreach ($folder in $majorFolders) {
        $regexAliasNoSlash = "@" + $folder + "(?!/)"
        $fixed = [regex]::Replace($fixed, $regexAliasNoSlash, "@/$folder")
    }

    # ================================================================
    # PART 3 — FIX alias prefix (@folder/ → @/folder/)
    # ================================================================
    foreach ($folder in $majorFolders) {
        $badAlias = "@$folder/"
        $goodAlias = "@/$folder/"
        $fixed = $fixed -replace [regex]::Escape($badAlias), $goodAlias
    }

    # ================================================================
    # PART 4 — fallback ../../something → @/something
    # ================================================================
    $generic = "(?<=from\s+['""])(\.\./)+(?=[A-Za-z])"
    $fixed = [regex]::Replace($fixed, $generic, "@/")

    if ($fixed -ne $content) {
        Set-Content $file $fixed -Encoding UTF8
        Write-Host "Updated: $file"
    }
}

Write-Host "All imports normalized."
