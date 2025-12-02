#!/bin/bash

# =====================================================
# Debug Script - Check VocaPro Status on VPS
# =====================================================

echo "?? Checking VocaPro Application Status..."
echo "========================================"

# Check Node.js
echo ""
echo "?? Node.js Version:"
node --version || echo "? Node.js not installed!"

# Check PM2
echo ""
echo "?? PM2 Version:"
pm2 --version || echo "? PM2 not installed!"

# Check PM2 processes
echo ""
echo "?? PM2 Process Status:"
pm2 list

# Check if app is running on port 3000
echo ""
echo "?? Port 3000 Status:"
if lsof -i :3000 > /dev/null 2>&1; then
    echo "? Port 3000 is in use"
    lsof -i :3000
else
    echo "? Nothing is running on port 3000!"
fi

# Check Nginx status
echo ""
echo "?? Nginx Status:"
sudo systemctl status nginx --no-pager | head -10

# Check Nginx config
echo ""
echo "?? Nginx Config Test:"
sudo nginx -t

# Check if VocaPro config exists
echo ""
echo "?? VocaPro Nginx Config:"
if [ -f "/etc/nginx/sites-available/vocapro" ]; then
    echo "? Config exists"
    cat /etc/nginx/sites-available/vocapro | head -20
else
    echo "? VocaPro config not found!"
fi

# Check if config is enabled
echo ""
echo "?? Enabled Sites:"
ls -la /etc/nginx/sites-enabled/

# Check Redis
echo ""
echo "?? Redis Status:"
sudo systemctl status redis-server --no-pager | head -5
redis-cli ping || echo "? Redis not responding"

# Check application directory
echo ""
echo "?? Application Directory:"
if [ -d "$HOME/vocapro" ]; then
    echo "? Directory exists: $HOME/vocapro"
    ls -la $HOME/vocapro | head -15
else
    echo "? VocaPro directory not found!"
fi

# Check .env file
echo ""
echo "??  Environment File:"
if [ -f "$HOME/vocapro/.env" ]; then
    echo "? .env exists"
elif [ -f "$HOME/vocapro/.env.production" ]; then
    echo "? .env.production exists"
else
    echo "? No .env file found!"
fi

# Check logs
echo ""
echo "?? Recent PM2 Logs (if any):"
pm2 logs vocapro --lines 20 --nostream 2>/dev/null || echo "No PM2 logs found"

echo ""
echo "========================================"
echo "? Diagnosis Complete"
