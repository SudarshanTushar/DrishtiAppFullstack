#!/bin/bash

# Drishti-NE Backend Deployment Script for DigitalOcean
# Run this on your server after uploading the code

set -e  # Exit on error

echo "🚀 Deploying Drishti-NE Backend to DigitalOcean..."

# 1. Install system dependencies
echo "📦 Installing system dependencies..."
apt-get update
apt-get install -y python3-pip python3-venv

# 2. Setup directories
echo "📁 Setting up directories..."
mkdir -p /root/DrishtiApp
cd /root/DrishtiApp

# 3. Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# 4. Install Python packages
echo "📚 Installing Python packages (this may take a few minutes)..."
pip install --upgrade pip
pip install -r backend/requirements.txt

# 5. Copy systemd service file
echo "⚙️ Installing systemd service..."
cp backend/drishti_backend.service /etc/systemd/system/
systemctl daemon-reload

# 6. Create log files
echo "📝 Creating log files..."
touch /var/log/drishti_backend.log
touch /var/log/drishti_backend_error.log
chmod 644 /var/log/drishti_backend*.log

# 7. Enable and start service
echo "🔄 Starting service..."
systemctl enable drishti_backend.service
systemctl restart drishti_backend.service

# 8. Wait and check status
echo "⏳ Waiting for service to start..."
sleep 5
systemctl status drishti_backend.service --no-pager

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Useful commands:"
echo "   Check status: systemctl status drishti_backend"
echo "   View logs: tail -f /var/log/drishti_backend.log"
echo "   View errors: tail -f /var/log/drishti_backend_error.log"
echo "   Restart: systemctl restart drishti_backend"
echo "   Stop: systemctl stop drishti_backend"
echo ""
echo "🌐 Test the API:"
echo "   curl http://localhost:8000/"
echo "   curl http://localhost:8000/system/readiness"
