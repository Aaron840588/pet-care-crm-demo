# deploy.ps1 — Build, deploy to Vercel, and push to GitHub
# Usage: .\deploy.ps1
# Usage with message: .\deploy.ps1 "your commit message"

param(
  [string]$Message = ""
)

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"

# 1. Build
Write-Host "📦 Building..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Build failed" -ForegroundColor Red; exit 1 }

# 2. Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Cyan
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Vercel deploy failed" -ForegroundColor Red; exit 1 }

# 3. Git commit + push
Write-Host "📤 Pushing to GitHub..." -ForegroundColor Cyan
git add -A

$commitMsg = if ($Message -ne "") { $Message } else { "deploy: $timestamp" }
git commit -m $commitMsg

git push origin master
if ($LASTEXITCODE -ne 0) {
  git push --set-upstream origin master
}

Write-Host "✅ Done! Deployed to Vercel + pushed to GitHub." -ForegroundColor Green
