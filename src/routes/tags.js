// =====================================================
// Tag Routes
// =====================================================

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { validate, createTagSchema, updateTagSchema } = require('../utils/validation');

/**
 * @swagger
 * /api/v1/tags:
 *   get:
 *     summary: Get all user tags
 *     tags: [Tags]
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const tags = await prisma.tag.findMany({
      where: { ownerId: req.user.id },
      include: {
        _count: {
          select: { vocabularies: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      data: tags.map((tag) => ({
        ...tag,
        vocabularyCount: tag._count.vocabularies,
        _count: undefined,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

/**
 * @swagger
 * /api/v1/tags/{id}:
 *   get:
 *     summary: Get tag by ID
 *     tags: [Tags]
 */
router.get('/:id', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const tag = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
      include: {
        _count: {
          select: { vocabularies: true },
        },
      },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({
      ...tag,
      vocabularyCount: tag._count.vocabularies,
      _count: undefined,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

/**
 * @swagger
 * /api/v1/tags:
 *   post:
 *     summary: Create new tag
 *     tags: [Tags]
 */
router.post('/', ensureAuthenticated, validate(createTagSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, color, description } = req.body;

  try {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const existing = await prisma.tag.findFirst({
      where: {
        ownerId: req.user.id,
        slug,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        color,
        description,
        ownerId: req.user.id,
      },
    });

    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

/**
 * @swagger
 * /api/v1/tags/{id}:
 *   put:
 *     summary: Update tag
 *     tags: [Tags]
 */
router.put('/:id', ensureAuthenticated, validate(updateTagSchema), async (req, res) => {
  const prisma = req.app.get('prisma');
  const { name, color, description } = req.body;

  try {
    const existing = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const updateData = {};
    if (name) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }
    if (color !== undefined) updateData.color = color;
    if (description !== undefined) updateData.description = description;

    const tag = await prisma.tag.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(tag);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

/**
 * @swagger
 * /api/v1/tags/{id}:
 *   delete:
 *     summary: Delete tag
 *     tags: [Tags]
 */
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  const prisma = req.app.get('prisma');

  try {
    const existing = await prisma.tag.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    await prisma.tag.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
