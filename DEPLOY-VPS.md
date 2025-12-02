# ?? VocaPro - H??ng D?n Deploy lên VPS (Node.js)

## ?? Yêu C?u H? Th?ng

- **VPS/Server**: Ubuntu 20.04 LTS ho?c m?i h?n
- **RAM**: T?i thi?u 1GB (khuy?n ngh? 2GB+)
- **Node.js**: 18.x tr? lên
- **Database**: Azure SQL Database (?ã có)
- **Domain**: Tùy ch?n (có th? dùng IP)

---

## ?? Ph??ng Pháp 1: Deploy T? ??ng (Khuy?n Ngh?)

### B??c 1: K?t n?i VPS

```bash
ssh your-username@your-vps-ip
```

### B??c 2: Download và ch?y script deploy

```bash
# T?o th? m?c project
mkdir -p ~/vocapro
cd ~/vocapro

# Clone repository
git clone https://github.com/PuuGoo/note-vocabulary-v2.git .

# Ch?y script deploy (script s? t? ??ng cài ??t t?t c?)
chmod +x deploy-vps.sh
bash deploy-vps.sh
```

### B??c 3: C?u hình môi tr??ng

```bash
# Edit file .env
nano .env
```

C?p nh?t các thông tin sau:

```env
# Database (Azure SQL Database)
DATABASE_URL="sqlserver://USERNAME:PASSWORD@SERVERNAME.database.windows.net:1433;database=DBNAME;encrypt=true;trustServerCertificate=false"

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
BASE_URL=http://your-domain.com  # ho?c http://your-vps-ip

# Session Secret (??i thành chu?i ng?u nhiên)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Redis
REDIS_URL=redis://localhost:6379

# Google OAuth (n?u dùng)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://your-domain.com/auth/google/callback
```

### B??c 4: ??y database schema và kh?i ??ng

```bash
# Generate Prisma Client
npx prisma generate

# ??y database schema lên Azure SQL
npx prisma db push

# Restart ?ng d?ng
pm2 restart vocapro
```

### B??c 5: C?u hình Nginx

```bash
# Edit Nginx config v?i domain/IP c?a b?n
sudo nano /etc/nginx/sites-available/vocapro
```

Thay ??i `yourdomain.com` thành domain ho?c IP c?a b?n:

```nginx
server_name your-domain.com www.your-domain.com;
# ho?c
server_name your-vps-ip;
```

```bash
# Test và reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### B??c 6: Cài ??t SSL (Khuy?n ngh?)

```bash
# Cài ??t Certbot
sudo apt install -y certbot python3-certbot-nginx

# T?o SSL certificate (thay your-domain.com)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renew certificate
sudo systemctl enable certbot.timer
```

---

## ??? Ph??ng Pháp 2: Deploy Th? Công

### B??c 1: Cài ??t Node.js

```bash
# Cài Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Ki?m tra version
node --version
npm --version
```

### B??c 2: Cài ??t PM2

```bash
sudo npm install -g pm2
pm2 --version
```

### B??c 3: Cài ??t Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### B??c 4: Cài ??t Redis

```bash
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

### B??c 5: Clone và cài ??t project

```bash
# T?o th? m?c
mkdir -p ~/vocapro
cd ~/vocapro

# Clone repository
git clone https://github.com/PuuGoo/note-vocabulary-v2.git .

# Cài ??t dependencies
npm install

# T?o file .env
cp .env.example .env
nano .env  # Ch?nh s?a theo môi tr??ng c?a b?n

# Generate Prisma Client
npx prisma generate

# ??y database schema
npx prisma db push

# T?o th? m?c logs và uploads
mkdir -p logs uploads
```

### B??c 6: C?u hình Nginx

```bash
# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/vocapro

# Xóa default site
sudo rm /etc/nginx/sites-enabled/default

# T?o symbolic link
sudo ln -s /etc/nginx/sites-available/vocapro /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### B??c 7: Kh?i ??ng ?ng d?ng v?i PM2

```bash
# Start v?i PM2
pm2 start ecosystem.config.js --env production

# Save process list
pm2 save

# Setup startup script
pm2 startup
# Copy và ch?y l?nh mà PM2 tr? v?
```

---

## ?? Qu?n Lý ?ng D?ng

### PM2 Commands

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs vocapro
pm2 logs vocapro --lines 100

# Restart
pm2 restart vocapro

# Stop
pm2 stop vocapro

# Start l?i
pm2 start vocapro

# Monitor realtime
pm2 monit

# Xem thông tin chi ti?t
pm2 describe vocapro

# Delete process
pm2 delete vocapro
```

