# Third pass - cleanup remaining glassmorphism
$files = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.js"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove remaining backdrop-blur references
    $content = $content -replace 'backdrop-blur-lg', ''
    $content = $content -replace 'backdrop-blur-sm', ''
    $content = $content -replace 'backdrop-blur', ''
    
    # Replace opacity-based backgrounds
    $content = $content -replace 'bg-white/10\s+rounded', 'bg-white rounded'
    $content = $content -replace 'bg-white/10\s+border', 'bg-white border'
    
    # Fix double spaces from previous replacements
    $content = $content -replace '\s{2,}', ' '
    $content = $content -replace 'className="([^"]*?)\s+\s+([^"]*?)"', 'className="$1 $2"'
    
    # Update loading screen text colors
    $content = $content -replace 'text-white text-xl([^>]*?)Loading', 'text-gray-800 text-xl$1Loading'
    
    # Update error/success message backgrounds that still use glassmorphism
    $content = $content -replace 'bg-red-500/20 border border-red-500/50', 'bg-red-100 border border-red-300'
    $content = $content -replace 'text-red-200', 'text-red-700'
    $content = $content -replace 'bg-green-500/20 border border-green-500/50', 'bg-green-100 border border-green-300'
    $content = $content -replace 'text-green-200', 'text-green-700'
    
    # Update remaining card styles
    $content = $content -replace 'shadow-purple-500/25', 'shadow-xl'
    $content = $content -replace 'shadow-purple-500/20', 'shadow-lg'
    $content = $content -replace 'shadow-purple-500/10', 'shadow-md'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Total files updated in pass 3: $count"
