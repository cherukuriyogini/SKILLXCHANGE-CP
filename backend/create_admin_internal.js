/**
 * create_admin_internal.js — Idempotent Admin Account Setup
 * ===========================================================
 * Creates the platform admin account if it does not already exist.
 *
 * IDEMPOTENCY GUARANTEE:
 *   This script is SAFE TO RUN MULTIPLE TIMES. It will:
 *     ✓ Create the admin user if they do not exist.
 *     ✓ Add the 'admin' role if the user exists but lacks it.
 *     ✗ NEVER overwrite an existing password.
 *     ✗ NEVER delete or reset any existing data.
 *
 * CREDENTIALS:
 *   - The admin email comes from the ADMIN_EMAIL environment variable.
 *   - The initial password ('Password123!') is ONLY used on first creation.
 *   - Once the user exists, the password is never touched by this script.
 *
 * USAGE:
 *   node create_admin_internal.js
 *   npm run create-admin   (via package.json script)
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@skillxchange.com';
// Initial password — only used if the admin account does NOT yet exist.
// After first creation, this value is irrelevant; the hashed password in
// the database is the source of truth.
const INITIAL_PASSWORD = 'Password123!';

const createAdmin = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[create-admin] ✗ MONGO_URI is not set in .env. Aborting.');
    process.exit(1);
  }

  try {
    // Log only the host — never log credentials
    const safeUri = mongoUri.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb$1://<credentials>@');
    console.log(`[create-admin] Connecting to: ${safeUri}`);
    await mongoose.connect(mongoUri);
    console.log('[create-admin] ✓ Connected to MongoDB.');

    const existingUser = await User.findOne({ email: ADMIN_EMAIL });

    if (existingUser) {
      // ── Admin already exists ─────────────────────────────────────────────
      // Only patch the roles if the 'admin' role is somehow missing.
      // NEVER touch the password — the existing hash must remain intact.
      if (!existingUser.roles.includes('admin')) {
        existingUser.roles = [...new Set([...existingUser.roles, 'admin'])];
        await existingUser.save({ validateBeforeSave: false });
        console.log(`[create-admin] ✓ Admin role added to existing user: ${ADMIN_EMAIL}`);
      } else {
        console.log(
          `[create-admin] ✓ Admin account already exists and has the correct role. No changes made.`
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
        skillsTeach: [],
        skillsLearn: []
      });
      console.log(`[create-admin] ✓ Admin account created: ${ADMIN_EMAIL}`);
      console.log(`[create-admin]   Initial password set. Change it after first login.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[create-admin] ✗ Error:', err.message);
    process.exit(1);
  }
};

createAdmin();
