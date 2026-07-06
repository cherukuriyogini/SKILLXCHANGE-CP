const Ticket = require('../models/Ticket');
const createAndEmitNotification = require('../utils/notificationHelper');

// @desc    Create a ticket
// @route   POST /api/tickets
// @access  Private
exports.createTicket = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const ticket = await Ticket.create(req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all tickets
// @route   GET /api/tickets
// @access  Private/Moderator/Admin
exports.getTickets = async (req, res) => {
  try {
    let filter = {};
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('moderator')) {
      filter = { userId: req.user.id };
    }
    
    const tickets = await Ticket.find(filter).populate('userId', 'name email avatar').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single ticket
// @route   GET /api/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id).populate('userId assignedTo', 'name email avatar');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    
    // Check ownership
    if (ticket.userId._id.toString() !== req.user.id && !req.user.roles.includes('admin') && !req.user.roles.includes('moderator')) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Reply to ticket
// @route   POST /api/tickets/:id/reply
// @access  Private
exports.replyToTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    const reply = {
      sender: req.user.id,
      message: req.body.message,
      createdAt: new Date()
    };

    ticket.replies.push(reply);
    
    if (req.user.roles.includes('moderator') || req.user.roles.includes('admin')) {
      ticket.status = 'in-progress';
      ticket.assignedTo = req.user.id;
    }

    await ticket.save();

    // Notify user if moderator replied
    if (req.user.roles.includes('moderator') || req.user.roles.includes('admin')) {
        await createAndEmitNotification(req.app, {
            recipient: ticket.userId,
            sender: req.user.id,
            type: 'ticket_update',
            title: 'Support Ticket Update',
            message: `A moderator has replied to your ticket: "${ticket.subject}"`,
            relatedId: ticket._id
        });
    }

    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update ticket status
// @route   PATCH /api/tickets/:id/status
// @access  Private/Moderator/Admin
exports.updateTicketStatus = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
