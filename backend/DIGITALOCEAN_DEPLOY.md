# Drishti-NE Backend - DigitalOcean Deployment Guide

## Quick Deploy

1. **Upload your code to DigitalOcean droplet:**

```bash
# From your local machine
scp -r backend root@YOUR_DROPLET_IP:/root/DrishtiApp/
```

2. **SSH into your server:**

```bash
ssh root@YOUR_DROPLET_IP
```

3. **Run the deployment script:**

```bash
cd /root/DrishtiApp
chmod +x backend/deploy_digitalocean.sh
./backend/deploy_digitalocean.sh
```

## Manual Fix (If Service Still Fails)

If the automated deployment doesn't work, follow these steps:

### Step 1: Check Error Logs

```bash
tail -f /var/log/drishti_backend_error.log
```

### Step 2: Test Manual Start

```bash
cd /root/DrishtiApp/backend
source ../venv/bin/activate
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

If this works, the service file needs adjustment.

### Step 3: Fix Common Issues

**Issue: Missing AI Model Files**

- The AI model will use fallback mode automatically
- No action needed - service will still work

**Issue: OSMnx Network Timeout**

- Fixed with lazy loading (downloads on first route request)
- Graph loads in 30-45 seconds on first API call

**Issue: Port 8000 Already in Use**

```bash
sudo lsof -i :8000
sudo kill -9 PID_NUMBER
```

## Verify Deployment

```bash
# Check service status
systemctl status drishti_backend

# Test health endpoint
curl http://localhost:8000/

# Test readiness
curl http://localhost:8000/system/readiness

# Test from external (replace with your IP)
curl http://YOUR_DROPLET_IP:8000/
```

## Firewall Configuration

```bash
# Allow port 8000
ufw allow 8000/tcp
ufw reload
```

## View Logs

```bash
# Live application logs
tail -f /var/log/drishti_backend.log

# Error logs only
tail -f /var/log/drishti_backend_error.log

# Last 100 lines
tail -100 /var/log/drishti_backend.log
```

## Service Management

```bash
# Start
systemctl start drishti_backend

# Stop
systemctl stop drishti_backend

# Restart (after code changes)
systemctl restart drishti_backend

# Enable auto-start on boot
systemctl enable drishti_backend

# Disable auto-start
systemctl disable drishti_backend
```

## Performance Optimization

For better performance on DigitalOcean:

1. **Use at least 2GB RAM droplet** (graph loading is memory intensive)
2. **Enable swap** if using 1GB droplet:

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

3. **Monitor resources:**

```bash
htop  # Install with: apt install htop
```

## Troubleshooting

### Service won't start

```bash
# Check detailed error
journalctl -u drishti_backend.service -n 50 --no-pager

# Check Python path
which python3
/root/DrishtiApp/venv/bin/python3 --version

# Test uvicorn directly
cd /root/DrishtiApp/backend
/root/DrishtiApp/venv/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Graph Loading Hangs

- **This is normal for first request!** Graph takes 30-45 seconds to download
- Service starts immediately, graph loads on first API call
- Check logs: `tail -f /var/log/drishti_backend.log`

### Out of Memory

```bash
# Check memory usage
free -h

# Add swap (see Performance section above)
```

## Update Code

```bash
# Upload new code from local machine
scp -r backend/main.py root@YOUR_DROPLET_IP:/root/DrishtiApp/backend/

# Restart service on server
systemctl restart drishti_backend

# Watch logs
tail -f /var/log/drishti_backend.log
```

## Security (Production)

```bash
# Use UFW firewall
ufw enable
ufw allow 22/tcp  # SSH
ufw allow 8000/tcp  # API
ufw reload

# Setup nginx reverse proxy (optional)
apt install nginx
# Configure nginx to proxy port 80 -> 8000
```

## Support

If issues persist:

1. Check logs: `/var/log/drishti_backend_error.log`
2. Test manual start (Step 2 above)
3. Verify all dependencies: `pip list`
4. Check disk space: `df -h`
5. Check memory: `free -h`
