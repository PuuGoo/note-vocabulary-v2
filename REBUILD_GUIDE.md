# VocaPro - Complete Rebuild Guide

Hướng dẫn chi tiết để xây dựng lại dự án VocaPro từ đầu với kiến trúc tách biệt Backend và Frontend, sử dụng ES6 Modules.

---

## 📋 Table of Contents

- [Part 0: Giải Thích Chi Tiết Kiến Trúc](#part-0-giải-thích-chi-tiết-kiến-trúc)
- [Part 1: Backend Setup (ES6 Modules)](#part-1-backend-setup-es6-modules)
- [Part 2: Frontend Setup (ES6)](#part-2-frontend-setup-es6)
- [Part 3: Deployment](#part-3-deployment)

---

# Part 0: Giải Thích Chi Tiết Kiến Trúc

## 🏗️ Tổng Quan Kiến Trúc

VocaPro được xây dựng theo mô hình **Client-Server** với kiến trúc **3-tier**:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (Frontend - Vanilla JavaScript ES6 Modules)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Login UI │  │Dashboard │  │ Vocab UI │  │ Review UI│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│       │              │              │              │        │
│       └──────────────┴──────────────┴──────────────┘        │
│                          │                                   │
│                    Fetch API (HTTP)                         │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                     │
│           (Backend - Node.js + Express)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Express Middleware Stack                │   │
│  │  ┌───────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Helmet │→│  CORS   │→│ Session  │→│ Passport │   │   │
│  │  └───────┘ └─────────┘ └──────────┘ └──────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                Route Handlers                        │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │  Auth  │ │ Vocab  │ │ Review │ │  Tags  │       │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                    DATA ACCESS LAYER                        │
│            (Prisma ORM + SQL Server)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Prisma Client                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  User   │ │  Vocab  │ │ Review  │ │   Tag   │   │   │
│  │  │ Model   │ │  Model  │ │  Model  │ │  Model  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          │                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         Azure SQL Server Database                    │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │   │
│  │  │ users  │ │vocabs  │ │reviews │ │  tags  │       │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow (Chi tiết từng bước)

### Example: User Login Request

```
1. USER ACTION (Frontend)
   ├─ User nhập email & password vào form
   ├─ Click button "Login"
   └─ JavaScript event listener bắt submit event

2. FRONTEND PROCESSING (public/js/auth.js)
   ├─ e.preventDefault() - Ngăn form submit mặc định
   ├─ Lấy data từ form: { email, password }
   ├─ Validate input (email format, password length)
   └─ Gọi API: APIClient.post('/auth/login', data)

3. HTTP REQUEST
   ├─ Method: POST
   ├─ URL: http://localhost:3000/auth/login
   ├─ Headers:
   │   ├─ Content-Type: application/json
   │   └─ Cookie: connect.sid=... (nếu có)
   └─ Body: { "email": "user@gmail.com", "password": "123456" }

4. BACKEND MIDDLEWARE STACK (src/server.js)
   ├─ helmet() - Thêm security headers
   ├─ cors() - Check origin, allow credentials
   ├─ express.json() - Parse JSON body
   ├─ session() - Load session từ cookie
   └─ passport.initialize() - Setup authentication

5. ROUTE HANDLER (src/routes/auth.js)
   ├─ Match route: POST /auth/login
   ├─ Run validation middleware (email, password)
   └─ Execute handler:
       ├─ passport.authenticate('local')
       └─ Call LocalStrategy

6. AUTHENTICATION STRATEGY (src/config/passport.js)
   ├─ LocalStrategy callback executed:
   │   ├─ Nhận email & password từ request
   │   ├─ Query database: prisma.user.findUnique({ email })
   │   ├─ Check user exists
   │   ├─ Check user có password không (không phải Google login)
   │   ├─ bcrypt.compare(password, user.passwordHash)
   │   └─ Return done(null, user) hoặc done(null, false)
   └─ passport.serializeUser(user) - Lưu user.id vào session

7. DATABASE QUERY (Prisma → SQL Server)
   ├─ Prisma generates SQL:
   │   SELECT id, email, passwordHash, name, role
   │   FROM users
   │   WHERE email = @P1
   ├─ Execute query on Azure SQL Server
   └─ Return result to Prisma Client

8. RESPONSE GENERATION
   ├─ If success:
   │   ├─ req.login(user) - Create session
   │   ├─ Session saved to database/memory
   │   └─ Return: { message: 'Login successful', user: {...} }
   └─ If failure:
       └─ Return: { error: 'Invalid credentials' } (401)

9. HTTP RESPONSE
   ├─ Status: 200 OK (or 401 Unauthorized)
   ├─ Headers:
   │   ├─ Set-Cookie: connect.sid=xxxxx; HttpOnly; Secure
   │   └─ Content-Type: application/json
   └─ Body: { "message": "Login successful", "user": {...} }

10. FRONTEND PROCESSING (Callback)
    ├─ fetch() promise resolved
    ├─ Check response.ok
    ├─ Parse JSON: response.json()
    ├─ Show toast: "Login successful!"
    └─ Redirect: window.location.href = '/dashboard.html'
```

## 📊 Database Schema Explained (Chi tiết từng bảng)

### **Table: users**

```sql
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY,           -- UUID, phải generate manual
  email NVARCHAR(255) UNIQUE NOT NULL,       -- Email đăng nhập
  name NVARCHAR(255),                        -- Tên hiển thị
  passwordHash NVARCHAR(255),                -- Bcrypt hash, NULL nếu Google login
  role NVARCHAR(50) DEFAULT 'USER',          -- USER hoặc ADMIN
  settings NVARCHAR(MAX),                    -- JSON string cho preferences
  googleId NVARCHAR(255),                    -- ID từ Google OAuth, có thể NULL
  emailVerified BIT DEFAULT 0,               -- 1 nếu verified
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_googleId ON users(googleId);  -- Không UNIQUE!
```

**Giải thích các trường:**

- **id**: UUID (Universally Unique Identifier)

  - SQL Server không auto-generate → phải dùng `randomUUID()` trong code
  - Format: `550e8400-e29b-41d4-a716-446655440000`

- **passwordHash**: Bcrypt hashed password

  - Input: `"mypassword123"`
  - Output: `"$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"`
  - 10 rounds = 2^10 iterations (cân bằng security/performance)
  - Nullable vì user đăng nhập Google không cần password

- **googleId**: ID từ Google OAuth

  - Format: `"102938475629384756293"`
  - Nullable vì user đăng ký bằng email không có
  - **KHÔNG UNIQUE** vì SQL Server không cho nhiều NULL trong UNIQUE constraint

- **settings**: JSON string
  - Example: `{"theme": "dark", "language": "vi", "notifications": true}`
  - Lưu dạng NVARCHAR(MAX) vì SQL Server không hỗ trợ JSON type tốt

### **Table: vocabularies**

```sql
CREATE TABLE vocabularies (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  userId UNIQUEIDENTIFIER NOT NULL,          -- Foreign key đến users
  word NVARCHAR(255) NOT NULL,               -- Từ vựng (vd: "elaborate")
  definition NVARCHAR(MAX) NOT NULL,         -- Định nghĩa
  example NVARCHAR(MAX),                     -- Câu ví dụ
  pronunciation NVARCHAR(255),               -- Phiên âm (vd: "/ɪˈlæb.ə.reɪt/")
  partOfSpeech NVARCHAR(50),                 -- Loại từ (verb, noun, adj)
  difficulty INT DEFAULT 1,                  -- 1-5 (dễ → khó)
  imageUrl NVARCHAR(500),                    -- Link ảnh minh họa
  audioUrl NVARCHAR(500),                    -- Link file mp3
  createdAt DATETIME2 DEFAULT GETDATE(),
  updatedAt DATETIME2 DEFAULT GETDATE(),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_vocabs_userId ON vocabularies(userId);
CREATE INDEX idx_vocabs_word ON vocabularies(word);
```

**Cascade Delete:**

```
User deleted → All vocabularies của user đó tự động xóa
```

### **Table: reviews (Spaced Repetition Algorithm)**

```sql
CREATE TABLE reviews (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  userId UNIQUEIDENTIFIER NOT NULL,
  vocabularyId UNIQUEIDENTIFIER NOT NULL,
  easeFactor FLOAT DEFAULT 2.5,              -- Hệ số độ dễ (1.3 - 2.5)
  interval INT DEFAULT 0,                    -- Khoảng cách review (ngày)
  repetitions INT DEFAULT 0,                 -- Số lần ôn thành công liên tiếp
  nextReview DATETIME2 NOT NULL,             -- Ngày review tiếp theo
  lastReviewed DATETIME2,                    -- Lần review cuối
  quality INT,                               -- 0-5 (độ tự tin khi trả lời)
  createdAt DATETIME2 DEFAULT GETDATE(),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vocabularyId) REFERENCES vocabularies(id) ON DELETE CASCADE,
  UNIQUE (userId, vocabularyId)              -- Mỗi user chỉ có 1 review/vocab
);
```

**SM-2 Algorithm (Spaced Repetition):**

```javascript
function calculateNextReview(quality, easeFactor, interval, repetitions) {
  // quality: 0-5
  // 0-2: Quên, reset
  // 3-5: Nhớ, tăng interval

  if (quality < 3) {
    // Quên → reset
    return {
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      interval: 0,
      repetitions: 0,
      nextReview: new Date(), // Review lại ngay
    };
  }

  // Nhớ → tăng interval
  const newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  let newInterval;
  if (repetitions === 0) {
    newInterval = 1; // 1 ngày
  } else if (repetitions === 1) {
    newInterval = 6; // 6 ngày
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  return {
    easeFactor: Math.max(1.3, newEaseFactor),
    interval: newInterval,
    repetitions: repetitions + 1,
    nextReview: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
  };
}
```

**Example Timeline:**

```
Day 0:  Learn "elaborate" → Schedule review in 1 day
Day 1:  Review (quality=4) → Schedule in 6 days
Day 7:  Review (quality=5) → Schedule in 15 days (6 * 2.5)
Day 22: Review (quality=3) → Schedule in 37 days (15 * 2.5)
Day 59: Review (quality=2) → RESET → Schedule in 1 day
```

### **Table: tags**

```sql
CREATE TABLE tags (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  userId UNIQUEIDENTIFIER NOT NULL,
  name NVARCHAR(100) NOT NULL,               -- Tên tag (vd: "IELTS", "Business")
  color NVARCHAR(7),                         -- Hex color (vd: "#3B82F6")
  createdAt DATETIME2 DEFAULT GETDATE(),

  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (userId, name)                      -- User không tạo tag trùng tên
);
```

**Many-to-Many Relationship:**

```
vocabularies ←→ tags (through junction table)

1 vocab có nhiều tags: "elaborate" → ["IELTS", "Academic", "Writing"]
1 tag áp dụng cho nhiều vocabs: "IELTS" → ["elaborate", "crucial", "significant"]
```

## 🔐 Authentication Flow (Chi tiết)

### **Local Authentication (Email + Password)**

```javascript
// 1. User Registration
POST /auth/register
Body: { email, password, name }

Backend Process:
├─ Validate input (email format, password >= 8 chars)
├─ Check email exists: prisma.user.findUnique({ email })
├─ Hash password: bcrypt.hash(password, 10)
│   Input:  "mypassword123"
│   Output: "$2b$10$..."
├─ Generate UUID: randomUUID()
├─ Create user: prisma.user.create({
│     id: uuid,
│     email: email.toLowerCase(),
│     passwordHash: hashedPassword,
│     name
│   })
├─ Auto login: req.login(user)
└─ Return: { message: "Registration successful", user }

// 2. User Login
POST /auth/login
Body: { email, password }

Backend Process:
├─ passport.authenticate('local')
├─ LocalStrategy:
│   ├─ Find user: prisma.user.findUnique({ email })
│   ├─ Check user.passwordHash exists
│   ├─ Compare: bcrypt.compare(password, user.passwordHash)
│   │   ├─ Extract salt từ hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
│   │   ├─ Hash input với salt đó
│   │   └─ So sánh 2 hash
│   └─ Return user hoặc false
├─ If success: req.login(user)
│   ├─ passport.serializeUser: Save user.id to session
│   ├─ Session stored in database/memory
│   └─ Set-Cookie: connect.sid=xxxxx
└─ Return: { message: "Login successful", user }
```

**Session Storage:**

```javascript
// In-memory (Development)
req.session = {
  passport: {
    user: "550e8400-e29b-41d4-a716-446655440000" // user.id
  }
}

// Database (Production)
sessions table:
{
  sid: "s:abc123.xyz...",
  userId: "550e8400-e29b-41d4-a716-446655440000",
  expiresAt: "2025-11-09T00:00:00.000Z",
  data: '{"passport":{"user":"550e8400-..."}}'
}
```

### **Google OAuth 2.0 Flow**

```
1. User clicks "Login with Google"
   Frontend: <a href="/auth/google">

2. Backend redirects to Google
   ├─ URL: https://accounts.google.com/o/oauth2/v2/auth
   ├─ Params:
   │   ├─ client_id=your-client-id
   │   ├─ redirect_uri=http://localhost:3000/auth/google/callback
   │   ├─ scope=profile email
   │   └─ response_type=code
   └─ User thấy màn hình "Choose Google Account"

3. User chọn account và cho phép
   Google redirects back với code:
   http://localhost:3000/auth/google/callback?code=4/0AX...

4. Backend exchanges code for token
   ├─ POST https://oauth2.googleapis.com/token
   ├─ Body: { code, client_id, client_secret, redirect_uri }
   └─ Response: { access_token, id_token }

5. Backend gets user profile
   ├─ GET https://www.googleapis.com/oauth2/v2/userinfo
   ├─ Header: Authorization: Bearer {access_token}
   └─ Response: {
       id: "102938475629384756293",
       email: "user@gmail.com",
       name: "John Doe",
       picture: "https://..."
     }

6. GoogleStrategy callback
   ├─ Find user: prisma.user.findUnique({ googleId: profile.id })
   ├─ If not found:
   │   ├─ Check email exists: findUnique({ email })
   │   ├─ If exists: Update googleId
   │   └─ Else: Create new user with googleId
   ├─ req.login(user)
   └─ Redirect to /dashboard
```

## 🛠️ Middleware Stack (Chi tiết từng layer)

### **1. Security Middleware (Helmet)**

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

**Headers được thêm:**

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
```

**Bảo vệ khỏi:**

- XSS (Cross-Site Scripting)
- Clickjacking
- MIME-type sniffing
- Man-in-the-middle attacks

### **2. CORS Middleware**

```javascript
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:3000', 'https://vocapro.onrender.com'];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Cho phép gửi cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Response Headers:**

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: Content-Type,Authorization
```

### **3. Session Middleware**

```javascript
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Dùng để sign session ID
    resave: false, // Không save nếu session không thay đổi
    saveUninitialized: false, // Không save session rỗng
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production', // HTTPS only
      httpOnly: true, // Không cho JavaScript đọc
      sameSite: 'lax', // CSRF protection
    },
    store: new PrismaSessionStore(prisma), // Save to database
  })
);
```

**Cookie Structure:**

```
connect.sid=s%3Aj8fH2K...  // Signed cookie
  ├─ Signature: j8fH2K... (HMAC-SHA256 with SESSION_SECRET)
  └─ SessionID: abc123...

