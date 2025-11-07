// =====================================================
// Authentication Middleware
// =====================================================

/**
 * Ensure user is authenticated
 */
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized - Please log in' });
};

/**
 * Ensure user has specific role
 */
const ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    next();
  };
};

/**
 * Check if user owns resource or is admin
 */
const ensureOwnershipOrAdmin = (ownerIdField = 'ownerId') => {
  return (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.user.role === 'ADMIN') {
      return next();
    }
    if (req[ownerIdField] && req[ownerIdField] !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden - Not the owner' });
    }
    next();
  };
};

module.exports = {
  ensureAuthenticated,
  ensureRole,
  ensureOwnershipOrAdmin,
};
