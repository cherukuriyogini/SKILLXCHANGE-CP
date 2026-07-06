const express = require('express');
const { getLearningPaths, createLearningPath, updateLearningPath } = require('../controllers/learningPathController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createLearningPath);
router.get('/', getLearningPaths); // Get current user's paths
router.get('/:userId', getLearningPaths);
router.put('/:id', updateLearningPath);

module.exports = router;
