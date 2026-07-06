const express = require('express');
const {
  getPeerGroups,
  getPeerGroup,
  createPeerGroup,
  joinPeerGroup,
  leavePeerGroup,
  sendMessage,
  updatePeerGroup,
  deletePeerGroup
} = require('../controllers/peerGroupController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getPeerGroups)
  .post(createPeerGroup);

router.route('/:id')
  .get(getPeerGroup)
  .put(updatePeerGroup)
  .delete(deletePeerGroup);

router.post('/:id/join', joinPeerGroup);
router.post('/:id/leave', leavePeerGroup);
router.post('/:id/messages', sendMessage);

module.exports = router;