// =====================================================
// Review Routes (Spaced Repetition)
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, submitReviewSchema } = require('../utils/validation');
const { calculateNextReview } = require('../utils/spacedRepetition');

/**
 * @swagger
 * /api/v1/review/next:
 *   get:
 *     summary: Get next vocabulary for review
 *     tags: [Review]
 */
router.get('/next', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const review = await prisma.review.findFirst({
      where: {
        userId: req.user.id,
        dueDate: {
          lte: new Date(),
        },
      },
      include: {
        vocabulary: {
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    if (!review) {
      return res.json({ message: 'No reviews due', data: null });
    }

    res.json({
      review: {
        id: review.id,
        vocabId: review.vocabId,
        efactor: review.efactor,
        interval: review.interval,
        streak: review.streak,
        dueDate: review.dueDate,
      },
      vocabulary: {
        ...review.vocabulary,
        definitions: JSON.parse(review.vocabulary.definitions || '[]'),
        examples: review.vocabulary.examples ? JSON.parse(review.vocabulary.examples) : [],
        tags: review.vocabulary.tags.map((t) => t.tag),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch next review' });
  }
});

/**
 * @swagger
 * /api/v1/review/{id}:
 *   post:
 *     summary: Submit review result
 *     tags: [Review]
 */
router.post('/:id', ensureAuthenticated, validate(submitReviewSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { quality } = req.body;

  try {
    const review = await prisma.review.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    const nextReview = calculateNextReview(
      quality,
      review.efactor,
      review.interval,
      review.repetitions
    );

    const updated = await prisma.review.update({
      where: { id: req.params.id },
      data: {
        efactor: nextReview.efactor,
        interval: nextReview.interval,
        repetitions: nextReview.repetitions,
        dueDate: nextReview.dueDate,
        lastReviewed: new Date(),
        quality,
        streak: quality >= 3 ? review.streak + 1 : 0,
      },
    });

    res.json({
      message: 'Review submitted successfully',
      review: updated,
      nextDue: nextReview.dueDate,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * @swagger
 * /api/v1/review/stats:
 *   get:
 *     summary: Get review statistics
 *     tags: [Review]
 */
router.get('/stats', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const [dueCount, totalCount, todayCount] = await Promise.all([
      prisma.review.count({
        where: {
          userId: req.user.id,
          dueDate: { lte: new Date() },
        },
      }),
      prisma.review.count({
        where: { userId: req.user.id },
      }),
      prisma.review.count({
        where: {
          userId: req.user.id,
          lastReviewed: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const longestStreak = await prisma.review.findFirst({
      where: { userId: req.user.id },
      orderBy: { streak: 'desc' },
      select: { streak: true },
    });

    res.json({
      dueCount,
      totalCount,
      reviewedToday: todayCount,
      longestStreak: longestStreak?.streak || 0,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

module.exports = router;
