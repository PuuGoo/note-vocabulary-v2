// =====================================================
// VocaPro - Main Server Entry Point
// =====================================================

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
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

// =====================================================
// Middleware
// =====================================================

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for development
  })
);

// CORS
app.use(
  cors({
    origin: process.env.BASE_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'vocapro-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Make Prisma available to routes
app.set('prisma', prisma);

// =====================================================
// Routes
// =====================================================

// Auth routes
app.use('/auth', require('./routes/auth'));

// API v1 routes
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

// Serve frontend pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/vocab', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/vocabManager.html'));
});

app.get('/review', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/review.html'));
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

// =====================================================
// Server Start
// =====================================================

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
// Start server (skip in serverless environment like Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`🚀 VocaPro server running at http://${HOST}:${PORT}`);
    logger.info(`📚 API Documentation: http://${HOST}:${PORT}/api-docs`);
    logger.info(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await prisma.$disconnect();
  process.exit(0);
});

// Export for Vercel serverless
module.exports = app;
