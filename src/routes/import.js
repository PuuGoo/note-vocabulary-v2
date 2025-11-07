// =====================================================
// Import Routes
// =====================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { ensureAuthenticated } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * /api/v1/import:
 *   post:
 *     summary: Import vocabularies from CSV or JSON
 *     tags: [Import]
 */
router.post('/', ensureAuthenticated, upload.single('file'), async (req, res) => {
  const prisma = req.app.get('prisma');

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const format = req.body.format || 'csv';
    const vocabularies = [];

    if (format === 'csv') {
      // Parse CSV
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => {
            // Parse definitions - handle both single definition and semicolon-separated
            let definitions = [];
            if (row.definitions) {
              definitions = row.definitions.includes(';')
                ? row.definitions
                    .split(';')
                    .map((d) => d.trim())
                    .filter((d) => d)
                : [row.definitions.trim()];
            } else if (row.definition) {
              definitions = [row.definition.trim()];
            }

            // Parse examples - handle semicolon-separated
            let examples = [];
            if (row.examples) {
              examples = row.examples.includes(';')
                ? row.examples
                    .split(';')
                    .map((e) => e.trim())
                    .filter((e) => e)
                : [row.examples.trim()];
            } else if (row.example) {
              examples = [row.example.trim()];
            }

            vocabularies.push({
              word: row.word || row.Word,
              language: row.language || row.Language || 'en',
              partOfSpeech: row.partOfSpeech || row['Part of Speech'] || row.part_of_speech,
              ipa: row.ipa || row.IPA || row.pronunciation,
              definitions:
                definitions.length > 0 ? JSON.stringify(definitions) : JSON.stringify([]),
              examples: examples.length > 0 ? JSON.stringify(examples) : null,
              difficulty: (row.difficulty || row.Difficulty || 'MEDIUM').toUpperCase(),
              notes: row.notes || row.Notes || null,
              ownerId: req.user.id,
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (format === 'json') {
      // Parse JSON
      const data = JSON.parse(fs.readFileSync(req.file.path, 'utf-8'));
      vocabularies.push(
        ...data.map((v) => ({
          ...v,
          definitions: JSON.stringify(v.definitions || []),
          examples: v.examples ? JSON.stringify(v.examples) : null,
          ownerId: req.user.id,
        }))
      );
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported format' });
    }

    // Get existing words for this user to check duplicates
    const existingWords = await prisma.vocabulary.findMany({
      where: {
        ownerId: req.user.id,
        word: {
          in: vocabularies.map((v) => v.word),
        },
      },
      select: {
        word: true,
        language: true,
      },
    });

    // Create a Set of existing word+language combinations for fast lookup
    const existingSet = new Set(existingWords.map((v) => `${v.word.toLowerCase()}_${v.language}`));

    // Filter out duplicates
    const newVocabularies = vocabularies.filter((v) => {
      const key = `${v.word.toLowerCase()}_${v.language}`;
      return !existingSet.has(key);
    });

    if (newVocabularies.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(200).json({
        success: true,
        imported: 0,
        skipped: vocabularies.length,
        message: 'All words already exist',
      });
    }

    // Bulk create vocabularies (only new ones)
    const created = await prisma.vocabulary.createMany({
      data: newVocabularies,
    });

    // Create review records for each vocabulary
    const vocabRecords = await prisma.vocabulary.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: created.count,
    });

    await prisma.review.createMany({
      data: vocabRecords.map((v) => ({
        vocabId: v.id,
        userId: req.user.id,
        efactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: new Date(),
      })),
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    const skipped = vocabularies.length - created.count;

    res.json({
      success: true,
      message: 'Import successful',
      imported: created.count,
      skipped: skipped,
      total: vocabularies.length,
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Import failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

module.exports = router;
