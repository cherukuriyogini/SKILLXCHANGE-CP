const express = require('express');
const { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser, 
  getMentors, 
  getLeaderboard, 
  awardXP, 
  moderateUser, 
  uploadAvatar,
  updateSettings,
  updatePassword
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/gamification/leaderboard', getLeaderboard);
router.post('/:id/xp', authorize('admin', 'moderator'), awardXP);
router.patch('/:id/moderate', authorize('admin', 'moderator'), moderateUser);

router.put('/settings', updateSettings);
router.put('/update-password', updatePassword);

router.get('/', authorize('admin', 'moderator'), getUsers);
router.get('/mentors', getMentors);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
