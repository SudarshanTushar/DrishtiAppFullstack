# Quick Deploy Script - Uploads EVERYTHING (AI Brain + Server) and Restarts

# --- CONFIGURATION ---
$SERVER = "157.245.111.124"
$USER = "root"
$REMOTE_PATH = "/root/drishti_backend" 
$LOCAL_PATH = ".\backend\*"

Write-Host "`n🚀 Deploying Life Saviour AI to DigitalOcean..." -ForegroundColor Cyan

# ---------------------------------------------------------
# STEP 1: Upload Backend Files
# ---------------------------------------------------------
Write-Host "`n[1/3] Uploading backend files (AI Models + Code)..." -ForegroundColor Yellow
scp -r $LOCAL_PATH ${USER}@${SERVER}:${REMOTE_PATH}

# Check if Upload Failed
if (-not $?) {
    Write-Host "❌ Upload failed! Check SSH connection or path." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Upload successful" -ForegroundColor Green

# ---------------------------------------------------------
# STEP 2: Restart Service
# ---------------------------------------------------------
Write-Host "`n[2/3] Restarting backend service..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} "systemctl restart drishti"

# Check if Restart Failed
if (-not $?) {
    Write-Host "❌ Restart failed! Check server logs." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Service restarted" -ForegroundColor Green

# ---------------------------------------------------------
# STEP 3: Check Status
# ---------------------------------------------------------
Write-Host "`n[3/3] Checking service status..." -ForegroundColor Yellow
ssh ${USER}@${SERVER} "systemctl status drishti --no-pager -n 10"

Write-Host "`n✅ DEPLOYMENT COMPLETE! AI is Live." -ForegroundColor Cyan
Write-Host "Test API: curl https://157.245.111.124.nip.io/" -ForegroundColor Gray