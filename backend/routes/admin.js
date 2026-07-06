const express = require('express');
const { 
  getStats, 
  blockUser, 
  promoteUser, 
  updateUserRole, 
  deleteUser, 
  flagUser, 
  verifyMentor, 
  revokeMentor, 
  warnUser, 
  removeSkill,
  getModeratorStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All admin/moderator routes require authentication
router.use(protect);

// Admin-only operations
router.get('/stats', authorize('admin'), getStats);
router.patch('/promote/:userId', authorize('admin'), promoteUser);
router.patch('/role/:userId', authorize('admin'), updateUserRole);
router.delete('/user/:userId', authorize('admin'), deleteUser);

// Admin and Moderator shared operations
router.patch('/block/:userId', authorize('admin', 'moderator'), blockUser);
router.patch('/flag/:userId', authorize('admin', 'moderator'), flagUser);
router.patch('/verify-mentor/:userId', authorize('admin', 'moderator'), verifyMentor);
router.patch('/revoke-mentor/:userId', authorize('admin', 'moderator'), revokeMentor);
router.post('/warn/:userId', authorize('admin', 'moderator'), warnUser);
router.patch('/remove-skill/:userId', authorize('admin', 'moderator'), removeSkill);
router.get('/moderator-stats', authorize('admin', 'moderator'), getModeratorStats);

module.exports = router;
