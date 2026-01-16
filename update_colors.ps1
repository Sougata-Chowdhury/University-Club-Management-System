# PowerShell script to update color scheme
$files = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.js"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace main backgrounds
    $content = $content -replace 'min-h-screen bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800', 'min-h-screen bg-gradient-to-br from-purple-50 to-purple-100'
    $content = $content -replace 'min-h-screen bg-gradient-to-br from-purple-700 via-blue-800 to-indigo-900', 'min-h-screen bg-gradient-to-br from-purple-50 to-purple-100'
    $content = $content -replace 'min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800', 'min-h-screen bg-gradient-to-br from-purple-50 to-purple-100'
    
    # Replace glassmorphism navs
    $content = $content -replace 'bg-white/10 backdrop-blur-lg border-b border-white/20', 'bg-purple-600 border-b border-purple-300'
    
    # Replace button gradients with solid purple
    $content = $content -replace 'bg-gradient-to-r from-purple-500 to-blue-500', 'bg-purple-600'
    $content = $content -replace 'hover:from-purple-600 hover:to-blue-600', 'hover:bg-purple-700'
    
    # Replace glassmorphism cards
    $content = $content -replace 'bg-white/10 backdrop-blur-lg', 'bg-white'
    $content = $content -replace 'border-white/20', 'border-purple-200'
    $content = $content -replace 'bg-white/5 backdrop-blur', 'bg-white'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Total files updated: $count"
