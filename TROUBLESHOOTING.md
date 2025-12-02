# ?? VocaPro Not Working - Quick Fix Guide

## ?? V?n ??

Nginx hi?n th? trang m?c ??nh "Welcome to nginx!" thay vì ?ng d?ng VocaPro.

**Nguyên nhân:**
- ? ?ng d?ng Node.js ch?a ch?y trên port 3000
- ? Nginx config ch?a ???c setup ?úng
- ? PM2 ch?a start ?ng d?ng

---

## ? Gi?i Pháp Nhanh (3 Phút)

### **SSH vào VPS**

```bash
ssh root@165.227.101.102
```

### **Ch?y Script Fix T? ??ng**

```bash
# Pull code m?i
cd ~/vocapro
git pull origin main

# Ch?y quick fix script
chmod +x quick-fix-vps.sh
bash quick-fix-vps.sh
```

Script s? t? ??ng:
- ? Pull code m?i
- ? Install dependencies
- ? Generate Prisma Client
- ? C?u hình Nginx ?úng
- ? Start ?ng d?ng v?i PM2
- ? Show logs

---

## ?? Ho?c Fix Th? Công

### **B??c 1: Ki?m tra tr?ng thái**

```bash
cd ~/vocapro

# Debug script
chmod +x debug-vps.sh
bash debug-vps.sh
```

### **B??c 2: C?u hình .env**

```bash
# T?o file .env t? example
cp .env.example .env

# Edit v?i thông tin th?c
nano .env
```

C?p nh?t các thông tin sau trong `.env`:

```env
# Database (Azure SQL)
DATABASE_URL="sqlserver://digi-hotel.database.windows.net:1433;database=db_save_vocabulary;user=puugoo;password=1303Puu!;encrypt=true"

# Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
BASE_URL=http://165.227.101.102

# Session Secret
SESSION_SECRET=4e2f7a09b1d8d6a7a5b1239c38e9d28b2cda9e2cc6e0e9ef12e6cc0fd5d8f4e9

# Redis
REDIS_URL=redis://localhost:6379

# Google OAuth (??i sang credentials M?I!)
GOOGLE_CLIENT_ID=your-new-client-id
GOOGLE_CLIENT_SECRET=your-new-client-secret
GOOGLE_CALLBACK_URL=http://165.227.101.102/auth/google/callback

# Azure Storage (??i sang key M?I!)
AZURE_STORAGE_CONNECTION_STRING="your-new-connection-string"
AZURE_STORAGE_CONTAINER="puugoo"

# TTS API (??i sang key M?I!)
TTS_API_KEY=your-new-api-key

# RapidAPI
RAPIDAPI_KEY=e92a84b2e8msh4a75fb8d7498c48p1f34e4jsn9b18ebfa368f
```

**L?u file:** `Ctrl+X`, `Y`, `Enter`

### **B??c 3: Cài ??t dependencies**

```bash
cd ~/vocapro
npm install
npx prisma generate
```

### **B??c 4: ??y database schema**

```bash
npx prisma db push
```

### **B??c 5: C?u hình Nginx**

```bash
# T?o config m?i
sudo nano /etc/nginx/sites-available/vocapro
```

Paste n?i dung:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 165.227.101.102;

    access_log /var/log/nginx/vocapro-access.log;
    error_log /var/log/nginx/vocapro-error.log;

    client_max_body_size 10M;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /root/vocapro/uploads;
        expires 30d;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
```

**L?u và enable:**

```bash
# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Enable VocaPro
sudo ln -sf /etc/nginx/sites-available/vocapro /etc/nginx/sites-enabled/

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

### **B??c 6: Start ?ng d?ng v?i PM2**

```bash
cd ~/vocapro

# Stop old process
pm2 delete vocapro 2>/dev/null || true

# Start
pm2 start ecosystem.config.js --env production

# Save
pm2 save

# Setup startup
pm2 startup
# Copy và ch?y l?nh mà PM2 tr? v?
```

### **B??c 7: Ki?m tra**

```bash
# Xem PM2 status
pm2 status

# Xem logs
pm2 logs vocapro --lines 50

# Test port 3000
curl http://localhost:3000/health

# Test Nginx
curl http://165.227.101.102/health
```

---

## ?? Troubleshooting

### **1. PM2 process không ch?y**

```bash
# Xem logs
pm2 logs vocapro

# Restart
pm2 restart vocapro

# N?u l?i, start l?i
pm2 delete vocapro
pm2 start src/server.js --name vocapro
```

### **2. Database connection l?i**

```bash
# Test database connection
npx prisma db pull

# N?u l?i, ki?m tra DATABASE_URL trong .env
nano .env
```

### **3. Port 3000 b? chi?m**

```bash
# Ki?m tra process ?ang dùng port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### **4. Nginx 502 Bad Gateway**

```bash
# Ki?m tra PM2
pm2 status

# Restart app
pm2 restart vocapro

# Xem logs
pm2 logs vocapro
tail -f /var/log/nginx/vocapro-error.log
```

### **5. Xem t?t c? logs**

```bash
# PM2 logs
pm2 logs vocapro

# Nginx access log
sudo tail -f /var/log/nginx/vocapro-access.log

# Nginx error log
sudo tail -f /var/log/nginx/vocapro-error.log

# Application logs
tail -f ~/vocapro/logs/combined.log
```

---

## ? Checklist Hoàn Thành

- [ ] SSH vào VPS thành công
- [ ] Code ?ã ???c pull m?i nh?t
- [ ] File `.env` ?ã ???c t?o và c?u hình
- [ ] Dependencies ?ã ???c cài (`npm install`)
- [ ] Prisma client ?ã ???c generate
- [ ] Database schema ?ã ???c push
- [ ] Nginx config ?ã ???c t?o và enabled
- [ ] PM2 ?ang ch?y ?ng d?ng (`pm2 status` show "online")
- [ ] Port 3000 ?ang ???c s? d?ng (`lsof -i :3000`)
- [ ] Health check OK: `curl http://localhost:3000/health`
- [ ] Website ho?t ??ng: http://165.227.101.102

---

## ?? K?t Qu? Mong ??i

Khi truy c?p **http://165.227.101.102**, b?n s? th?y:
- ? Trang login c?a VocaPro
- ? KHÔNG còn th?y "Welcome to nginx!"

---

## ?? N?u V?n Không Ho?t ??ng

Ch?y debug script và g?i k?t qu?:

```bash
cd ~/vocapro
bash debug-vps.sh > debug-output.txt
cat debug-output.txt
```

Ki?m tra các ?i?u sau:
1. PM2 process có status "online" không?
2. Port 3000 có ?ang ???c s? d?ng không?
3. Nginx config có l?i không? (`sudo nginx -t`)
4. Database connection có OK không?
5. Logs có l?i gì không?
