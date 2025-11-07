// =====================================================
// Export Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/v1/export:
 *   get:
 *     summary: Export vocabularies to CSV or JSON
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [csv, json] }
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');
  const format = req.query.format || 'csv';

  try {
    const vocabularies = await prisma.vocabulary.findMany({
      where: { ownerId: req.user.id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = vocabularies.map((v) => ({
      word: v.word,
      language: v.language,
      partOfSpeech: v.partOfSpeech,
      ipa: v.ipa,
      definitions: JSON.parse(v.definitions || '[]').join('; '),
      examples: v.examples ? JSON.parse(v.examples).join('; ') : '',
      difficulty: v.difficulty,
      audioUrl: v.audioUrl,
      imageUrl: v.imageUrl,
      notes: v.notes,
      tags: v.tags.map((t) => t.tag.name).join(', '),
      createdAt: v.createdAt,
    }));

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=vocapro-export-${Date.now()}.json`
      );
      res.json(formatted);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=vocapro-export-${Date.now()}.csv`);

      // CSV headers
      const headers = [
        'word',
        'language',
        'partOfSpeech',
        'ipa',
        'definitions',
        'examples',
        'difficulty',
        'audioUrl',
        'imageUrl',
        'notes',
        'tags',
        'createdAt',
      ];
      res.write(headers.join(',') + '\n');

      // CSV rows
      formatted.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || '';
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        res.write(values.join(',') + '\n');
      });

      res.end();
    } else {
      res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
