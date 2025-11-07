// Vercel serverless function wrapper for Express app
// Disable dotenv in production (Vercel provides env vars)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = require('../src/server');

// Export for Vercel
module.exports = app;
