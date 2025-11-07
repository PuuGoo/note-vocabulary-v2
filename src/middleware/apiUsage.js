/**
 * API Usage Tracking Middleware
 * Tracks and limits API requests per day per service
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Track API usage and enforce daily limits
 * @param {string} service - Service name ('dictionary', 'tts', etc.)
 * @param {number} dailyLimit - Maximum requests per day (default: 2000)
 * @returns {Function} Express middleware
 */
function trackApiUsage(service, dailyLimit = 2000) {
  return async (req, res, next) => {
    try {
      // Get today's date in Vietnam timezone (GMT+7)
      const now = new Date();
      const utcTime = now.getTime();
      const vietnamOffset = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
      const vietnamTime = new Date(utcTime + vietnamOffset);
      
      // Get date string and create Date object at midnight UTC
      const year = vietnamTime.getUTCFullYear();
      const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
      const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      const today = new Date(dateString + 'T00:00:00.000Z');

      let usage = null;

      // Try to create new record first (optimistic approach)
      try {
        usage = await prisma.apiUsage.create({
          data: {
            date: today,
            service: service,
            requestCount: 1,
          },
        });
      } catch (createError) {
        // If unique constraint fails (P2002), record already exists - find and update it
        if (createError.code === 'P2002') {
          // Find existing record
          usage = await prisma.apiUsage.findFirst({
            where: {
              date: today,
              service: service,
            },
          });

          // If still not found (race condition), try one more time
          if (!usage) {
            console.warn('Race condition detected in API usage tracking, retrying...');
            await new Promise((resolve) => setTimeout(resolve, 100)); // Wait 100ms
            usage = await prisma.apiUsage.findFirst({
              where: {
                date: today,
                service: service,
              },
            });
          }

          // If still null, something went wrong - skip tracking
          if (!usage) {
            console.error('Failed to find or create API usage record after retry');
            return next();
          }

          // Check if limit already exceeded BEFORE incrementing
          if (usage.requestCount >= dailyLimit) {
            return res.status(429).json({
              error: 'Daily API limit exceeded',
              message: `You have reached the daily limit of ${dailyLimit} requests for ${service}. Please try again tomorrow.`,
              service: service,
              limit: dailyLimit,
              current: usage.requestCount,
              resetDate: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0],
            });
          }

          // Increment request count
          usage = await prisma.apiUsage.update({
            where: { id: usage.id },
            data: {
              requestCount: {
                increment: 1,
              },
            },
          });
        } else {
          // Rethrow if it's a different error
          throw createError;
        }
      }

      // Add usage info to request object for logging
      req.apiUsage = {
        service: service,
        count: usage.requestCount,
        limit: dailyLimit,
        remaining: dailyLimit - usage.requestCount,
      };

      next();
    } catch (error) {
      console.error('Error tracking API usage:', error);
      // Don't block request on tracking error, but log it
      next();
    }
  };
}

/**
 * Get current API usage statistics
 * @param {string} service - Service name (optional, returns all if not specified)
 * @returns {Promise<Array>} Usage statistics
 */
async function getApiUsageStats(service = null) {
  // Get today's date in Vietnam timezone (GMT+7)
  const now = new Date();
  const utcTime = now.getTime();
  const vietnamOffset = 7 * 60 * 60 * 1000; // GMT+7 in milliseconds
  const vietnamTime = new Date(utcTime + vietnamOffset);
  
  // Get date string and create Date object at midnight UTC
  const year = vietnamTime.getUTCFullYear();
  const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(vietnamTime.getUTCDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  const today = new Date(dateString + 'T00:00:00.000Z');

  const where = service ? { date: today, service } : { date: today };

  return await prisma.apiUsage.findMany({
    where,
    orderBy: { service: 'asc' },
  });
}

module.exports = {
  trackApiUsage,
  getApiUsageStats,
};
