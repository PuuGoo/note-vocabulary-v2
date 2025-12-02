# Quick VPS Deployment Commands

## ?? L?n ??u Deploy

```bash
# 1. SSH vào VPS
ssh your-username@your-vps-ip

# 2. Clone repository
cd ~
git clone https://github.com/PuuGoo/note-vocabulary-v2.git vocapro
cd vocapro

# 3. Ch?y auto-deploy script
chmod +x deploy-vps.sh
bash deploy-vps.sh

# 4. C?u hình .env file
nano .env
# ?i?n thông tin DATABASE_URL, SESSION_SECRET, etc.

# 5. Push database và restart
npx prisma db push
pm2 restart vocapro
```

## ?? Update Code M?i

```bash
cd ~/vocapro
git pull origin main
npm run deploy
```

## ?? Monitoring

```bash
# Xem status
pm2 status

# Xem logs
pm2 logs vocapro --lines 100

# Monitor realtime
pm2 monit
```

## ?? C?u Hình Nginx

```bash
# Edit domain trong nginx config
sudo nano /etc/nginx/sites-available/vocapro

# Thay ??i: server_name yourdomain.com;
# Thành: server_name your-actual-domain.com;

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

## ?? Setup SSL (N?u có domain)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## ??? Các L?nh H?u Ích

```bash
# PM2
pm2 restart vocapro    # Restart app
pm2 stop vocapro       # Stop app
pm2 logs vocapro       # Xem logs
pm2 monit              # Monitor

# Nginx
sudo systemctl reload nginx   # Reload config
sudo nginx -t                 # Test config
sudo systemctl status nginx   # Status

# Redis
sudo systemctl status redis-server
redis-cli ping

# Database
npx prisma studio              # Open Prisma Studio
npx prisma db push             # Push schema changes
```

## ?? Troubleshooting

```bash
# App không ch?y
pm2 logs vocapro

# Nginx error
sudo tail -f /var/log/nginx/vocapro-error.log

# Ki?m tra port
sudo lsof -i :3000

# Restart t?t c?
pm2 restart vocapro
sudo systemctl restart nginx
```

## ?? Environment Variables (.env)

```env
DATABASE_URL="sqlserver://user:pass@server.database.windows.net:1433;database=dbname;encrypt=true"
NODE_ENV=production
PORT=3000
BASE_URL=http://your-domain.com
SESSION_SECRET=your-random-secret-key
REDIS_URL=redis://localhost:6379
```
