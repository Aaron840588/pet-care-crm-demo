$sourcePath = Read-Host "Enter the full path to your SVG logo (e.g. C:\Users\Downloads\logo.svg)"
$sourcePath = $sourcePath.Trim('"')

if (!(Test-Path $sourcePath)) {
    Write-Host "Could not find file at $sourcePath" -ForegroundColor Red
    exit
}

Write-Host "Copying logo to public/logo.svg..."
Copy-Item $sourcePath "public/logo.svg" -Force

Write-Host "Generating PWA icons..."
node generate-icons.cjs

Write-Host "Done! The logo has been updated across the web app and PWA." -ForegroundColor Green
