# VocaPro - Complete Rebuild Guide

Hướng dẫn chi tiết để xây dựng lại dự án VocaPro từ đầu với kiến trúc tách biệt Backend và Frontend.

---

## 📋 Table of Contents

- [Part 1: Backend Setup](#part-1-backend-setup)
- [Part 2: Frontend Setup (ES6)](#part-2-frontend-setup-es6)
- [Part 3: Deployment](#part-3-deployment)

---

# Part 1: Backend Setup

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
npm install bcryptjs jsonwebtoken
npm install @prisma/client
npm install csv-parser multer
npm install node-fetch@2 swagger-jsdoc swagger-ui-express
npm install winston uuid

# Dev dependencies
npm install -D nodemon prisma eslint jest supertest
```

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

### `src/utils/logger.js`

```javascript
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if not exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir) && process.env.VERCEL !== '1') {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
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
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    })
  );
}

module.exports = logger;
```

### `src/utils/validation.js`

```javascript
const { body, validationResult } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

const registerSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').optional().trim(),
];

const loginSchema = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
];

const vocabSchema = [
  body('word').trim().notEmpty(),
  body('definition').trim().notEmpty(),
  body('example').optional().trim(),
  body('pronunciation').optional().trim(),
  body('partOfSpeech').optional().trim(),
  body('difficulty').optional().isInt({ min: 1, max: 5 }),
];

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  vocabSchema,
};
```

### `src/config/passport.js`

```javascript
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');

module.exports = function (passport, prisma) {
  // Local Strategy
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          if (!user.passwordHash) {
            return done(null, false, { message: 'Please use Google Sign-In' });
          }

          const isMatch = await bcrypt.compare(password, user.passwordHash);
          if (!isMatch) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            user = await prisma.user.findUnique({
              where: { email: profile.emails[0].value },
            });

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, emailVerified: true },
              });
            } else {
              const { randomUUID } = require('crypto');
              user = await prisma.user.create({
                data: {
                  id: randomUUID(),
                  email: profile.emails[0].value,
                  name: profile.displayName,
                  googleId: profile.id,
                  emailVerified: true,
                  role: 'USER',
                },
              });
            }
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize/Deserialize
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
```

### `src/config/swagger.js`

```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VocaPro API',
      version: '1.0.0',
      description: 'Professional Vocabulary Management System API',
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
```

---

## 1.5. Authentication Routes

### `src/routes/auth.js`

```javascript
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { validate, registerSchema, loginSchema } = require('../utils/validation');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { email, password, name } = req.body;

  try {
    console.log('Registering email:', email.toLowerCase());
    
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate UUID manually (SQL Server doesn't auto-generate)
    const { randomUUID } = require('crypto');
    const userId = randomUUID();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        passwordHash,
        name: name || 'User',
        role: 'USER',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    req.login(user, (err) => {
      if (err) {
        console.error('Login after registration failed:', err);
        return res.status(500).json({ error: 'Registration successful but login failed' });
      }
      res.status(201).json({ message: 'Registration successful', user });
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002' || error.message.includes('Unique constraint')) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 */
router.post('/login', validate(loginSchema), (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    if (!user) {
      return res.status(401).json({ error: info.message || 'Invalid credentials' });
    }
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Login failed' });
      }
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    });
  })(req, res, next);
});

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth
 *     tags: [Auth]
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 */
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user: req.user });
});

module.exports = router;
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
app.use(cors({
  origin: process.env.BASE_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'vocapro-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
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
.text-center { text-align: center; }
.mt-1 { margin-top: var(--spacing-sm); }
.mt-2 { margin-top: var(--spacing-md); }
.mt-3 { margin-top: var(--spacing-lg); }
.mb-1 { margin-bottom: var(--spacing-sm); }
.mb-2 { margin-bottom: var(--spacing-md); }
.mb-3 { margin-bottom: var(--spacing-lg); }
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VocaPro - Login</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body>
  <div class="login-container">
    <div class="card">
      <h1 class="text-center">VocaPro</h1>
      <p class="text-center text-secondary">Professional Vocabulary Management</p>
      
      <form id="loginForm" class="mt-3">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
        </div>
        
        <button type="submit" class="btn btn-primary" style="width: 100%">
          Sign In
        </button>
      </form>
      
      <div class="text-center mt-2">
        <a href="/auth/google" class="btn btn-outline">
          Sign in with Google
        </a>
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
        setTimeout(() => window.location.href = '/dashboard', 1000);
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
