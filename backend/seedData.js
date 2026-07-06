/**
 * seedData.js — Idempotent Database Seeder
 * ==========================================
 * Populates the database with initial demo data.
 *
 * DEFAULT BEHAVIOUR (safe — no data is deleted):
 *   node seedData.js
 *   npm run seed
 *
 *   Only inserts users/peer-groups that do NOT already exist.
 *   Existing data is NEVER modified or deleted.
 *
 * DESTRUCTIVE RESET (wipes ALL data first):
 *   node seedData.js --force
 *   npm run seed:force
 *
 *   ⚠  WARNING: --force deletes all Users, Sessions, and PeerGroups
 *   before re-seeding. Use only in development. NEVER in production.
 *
 * CREDENTIALS:
 *   Seed passwords ('password123') are only used for development demo
 *   accounts. They are hashed by the User model's pre-save hook.
 *   These credentials are NOT used in production.
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const mongoose = require('mongoose');
const User = require('./models/User');
const Session = require('./models/Session');
const PeerGroup = require('./models/PeerGroup');

// ── Seed Data Definitions ─────────────────────────────────────────────────────

const users = [
  {
    name: 'Demo Learner',
    email: 'learner@skillxchange.com',
    password: 'password123',
    roles: ['learner'],
    bio: 'I am a passionate learner looking to pick up new skills.',
    skillsLearn: ['React', 'Node.js', 'Python']
  },
  {
    name: 'Demo Mentor',
    email: 'mentor@skillxchange.com',
    password: 'password123',
    roles: ['mentor'],
    bio: 'Experienced developer willing to share knowledge.',
    skillsTeach: ['JavaScript', 'CSS', 'HTML', 'React'],
    reputationScore: 95
  },
  {
    name: 'Demo Moderator',
    email: 'moderator@skillxchange.com',
    password: 'password123',
    roles: ['moderator'],
    bio: 'Ensuring the community stays helpful and safe.'
  },
  {
    name: 'Demo Admin',
    email: 'admin@skillxchange.com',
    password: 'password123',
    roles: ['admin'],
    bio: 'Platform administrator.'
  },
  {
    name: 'Sarah Martinez',
    email: 'sarah@skillxchange.com',
    password: 'password123',
    roles: ['mentor'],
    bio: 'Senior Python Developer with 8+ years of experience in Data Science and ML.',
    skillsTeach: ['Python', 'Data Science', 'Machine Learning'],
    reputationScore: 1250,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sarah'
  },
  {
    name: 'David Chen',
    email: 'david@skillxchange.com',
    password: 'password123',
    roles: ['mentor'],
    bio: 'React and Frontend Architect. Love teaching complex concepts simply.',
    skillsTeach: ['React', 'JavaScript', 'TypeScript', 'Tailwind'],
    reputationScore: 980,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=David'
  },
  {
    name: 'Alex Rivera',
    email: 'alex@skillxchange.com',
    password: 'password123',
    roles: ['mentor'],
    bio: 'Fullstack Engineer specializing in Node.js and Cloud architecture.',
    skillsTeach: ['Node.js', 'Express', 'MongoDB', 'AWS'],
    reputationScore: 850,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alex'
  }
];

const sessionTemplates = [
  {
    topic: 'Introduction to React Hooks',
    status: 'completed',
    scheduledTime: new Date(Date.now() - 86400000 * 2),
    rating: 5,
    feedback: 'Excellent explanation of useEffect!'
  },
  {
    topic: 'Advanced Python Decorators',
    status: 'ai-substitute',
    scheduledTime: new Date(Date.now() - 86400000),
    rating: 4,
    feedback: 'Mentor was busy but AI tutor was surprisingly helpful!'
  }
];

const peerGroupTemplates = [
  {
    name: 'Python Beginners',
    skill: 'Python',
    level: 'beginner',
    maxMembers: 6,
    welcomeMessage: "Welcome to Python Beginners! Let's start with variables."
  },
  {
    name: 'React Enthusiasts',
    skill: 'React',
    level: 'intermediate',
    maxMembers: 5,
    welcomeMessage: 'Anyone working on hooks projects?'
  }
];

// ── Main Seeder ───────────────────────────────────────────────────────────────

const seedData = async () => {
  const isForce = process.argv.includes('--force');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[seed] ✓ Connected to MongoDB.');

    if (isForce) {
      // ── DESTRUCTIVE MODE ────────────────────────────────────────────────
      console.log('\n[seed] ⚠  --force flag detected.');
      console.log('[seed] ⚠  Deleting ALL Users, Sessions, and PeerGroups...');
      await User.deleteMany({});
      await Session.deleteMany({});
      await PeerGroup.deleteMany({});
      console.log('[seed] ✓ Existing data cleared.\n');
    } else {
      // ── SAFE MODE (default) ─────────────────────────────────────────────
      console.log('[seed] Running in safe mode (no data will be deleted).');
      console.log('[seed] Use --force to wipe and re-seed from scratch.\n');
    }

    // ── Seed Users (skip if email already exists) ─────────────────────────
    const createdUsers = {};
    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        createdUsers[userData.email] = existing;
        skippedCount++;
        console.log(`[seed]   skip  ${userData.email} (already exists)`);
      } else {
        const user = await User.create(userData);
        createdUsers[userData.email] = user;
        createdCount++;
        console.log(`[seed]   create ${userData.email}`);
      }
    }

    console.log(`\n[seed] Users: ${createdCount} created, ${skippedCount} skipped.`);

    // ── Seed Sessions (only in --force mode to avoid duplicates) ──────────
    if (isForce) {
      const learner = createdUsers['learner@skillxchange.com'];
      const mentor  = createdUsers['mentor@skillxchange.com'];
      if (learner && mentor) {
        for (const s of sessionTemplates) {
          await Session.create({ ...s, learnerId: learner._id, mentorId: mentor._id });
        }
        console.log('[seed] ✓ Sessions seeded.');
      }
    }

    // ── Seed Peer Groups (skip if name already exists) ────────────────────
    const creator =
      createdUsers['sarah@skillxchange.com'] ||
      createdUsers['mentor@skillxchange.com'];

    if (creator) {
      for (const pg of peerGroupTemplates) {
        const existing = await PeerGroup.findOne({ name: pg.name });
        if (existing) {
          console.log(`[seed]   skip  PeerGroup "${pg.name}" (already exists)`);
        } else {
          const group = await PeerGroup.create({
            name: pg.name,
            skill: pg.skill,
            level: pg.level,
            maxMembers: pg.maxMembers,
            createdBy: creator._id,
            members: [{ userId: creator._id, role: 'leader' }],
            chatMessages: [{
              userId: creator._id,
              message: pg.welcomeMessage,
              timestamp: new Date(Date.now() - 86400000)
            }]
          });
          console.log(`[seed]   create PeerGroup "${group.name}"`);
        }
      }
    }

    console.log('\n[seed] ✓ Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('[seed] ✗ Error:', err.message);
    process.exit(1);
  }
};

seedData();
