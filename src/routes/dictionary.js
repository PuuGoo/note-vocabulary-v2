const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { trackApiUsage } = require('../middleware/apiUsage');
const { lookupWord } = require('../services/dictionary');

/**
 * @route   GET /api/v1/dictionary/lookup/:word
 * @desc    Look up word definition from dictionary API
 * @access  Private
 */
router.get(
  '/lookup/:word',
  trackApiUsage('dictionary', 2000),
  ensureAuthenticated,
  async (req, res) => {
    try {
      const { word } = req.params;

      if (!word || word.trim().length === 0) {
        return res.status(400).json({ error: 'Word is required' });
      }

      const result = await lookupWord(word.trim().toLowerCase());

      res.json(result);
    } catch (error) {
      console.error('Dictionary lookup error:', error);
      res.status(500).json({
        error: 'Dictionary lookup failed',
        details: error.message,
      });
    }
  }
);

module.exports = router;