Session Data in Database:
{
  sid: "abc123...",
  data: {
    passport: { user: "550e8400-..." },
    lastActivity: "2025-11-08T10:30:00.000Z"
  },
  expiresAt: "2025-11-09T10:30:00.000Z"
}
```

### **4. Passport Middleware**

```javascript
app.use(passport.initialize());
app.use(passport.session());

// Deserialize on every request
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});
```

**Request Processing:**

```
1. Request arrives with cookie: connect.sid=...
2. session middleware loads session from database
3. passport.session() reads session.passport.user (user ID)
4. deserializeUser() queries database to get full user object
5. req.user = { id, email, name, role, ... }
6. Route handler can access req.user
```

## 📦 ES6 Modules vs CommonJS

### **Sự khác biệt:**

```javascript
// CommonJS (Old - Node.js default)
const express = require('express');
const bcrypt = require('bcryptjs');

module.exports = function (app) {
  // ...
};

// ES6 Modules (Modern)
import express from 'express';
import bcrypt from 'bcryptjs';

export default function (app) {
  // ...
}

export { helperFunction, CONSTANT };
```

### **Ưu điểm ES6 Modules:**

- ✅ Static analysis (IDE autocomplete tốt hơn)
- ✅ Tree-shaking (loại bỏ code không dùng)
- ✅ Async loading (import() dynamic)
- ✅ Named exports + default export
- ✅ Browser native support

### **Setup ES6 trong Node.js:**

```json
// package.json
{
  "type": "module", // ← Enable ES6 modules
  "scripts": {
    "start": "node src/server.js"
  }
}
```

**File extensions:**

- `.js` → ES6 modules (nếu `"type": "module"`)
- `.mjs` → ES6 modules (luôn luôn)
- `.cjs` → CommonJS (luôn luôn)

---

# Part 1: Backend Setup (ES6 Modules)

## 1.1. Initial Setup

### Tạo project structure

```bash
mkdir vocapro-backend
cd vocapro-backend
npm init -y
```

### Cài đặt dependencies

```bash
# Core dependencies
npm install express dotenv cors helmet morgan
npm install express-session express-rate-limit
npm install passport passport-local passport-google-oauth20
npm install bcryptjs
npm install @prisma/client
npm install csv-parser multer
npm install node-fetch swagger-jsdoc swagger-ui-express
npm install winston

