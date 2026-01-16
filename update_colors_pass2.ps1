# Second pass - more specific replacements
$files = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.js"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace text colors for light backgrounds
    $content = $content -replace 'text-white text-xl font-bold', 'text-white text-xl font-bold'
    $content = $content -replace 'text-gray-300 hover:text-white', 'text-purple-100 hover:text-white'
    
    # Replace white text on cards to dark text
    $content = $content -replace '(\s+)text-white(\s+)(?=.*mb-)', '$1text-gray-800$2'
    
    # Replace glassmorphism divs
    $content = $content -replace 'bg-white/20', 'bg-purple-700'
    $content = $content -replace 'bg-white/5', 'bg-white'
    
    # Replace hover states
    $content = $content -replace 'hover:bg-white/10', 'hover:bg-purple-100'
    $content = $content -replace 'hover:bg-white/20', 'hover:bg-purple-200'
    $content = $content -replace 'hover:bg-white/5', 'hover:bg-purple-50'
    
    # Replace status badge colors
    $content = $content -replace 'bg-green-500/20 border border-green-400/50 text-green-200', 'bg-green-100 border border-green-300 text-green-700'
    $content = $content -replace 'bg-yellow-500/20 border border-yellow-400/50 text-yellow-200', 'bg-yellow-100 border border-yellow-300 text-yellow-700'
    $content = $content -replace 'bg-red-500/20 border border-red-400/50 text-red-200', 'bg-red-100 border border-red-300 text-red-700'
    $content = $content -replace 'bg-blue-500/20 border border-blue-400/50 text-blue-200', 'bg-blue-100 border border-blue-300 text-blue-700'
    $content = $content -replace 'bg-purple-500/20 border border-purple-400/50 text-purple-200', 'bg-purple-100 border border-purple-300 text-purple-700'
    
    # Replace secondary buttons
    $content = $content -replace 'bg-gray-500 hover:bg-gray-600', 'bg-purple-100 hover:bg-purple-200 text-purple-700'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Total files updated in pass 2: $count"
