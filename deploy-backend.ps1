# Quick Deploy Script - Upload and Restart Backend

Write-Host "`n🚀 Deploying updated backend to DigitalOcean..." -ForegroundColor Cyan

$SERVER = "157.245.111.124"

# 1. Upload main.py
Write-Host "`n[1/3] Uploading main.py..." -ForegroundColor Yellow
scp backend/main.py root@${SERVER}:/root/DrishtiApp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Upload failed! Check SSH connection." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Upload successful" -ForegroundColor Green

# 2. Restart service
Write-Host "`n[2/3] Restarting backend service..." -ForegroundColor Yellow
ssh root@$SERVER "systemctl restart drishti_backend"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Restart failed!" -ForegroundColor Red
    exit 1
}

Start-Sleep -Seconds 3
Write-Host "✓ Service restarted" -ForegroundColor Green

# 3. Check status
Write-Host "`n[3/3] Checking service status..." -ForegroundColor Yellow
ssh root@$SERVER "systemctl status drishti_backend --no-pager -n 20"

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Test the API: curl https://157.245.111.124.nip.io/" -ForegroundColor Cyan
