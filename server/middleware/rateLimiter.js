/**
 * Lightweight In-Memory Rate Limiter Middleware
 * Protects public endpoints (e.g. /verify/:batchId) against automated brute-force scanning & denial of service.
 */
const createRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 60, message = 'Too many requests to public verification endpoint, please try again later.' } = {}) => {
  const requests = new Map();

  // Periodically clean up old IP records every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < windowMs);
      if (validTimestamps.length === 0) {
        requests.delete(ip);
      } else {
        requests.set(ip, validTimestamps);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const timestamps = (requests.get(ip) || []).filter(ts => now - ts < windowMs);
    timestamps.push(now);
    requests.set(ip, timestamps);

    if (timestamps.length > maxRequests) {
      return res.status(429).json({
        success: false,
        error: message
      });
    }

    next();
  };
};

module.exports = { createRateLimiter };