# Dev dependencies
npm install -D nodemon prisma eslint jest supertest
```

---

## 📚 Giải Thích Chi Tiết Từng Thư Viện

### **1. Core Framework & Server**

#### **express** (^4.18.2)

```javascript
import express from 'express';
const app = express();
```

**Mục đích:**

- Web framework cho Node.js, xây dựng RESTful API
- Quản lý routing (GET, POST, PUT, DELETE)
- Middleware pipeline (xử lý request theo thứ tự)
- Serve static files (HTML, CSS, JS)

**Ví dụ sử dụng:**

```javascript
// Routing
app.get('/api/vocab', (req, res) => {
  res.json({ vocabs: [...] });
});

// Middleware
app.use(express.json()); // Parse JSON body
app.use('/public', express.static('public')); // Serve static files
```

**Tại sao cần:** Nền tảng để xây dựng API server, không có Express phải viết HTTP server từ đầu với module `http` native (phức tạp hơn nhiều).

---

#### **dotenv** (^16.3.1)

```javascript
import 'dotenv/config';
// hoặc
import dotenv from 'dotenv';
dotenv.config();
```

**Mục đích:**

- Load biến môi trường từ file `.env` vào `process.env`
- Quản lý configuration theo environment (dev/production)
- Bảo mật: Không commit secrets vào Git

**File `.env`:**

```env
DATABASE_URL="sqlserver://..."
SESSION_SECRET="super-secret-key"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
```

**Sử dụng:**

```javascript
const dbUrl = process.env.DATABASE_URL;
const port = process.env.PORT || 3000;
```

**Tại sao cần:** Production và development có config khác nhau (database URL, API keys). Không thể hardcode vào code được.

---

### **2. Security & Middleware**

#### **helmet** (^7.1.0)

```javascript
import helmet from 'helmet';
app.use(helmet());
```

**Mục đích:**

- Thêm security HTTP headers tự động
- Bảo vệ khỏi các tấn công phổ biến (XSS, clickjacking, MIME sniffing)

**Headers được thêm:**

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

**Bảo vệ khỏi:**

- **XSS (Cross-Site Scripting):** Inject JavaScript vào trang
- **Clickjacking:** Embed trang trong iframe để lừa user click
- **MIME Sniffing:** Browser đoán sai content type

**Tại sao cần:** Security best practice, bắt buộc cho production app.

---

#### **cors** (^2.8.5)

```javascript
import cors from 'cors';
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);
```

**Mục đích:**

- Cho phép frontend (domain khác) gọi API
- CORS = Cross-Origin Resource Sharing

**Vấn đề nếu không có:**

```javascript
// Frontend: http://localhost:5173
fetch('http://localhost:3000/api/vocab');

// Browser block:
// ❌ Access to fetch at 'http://localhost:3000/api/vocab'
//    from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Config chi tiết:**

```javascript
app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = ['http://localhost:3000', 'https://vocapro.com'];
      if (allowed.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Cho phép gửi cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

**Tại sao cần:** Frontend và backend thường ở domain khác nhau (SPA architecture).

---

#### **morgan** (^1.10.0)

```javascript
import morgan from 'morgan';
app.use(morgan('combined'));
```

**Mục đích:**

- HTTP request logger
- Log mọi request vào server (method, URL, status, response time)

**Output example:**

```
::1 - - [08/Nov/2025:10:30:45 +0000] "POST /auth/login HTTP/1.1" 200 156 "-" "Mozilla/5.0..."
::1 - - [08/Nov/2025:10:30:47 +0000] "GET /api/vocab HTTP/1.1" 200 2435 "-" "Mozilla/5.0..."
```

**Formats:**

- `'dev'` - Compact, colorized (cho development)
- `'combined'` - Apache combined log format (cho production)
- `'tiny'` - Minimal output

**Tại sao cần:** Debug requests, monitor performance, audit logs.

---

#### **express-rate-limit** (^7.1.5)

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);
```

**Mục đích:**

- Giới hạn số requests từ 1 IP
- Chống brute-force attacks, DDoS

**Example scenarios:**

```javascript
// Login endpoint - max 5 attempts per 15 mins
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes'
});
app.post('/auth/login', loginLimiter, ...);

// API endpoint - max 100 requests per hour
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false
});
app.use('/api/', apiLimiter);
```

**Headers returned:**

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1699448400
```

**Tại sao cần:** Bảo vệ server khỏi abuse, đặc biệt login/register endpoints.

---

### **3. Authentication & Security**

#### **express-session** (^1.17.3)

```javascript
import session from 'express-session';

app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: true, // HTTPS only
      httpOnly: true, // Not accessible via JavaScript
    },
  })
);
```

**Mục đích:**

- Quản lý user sessions (lưu trạng thái login)
- Lưu session data giữa các requests

**Flow:**

```
1. User login → Server tạo session
2. Server lưu session (memory/database/redis)
3. Server gửi cookie về client: connect.sid=abc123
4. Mọi request sau client gửi cookie
5. Server đọc cookie → load session → biết user đã login
```

**Session data structure:**

```javascript
req.session = {
  cookie: {
    originalMaxAge: 86400000,
    expires: '2025-11-09T10:00:00.000Z',
    secure: true,
    httpOnly: true,
    path: '/',
  },
  passport: {
    user: '550e8400-e29b-41d4-a716-446655440000',
  },
};
```

**Tại sao cần:** HTTP stateless → cần mechanism để nhớ user đã login (không cần login lại mỗi request).

---

#### **passport** (^0.7.0)

```javascript
import passport from 'passport';

app.use(passport.initialize());
app.use(passport.session());
```

**Mục đích:**

- Authentication middleware cho Node.js
- Hỗ trợ nhiều strategies (Local, Google, Facebook, JWT, etc.)
- Serialize/deserialize user vào session

**Strategies:**

```javascript
// Local Strategy (Email + Password)
import { Strategy as LocalStrategy } from 'passport-local';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
    },
    async (email, password, done) => {
      const user = await findUser(email);
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (isValid) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    }
  )
);

// Google OAuth Strategy
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await findOrCreateUser(profile);
      return done(null, user);
    }
  )
);
```

**Serialize/Deserialize:**

```javascript
// Save user ID to session (lightweight)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Load full user from database on each request
passport.deserializeUser(async (id, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});
```

**Tại sao cần:** Xử lý authentication logic phức tạp, hỗ trợ nhiều phương thức đăng nhập.

---

#### **passport-local** (^1.0.0)

**Mục đích:** Strategy cho email/password authentication

#### **passport-google-oauth20** (^2.0.0)

**Mục đích:** Strategy cho Google OAuth 2.0 (Login with Google)

**Google OAuth Flow:**

```
1. User click "Login with Google"
2. Redirect to Google: /auth/google
3. Google login screen
4. User approves
5. Google redirect back: /auth/google/callback?code=xxx
6. Exchange code for access_token
7. Get user profile from Google
8. Create/update user in database
9. Login user
```

---

#### **bcryptjs** (^2.4.3)

```javascript
import bcrypt from 'bcryptjs';

