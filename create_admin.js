/**
 * create_admin.js — Root-level Idempotent Admin Setup
 * =====================================================
 * Thin wrapper around the backend admin creation logic.
 * Run from the project root directory.
 *
 * IDEMPOTENCY GUARANTEE:
 *   Safe to run multiple times — NEVER overwrites an existing password.
 *
 * FIX APPLIED:
 *   Previously used 'MONGODB_URI' (wrong key). Now correctly uses 'MONGO_URI'
 *   to match the backend/.env configuration.
 *
 * USAGE:
 *   node create_admin.js   (from project root)
 */

'use strict';

// Add backend/node_modules to resolve dependencies from the backend
const path = require('path');
module.paths.push(path.resolve(__dirname, 'backend', 'node_modules'));

// Load env from backend/.env (the canonical env file for this project)
require('dotenv').config({ path: path.resolve(__dirname, 'backend', '.env') });

const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillxchange.com';
// Initial password — only used if the admin does NOT yet exist.
const INITIAL_PASSWORD = 'Password123!';

const createAdmin = async () => {
  // Uses MONGO_URI (correct key) — previously was MONGODB_URI (wrong key)
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[create-admin] ✗ MONGO_URI is not set in backend/.env. Aborting.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('[create-admin] ✓ Connected to MongoDB.');

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });

    if (existingUser) {
      // ── Admin already exists ─────────────────────────────────────────────
      // Only patch roles if 'admin' is missing — NEVER touch the password.
      if (!existingUser.roles.includes('admin')) {
        existingUser.roles = [...new Set([...existingUser.roles, 'admin'])];
        await existingUser.save({ validateBeforeSave: false });
        console.log(`[create-admin] ✓ Admin role added to existing user: ${ADMIN_EMAIL}`);
      } else {
        console.log(
          `[create-admin] ✓ Admin already has correct roles. No changes made.`
        );
      }
    } else {
      // ── Admin does not exist — create for the first time ─────────────────
      await User.create({
        name: 'System Admin',
        email: ADMIN_EMAIL,
        password: INITIAL_PASSWORD,   // bcrypt pre-save hook will hash this
        roles: ['learner', 'mentor', 'moderator', 'admin'],
        bio: 'Platform Administrator',
        skillsTeach: ['System Administration', 'Security'],
        skillsLearn: []
      });
      console.log(`[create-admin] ✓ Admin account created: ${ADMIN_EMAIL}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[create-admin] ✗ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
