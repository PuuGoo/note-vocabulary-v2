#!/bin/bash

# =====================================================
# Fix Session/Cookie Issues - Login Redirect Problem
# =====================================================

echo "?? Fixing session/cookie configuration..."

cd /root/vocapro || exit 1

# Pull latest code
echo "?? Pulling latest changes..."
git pull origin main

# Install dependencies (if any changes)
echo "?? Installing dependencies..."
npm install

# Restart application
echo "?? Restarting application..."
pm2 restart vocapro

# Wait a moment
sleep 2

# Show status
echo ""
echo "? Application restarted!"
pm2 status

echo ""
echo "?? Recent logs:"
pm2 logs vocapro --lines 20 --nostream

echo ""
echo "?? Test login at: http://165.227.101.102"
echo ""
echo "?? Changes made:"
echo "  - Session cookie: secure = false (works with HTTP)"
echo "  - Added sameSite = 'lax' (prevents CSRF)"
echo "  - Cookie will persist after login"