// Hash password
const password = 'Password123';
const hash = await bcrypt.hash(password, 10); // 10 rounds
// Result: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Verify password
const isValid = await bcrypt.compare('Password123', hash);
// true
```

**Mục đích:**

- Hash passwords securely
- Không lưu plain text password vào database
- Slow hashing → chống brute-force

**How it works:**

```
1. Generate salt (random string)
   Salt: "$2b$10$N9qo8uLOickgx2ZMRZoMye"

2. Combine password + salt
   "Password123" + "$2b$10$N9qo8uLOickgx2ZMRZoMye"

3. Hash 2^10 times (1024 iterations)
   Result: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
                └─┬─┘ └─┬┘ └──────────┬─────────┘ └──────────┬────────┘
             Algorithm Rounds    Salt (22 chars)    Hash (31 chars)
```

**Tại sao cần:** Security best practice, bắt buộc hash passwords. NEVER store plain text.

---

### **4. Database & ORM**

#### **@prisma/client** (^5.22.0)

```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Query database
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

const vocabs = await prisma.vocabulary.findMany({
  where: { userId: user.id },
  include: { tags: true },
});
```

**Mục đích:**

- ORM (Object-Relational Mapping) cho Node.js
- Type-safe database queries (TypeScript support)
- Auto-generated query builder từ schema
- Migration management

**Advantages:**

```javascript
// ✅ Prisma (clean, type-safe)
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John',
  },
});

// ❌ Raw SQL (prone to SQL injection, no type safety)
const result = await db.query(`INSERT INTO users (email, name) VALUES ('${email}', '${name}')`);
```

**Schema definition:**

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String?

  vocabularies Vocabulary[]
}

model Vocabulary {
  id     String @id @default(uuid())
  userId String
  word   String

  user User @relation(fields: [userId], references: [id])
}
```

**Tại sao cần:** Làm việc với database dễ dàng, type-safe, tránh SQL injection.

---

#### **prisma** (^5.22.0) - DevDependency

**Mục đích:**

- Prisma CLI tool
- Generate client: `npx prisma generate`
- Database migrations: `npx prisma migrate dev`
- Prisma Studio: `npx prisma studio` (GUI database browser)

---

### **5. File Processing**

#### **multer** (^1.4.5-lts.1)

```javascript
import multer from 'multer';

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files allowed'));
    }
  },
});

app.post('/api/import', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  // Process file...
});
```

**Mục đích:**

- Handle file uploads trong Express
- Parse `multipart/form-data`
- Validate file type, size

**Storage options:**

```javascript
// Disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

// Memory storage (Buffer)
const memoryStorage = multer.memoryStorage();
```

**Tại sao cần:** Import CSV files, upload images cho vocabulary.

---

#### **csv-parser** (^3.0.0)

```javascript
import fs from 'fs';
import csv from 'csv-parser';

const results = [];

fs.createReadStream('vocabs.csv')
  .pipe(csv())
  .on('data', (row) => {
    results.push({
      word: row.word,
      definition: row.definition,
      example: row.example,
    });
  })
  .on('end', () => {
    console.log(`Parsed ${results.length} vocabularies`);
  });
```

**Mục đích:**

- Parse CSV files thành JavaScript objects
- Stream processing (memory efficient cho file lớn)

**CSV format:**

```csv
word,definition,example,difficulty
elaborate,Add more detail,"Please elaborate on your answer",3
crucial,Extremely important,"This is a crucial decision",4
```

**Tại sao cần:** Import vocabulary từ CSV, export data backup.

---

### **6. API & Documentation**

#### **node-fetch** (^3.3.2)

```javascript
import fetch from 'node-fetch';

const response = await fetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ key: 'value' }),
});

const data = await response.json();
```

**Mục đích:**

- HTTP client cho Node.js (giống `fetch()` trong browser)
- Call external APIs (WordsAPI, Google API, etc.)

**Use case trong VocaPro:**

```javascript
// Call WordsAPI để lấy definition
const response = await fetch('https://wordsapi.p.rapidapi.com/words/elaborate', {
  headers: {
    'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
    'X-RapidAPI-Host': 'wordsapi.p.rapidapi.com',
  },
});

const wordData = await response.json();
// { word: 'elaborate', definition: '...', examples: [...] }
```

**Tại sao cần:** Gọi API bên thứ 3, Node.js không có built-in `fetch()` (trước v18).

---

#### **swagger-jsdoc** (^6.2.8) + **swagger-ui-express** (^5.0.0)

```javascript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VocaPro API',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

**Mục đích:**

- Auto-generate API documentation từ JSDoc comments
- Interactive API testing interface

**JSDoc example:**

```javascript
/**
 * @swagger
 * /api/vocab:
 *   get:
 *     summary: Get all vocabularies
 *     tags: [Vocabulary]
 *     responses:
 *       200:
 *         description: List of vocabularies
 */
router.get('/vocab', async (req, res) => {
  // ...
});
```

**Result:** Beautiful UI tại `/api-docs` để test API.

**Tại sao cần:** Documentation tự động, frontend developers biết API có gì.

---

#### **winston** (^3.11.0)

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

logger.info('Server started on port 3000');
logger.error('Database connection failed', { error: err.message });
logger.warn('API rate limit exceeded', { ip: req.ip });
```

**Mục đích:**

- Professional logging library
- Multiple transports (console, file, database, cloud)
- Log levels (error, warn, info, debug)

**Log levels:**

```javascript
logger.error('Critical error'); // 0 - Errors
logger.warn('Warning message'); // 1 - Warnings
logger.info('Info message'); // 2 - Important info
logger.http('HTTP request'); // 3 - HTTP logs
logger.verbose('Verbose info'); // 4 - Detailed info
logger.debug('Debug info'); // 5 - Debug only
logger.silly('Silly message'); // 6 - Everything
```

**Production config:**

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

**Tại sao cần:** Production app cần logging system để debug, monitor, audit.

---

### **7. Development Tools**

#### **nodemon** (^3.0.2) - DevDependency

```json
{
  "scripts": {
    "dev": "nodemon src/server.js"
  }
}
```

**Mục đích:**

- Auto-restart server khi code thay đổi
- Development only (không dùng production)

**Config `nodemon.json`:**

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js"],
  "exec": "node src/server.js"
}
```

**Tại sao cần:** Tiết kiệm thời gian, không cần restart manual mỗi lần sửa code.

---

#### **eslint** (^8.56.0) - DevDependency

**Mục đích:**

- Code linter, check code quality
- Enforce coding standards
- Find bugs trước khi runtime

**Config `.eslintrc.json`:**

```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "rules": {
    "no-unused-vars": "warn",
    "no-console": "off",
    "semi": ["error", "always"],
    "quotes": ["error", "single"]
  }
}
```

---

#### **jest** (^29.7.0) + **supertest** (^6.3.3) - DevDependency

```javascript
import request from 'supertest';
import app from '../src/server.js';

