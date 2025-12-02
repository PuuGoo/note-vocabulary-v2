// =====================================================
// Authentication Routes
// =====================================================

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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', validate(registerSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { email, password, name } = req.body;

  try {
    console.log('Registering email:', email.toLowerCase());

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    console.log('Existing user found:', existingUser);

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Generate UUID manually (SQL Server doesn't auto-generate)
    const { randomUUID } = require('crypto');
    const userId = randomUUID();

    console.log('Creating user with data:', {
      id: userId,
      email: email.toLowerCase(),
      name: name || 'User',
      role: 'USER',
      emailVerified: false,
    });

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

    // Handle unique constraint violation
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
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
