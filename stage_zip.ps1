
$source = "C:\\Users\\hp\\Downloads\\terramatch-frontend-integrated"
$dest = "C:\\Users\\hp\\Downloads\\terramatch-frontend-integrated\\terramatch-startup-complete.zip"
$destParent = "C:\\Users\\hp\\Downloads\\terramatch-startup-complete.zip"

if (Test-Path $dest) { Remove-Item $dest -Force }
if (Test-Path $destParent) { Remove-Item $destParent -Force }

$tempDir = Join-Path $env:TEMP ("terramatch_pkg_" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

Write-Host "Staging clean files to $tempDir..."

# Copy files excluding node_modules, dist, and zip
$exclude = @("node_modules", "dist", ".git", "*.zip", "*.log")

Get-ChildItem -Path $source -Recurse | Where-Object {
    $item = $_
    $relPath = $item.FullName.Substring($source.Length).TrimStart('\/')
    $skip = $false
    foreach ($ex in $exclude) {
        if ($relPath -like "*$ex*" -or $item.Name -like "$ex") {
            $skip = $true
            break
        }
    }
    -not $skip
} | ForEach-Object {
    $item = $_
    $targetPath = Join-Path $tempDir ($item.FullName.Substring($source.Length).TrimStart('\/'))
    if ($item.PSIsContainer) {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    } else {
        $parent = Split-Path $targetPath -Parent
        if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
        Copy-Item -Path $item.FullName -Destination $targetPath -Force
    }
}

Write-Host "Compressing archive to $dest..."
Compress-Archive -Path "$tempDir\*" -DestinationPath $dest -CompressionLevel Optimal
Copy-Item -Path $dest -Destination $destParent -Force

Remove-Item -Path $tempDir -Recurse -Force
Write-Host "Package created successfully!"