describe('Auth API', () => {
  test('POST /auth/register should create user', async () => {
    const response = await request(app).post('/auth/register').send({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

**Mục đích:**

- **jest:** Testing framework
- **supertest:** HTTP assertion library (test API endpoints)

**Tại sao cần:** Automated testing, prevent bugs, CI/CD pipeline.

---

## 📊 Tổng Kết Dependencies

### **Production Dependencies (25 packages):**

```
express              → Web framework
dotenv               → Environment variables
cors                 → Cross-origin requests
helmet               → Security headers
morgan               → HTTP logging
express-session      → Session management
express-rate-limit   → Rate limiting
passport             → Authentication framework
passport-local       → Email/password auth
passport-google...   → Google OAuth
bcryptjs             → Password hashing
@prisma/client       → Database ORM
csv-parser           → Parse CSV files
multer               → File uploads
node-fetch           → HTTP client
swagger-jsdoc        → API docs generator
swagger-ui-express   → API docs UI
winston              → Logging library
```

### **Development Dependencies (5 packages):**

```
nodemon              → Auto-restart server
prisma               → Prisma CLI tools
eslint               → Code linter
jest                 → Testing framework
supertest            → API testing
```

### **Total bundle size:** ~50MB (với node_modules)

### **Startup time:** ~500ms

### **Memory usage:** ~50-100MB (idle)

---

### **QUAN TRỌNG: Enable ES6 Modules**

Sửa `package.json` để enable ES6 modules:

```json
{
  "name": "vocapro-backend",
  "version": "1.0.0",
  "type": "module",
  "description": "VocaPro Backend API",
  "main": "src/server.js",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio",
    "test": "NODE_OPTIONS=--experimental-vm-modules jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "express-session": "^1.17.3",
    "express-rate-limit": "^7.1.5",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "passport-google-oauth20": "^2.0.0",
    "bcryptjs": "^2.4.3",
    "@prisma/client": "^5.22.0",
    "csv-parser": "^3.0.0",
    "multer": "^1.4.5-lts.1",
    "node-fetch": "^3.3.2",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "prisma": "^5.22.0",
    "eslint": "^8.56.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

**Giải thích:**

- `"type": "module"` → Cho phép dùng `import/export` thay vì `require/module.exports`
- Tất cả file `.js` sẽ được treat như ES6 modules
- Nếu cần dùng CommonJS → đổi extension thành `.cjs`

### Tạo folder structure

```
vocapro-backend/
├── src/
│   ├── config/
│   │   ├── passport.js
│   │   └── swagger.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── vocab.js
│   │   ├── review.js
│   │   ├── tags.js
│   │   ├── import.js
│   │   ├── export.js
│   │   ├── user.js
│   │   ├── stats.js
│   │   └── dictionary.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── validation.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── uploads/
├── .env
├── .env.example
└── package.json
```

---

## 1.2. Database Schema (Prisma)

### Tạo `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

// User Model
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  name          String?
  passwordHash  String?
  role          String       @default("USER")
  settings      String?      @db.NVarChar(Max)
  googleId      String?
  emailVerified Boolean      @default(false)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  vocabularies  Vocabulary[]
  tags          Tag[]
  reviews       Review[]
  sessions      Session[]

  @@index([email])
  @@index([googleId])
  @@map("users")
}

// Session Model
model Session {
  id        String   @id @default(uuid())
  sid       String   @unique
  userId    String
  expiresAt DateTime
  data      String   @db.NVarChar(Max)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([sid])
  @@map("sessions")
}

// Vocabulary Model
model Vocabulary {
  id          String    @id @default(uuid())
  userId      String
  word        String
  definition  String    @db.NVarChar(Max)
  example     String?   @db.NVarChar(Max)
  pronunciation String?
  partOfSpeech String?
  difficulty  Int       @default(1)
  imageUrl    String?
  audioUrl    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reviews Review[]
  tags    Tag[]    @relation("VocabularyTags")

  @@index([userId])
  @@index([word])
  @@map("vocabularies")
}

// Tag Model
model Tag {
  id        String   @id @default(uuid())
  userId    String
  name      String
  color     String?
  createdAt DateTime @default(now())

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  vocabularies Vocabulary[] @relation("VocabularyTags")

  @@unique([userId, name])
  @@index([userId])
  @@map("tags")
}

// Review Model (Spaced Repetition)
model Review {
  id           String   @id @default(uuid())
  userId       String
  vocabularyId String
  easeFactor   Float    @default(2.5)
  interval     Int      @default(0)
  repetitions  Int      @default(0)
  nextReview   DateTime
  lastReviewed DateTime?
  quality      Int?
  createdAt    DateTime @default(now())

  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  vocabulary Vocabulary @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)

  @@unique([userId, vocabularyId])
  @@index([userId])
  @@index([nextReview])
  @@map("reviews")
}

// API Usage Tracking
model ApiUsage {
  id        String   @id @default(uuid())
  endpoint  String
  date      DateTime
  count     Int      @default(0)
  createdAt DateTime @default(now())

  @@unique([endpoint, date])
  @@index([endpoint])
  @@index([date])
  @@map("api_usage")
}
```

### Setup database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

---

## 1.3. Environment Variables

### Tạo `.env`

```env
# Database
DATABASE_URL="sqlserver://server.database.windows.net:1433;database=vocapro;user=admin;password=YourPassword;encrypt=true"

# Server
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# RapidAPI (WordsAPI)
RAPIDAPI_KEY=your-rapidapi-key
```

---

## 1.4. Core Backend Files

### `src/utils/logger.js` (ES6 Version)

```javascript
import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get __dirname in ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir) && process.env.VERCEL !== '1') {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'vocapro-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
    }),
  ],
});

// Add file transport only in non-serverless environment
if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export default logger;
```

**Giải thích ES6 specific code:**

```javascript
// CommonJS way (Old)
const __dirname = __dirname; // Global variable

// ES6 way (New)
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

**Why?** ES6 modules không có global `__dirname` và `__filename`. Phải tạo manually từ `import.meta.url`.

**import.meta.url examples:**

- Unix: `file:///home/user/project/src/utils/logger.js`
- Windows: `file:///C:/Users/user/project/src/utils/logger.js`

### `src/utils/validation.js` (ES6 Version)

```javascript
import { body, validationResult } from 'express-validator';

/**
 * Middleware để chạy validation và return errors
 * @param {Array} validations - Array of validation chains
 * @returns {Function} Express middleware
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    // Chạy tất cả validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Lấy errors
    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next(); // Không có lỗi → tiếp tục
    }

    // Có lỗi → return 400 với error details
    res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  };
};

// Registration validation schema
export const registerSchema = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail().trim(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase and number'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2-50 characters'),
];

// Login validation schema
export const loginSchema = [
  body('email').isEmail().withMessage('Invalid email format').normalizeEmail().trim(),

  body('password')
    .exists()
    .withMessage('Password is required')
    .notEmpty()
    .withMessage('Password cannot be empty'),
];

// Vocabulary validation schema
export const vocabSchema = [
  body('word')
    .trim()
    .notEmpty()
    .withMessage('Word is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Word must be 1-100 characters'),

  body('definition')
    .trim()
    .notEmpty()
    .withMessage('Definition is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Definition must be 5-1000 characters'),

  body('example')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Example must not exceed 500 characters'),

  body('pronunciation')
    .optional()
    .trim()
    .matches(/^\/[^\/]+\/$/)
    .withMessage('Pronunciation must be in format /.../ (e.g., /həˈloʊ/)'),

  body('partOfSpeech')
    .optional()
    .trim()
    .isIn([
      'noun',
      'verb',
      'adjective',
      'adverb',
      'pronoun',
      'preposition',
      'conjunction',
      'interjection',
    ])
    .withMessage('Invalid part of speech'),

  body('difficulty')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Difficulty must be between 1-5'),
];

// Tag validation schema
export const tagSchema = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tag name is required')
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag name must be 1-30 characters')
    .matches(/^[a-zA-Z0-9\s-_]+$/)
    .withMessage('Tag name can only contain letters, numbers, spaces, hyphens and underscores'),

  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex code (e.g., #3B82F6)'),
];

// Review quality validation
export const reviewSchema = [
  body('quality').isInt({ min: 0, max: 5 }).withMessage('Quality must be between 0-5'),
];

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid UUID
 */
export const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
```

**Giải thích Validation Chain:**

```javascript
// Example: Email validation
body('email')
  .isEmail() // 1. Check email format
  .withMessage('Invalid') // 2. Custom error message
  .normalizeEmail() // 3. Convert to lowercase, remove dots
  .trim(); // 4. Remove whitespace

// Input:  "  John.Doe@GMAIL.COM  "
// After:  "johndoe@gmail.com"
```

**Giải thích Password Regex:**

```javascript
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

^           : Start of string
(?=.*[a-z]) : Must contain at least 1 lowercase letter
(?=.*[A-Z]) : Must contain at least 1 uppercase letter
(?=.*\d)    : Must contain at least 1 digit

Valid:   "Password123"
Invalid: "password123" (no uppercase)
Invalid: "PASSWORD123" (no lowercase)
Invalid: "PasswordABC" (no digit)
```

### `src/config/passport.js` (ES6 Version)

