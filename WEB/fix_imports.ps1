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
    "utils",
    "ui" # ui folder, but will be rewritten to components/ui
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
    # PART 0 — SAME-FOLDER imports (“./file” → alias)
    # ================================================================
    $pattern = "(?<=from\s+['""])\.\/([^'""]+)"
    $fixed = [regex]::Replace($fixed, $pattern, {
        param($m)
        $fileName = $m.Groups[1].Value
        return "@/" + ($currentDir + "/" + $fileName).Replace("\","/")
    })

    # ================================================================
    # PART 1 — RELATIVE imports → @/folder
    # ================================================================
    foreach ($folder in $majorFolders) {
        $regex = "(?<=from\s+['""])(\.\./)+$folder(/|$)"
        $fixed = [regex]::Replace($fixed, $regex, "@/$folder/")
    }

    # ================================================================
    # PART 2 — Fix @folder → @/folder
    # ================================================================
    foreach ($folder in $majorFolders) {
        $bad = "@$folder/"
        $good = "@/$folder/"
        $fixed = $fixed -replace [regex]::Escape($bad), $good
    }

    # ================================================================
    # PART 3 — fallback: any ../../something → @/something
    # ================================================================
    $generic = "(?<=from\s+['""])(\.\./)+(?=[A-Za-z])"
    $fixed = [regex]::Replace($fixed, $generic, "@/")

    # ================================================================
    # PART 4 — SPECIAL UI FIX:
    # Convert ANY ui import → components/ui
    # ================================================================
    # @/ui/button -> @/components/ui/button
    $fixed = $fixed -replace "@/ui/", "@/components/ui/"

    # ../../ui/button -> @/components/ui/button
    $fixed = $fixed -replace "(?<=from\s+['""])(\.\./)+ui/", "@/components/ui/"

    # ./ui/button -> @/components/ui/button
    $fixed = $fixed -replace "(?<=from\s+['""])\.\/ui/", "@/components/ui/"

    if ($fixed -ne $content) {
        Set-Content $file $fixed -Encoding UTF8
        Write-Host "Updated: $file"
    }
}

Write-Host "All imports normalized."
