// =====================================================
// Validation Schemas (Zod)
// =====================================================

const { z } = require('zod');

// =====================================================
// Vocabulary Schemas
// =====================================================

const createVocabSchema = z.object({
  word: z.string().min(1).max(200),
  language: z.string().length(2).default('en'),
  partOfSpeech: z.string().optional(),
  ipa: z.string().optional(),
  definitions: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).default('MEDIUM'),
  audioUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const updateVocabSchema = createVocabSchema.partial();

const vocabQuerySchema = z.object({
  search: z.string().optional().or(z.literal('')),
  language: z.string().optional().or(z.literal('')),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')), // comma-separated tag IDs
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  sortBy: z.enum(['word', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =====================================================
// Review Schemas
// =====================================================

const submitReviewSchema = z.object({
  quality: z.number().int().min(0).max(5),
});

// =====================================================
// Tag Schemas
// =====================================================

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().max(200).optional(),
});

const updateTagSchema = createTagSchema.partial();

// =====================================================
// Auth Schemas
// =====================================================

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// =====================================================
// Validation Middleware
// =====================================================

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
    }
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: 'Query validation failed',
        details: error.errors,
      });
    }
  };
};

module.exports = {
  createVocabSchema,
  updateVocabSchema,
  vocabQuerySchema,
  submitReviewSchema,
  createTagSchema,
  updateTagSchema,
  registerSchema,
  loginSchema,
  validate,
  validateQuery,
};
