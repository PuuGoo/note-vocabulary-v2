#!/bin/bash

# =====================================================
# Emergency Fix - EADDRINUSE Error
# =====================================================

echo "?? Fixing EADDRINUSE Error..."

cd /root/vocapro || exit 1

# Step 1: Stop all PM2 processes
echo "?? Stopping all PM2 processes..."
pm2 delete all

# Step 2: Kill any process using port 3000
echo "?? Killing processes on port 3000..."
sudo lsof -ti:3000 | xargs -r sudo kill -9 2>/dev/null || true

# Step 3: Pull latest config
echo "?? Pulling latest configuration..."
git pull origin main

# Step 4: Clear PM2 logs
echo "?? Clearing PM2 logs..."
pm2 flush

# Step 5: Start with new config
echo "?? Starting with new configuration..."
pm2 start ecosystem.config.js --env production

# Step 6: Save PM2 process list
pm2 save

# Step 7: Show status
echo ""
echo "? Fixed! Current status:"
pm2 status

echo ""
echo "?? Logs:"
pm2 logs vocapro --lines 20 --nostream

echo ""
echo "?? Test: curl http://localhost:3000/health"
curl -s http://localhost:3000/health || echo "? Health check failed"
