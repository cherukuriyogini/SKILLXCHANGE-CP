/**
 * config/env.js — Startup Environment Validator
 * ================================================
 * Validates that all required environment variables are present
 * BEFORE the server begins listening. If any are missing, the
 * process exits immediately with a clear, actionable error message.
 *
 * HOW IT WORKS:
 *   1. dotenv.config() must be called BEFORE this module is imported.
 *   2. This module checks process.env for each required key.
 *   3. On failure: logs every missing key and exits with code 1.
 *   4. On success: logs a single "✓ env OK" confirmation and returns.
 *
 * IMPORTANT RULES:
 *   - This module NEVER generates, rotates, or overwrites any credential.
 *   - It only reads from process.env — it never writes to it.
 *   - Add new required keys to REQUIRED_VARS below; do not scatter
 *     validation logic across other files.
 */

'use strict';

// ─── Required Variables ───────────────────────────────────────────────────────
// These must be present in .env before the server will start.
// Optional variables (OPENAI_API_KEY, Cloudinary, Email) are excluded here
// because the app degrades gracefully when they are absent.

const REQUIRED_VARS = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRE',
  'JWT_REFRESH_EXPIRE',
  'COOKIE_SECRET',
  'ADMIN_EMAIL',
];

// ─── Optional Variables (warn if missing, do not block startup) ───────────────
const OPTIONAL_VARS = [
  'GEMINI_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'FRONTEND_URL',
  'CLIENT_URL',
];

// ─── Validation ───────────────────────────────────────────────────────────────
function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => {
    const val = process.env[key];
    // Treat empty string as missing
    return val === undefined || val === null || val.trim() === '';
  });

  if (missing.length > 0) {
    console.error('\n╔══════════════════════════════════════════════════════╗');
    console.error('║  STARTUP FAILED — Missing Environment Variables      ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    console.error('\nThe following required variables are missing from .env:\n');
    missing.forEach((key) => console.error(`  ✗  ${key}`));
    console.error(
      '\nFix: Add the missing variables to backend/.env\n' +
      'Reference: backend/.env.example lists all required keys.\n'
    );
    process.exit(1);
  }

  // Warn about missing optional variables (non-blocking)
  const missingOptional = OPTIONAL_VARS.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || val.trim() === '';
  });

  if (missingOptional.length > 0) {
    console.warn('\n[EnvValidator] ⚠  Optional variables not set (features may be limited):');
    missingOptional.forEach((key) => console.warn(`   -  ${key}`));
    console.warn('');
  }

  console.log('[EnvValidator] ✓ All required environment variables are present.');
}

module.exports = { validateEnv };
