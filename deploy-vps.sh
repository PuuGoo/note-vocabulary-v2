#!/bin/bash

# =====================================================
# VocaPro VPS Deployment Script
# S? d?ng: bash deploy-vps.sh
# =====================================================

set -e

echo "?? Starting VocaPro VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# =====================================================
# 1. Update system packages
# =====================================================
echo -e "${YELLOW}?? Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# =====================================================
# 2. Install Node.js 18.x
# =====================================================
echo -e "${YELLOW}?? Installing Node.js 18.x...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}? Node.js already installed${NC}"
fi

node --version
npm --version

# =====================================================
# 3. Install PM2 globally
# =====================================================
echo -e "${YELLOW}?? Installing PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
else
    echo -e "${GREEN}? PM2 already installed${NC}"
fi

pm2 --version

# =====================================================
# 4. Install Nginx
# =====================================================
echo -e "${YELLOW}?? Installing Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
else
    echo -e "${GREEN}? Nginx already installed${NC}"
fi

# =====================================================
# 5. Install Redis (for session storage)
# =====================================================
echo -e "${YELLOW}?? Installing Redis...${NC}"
if ! command -v redis-server &> /dev/null; then
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
else
    echo -e "${GREEN}? Redis already installed${NC}"
fi

# =====================================================
# 6. Create application directory
# =====================================================
echo -e "${YELLOW}?? Setting up application directory...${NC}"
APP_DIR="/home/$(whoami)/vocapro"
mkdir -p $APP_DIR
cd $APP_DIR

# =====================================================
# 7. Clone or update repository
# =====================================================
echo -e "${YELLOW}?? Cloning/updating repository...${NC}"
if [ ! -d ".git" ]; then
    git clone https://github.com/PuuGoo/note-vocabulary-v2.git .
else
    git pull origin main
fi

# =====================================================
# 8. Install dependencies
# =====================================================
echo -e "${YELLOW}?? Installing Node.js dependencies...${NC}"
npm install

# =====================================================
# 9. Setup environment variables
# =====================================================
echo -e "${YELLOW}??  Setting up environment variables...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${RED}??  Please edit .env file with your production settings${NC}"
    echo -e "${YELLOW}Run: nano .env${NC}"
else
    echo -e "${GREEN}? .env file already exists${NC}"
fi

# =====================================================
# 10. Generate Prisma Client
# =====================================================
echo -e "${YELLOW}?? Generating Prisma Client...${NC}"
npx prisma generate

# =====================================================
# 11. Push database schema (optional - run manually if needed)
# =====================================================
echo -e "${YELLOW}?? Database setup...${NC}"
echo -e "${YELLOW}To push database schema, run: npx prisma db push${NC}"
# Uncomment to auto-push:
# npx prisma db push

# =====================================================
# 12. Create required directories
# =====================================================
echo -e "${YELLOW}?? Creating required directories...${NC}"
mkdir -p logs uploads

# =====================================================
# 13. Setup Nginx
# =====================================================
echo -e "${YELLOW}?? Setting up Nginx...${NC}"
sudo cp nginx.conf /etc/nginx/sites-available/vocapro

# Remove default site if exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# Create symlink
if [ ! -f "/etc/nginx/sites-enabled/vocapro" ]; then
    sudo ln -s /etc/nginx/sites-available/vocapro /etc/nginx/sites-enabled/
fi

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
sudo systemctl enable nginx

# =====================================================
# 14. Setup firewall (optional)
# =====================================================
echo -e "${YELLOW}?? Setting up firewall...${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    # sudo ufw enable
    echo -e "${YELLOW}Firewall configured (not enabled yet)${NC}"
fi

# =====================================================
# 15. Start application with PM2
# =====================================================
echo -e "${YELLOW}?? Starting application with PM2...${NC}"
pm2 delete vocapro 2>/dev/null || true
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 startup script
pm2 startup | tail -n 1 | sudo bash

# =====================================================
# 16. Show status
# =====================================================
echo -e "${GREEN}? Deployment completed!${NC}"
echo ""
echo "?? Application status:"
pm2 status

echo ""
echo "?? Useful commands:"
echo "  - View logs:     pm2 logs vocapro"
echo "  - Restart app:   pm2 restart vocapro"
echo "  - Stop app:      pm2 stop vocapro"
echo "  - Monitor:       pm2 monit"
echo "  - View status:   pm2 status"
echo ""
echo "?? Nginx commands:"
echo "  - Test config:   sudo nginx -t"
echo "  - Reload:        sudo systemctl reload nginx"
echo "  - Status:        sudo systemctl status nginx"
echo ""
echo "??  Next steps:"
echo "  1. Edit .env file: nano .env"
echo "  2. Push database: npx prisma db push"
echo "  3. Restart app:   pm2 restart vocapro"
echo "  4. Setup SSL:     sudo certbot --nginx -d yourdomain.com"
echo ""
echo -e "${GREEN}?? VocaPro is ready!${NC}"