```javascript
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

/**
 * Configure Passport authentication strategies
 * @param {Object} passport - Passport instance
 * @param {Object} prisma - Prisma client instance
 */
export default function configurePassport(passport, prisma) {
  // ==========================================
  // LOCAL STRATEGY (Email + Password)
  // ==========================================
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: false,
      },
      async (email, password, done) => {
        try {
          // 1. Find user by email (case-insensitive)
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
              id: true,
              email: true,
              name: true,
              passwordHash: true,
              role: true,
              emailVerified: true,
              googleId: true,
            },
          });

          // 2. Check if user exists
          if (!user) {
            return done(null, false, {
              message: 'No account found with this email',
            });
          }

          // 3. Check if user has password (not Google-only account)
          if (!user.passwordHash) {
            return done(null, false, {
              message: 'This account uses Google Sign-In. Please use "Continue with Google"',
            });
          }

          // 4. Verify password with bcrypt
          const isMatch = await bcrypt.compare(password, user.passwordHash);

          if (!isMatch) {
            return done(null, false, {
              message: 'Incorrect password',
            });
          }

          // 5. Success - return user (without passwordHash)
          const { passwordHash, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          console.error('LocalStrategy error:', error);
          return done(error);
        }
      }
    )
  );

  // ==========================================
  // GOOGLE OAUTH 2.0 STRATEGY
  // ==========================================
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const name = profile.displayName;
          const picture = profile.photos?.[0]?.value;

          // 1. Try to find user by Google ID first
          let user = await prisma.user.findFirst({
            where: { googleId },
          });

          if (user) {
            // User exists with this Google ID
            return done(null, user);
          }

          // 2. Check if email already exists (user signed up with email/password)
          user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (user) {
            // Link Google account to existing email account
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId,
                emailVerified: true,
              },
            });

            return done(null, user);
          }

          // 3. Create new user with Google account
          user = await prisma.user.create({
            data: {
              id: randomUUID(), // Manual UUID generation for SQL Server
              email: email.toLowerCase(),
              name,
              googleId,
              emailVerified: true,
              role: 'USER',
              settings: JSON.stringify({
                theme: 'dark',
                language: 'en',
                notifications: true,
                avatar: picture,
              }),
            },
          });

          return done(null, user);
        } catch (error) {
          console.error('GoogleStrategy error:', error);
          return done(error);
        }
      }
    )
  );

  // ==========================================
  // SERIALIZE USER (Save to session)
  // ==========================================
  passport.serializeUser((user, done) => {
    // Only save user ID to session (lightweight)
    done(null, user.id);
  });

  // ==========================================
  // DESERIALIZE USER (Load from database on each request)
  // ==========================================
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          emailVerified: true,
          settings: true,
        },
      });

      if (!user) {
        return done(null, false);
      }

      // Parse settings JSON
      if (user.settings) {
        try {
          user.settings = JSON.parse(user.settings);
        } catch (e) {
          user.settings = {};
        }
      }

      done(null, user);
    } catch (error) {
      console.error('Deserialize user error:', error);
      done(error);
    }
  });
}
```

**Giải thích chi tiết flow:**

### **1. Local Authentication Flow:**

```javascript
// User submits login form
POST /auth/login
Body: { email: "user@gmail.com", password: "Password123" }

↓

// Passport LocalStrategy triggered
1. Find user: prisma.user.findUnique({ email })
   Result: {
     id: "550e8400-...",
     email: "user@gmail.com",
     passwordHash: "$2b$10$N9qo8uLOickgx2ZMRZoMye...",
     name: "John Doe"
   }

2. Check user exists
   If not → return done(null, false, { message: 'No account...' })

3. Check passwordHash exists
   If not → return done(null, false, { message: 'Use Google Sign-In' })

4. bcrypt.compare("Password123", "$2b$10$...")
   Process:
   - Extract salt from hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
   - Hash input with same salt
   - Compare results

   If match → return done(null, user)
   If not   → return done(null, false, { message: 'Incorrect password' })

5. Passport calls serializeUser(user)
   Saves user.id to session: req.session.passport = { user: "550e8400-..." }

6. Response sent with Set-Cookie header
```

### **2. Google OAuth Flow:**

```javascript
// Step 1: User clicks "Login with Google"
GET /auth/google

↓ Redirect to Google

// Step 2: Google consent screen
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=xxx&
  redirect_uri=http://localhost:3000/auth/google/callback&
  scope=profile email&
  response_type=code

User approves

↓ Google redirects back

// Step 3: Callback with authorization code
GET /auth/google/callback?code=4/0AX4XfWh...

↓

// Step 4: Exchange code for tokens
Passport automatically:
- POST https://oauth2.googleapis.com/token
  Body: { code, client_id, client_secret, redirect_uri }

  Response: {
    access_token: "ya29.a0AfH6SMBx...",
    id_token: "eyJhbGciOiJSUzI1NiIs...",
    expires_in: 3599
  }

// Step 5: Get user profile
- GET https://www.googleapis.com/oauth2/v2/userinfo
  Header: Authorization: Bearer ya29.a0AfH6SMBx...

  Response: {
    id: "102938475629384756293",
    email: "user@gmail.com",
    verified_email: true,
    name: "John Doe",
    picture: "https://lh3.googleusercontent.com/..."
  }

↓

// Step 6: GoogleStrategy callback executed
profile = {
  id: "102938475629384756293",
  displayName: "John Doe",
  emails: [{ value: "user@gmail.com" }],
  photos: [{ value: "https://..." }]
}

1. Find by googleId: prisma.user.findFirst({ googleId: profile.id })

   If found → return done(null, user)

2. Find by email: prisma.user.findUnique({ email: profile.emails[0].value })

   If found → Link Google ID to existing account

3. Create new user:
   prisma.user.create({
     id: randomUUID(),
     email: "user@gmail.com",
     googleId: "102938475629384756293",
     name: "John Doe",
     emailVerified: true
   })

4. return done(null, user)

// Step 7: Serialize user
serializeUser(user) → Save user.id to session

// Step 8: Redirect to dashboard
res.redirect('/dashboard.html')
```

### **3. Session Management:**

```javascript
// Every subsequent request
GET /api/vocab

Headers:
  Cookie: connect.sid=s%3Aj8fH2K9L...

↓

// Session middleware
1. Read cookie: connect.sid
2. Verify signature with SESSION_SECRET
3. Extract session ID: "abc123..."
4. Load session from database/memory

   session = {
     cookie: { maxAge: 86400000, ... },
     passport: { user: "550e8400-..." }
   }

// Passport middleware
5. passport.session() reads session.passport.user
6. Calls deserializeUser("550e8400-...")

7. Query database:
   user = await prisma.user.findUnique({
     where: { id: "550e8400-..." }
   })

8. Attach to request:
   req.user = {
     id: "550e8400-...",
     email: "user@gmail.com",
     name: "John Doe",
     role: "USER"
   }

// Route handler can now access req.user
router.get('/api/vocab', (req, res) => {
  const userId = req.user.id; // ✓ Available
  // ...
});
```

**Bcrypt Deep Dive:**

```javascript
// Hashing process
const password = 'Password123';
const salt = await bcrypt.genSalt(10); // 10 rounds = 2^10 iterations

// Salt example: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
// Format: $2b$ + rounds + salt

const hash = await bcrypt.hash(password, salt);
// Result: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
//          ─┬─  ─┬  ───────────┬──────────── ─────────────┬─────────────
//           │    │             │                           │
//       Algorithm │         22-char salt            31-char hash
//              Rounds

// Verification
const isMatch = await bcrypt.compare('Password123', hash);
// Process:
// 1. Extract salt from hash: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
// 2. Hash input with extracted salt
// 3. Compare result with original hash
// 4. Return true/false
```

### `src/config/swagger.js` (ES6 Version)

```javascript
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VocaPro API Documentation',
      version: '1.0.0',
      description: `
        Professional Vocabulary Management System API
        
        ## Features
        - 🔐 Authentication (Local + Google OAuth)
        - 📚 Vocabulary Management (CRUD operations)
        - 🔄 Spaced Repetition Review System
        - 🏷️ Tag Management
        - 📊 Statistics & Analytics
        - 📖 Dictionary Integration (WordsAPI)
        - 📥 Import/Export (CSV, JSON)
        
        ## Authentication
        Most endpoints require authentication. After logging in, a session cookie will be set automatically.
      `,
      contact: {
        name: 'VocaPro API Support',
        email: 'support@vocapro.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description:
          process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie automatically set after login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
            emailVerified: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Vocabulary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            word: { type: 'string', example: 'elaborate' },
            definition: { type: 'string', example: 'To add more detail or information' },
            example: { type: 'string', example: 'Please elaborate on your answer.' },
            pronunciation: { type: 'string', example: '/ɪˈlæb.ə.reɪt/' },
            partOfSpeech: {
              type: 'string',
              enum: ['noun', 'verb', 'adjective', 'adverb'],
              example: 'verb',
            },
            difficulty: { type: 'integer', minimum: 1, maximum: 5, example: 3 },
            imageUrl: { type: 'string', format: 'uri', nullable: true },
            audioUrl: { type: 'string', format: 'uri', nullable: true },
            tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'IELTS' },
            color: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$', example: '#3B82F6' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            vocabularyId: { type: 'string', format: 'uuid' },
            easeFactor: { type: 'number', format: 'float', example: 2.5 },
            interval: { type: 'integer', example: 7 },
            repetitions: { type: 'integer', example: 3 },
            nextReview: { type: 'string', format: 'date-time' },
            lastReviewed: { type: 'string', format: 'date-time', nullable: true },
            quality: { type: 'integer', minimum: 0, maximum: 5, nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Invalid credentials' },
            details: { type: 'string', example: 'Additional error information' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: 'Not authenticated' },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                        value: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to route files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
```

