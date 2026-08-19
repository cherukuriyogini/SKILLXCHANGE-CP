/**
 * config/redis.js — Redis Client Setup with Graceful Fallback
 * ==========================================================
 * Provides Redis caching with in-memory / no-op fallback when Redis is unavailable.
 */

'use strict';

const Redis = require('ioredis');

let redisClient = null;
let isConnected = false;

const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379';

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying after 3 attempts, fallback cleanly
        return null;
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true
  });

  redisClient.connect()
    .then(() => {
      isConnected = true;
      console.log('[Redis] ✓ Connected successfully to Redis server');
    })
    .catch((err) => {
      isConnected = false;
      console.warn(`[Redis] ⚠ Redis unavailable (${err.message}). Caching disabled, falling back to direct DB queries.`);
    });

  redisClient.on('error', (err) => {
    isConnected = false;
    // Suppress connection spam
  });

  redisClient.on('connect', () => {
    isConnected = true;
  });

  redisClient.on('close', () => {
    isConnected = false;
  });
} catch (error) {
  console.warn(`[Redis] ⚠ Initialization error: ${error.message}`);
  isConnected = false;
}

/**
 * Get value from cache (parsed JSON)
 */
async function getCache(key) {
  if (!isConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[Redis] Get error for key ${key}:`, err.message);
    return null;
  }
}

/**
 * Set value in cache (serialized JSON) with TTL in seconds
 */
async function setCache(key, value, ttlSeconds = 300) {
  if (!isConnected || !redisClient) return false;
  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.set(key, payload, 'EX', ttlSeconds);
    } else {
      await redisClient.set(key, payload);
    }
    return true;
  } catch (err) {
    console.error(`[Redis] Set error for key ${key}:`, err.message);
    return false;
  }
}

/**
 * Delete key(s) or keys matching wildcard pattern
 */
async function delCache(keyOrPattern) {
  if (!isConnected || !redisClient) return false;
  try {
    if (keyOrPattern.includes('*')) {
      const keys = await redisClient.keys(keyOrPattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } else {
      await redisClient.del(keyOrPattern);
    }
    return true;
  } catch (err) {
    console.error(`[Redis] Del error for ${keyOrPattern}:`, err.message);
    return false;
  }
}

module.exports = {
  redisClient,
  isRedisConnected: () => isConnected,
  getCache,
  setCache,
  delCache
};
