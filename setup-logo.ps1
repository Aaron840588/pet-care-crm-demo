$sourcePath = Read-Host "Enter the full path to your logo image (e.g. C:\Users\Downloads\logo.png)"
$sourcePath = $sourcePath.Trim('"')

if (!(Test-Path $sourcePath)) {
    Write-Host "Could not find file at $sourcePath" -ForegroundColor Red
    exit
}

Write-Host "Copying logo to public/logo.png..."
Copy-Item $sourcePath "public/logo.png" -Force

Write-Host "Generating PWA icons..."
node generate-icons.cjs

Write-Host "Done! The logo has been updated across the web app and PWA." -ForegroundColor Green
