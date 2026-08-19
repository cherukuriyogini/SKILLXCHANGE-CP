const express = require('express');
const {
  createSession,
  getSessions,
  getSession,
  updateSession,
  deleteSession,
  acceptSession,
  rejectSession,
  completeSession,
  submitFeedback,
  getDashboardStats,
  cancelSession,
  requestReschedule,
  confirmReschedule,
  markNoShow
} = require('../controllers/sessionController');
const { protect, authorize } = require('../middleware/auth');
const { cacheResponse, clearCache } = require('../middleware/cache');

const router = express.Router();

router.use(protect);

// Invalidation patterns for session mutations
const sessionInvalidate = [
  (req) => `cache:sessions:user:${req.user?.id || '*'}:*`,
  (req) => `cache:sessions:detail:${req.params?.id || '*'}`,
  (req) => `cache:sessions:stats:${req.user?.id || '*'}`
];

// Stats cached for 60s
router.get('/stats', cacheResponse(60, (req) => `cache:sessions:stats:${req.user.id}`), getDashboardStats);

router.route('/')
  .get(cacheResponse(60, (req) => `cache:sessions:user:${req.user.id}:${JSON.stringify(req.query)}`), getSessions)
  .post(clearCache(['cache:sessions:*']), createSession);

router.route('/:id')
  .get(cacheResponse(60, (req) => `cache:sessions:detail:${req.params.id}`), getSession)
  .put(clearCache(sessionInvalidate), updateSession)
  .patch(clearCache(sessionInvalidate), updateSession)
  .delete(clearCache(sessionInvalidate), deleteSession);

router.patch('/:id/accept', authorize('mentor'), clearCache(sessionInvalidate), acceptSession);
router.patch('/:id/reject', authorize('mentor'), clearCache(sessionInvalidate), rejectSession);
router.patch('/:id/complete', clearCache(sessionInvalidate), completeSession);
router.patch('/:id/feedback', clearCache(sessionInvalidate), submitFeedback);
router.patch('/:id/cancel', clearCache(sessionInvalidate), cancelSession);
router.patch('/:id/no-show', clearCache(sessionInvalidate), markNoShow);
router.patch('/:id/reschedule-request', clearCache(sessionInvalidate), requestReschedule);
router.patch('/:id/reschedule-confirm', clearCache(sessionInvalidate), confirmReschedule);

module.exports = router;
