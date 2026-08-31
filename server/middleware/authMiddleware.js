const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'honeychain-secret-key-2026';

function verifyAuthToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.',
    });
  }
}

function authorizeRole(allowedRoles = []) {
  return (req, res, next) => {
    verifyAuthToken(req, res, () => {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Account role not specified.',
        });
      }

      const userRole = (req.user.role || '').toLowerCase();

      // Admin always has full backend mutation access
      if (userRole === 'admin') {
        return next();
      }

      const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());
      if (normalizedAllowed.includes(userRole)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: `Access denied. This endpoint requires ${allowedRoles.join(' or ')} permission. (Your role: ${req.user.role})`,
      });
    });
  };
}

module.exports = {
  verifyAuthToken,
  authorizeRole,
};