**Cách sử dụng trong routes:**

```javascript
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []  # No auth required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', ...);
```

---

## 1.5. Authentication Routes (ES6 Version)

### `src/routes/auth.js`

```javascript
import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { email, password, name } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    logger.info(`Registration attempt for email: ${normalizedEmail}`);

    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    if (existingUser) {
      logger.warn(`Registration failed: Email already exists - ${normalizedEmail}`);
      return res.status(400).json({
        error: 'Email already registered',
        details:
          'An account with this email already exists. Please login or use a different email.',
      });
    }

    // 2. Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    logger.debug(`Password hashed successfully for ${normalizedEmail}`);

    // 3. Generate UUID manually (SQL Server doesn't auto-generate)
    const userId = randomUUID();

    // 4. Create new user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email: normalizedEmail,
        passwordHash,
        name: name || 'User',
        role: 'USER',
        emailVerified: false,
        settings: JSON.stringify({
          theme: 'dark',
          language: 'en',
          notifications: true,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    logger.info(`User created successfully: ${user.id}`);

    // 5. Automatically log in the user
    req.login(user, (err) => {
      if (err) {
        logger.error(`Auto-login failed after registration: ${err.message}`);
        return res.status(500).json({
          error: 'Registration successful but login failed',
          details: 'Please try logging in manually.',
        });
      }

      logger.info(`User logged in successfully: ${user.id}`);

      res.status(201).json({
        message: 'Registration successful',
        user,
      });
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`, {
      email: email?.toLowerCase(),
      code: error.code,
      stack: error.stack,
    });

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      return res.status(400).json({
        error: 'Email already registered',
        details: 'This email is already in use.',
      });
    }

    res.status(500).json({
      error: 'Registration failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error(`Login error: ${err.message}`);
      return res.status(500).json({
        error: 'Authentication error',
        details: 'An error occurred during authentication.',
      });
    }

    if (!user) {
      logger.warn(`Login failed: ${info?.message || 'Unknown reason'}`, {
        email: req.body.email,
      });
      return res.status(401).json({
        error: info?.message || 'Invalid credentials',
        details: 'Please check your email and password.',
      });
    }

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        logger.error(`Login session creation failed: ${err.message}`);
        return res.status(500).json({
          error: 'Login failed',
          details: 'Failed to create session.',
        });
      }

      logger.info(`User logged in: ${user.id} (${user.email})`);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        },
      });
    });
  })(req, res, next);
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth flow
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth consent screen
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent',
  })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to dashboard on success, login page on failure
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login.html',
    failureMessage: true,
  }),
  (req, res) => {
    logger.info(`Google OAuth successful for user: ${req.user.id}`);
    res.redirect('/dashboard.html');
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', (req, res) => {
  const userId = req.user?.id;

  req.logout((err) => {
    if (err) {
      logger.error(`Logout error: ${err.message}`, { userId });
      return res.status(500).json({
        error: 'Logout failed',
        details: 'Failed to destroy session.',
      });
    }

    req.session.destroy((err) => {
      if (err) {
        logger.error(`Session destroy error: ${err.message}`, { userId });
      }

      res.clearCookie('connect.sid');
      logger.info(`User logged out: ${userId}`);

      res.json({ message: 'Logout successful' });
    });
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated',
      details: 'Please login to access this resource.',
    });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      settings: req.user.settings,
    },
  });
});

/**
 * @swagger
 * /auth/check:
 *   get:
 *     summary: Check if user is authenticated
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Authentication status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authenticated:
 *                   type: boolean
 */
router.get('/check', (req, res) => {
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.isAuthenticated()
      ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
        }
      : null,
  });
});

export default router;
```

**Giải thích chi tiết các endpoints:**

### **POST /auth/register**

```javascript
// Request
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe"
}

// Process
1. Validation middleware chạy (registerSchema)
   - Check email format
   - Check password >= 8 chars, có uppercase, lowercase, number
   - Trim & normalize input

2. Check email tồn tại chưa
   - findUnique({ email: "user@example.com" })
   - Nếu có → return 400

3. Hash password
   - bcrypt.hash("Password123", 10)
   - 10 rounds = 1024 iterations
   - Result: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

4. Generate UUID
   - randomUUID() → "550e8400-e29b-41d4-a716-446655440000"

5. Create user in database
   - INSERT INTO users (id, email, passwordHash, name, role, emailVerified, settings)
   - VALUES (uuid, email, hash, name, 'USER', 0, '{"theme":"dark",...}')

6. Auto-login
   - req.login(user) → Creates session
   - Session saved to database
   - Set-Cookie: connect.sid=s%3Aj8fH2K...

// Response 201
{
  "message": "Registration successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "emailVerified": false,
    "createdAt": "2025-11-08T10:00:00.000Z"
  }
}
```

### **POST /auth/login**

```javascript
// Request
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

// Process
1. Validation middleware
   - Check email format
   - Check password exists

2. passport.authenticate('local') callback
   - Find user by email
   - Check user exists
   - Check user.passwordHash exists (not Google-only)
   - bcrypt.compare(password, passwordHash)
   - Return user or false

3. If success:
   - req.login(user) → Create session
   - passport.serializeUser → Save user.id to session
   - Set-Cookie

4. If failure:
   - Return 401 with error message

// Response 200
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "emailVerified": false
  }
}
```

### **GET /auth/google**

```javascript
// Request
GET http://localhost:3000/auth/google

// Process
1. Passport redirects to Google OAuth:
   https://accounts.google.com/o/oauth2/v2/auth?
     client_id=xxxxx.apps.googleusercontent.com&
     redirect_uri=http://localhost:3000/auth/google/callback&
     scope=profile email&
     response_type=code&
     access_type=offline&
     prompt=consent

2. User sees Google account selection screen

3. User approves → Google redirects back with code
```

### **GET /auth/google/callback?code=...**

```javascript
// Request (from Google)
GET http://localhost:3000/auth/google/callback?code=4/0AX4XfWh...

// Process
1. Passport exchanges code for tokens
   POST https://oauth2.googleapis.com/token
   Response: { access_token, id_token, refresh_token }

2. Get user profile
   GET https://www.googleapis.com/oauth2/v2/userinfo
   Response: { id, email, name, picture }

3. GoogleStrategy callback:
   - Find by googleId
   - If not found → Find by email
   - If not found → Create new user
   - Link Google ID if needed

4. req.login(user) → Create session

5. Redirect to dashboard

// Response
HTTP/1.1 302 Found
Location: /dashboard.html
Set-Cookie: connect.sid=s%3A...
```

### **POST /auth/logout**

```javascript
// Request
POST http://localhost:3000/auth/logout
Cookie: connect.sid=s%3Aj8fH2K...

// Process
1. req.logout() → Passport clears user from session
2. req.session.destroy() → Delete session from database
3. res.clearCookie('connect.sid') → Remove cookie

// Response 200
{
  "message": "Logout successful"
}
```

### **GET /auth/me**

```javascript
// Request
GET http://localhost:3000/auth/me
Cookie: connect.sid=s%3Aj8fH2K...

// Process
1. Session middleware loads session
2. Passport deserializes user (query database)
3. Check req.isAuthenticated()
4. Return user data

// Response 200
{
  "authenticated": true,
  "user": {
    "id": "550e8400-...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "emailVerified": false,
    "settings": {
      "theme": "dark",
      "language": "en",
      "notifications": true
    }
  }
}
```

---

## 1.6. Main Server File

### `src/server.js`

```javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const logger = require('./utils/logger');
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Passport configuration
require('./config/passport')(passport, prisma);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.BASE_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vocapro-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Base URL middleware
app.use((req, res, next) => {
  res.locals.baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  next();
});

