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

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.route('/')
  .get(getSessions)
  .post(createSession);

router.route('/:id')
  .get(getSession)
  .put(updateSession)
  .patch(updateSession)
  .delete(deleteSession);

router.patch('/:id/accept', authorize('mentor'), acceptSession);
router.patch('/:id/reject', authorize('mentor'), rejectSession);
router.patch('/:id/complete', completeSession);
router.patch('/:id/feedback', submitFeedback);
router.patch('/:id/cancel', cancelSession);
router.patch('/:id/no-show', markNoShow);
router.patch('/:id/reschedule-request', requestReschedule);
router.patch('/:id/reschedule-confirm', confirmReschedule);

module.exports = router;
