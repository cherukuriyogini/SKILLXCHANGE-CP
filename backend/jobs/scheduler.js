/**
 * jobs/scheduler.js — Automated Background Scheduled Tasks
 * =========================================================
 * Uses node-cron to run background maintenance and automated workflows:
 *   1. Session Reminders (every minute)
 *   2. Daily Streak Check & Reset (every midnight)
 *   3. Stale Session Auto-Cleanup (every hour)
 */

'use strict';

const cron = require('node-cron');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const User = require('../models/User');

let scheduledJobs = [];

/**
 * Initialize all automated cron jobs
 * @param {import('socket.io').Server} io - Socket.io server instance for live alerts
 */
function initScheduler(io) {
  console.log('[Scheduler] Initializing automated background cron jobs...');

  // ── Job 1: Session Reminders (Runs every 1 minute) ──────────────────────────
  const sessionReminderJob = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);
      const twentyNineMinutesLater = new Date(now.getTime() + 29 * 60 * 1000);

      // Find accepted sessions starting in ~30 minutes
      const upcomingSessions = await Session.find({
        status: 'accepted',
        scheduledTime: {
          $gte: twentyNineMinutesLater,
          $lte: thirtyMinutesLater
        }
      }).populate('learnerId mentorId', 'name email');

      for (const session of upcomingSessions) {
        // Send notification to learner
        if (session.learnerId) {
          const learnerNotif = await Notification.create({
            recipient: session.learnerId._id,
            type: 'session_reminder',
            title: 'Upcoming Session in 30 Minutes',
            message: `Your session on "${session.topic}" with ${session.mentorId?.name || 'your mentor'} starts in 30 minutes!`,
            relatedId: session._id
          });

          if (io) {
            io.to(`user_${session.learnerId._id}`).emit('notification', {
              type: 'session_reminder',
              title: learnerNotif.title,
              message: learnerNotif.message,
              sessionId: session.sessionId
            });
          }
        }

        // Send notification to mentor
        if (session.mentorId) {
          const mentorNotif = await Notification.create({
            recipient: session.mentorId._id,
            type: 'session_reminder',
            title: 'Upcoming Session in 30 Minutes',
            message: `Your session on "${session.topic}" with ${session.learnerId?.name || 'your learner'} starts in 30 minutes!`,
            relatedId: session._id
          });

          if (io) {
            io.to(`user_${session.mentorId._id}`).emit('notification', {
              type: 'session_reminder',
              title: mentorNotif.title,
              message: mentorNotif.message,
              sessionId: session.sessionId
            });
          }
        }
      }

      if (upcomingSessions.length > 0) {
        console.log(`[Scheduler] Dispatched reminders for ${upcomingSessions.length} upcoming session(s)`);
      }
    } catch (err) {
      console.error('[Scheduler] Error in session reminder job:', err.message);
    }
  });

  // ── Job 2: Daily Streak Check (Runs every day at 00:05 AM) ──────────────────
  const dailyStreakJob = cron.schedule('5 0 * * *', async () => {
    try {
      console.log('[Scheduler] Running daily streak audit...');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      // Reset streak for users who have a streak > 0 but were not active yesterday or today
      const result = await User.updateMany(
        {
          currentStreak: { $gt: 0 },
          lastActiveDate: { $lt: yesterday }
        },
        {
          $set: { currentStreak: 0 }
        }
      );

      console.log(`[Scheduler] Streak audit completed. Reset streaks for ${result.modifiedCount} inactive user(s).`);
    } catch (err) {
      console.error('[Scheduler] Error in daily streak job:', err.message);
    }
  });

  // ── Job 3: Stale Session Auto-Cleanup (Runs every hour at minute 0) ────────
  const staleSessionCleanupJob = cron.schedule('0 * * * *', async () => {
    try {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      // Find sessions that were requested but never accepted after 48 hours
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const expiredRequests = await Session.updateMany(
        {
          status: 'requested',
          createdAt: { $lt: twoDaysAgo }
        },
        {
          $set: { status: 'cancelled', notes: 'Automatically cancelled due to inactivity.' }
        }
      );

      // Mark accepted sessions that passed without action as no-show
      const staleAccepted = await Session.updateMany(
        {
          status: 'accepted',
          scheduledTime: { $lt: fourHoursAgo }
        },
        {
          $set: { status: 'no-show', notes: 'Session scheduled time passed without completion.' }
        }
      );

      if (expiredRequests.modifiedCount > 0 || staleAccepted.modifiedCount > 0) {
        console.log(`[Scheduler] Cleanup: ${expiredRequests.modifiedCount} expired request(s), ${staleAccepted.modifiedCount} stale session(s) updated.`);
      }
    } catch (err) {
      console.error('[Scheduler] Error in stale session cleanup job:', err.message);
    }
  });

  scheduledJobs.push(sessionReminderJob, dailyStreakJob, staleSessionCleanupJob);
  console.log('[Scheduler] ✓ 3 automated cron jobs active (Reminders, Streaks, Cleanup)');
}

/**
 * Stop all running cron jobs
 */
function stopScheduler() {
  scheduledJobs.forEach(job => job.stop());
  scheduledJobs = [];
  console.log('[Scheduler] Stopped all cron jobs.');
}

module.exports = {
  initScheduler,
  stopScheduler
};
