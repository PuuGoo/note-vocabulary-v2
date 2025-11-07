// =====================================================
// User Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/user/settings:
 *   get:
 *     summary: Get user settings
 *     tags: [User]
 */
router.get('/settings', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { settings: true },
    });

    const settings = user.settings ? JSON.parse(user.settings) : {};
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @swagger
 * /api/v1/user/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [User]
 */
router.put('/settings', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        settings: JSON.stringify(req.body),
      },
      select: { settings: true },
    });

    res.json({ settings: JSON.parse(user.settings) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
