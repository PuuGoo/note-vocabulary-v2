// =====================================================
// Vocabulary Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const {
  validate,
  validateQuery,
  createVocabSchema,
  updateVocabSchema,
  vocabQuerySchema,
} = require('../utils/validation');

/**
 * @swagger
 * /api/v1/vocab:
 *   get:
 *     summary: Get vocabulary list with filters
 *     tags: [Vocabulary]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: language
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Vocabulary list
 */
router.get('/', ensureAuthenticated, validateQuery(vocabQuerySchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { search, language, difficulty, tags, page, limit, sortBy, sortOrder } = req.query;

  try {
    const where = {
      ownerId: req.user.id,
      ...(search &&
        search.trim() && {
          OR: [
            { word: { contains: search } },
            { definitions: { contains: search } },
            { notes: { contains: search } },
          ],
        }),
      ...(language && language.trim() && { language }),
      ...(difficulty && difficulty.trim() && { difficulty }),
      ...(tags &&
        tags.trim() && {
          tags: {
            some: {
              tagId: { in: tags.split(',') },
            },
          },
        }),
    };

    const [vocabularies, total] = await Promise.all([
      prisma.vocabulary.findMany({
        where,
        include: {
          tags: {
            include: {
              tag: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vocabulary.count({ where }),
    ]);

    // Parse JSON fields
    const formatted = vocabularies.map((v) => ({
      ...v,
      definitions: JSON.parse(v.definitions || '[]'),
      examples: v.examples ? JSON.parse(v.examples) : [],
      tags: v.tags.map((t) => t.tag),
    }));

    res.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vocabularies' });
  }
});

/**
 * @swagger
 * /api/v1/vocab/{id}:
 *   get:
 *     summary: Get vocabulary by ID
 *     tags: [Vocabulary]
 */
router.get('/:id', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const vocab = await prisma.vocabulary.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!vocab) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    res.json({
      ...vocab,
      definitions: JSON.parse(vocab.definitions || '[]'),
      examples: vocab.examples ? JSON.parse(vocab.examples) : [],
      tags: vocab.tags.map((t) => t.tag),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

/**
 * @swagger
 * /api/v1/vocab:
 *   post:
 *     summary: Create new vocabulary
 *     tags: [Vocabulary]
 */
router.post('/', ensureAuthenticated, validate(createVocabSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { tags, definitions, examples, ...vocabData } = req.body;

  try {
    // Check for duplicate word (same word + language for this user)
    const existingVocab = await prisma.vocabulary.findFirst({
      where: {
        ownerId: req.user.id,
        word: vocabData.word,
        language: vocabData.language,
      },
    });

    if (existingVocab) {
      return res.status(409).json({
        error: 'Duplicate vocabulary',
        message: `The word "${vocabData.word}" already exists in your ${vocabData.language} vocabulary.`,
        existingId: existingVocab.id,
      });
    }

    const vocab = await prisma.vocabulary.create({
      data: {
        ...vocabData,
        definitions: definitions ? JSON.stringify(definitions) : JSON.stringify([]),
        examples: examples ? JSON.stringify(examples) : null,
        ownerId: req.user.id,
        ...(tags &&
          tags.length > 0 && {
            tags: {
              create: tags.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            },
          }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Create initial review record
    await prisma.review.create({
      data: {
        vocabId: vocab.id,
        userId: req.user.id,
        efactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: new Date(),
      },
    });

    res.status(201).json({
      ...vocab,
      definitions: JSON.parse(vocab.definitions),
      examples: vocab.examples ? JSON.parse(vocab.examples) : [],
      tags: vocab.tags.map((t) => t.tag),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vocabulary' });
  }
});

/**
 * @swagger
 * /api/v1/vocab/{id}:
 *   put:
 *     summary: Update vocabulary
 *     tags: [Vocabulary]
 */
router.put('/:id', ensureAuthenticated, validate(updateVocabSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { tags, definitions, examples, ...vocabData } = req.body;

  try {
    // Check ownership
    const existing = await prisma.vocabulary.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    // Update vocabulary
    const vocab = await prisma.vocabulary.update({
      where: { id: req.params.id },
      data: {
        ...vocabData,
        ...(definitions && { definitions: JSON.stringify(definitions) }),
        ...(examples && { examples: JSON.stringify(examples) }),
        ...(tags && {
          tags: {
            deleteMany: {},
            create: tags.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    res.json({
      ...vocab,
      definitions: JSON.parse(vocab.definitions),
      examples: vocab.examples ? JSON.parse(vocab.examples) : [],
      tags: vocab.tags.map((t) => t.tag),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

/**
 * @swagger
 * /api/v1/vocab/{id}:
 *   delete:
 *     summary: Delete vocabulary
 *     tags: [Vocabulary]
 */
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const existing = await prisma.vocabulary.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    await prisma.vocabulary.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Vocabulary deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

module.exports = router;

