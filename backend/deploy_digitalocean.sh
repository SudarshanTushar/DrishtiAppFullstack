#!/bin/bash

# ====================================================
# 🚀 DRISHTI-NE: WAR ROOM DEPLOYMENT SCRIPT
# Target: Ubuntu / DigitalOcean Droplet
# ====================================================

set -e  # Exit immediately if a command exits with a non-zero status

echo "🔥 [DEPLOY] Initiating Drishti-NE Deployment Sequence..."

# 1. SYSTEM PREP
echo "📦 [SYSTEM] Updating repositories & installing dependencies..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv git ufw

# 2. SETUP DIRECTORIES
# We assume you uploaded the code to /root/DrishtiApp via SCP/FileZilla
APP_DIR="/root/DrishtiApp"
echo "📂 [FILES] Verifying directory: $APP_DIR"

if [ ! -d "$APP_DIR" ]; then
    echo "❌ ERROR: Directory $APP_DIR not found!"
    echo "   Please upload your code first: scp -r backend/ root@<IP>:/root/DrishtiApp"
    exit 1
fi

cd $APP_DIR

# 3. PYTHON ENVIRONMENT
echo "🐍 [PYTHON] Setting up Virtual Environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

# 4. DEPENDENCIES
echo "📚 [DEPS] Installing Python packages (this takes time)..."
pip install --upgrade pip
# Force CPU version of PyTorch to save RAM on Droplet
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r backend/requirements.txt

# 5. MODEL SAFEGUARD
# Create the directory so the code doesn't crash, even if empty
mkdir -p backend/ai_models/distilbert
echo "🧠 [AI] Model directory structure confirmed."

# 6. SYSTEMD SERVICE
echo "⚙️ [SERVICE] Configuring Systemd..."
# Ensure the service file points to the right path (/root/DrishtiApp/backend)
# We overwrite the uploaded service file to ensure paths are correct dynamically
cat > /etc/systemd/system/drishti_backend.service <<EOF
[Unit]
Description=Drishti-NE API Server
After=network.target

[Service]
User=root
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable drishti_backend
sudo systemctl restart drishti_backend

# 7. FIREWALL (CRITICAL STEP)
echo "🛡️ [SEC] Opening Port 8000 (HTTP)..."
sudo ufw allow 8000/tcp
sudo ufw allow 22/tcp  # Don't lock yourself out of SSH!
echo "y" | sudo ufw enable

# 8. STATUS CHECK
echo "⏳ [WAIT] Waiting for API to boot..."
sleep 5

# Check if port 8000 is listening
if ss -tuln | grep -q :8000; then
    echo ""
    echo "===================================================="
    echo "✅ DEPLOYMENT SUCCESSFUL - SYSTEM ONLINE"
    echo "===================================================="
    echo "📡 Live API: http://$(curl -s ifconfig.me):8000"
    echo "📄 Docs:     http://$(curl -s ifconfig.me):8000/docs"
    echo "===================================================="
else
    echo "⚠️ WARNING: Service started but port 8000 seems closed."
    echo "   Check logs: journalctl -u drishti_backend -f"
fi