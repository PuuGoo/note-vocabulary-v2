#!/bin/bash

# =====================================================
# Fix Redis Installation Issues
# =====================================================

echo "?? Fixing Redis Installation..."

# Stop any running Redis processes
echo "?? Stopping Redis..."
sudo systemctl stop redis-server 2>/dev/null || true
sudo killall redis-server 2>/dev/null || true

# Remove existing Redis installation
echo "???  Removing old Redis installation..."
sudo apt remove --purge redis-server -y 2>/dev/null || true
sudo apt autoremove -y

# Clean up Redis data
echo "?? Cleaning up Redis data..."
sudo rm -rf /var/lib/redis
sudo rm -rf /etc/redis
sudo rm -rf /var/log/redis

# Update package list
echo "?? Updating package list..."
sudo apt update

# Install Redis
echo "?? Installing Redis..."
sudo apt install redis-server -y

# Configure Redis
echo "??  Configuring Redis..."
sudo tee /etc/redis/redis.conf > /dev/null <<EOF
# Redis Configuration
bind 127.0.0.1 ::1
protected-mode yes
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300
daemonize no
supervised systemd
pidfile /var/run/redis/redis-server.pid
loglevel notice
logfile /var/log/redis/redis-server.log
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis
maxmemory 256mb
maxmemory-policy allkeys-lru
appendonly no
EOF

# Set correct permissions
echo "?? Setting permissions..."
sudo mkdir -p /var/lib/redis
sudo mkdir -p /var/log/redis
sudo mkdir -p /var/run/redis
sudo chown -R redis:redis /var/lib/redis
sudo chown -R redis:redis /var/log/redis
sudo chown -R redis:redis /var/run/redis
sudo chmod 750 /var/lib/redis

# Reload systemd
echo "?? Reloading systemd..."
sudo systemctl daemon-reload

# Enable and start Redis
echo "?? Starting Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Wait a moment
sleep 2

# Check status
echo ""
echo "?? Redis Status:"
sudo systemctl status redis-server --no-pager | head -15

# Test Redis
echo ""
echo "?? Testing Redis connection..."
if redis-cli ping 2>/dev/null; then
    echo "? Redis is working!"
else
    echo "? Redis is not responding"
    echo ""
    echo "?? Checking logs..."
    sudo journalctl -u redis-server -n 20 --no-pager
fi

echo ""
echo "? Redis installation complete!"
