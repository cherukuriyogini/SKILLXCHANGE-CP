const express = require('express');
const { createTicket, getTickets, getTicket, replyToTicket, updateTicketStatus } = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/:id/reply', replyToTicket);
router.patch('/:id/status', authorize('admin', 'moderator'), updateTicketStatus);

module.exports = router;
