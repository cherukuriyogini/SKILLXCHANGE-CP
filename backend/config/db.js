/**
 * config/db.js — MongoDB Connection with Retry Logic
 * =====================================================
 * Connects to MongoDB using the MONGO_URI from .env.
 *
 * RETRY BEHAVIOUR:
 *   - Attempts up to MAX_RETRIES connections before giving up.
 *   - Waits RETRY_DELAY_MS between attempts.
 *   - On permanent failure, exits with code 1.
 *
 * SECURITY:
 *   - The full connection string (including credentials) is NEVER logged.
 *   - Only the host portion is printed for diagnostics.
 *
 * CREDENTIALS:
 *   - This module reads MONGO_URI from process.env.
 *   - It never generates, modifies, or stores any credential.
 */

'use strict';

const mongoose = require('mongoose');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Returns a safe-to-log version of the connection string
 * by stripping the user:password@ portion.
 */
function safeUri(uri) {
  try {
    // Hide credentials: mongodb+srv://user:pass@host → host
    return uri.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb$1://<credentials>@');
  } catch {
    return '<uri-parse-error>';
  }
}

/**
 * Connects to MongoDB with automatic retry.
 * @param {number} attempt - Current attempt number (1-indexed).
 */
const connectDB = async (attempt = 1) => {
  const uri = process.env.MONGO_URI;

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[DB] ✓ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(
      `[DB] ✗ Connection failed (attempt ${attempt}/${MAX_RETRIES}): ${error.message}`
    );
    console.error(`[DB]   URI (sanitised): ${safeUri(uri)}`);

    if (attempt < MAX_RETRIES) {
      console.log(`[DB]   Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(attempt + 1);
    }

    console.error('[DB] ✗ All connection attempts failed. Shutting down.');
    process.exit(1);
  }
};

module.exports = connectDB;
