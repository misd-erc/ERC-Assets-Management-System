param($root = "src")

Write-Host "Normalizing import paths..."

# 🔥 Major folders (top-level only)
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

Get-ChildItem -Recurse -Include *.ts, *.tsx -Path $root | ForEach-Object {

    $file = $_.FullName
    $content = Get-Content $file -Raw
    $fixed = $content

    # ================================================================
    # PART 1 — RELATIVE imports → @/folder/...
    # ================================================================
    foreach ($folder in $majorFolders) {
        $regex = "(?<=from\s+['""])(\.\./)+$folder(/|$)"
        $fixed = [regex]::Replace($fixed, $regex, "@/$folder/")
    }

    # ================================================================
    # PART 2 — ALIAS FIX (NO slash) → add slash
    #   @types      → @/types
    #   @audit      → @/audit
    #   @hooks      → @/hooks
    # ================================================================
    foreach ($folder in $majorFolders) {
        # no-slash alias, like @types, @hooks
        $regexAliasNoSlash = "@" + $folder + "(?!/)"
        $fixed = [regex]::Replace($fixed, $regexAliasNoSlash, "@/$folder")
    }

    # ================================================================
    # PART 3 — WRONG alias prefix → correct (@folder/ → @/folder/)
    #   @types/...  → @/types/...
    #   @hooks/...  → @/hooks/...
    # ================================================================
    foreach ($folder in $majorFolders) {
        $badAlias = "@$folder/"
        $goodAlias = "@/$folder/"
        $fixed = $fixed -replace [regex]::Escape($badAlias), $goodAlias
    }

    # ================================================================
    # PART 4 — generic ../../something  → @/something
    # ================================================================
    $generic = "(?<=from\s+['""])(\.\./)+(?=[A-Za-z])"
    $fixed = [regex]::Replace($fixed, $generic, "@/")

    if ($fixed -ne $content) {
        Set-Content $file $fixed -Encoding UTF8
        Write-Host "Updated: $file"
    }
}

Write-Host "All imports normalized."
