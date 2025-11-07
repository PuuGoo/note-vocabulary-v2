// =====================================================
// Swagger/OpenAPI Configuration
// =====================================================

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VocaPro API',
      version: '1.0.0',
      description: 'Professional vocabulary management system API',
      contact: {
        name: 'VocaPro Support',
        email: 'support@vocapro.com',
      },
    },
    servers: [
      {
        url: process.env.BASE_URL || 'http://localhost:3000',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
      },
      schemas: {
        Vocabulary: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            word: { type: 'string' },
            language: { type: 'string' },
            partOfSpeech: { type: 'string' },
            ipa: { type: 'string' },
            definitions: { type: 'array', items: { type: 'string' } },
            examples: { type: 'array', items: { type: 'string' } },
            difficulty: { type: 'string', enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
            audioUrl: { type: 'string' },
            imageUrl: { type: 'string' },
            tags: { type: 'array', items: { type: 'object' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            slug: { type: 'string' },
            color: { type: 'string' },
            description: { type: 'string' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            vocabId: { type: 'string', format: 'uuid' },
            efactor: { type: 'number' },
            interval: { type: 'integer' },
            dueDate: { type: 'string', format: 'date-time' },
            streak: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
