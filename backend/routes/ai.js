const express = require('express');
const { doubtSolver, aiTutor, sessionSummary, generatePath, downloadSummary } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.post('/doubt-solver', upload.single('file'), doubtSolver);
router.post('/tutor', aiTutor);
router.post('/session-summary', upload.single('file'), sessionSummary);
router.post('/learning-path-generator', generatePath);
router.post('/meeting-summary', upload.single('audio'), require('../controllers/aiController').meetingSummary);
router.get('/summaries', require('../controllers/aiController').getSummaries);
router.get('/chat-history', require('../controllers/aiController').getChatHistory);
router.get('/session-summary/:id/download', downloadSummary);

module.exports = router;
