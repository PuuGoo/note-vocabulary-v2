// =====================================================
// Statistics Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { getApiUsageStats } = require('../middleware/apiUsage');

/**
 * @swagger
 * /api/v1/stats/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Stats]
 */
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const [
      totalVocab,
      reviewsDue,
      reviewedToday,
      totalTags,
      difficultyBreakdown,
      languageBreakdown,
      recentActivity,
    ] = await Promise.all([
      prisma.vocabulary.count({ where: { ownerId: req.user.id } }),
      prisma.review.count({
        where: {
          userId: req.user.id,
          dueDate: { lte: new Date() },
        },
      }),
      prisma.review.count({
        where: {
          userId: req.user.id,
          lastReviewed: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.tag.count({ where: { ownerId: req.user.id } }),
      prisma.vocabulary.groupBy({
        by: ['difficulty'],
        where: { ownerId: req.user.id },
        _count: true,
      }),
      prisma.vocabulary.groupBy({
        by: ['language'],
        where: { ownerId: req.user.id },
        _count: true,
      }),
      prisma.vocabulary.findMany({
        where: { ownerId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          word: true,
          language: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      totalVocabulary: totalVocab,
      reviewsDue,
      reviewedToday,
      totalTags,
      difficultyBreakdown: difficultyBreakdown.map((d) => ({
        difficulty: d.difficulty,
        count: d._count,
      })),
      languageBreakdown: languageBreakdown.map((l) => ({
        language: l.language,
        count: l._count,
      })),
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * @swagger
 * /api/v1/stats/api-usage:
 *   get:
 *     summary: Get API usage statistics
 *     tags: [Stats]
 */
router.get('/api-usage', ensureAuthenticated, async (req, res) => {
  try {
    const stats = await getApiUsageStats();

    res.json({
      date: new Date().toISOString().split('T')[0],
      services: stats.map((stat) => ({
        service: stat.service,
        used: stat.requestCount,
        limit: stat.service === 'dictionary' ? 2000 : null,
        remaining: stat.service === 'dictionary' ? 2000 - stat.requestCount : null,
      })),
    });
  } catch (error) {
    console.error('API usage stats error:', error);
    res.status(500).json({ error: 'Failed to fetch API usage statistics' });
  }
});

module.exports = router;
