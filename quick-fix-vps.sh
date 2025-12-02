#!/bin/bash

# =====================================================
# Quick Fix Script for VocaPro on VPS
# =====================================================

set -e

echo "?? Quick Fix for VocaPro Application..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current user's home directory
USER_HOME=$(eval echo ~$USER)
APP_DIR="$USER_HOME/vocapro"

echo -e "${YELLOW}?? Working directory: $APP_DIR${NC}"

# Navigate to app directory
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
else
    echo -e "${RED}? Application directory not found: $APP_DIR${NC}"
    echo -e "${YELLOW}Creating directory...${NC}"
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    echo -e "${YELLOW}?? Cloning repository...${NC}"
    git clone https://github.com/PuuGoo/note-vocabulary-v2.git .
fi

# Pull latest code
echo -e "${YELLOW}?? Pulling latest code...${NC}"
git pull origin main || echo "Already up to date"

# Install dependencies
echo -e "${YELLOW}?? Installing dependencies...${NC}"
npm install

# Setup environment file
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}??  Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${RED}??  IMPORTANT: Edit .env file with your settings!${NC}"
    echo -e "${YELLOW}Run: nano .env${NC}"
else
    echo -e "${GREEN}? Environment file exists${NC}"
fi

# Generate Prisma Client
echo -e "${YELLOW}?? Generating Prisma Client...${NC}"
npx prisma generate

# Create required directories
echo -e "${YELLOW}?? Creating required directories...${NC}"
mkdir -p logs uploads

# Fix Nginx config - Update username
echo -e "${YELLOW}?? Updating Nginx configuration...${NC}"
CURRENT_USER=$(whoami)

# Create custom nginx config with correct paths
sudo tee /etc/nginx/sites-available/vocapro > /dev/null <<EOF
# VocaPro Nginx Configuration
server {
    listen 80;
    listen [::]:80;
    server_name 165.227.101.102;

    access_log /var/log/nginx/vocapro-access.log;
    error_log /var/log/nginx/vocapro-error.log;

    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    # Proxy to Node.js app on port 3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static uploads
    location /uploads {
        alias $APP_DIR/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
echo -e "${YELLOW}?? Enabling VocaPro site...${NC}"
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/vocapro /etc/nginx/sites-enabled/

# Test Nginx config
echo -e "${YELLOW}?? Testing Nginx configuration...${NC}"
sudo nginx -t

# Reload Nginx
echo -e "${YELLOW}?? Reloading Nginx...${NC}"
sudo systemctl reload nginx

# Stop any existing PM2 process
echo -e "${YELLOW}?? Stopping existing PM2 processes...${NC}"
pm2 delete vocapro 2>/dev/null || true

# Start application with PM2
echo -e "${YELLOW}?? Starting VocaPro with PM2...${NC}"
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Show status
echo ""
echo -e "${GREEN}? VocaPro Application Started!${NC}"
echo ""
pm2 status
echo ""
echo -e "${YELLOW}?? Useful Commands:${NC}"
echo "  View logs:    pm2 logs vocapro"
echo "  Restart app:  pm2 restart vocapro"
echo "  Stop app:     pm2 stop vocapro"
echo ""
echo -e "${YELLOW}?? Access your app at: http://165.227.101.102${NC}"
echo ""

# Show recent logs
echo -e "${YELLOW}?? Recent application logs:${NC}"
pm2 logs vocapro --lines 30 --nostream
