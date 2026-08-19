/**
 * middleware/cache.js — Redis Cache Middleware
 * ============================================
 */

'use strict';

const { getCache, setCache, delCache } = require('../config/redis');

/**
 * Cache middleware generator for Express routes
 * @param {number} ttlSeconds - Time-to-live in seconds (default 120)
 * @param {Function} [keyGenerator] - Optional custom key generator (req) => string
 */
function cacheResponse(ttlSeconds = 120, keyGenerator = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userId = req.user ? req.user._id || req.user.id : 'anon';
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `cache:${req.baseUrl || ''}${req.path}:${userId}:${JSON.stringify(req.query)}`;

    try {
      const cachedData = await getCache(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }

      // Cache MISS: intercept res.json to cache the response body
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // On error, continue without cache
      next();
    }
  };
}

/**
 * Middleware or helper to invalidate cache keys by pattern
 * @param {string|string[]} patterns
 */
function clearCache(patterns) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternList = Array.isArray(patterns) ? patterns : [patterns];
        for (const pattern of patternList) {
          const formatted = typeof pattern === 'function' ? pattern(req) : pattern;
          await delCache(formatted).catch(() => {});
        }
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = {
  cacheResponse,
  clearCache
};
