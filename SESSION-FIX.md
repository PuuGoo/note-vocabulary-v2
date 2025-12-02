# ?? Login Redirect Issue - Session/Cookie Fix

## V?n ??

??ng nh?p thành công nh?ng b? v?ng ra trang login ngay l?p t?c.

**Nguyên nhân:**
- Session cookie có `secure: true` (ch? ho?t ??ng v?i HTTPS)
- VPS ?ang dùng HTTP (không có SSL)
- Browser không l?u cookie ? b? logout ngay

---

## ? Gi?i Pháp Nhanh (30 Giây)

### **Ch?y trên VPS:**

```bash
cd /root/vocapro
git pull origin main
chmod +x fix-session.sh
bash fix-session.sh
```

Script s?:
1. ? Pull code m?i (?ã fix session config)
2. ? Install dependencies
3. ? Restart ?ng d?ng
4. ? Test

---

## ?? Thay ??i ?ã Làm

**File `src/server.js`:**

### **TR??C (L?i):**
```javascript
cookie: {
  secure: process.env.NODE_ENV === 'production', // ? true khi production
  httpOnly: true,
  maxAge: 24 * 60 * 60 * 1000,
}
```

**V?n ??:** `secure: true` yêu c?u HTTPS, nh?ng b?n dùng HTTP.

### **SAU (Fixed):**
```javascript
cookie: {
  secure: false,        // ? Ho?t ??ng v?i HTTP
  httpOnly: true,       // ? B?o m?t: không truy c?p t? JS
  maxAge: 24 * 60 * 60 * 1000,  // ? 24 gi?
  sameSite: 'lax',      // ? Ch?ng CSRF
}
```

---

## ?? Test Sau Khi Fix

### **1. M? browser:**
```
http://165.227.101.102
```

### **2. ??ng nh?p:**
- Email + Password
- Ho?c Google OAuth

### **3. Ki?m tra:**
- ? Sau khi login, KHÔNG b? v?ng v? trang login
- ? Redirect ??n dashboard thành công
- ? Cookie ???c l?u trong browser

### **4. Ki?m tra cookie trong DevTools:**
1. M? DevTools (F12)
2. Tab **Application** ? **Cookies**
3. Xem cookie `connect.sid`:
   - ? `Secure: No` (vì dùng HTTP)
   - ? `HttpOnly: Yes`
   - ? `SameSite: Lax`

---

## ?? V? B?o M?t

### **Hi?n t?i (HTTP):**
```
secure: false  // Cookie g?i qua HTTP (không mã hóa)
```

**R?i ro:** Cookie có th? b? ?ánh c?p qua man-in-the-middle.

### **Nên dùng HTTPS (Khuy?n ngh?):**

Khi có domain và SSL:
```javascript
secure: process.env.NODE_ENV === 'production' // true v?i HTTPS
```

**Setup SSL mi?n phí:**
```bash
# C?n có domain tr??c
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## ?? Ho?c Fix Th? Công

### **Trên VPS:**

```bash
# 1. Pull code
cd /root/vocapro
git pull origin main

# 2. Restart
pm2 restart vocapro

# 3. Check logs
pm2 logs vocapro --lines 50

# 4. Test
curl -I http://localhost:3000/health
```

---

## ?? K?t Qu? Mong ??i

### **Tr??c Fix:**
1. ??ng nh?p ? thành công
2. Redirect ? dashboard
3. **B? LOGOUT NGAY** ? quay v? login ?

### **Sau Fix:**
1. ??ng nh?p ? thành công
2. Redirect ? dashboard
3. **V?N ??NG NH?P** ? s? d?ng bình th??ng ?

---

## ?? Debug N?u V?n L?i

### **1. Check PM2 logs:**
```bash
pm2 logs vocapro --lines 100
```

### **2. Check session trong code:**
Thêm log ?? debug:
```javascript
// Trong routes/auth.js
console.log('Session after login:', req.session);
console.log('User:', req.user);
```

### **3. Clear browser cache:**
- Ctrl + Shift + Delete
- Xóa cookies c?a `165.227.101.102`
- Th? login l?i

### **4. Test v?i Incognito:**
- M? c?a s? ?n danh
- Th? login
- N?u OK ? v?n ?? là cache

---

## ? Checklist

- [ ] `git pull origin main` - Pull code m?i
- [ ] `pm2 restart vocapro` - Restart app
- [ ] Clear browser cache/cookies
- [ ] Test login t?i http://165.227.101.102
- [ ] Login thành công và KHÔNG b? logout
- [ ] Dashboard hi?n th? ?úng
- [ ] Session cookie có `Secure: No`

---

## ?? L?u Ý Quan Tr?ng

### **T?i sao `secure: false`?**
- Vì b?n ?ang dùng **HTTP** (không ph?i HTTPS)
- Cookie v?i `secure: true` ch? g?i qua HTTPS
- HTTP + `secure: true` = Cookie không ???c l?u = Logout ngay

### **Khi nào dùng `secure: true`?**
- Khi có **SSL certificate** (HTTPS)
- Production v?i domain + Certbot
- B?o m?t cao h?n

### **Hi?n t?i:**
- ? Dùng `secure: false` ?? app ho?t ??ng
- ?? C?n setup SSL sau ?? b?o m?t t?t h?n
- ? `httpOnly: true` v?n ch?ng XSS
- ? `sameSite: 'lax'` v?n ch?ng CSRF

---

**Ch?y script fix và test login ngay! ??**
