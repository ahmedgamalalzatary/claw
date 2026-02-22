# count-lines.ps1 — Count lines in dev source files under CWD

$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.mts", "*.cts", "*.json", "*.md")
$excludeDirs = @("node_modules", "dist", ".git", "data")
$rootPath = (Resolve-Path .).Path

$files = Get-ChildItem -Recurse -File -Include $extensions -Path $rootPath |
  Where-Object {
    $relativePath = $_.FullName.Substring($rootPath.Length + 1)
    $parts = $relativePath -split "[\\/]"
    -not ($excludeDirs | Where-Object { $parts -contains $_ })
  }

$results = $files | ForEach-Object {
  # Match `wc -l` semantics by counting newline characters.
  $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
  $lines = if ($null -eq $content) { 0 } else { ([regex]::Matches($content, "`n")).Count }
  [PSCustomObject]@{
    Lines = $lines
    File  = $_.FullName.Substring($rootPath.Length + 1)
  }
} | Sort-Object Lines -Descending

$total = ($results | Measure-Object -Property Lines -Sum).Sum

"{0,-8} {1}" -f "Lines", "File"
"{0,-8} {1}" -f "-----", "----"
foreach ($r in $results) {
  "{0,-8} {1}" -f $r.Lines, $r.File
}
Write-Output "-----------------------------------------"
Write-Output "Total: $total lines across $($results.Count) files"