### Nginx Commands

```bash
# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# Stop
sudo systemctl stop nginx

# Start
sudo systemctl start nginx

# Status
sudo systemctl status nginx

# Xem logs
sudo tail -f /var/log/nginx/vocapro-access.log
sudo tail -f /var/log/nginx/vocapro-error.log
```

### Redis Commands

```bash
# Status
sudo systemctl status redis-server

# Restart
sudo systemctl restart redis-server

# Test connection
redis-cli ping  # Should return PONG
```

---

## ?? Update ?ng D?ng

```bash
# Di chuy?n vào th? m?c project
cd ~/vocapro

# Pull code m?i
git pull origin main

# Cài ??t dependencies m?i (n?u có)
npm install

# Generate Prisma Client
npx prisma generate

# Migrate database (n?u có thay ??i schema)
npx prisma db push

# Restart ?ng d?ng
pm2 restart vocapro

# Xem logs ?? ??m b?o không có l?i
pm2 logs vocapro --lines 50
```

---

## ?? B?o M?t

### 1. Firewall (UFW)

```bash
# Enable firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Check status
sudo ufw status
```

### 2. Fail2Ban (Ch?ng brute force)

```bash
# Cài ??t
sudo apt install -y fail2ban

# Enable
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Secure Redis

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Thêm password
requirepass your-strong-password

# Bind to localhost only
bind 127.0.0.1

# Restart Redis
sudo systemctl restart redis-server
```

Sau ?ó update file `.env`:

```env
REDIS_URL=redis://:your-strong-password@localhost:6379
```

---

## ?? Monitoring

### Setup PM2 Monitoring (Optional)

```bash
# Link to PM2 Plus (free tier)
pm2 link <secret_key> <public_key>

# Monitor
pm2 monitor
```

### Log Rotation

PM2 t? ??ng rotate logs, nh?ng b?n có th? c?u hình thêm:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## ?? Troubleshooting

### Ki?m tra service ?ang ch?y

```bash
# Node.js processes
pm2 status

# Nginx
sudo systemctl status nginx

# Redis
sudo systemctl status redis-server
```

### Ki?m tra logs

```bash
# PM2 logs
pm2 logs vocapro

# Nginx logs
sudo tail -f /var/log/nginx/vocapro-error.log

# System logs
journalctl -u nginx -f
```

### Application không start

```bash
# Ki?m tra port 3000 có b? chi?m không
sudo lsof -i :3000

# Ki?m tra .env file
cat .env

# Test database connection
npx prisma db pull
```

### Nginx 502 Bad Gateway

```bash
# Ki?m tra PM2 process
pm2 status

# Restart application
pm2 restart vocapro

# Ki?m tra Nginx config
sudo nginx -t
```

---

## ?? Checklist Deploy

- [ ] VPS ?ã cài ??t Node.js 18+
- [ ] ?ã cài PM2, Nginx, Redis
- [ ] Clone code t? GitHub
- [ ] T?o và c?u hình file `.env`
- [ ] Ch?y `npm install`
- [ ] Ch?y `npx prisma generate`
- [ ] Ch?y `npx prisma db push`
- [ ] C?u hình Nginx v?i domain/IP
- [ ] Start ?ng d?ng v?i PM2
- [ ] Setup PM2 startup script
- [ ] Cài ??t SSL certificate (n?u có domain)
- [ ] C?u hình firewall
- [ ] Test ?ng d?ng qua browser

---

## ?? Support

N?u g?p v?n ??, ki?m tra:

1. **PM2 logs**: `pm2 logs vocapro`
2. **Nginx logs**: `sudo tail -f /var/log/nginx/vocapro-error.log`
3. **Redis status**: `sudo systemctl status redis-server`
4. **Database connection**: Ki?m tra `DATABASE_URL` trong `.env`

---

## ?? Performance Tips

1. **Enable Gzip**: ?ã c?u hình trong Nginx
2. **Use PM2 cluster mode**: ?ã c?u hình trong `ecosystem.config.js`
3. **Redis caching**: ?ã setup cho sessions
4. **Static file caching**: Nginx serve static files v?i cache headers
5. **Database connection pooling**: Prisma t? ??ng qu?n lý

---

**Chúc b?n deploy thành công! ??**
