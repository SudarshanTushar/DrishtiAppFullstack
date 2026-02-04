# --- CONFIGURATION ---
$ServerIP = "157.245.111.124"
$User = "root"
$RemotePath = "/root/drishti_backend"

# Current folder se backend folder uthao
$LocalBackendPath = ".\backend\*" 

# --- SCRIPT START ---
Write-Host "🚀 Starting Deployment to DigitalOcean..." -ForegroundColor Cyan

# 1. Upload Backend Files (Recursive)
Write-Host "📦 Uploading Backend Files..." -ForegroundColor Yellow
scp -r $LocalBackendPath ${User}@${ServerIP}:${RemotePath}

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files Uploaded Successfully!" -ForegroundColor Green
    
    # 2. Restart Server Service
    Write-Host "🔄 Restarting Drishti Backend Service..." -ForegroundColor Yellow
    ssh ${User}@${ServerIP} "systemctl restart drishti"
    
    Write-Host "🔥 DEPLOYMENT COMPLETE! Server is Live." -ForegroundColor Cyan
} else {
    Write-Host "❌ Error: Upload Failed." -ForegroundColor Red
}