// Make Prisma available to routes
app.set('prisma', prisma);

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/v1/vocab', require('./routes/vocab'));
app.use('/api/v1/review', require('./routes/review'));
app.use('/api/v1/tags', require('./routes/tags'));
app.use('/api/v1/import', require('./routes/import'));
app.use('/api/v1/export', require('./routes/export'));
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/stats', require('./routes/stats'));
app.use('/api/v1/dictionary', require('./routes/dictionary'));

// Swagger API docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`🚀 VocaPro server running at http://localhost:${PORT}`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
```

### Update `package.json`

```json
{
  "name": "vocapro-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  }
}
```

---

# Part 2: Frontend Setup (ES6)

## 2.1. Folder Structure

```
vocapro-frontend/
├── public/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   └── ui.js
│   ├── pages/
│   │   ├── login.html
│   │   ├── dashboard.html
│   │   ├── vocabManager.html
│   │   └── review.html
│   └── favicon.svg
├── package.json
└── README.md
```

---

## 2.2. Modern CSS with Variables

### `public/css/app.css`

```css
/* CSS Variables */
:root {
  --primary: #667eea;
  --primary-dark: #5568d3;
  --secondary: #764ba2;
  --success: #48bb78;
  --error: #f56565;
  --warning: #ed8936;
  --info: #4299e1;

  --background: #1a202c;
  --background-alt: #2d3748;
  --text-primary: #f7fafc;
  --text-secondary: #cbd5e0;
  --border-color: #4a5568;

  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

  --transition-fast: 150ms ease;
  --transition-smooth: 300ms ease;
}

/* Light Theme */
[data-theme='light'] {
  --background: #ffffff;
  --background-alt: #f7fafc;
  --text-primary: #1a202c;
  --text-secondary: #4a5568;
  --border-color: #e2e8f0;
}

/* Reset & Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
    'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  background: var(--background);
  color: var(--text-primary);
  line-height: 1.6;
}

/* Button Styles */
.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-smooth);
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-outline {
  background: transparent;
  border: 2px solid var(--primary);
  color: var(--primary);
}

.btn-outline:hover {
  background: var(--primary);
  color: white;
}

/* Form Styles */
.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--background);
  color: var(--text-primary);
  font-size: 1rem;
  transition: border-color var(--transition-fast);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary);
}

/* Card Styles */
.card {
  background: var(--background-alt);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: var(--spacing-lg);
  right: var(--spacing-lg);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.toast {
  min-width: 300px;
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  animation: slideInRight 0.3s ease;
}

.toast.success {
  background: var(--success);
  color: white;
}

.toast.error {
  background: var(--error);
  color: white;
}

.toast.warning {
  background: var(--warning);
  color: white;
}

.toast.info {
  background: var(--info);
  color: white;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-overlay.active {
  display: flex;
}

.modal {
  background: var(--background-alt);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-xl);
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Utility Classes */
.text-center {
  text-align: center;
}
.mt-1 {
  margin-top: var(--spacing-sm);
}
.mt-2 {
  margin-top: var(--spacing-md);
}
.mt-3 {
  margin-top: var(--spacing-lg);
}
.mb-1 {
  margin-bottom: var(--spacing-sm);
}
.mb-2 {
  margin-bottom: var(--spacing-md);
}
.mb-3 {
  margin-bottom: var(--spacing-lg);
}
```

---

## 2.3. Modern JavaScript (ES6) UI Library

### `public/js/ui.js`

```javascript
// Modern VocaPro UI Library (ES6)

// Theme Management
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', this.theme);
    document.documentElement.setAttribute('data-theme', this.theme);
    VocaPro.Toasts.show('Theme changed', `Switched to ${this.theme} mode`, 'info');
  }
}

// Toast Notifications
class ToastManager {
  constructor() {
    this.container = null;
    this.queue = [];
    this.maxToasts = 5;
    this.init();
  }

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  }

  show(title, message, type = 'info', duration = 4000) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);
    this.queue.push(toast);

    if (this.queue.length > this.maxToasts) {
      const oldest = this.queue.shift();
      oldest?.remove();
    }

    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        toast.remove();
        this.queue = this.queue.filter((t) => t !== toast);
      }, 300);
    }, duration);
  }
}

// Modal Management
class ModalManager {
  open(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  close(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  init() {
    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(overlay.id);
        }
      });
    });

    // Close on close button
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) {
          this.close(overlay.id);
        }
      });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          this.close(activeModal.id);
        }
      }
    });
  }
}

// API Helper
class APIClient {
  constructor() {
    this.baseURL = '';
  }

  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      VocaPro.Toasts.show('Error', error.message, 'error');
      throw error;
    }
  }

  get(url) {
    return this.request(url, { method: 'GET' });
  }

  post(url, body) {
    return this.request(url, { method: 'POST', body: JSON.stringify(body) });
  }

  put(url, body) {
    return this.request(url, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// Debounce Utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Initialize
const initializeUI = () => {
  const theme = new ThemeManager();
  const toasts = new ToastManager();
  const modal = new ModalManager();
  modal.init();

  console.log('✨ VocaPro UI initialized');
};

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}

// Export global VocaPro object
window.VocaPro = {
  Theme: new ThemeManager(),
  Toasts: new ToastManager(),
  Modal: new ModalManager(),
  API: new APIClient(),
  debounce,
};
```

---

## 2.4. Example Frontend Page

### `public/pages/login.html`

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VocaPro - Login</title>
    <link rel="stylesheet" href="/css/app.css" />
  </head>
  <body>
    <div class="login-container">
      <div class="card">
        <h1 class="text-center">VocaPro</h1>
        <p class="text-center text-secondary">Professional Vocabulary Management</p>

        <form id="loginForm" class="mt-3">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%">Sign In</button>
        </form>

        <div class="text-center mt-2">
          <a href="/auth/google" class="btn btn-outline"> Sign in with Google </a>
        </div>
      </div>
    </div>

    <script src="/js/ui.js"></script>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
          const result = await VocaPro.API.post('/auth/login', data);
          VocaPro.Toasts.show('Success', 'Login successful!', 'success');
          setTimeout(() => (window.location.href = '/dashboard'), 1000);
        } catch (error) {
          // Error already shown by API helper
        }
      });
    </script>
  </body>
</html>
```

---

# Part 3: Deployment

## 3.1. Render.com Deployment

### Create `render.yaml`

```yaml
services:
  - type: web
    name: vocapro-api
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
      - key: GOOGLE_CLIENT_ID
        sync: false
      - key: GOOGLE_CLIENT_SECRET
        sync: false
      - key: RAPIDAPI_KEY
        sync: false
      - key: NODE_ENV
        value: production
```

### Set Environment Variables in Render Dashboard

1. Go to Render Dashboard
2. Select your service
3. Go to Environment tab
4. Add all required environment variables

---

## 3.2. Testing

```bash
# Start backend
cd vocapro-backend
npm run dev

# Backend runs on http://localhost:3000
# API docs: http://localhost:3000/api-docs
```

---

## 📝 Notes

### SQL Server Specific Issues

1. **UUID Generation**: SQL Server không tự generate UUID

   - Solution: Generate manually với `randomUUID()` trong code

2. **UNIQUE Constraint with NULL**: SQL Server không cho phép nhiều NULL trong UNIQUE column

   - Solution: Remove `@unique` từ `googleId`, dùng `@@index` thay thế

3. **Connection String**: Phải có `encrypt=true` cho Azure SQL

### Security Best Practices

1. **Environment Variables**: Không commit `.env` vào git
2. **Session Secret**: Dùng random string ít nhất 32 ký tự
3. **HTTPS**: Bật trong production với `cookie.secure = true`
4. **CORS**: Chỉ cho phép origin cụ thể

---

## 🎯 Next Steps

1. Implement remaining routes (vocab, review, tags, etc.)
2. Add frontend pages (dashboard, vocab manager, review)
3. Implement spaced repetition algorithm
4. Add tests with Jest
5. Setup CI/CD pipeline
6. Add monitoring and logging

---

**Created by: VocaPro Team**  
**Last Updated: November 2025**
