# Fifth pass - fix remaining gradient avatars and ensure consistency
$files = Get-ChildItem -Path "frontend\src" -Recurse -Filter "*.js"
$count = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace gradient avatars with solid purple
    $content = $content -replace 'bg-gradient-to-r from-blue-500 to-purple-500', 'bg-purple-600'
    $content = $content -replace 'bg-gradient-to-r from-purple-500 to-blue-500', 'bg-purple-600'
    $content = $content -replace 'bg-gradient-to-r from-purple-400 to-blue-400', 'bg-purple-600'
    
    # Fix any remaining text color issues in navigation
    $content = $content -replace 'text-gray-800 hover:text-gray-300', 'text-purple-100 hover:text-white'
    
    # Fix button hover that might have been changed incorrectly
    $content = $content -replace 'bg-purple-600 text-gray-800', 'bg-purple-600 text-white'
    
    # Ensure shadow classes are clean
    $content = $content -replace 'shadow-xl shadow-xl', 'shadow-xl'
    $content = $content -replace 'shadow-lg shadow-lg', 'shadow-lg'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)"
    }
}
Write-Host "Total files updated in pass 5: $count"
