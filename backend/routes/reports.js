const express = require('express');
const { createReport, getReports, updateReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createReport);
router.get('/', authorize('admin', 'moderator'), getReports);
router.put('/:id', authorize('admin', 'moderator'), updateReport);

module.exports = router;
