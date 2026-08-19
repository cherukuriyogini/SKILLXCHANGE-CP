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
const { cacheResponse, clearCache } = require('../middleware/cache');

const router = express.Router();

router.use(protect);

// Leaderboard cached for 60s
router.get('/gamification/leaderboard', cacheResponse(60, () => 'cache:users:leaderboard'), getLeaderboard);
router.post('/:id/xp', authorize('admin', 'moderator'), clearCache(['cache:users:leaderboard', (req) => `cache:users:${req.params.id}`]), awardXP);
router.patch('/:id/moderate', authorize('admin', 'moderator'), clearCache(['cache:users:*', 'cache:mentors:*']), moderateUser);

router.put('/settings', clearCache((req) => `cache:users:${req.user.id}`), updateSettings);
router.put('/update-password', updatePassword);

router.get('/', authorize('admin', 'moderator'), getUsers);
// Mentors list cached for 180s (3 minutes)
router.get('/mentors', cacheResponse(180, (req) => `cache:mentors:${JSON.stringify(req.query)}`), getMentors);
// Single user cached for 120s
router.get('/:id', cacheResponse(120, (req) => `cache:users:${req.params.id}`), getUser);
router.put('/:id', clearCache([(req) => `cache:users:${req.params.id}`, 'cache:mentors:*']), updateUser);
router.put('/:id/avatar', upload.single('avatar'), clearCache([(req) => `cache:users:${req.params.id}`, 'cache:mentors:*']), uploadAvatar);
router.delete('/:id', authorize('admin'), clearCache(['cache:users:*', 'cache:mentors:*']), deleteUser);

module.exports = router;
