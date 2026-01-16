# Fourth pass - fix text colors for readability
$files = Get-ChildItem -Path "frontend\src\components","frontend\src\pages" -Recurse -Filter "*.js"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix heading colors - white headings should be dark on light backgrounds
    $content = $content -replace '(<h[1-6][^>]*className="[^"]*?)text-white([^"]*?"[^>]*?>)', '$1text-purple-900$2'
    
    # Fix paragraph text on cards
    $content = $content -replace 'text-gray-300([^"]*?)mb-', 'text-gray-600$1mb-'
    
    # Fix remaining white text in cards (but not in navigation)
    $content = $content -replace '(<p[^>]*className="[^"]*?)text-white([^"]*?")', '$1text-gray-800$2'
    
    # Update input field colors for light theme
    $content = $content -replace 'bg-white border border-purple-200 rounded-xl text-white', 'bg-white border border-purple-200 rounded-xl text-gray-800'
    
    # Fix label colors
    $content = $content -replace '(<label[^>]*className="[^"]*?)text-white([^"]*?")', '$1text-gray-700$2'
    
    # Fix link colors  
    $content = $content -replace 'text-purple-300', 'text-purple-600'
    $content = $content -replace 'text-purple-400', 'text-purple-600'
    
    # Fix span and div text colors
    $content = $content -replace '(<span[^>]*className="[^"]*?)text-white([^"]*?"[^>]*?>)', '$1text-gray-800$2'
    
    # Secondary button style (keeping some whites for buttons on purple bg)
    $content = $content -replace 'bg-gray-600 hover:bg-gray-700 text-white', 'bg-purple-100 hover:bg-purple-200 text-purple-700'
    
    # Ensure primary purple buttons keep white text
    $content = $content -replace 'bg-purple-600 hover:bg-purple-700 text-gray-800', 'bg-purple-600 hover:bg-purple-700 text-white'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Total files updated in pass 4: $count"
