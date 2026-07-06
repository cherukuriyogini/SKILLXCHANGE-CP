const PeerGroup = require('../models/PeerGroup');
const User = require('../models/User');

// @desc    Get all peer groups
// @route   GET /api/peer-groups
// @access  Private
exports.getPeerGroups = async (req, res) => {
  try {
    const { skill, level } = req.query;
    let filter = { isActive: true };

    if (skill) filter.skill = skill;
    if (level) filter.level = level;

    const groups = await PeerGroup.find(filter)
      .populate('members.userId', 'name avatar reputationScore')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single peer group
// @route   GET /api/peer-groups/:id
// @access  Private
exports.getPeerGroup = async (req, res) => {
  try {
    const group = await PeerGroup.findById(req.params.id)
      .populate('members.userId', 'name avatar reputationScore')
      .populate('createdBy', 'name')
      .populate('chatMessages.userId', 'name avatar');

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create peer group
// @route   POST /api/peer-groups
// @access  Private
exports.createPeerGroup = async (req, res) => {
  try {
    const { name, skill, level, maxMembers } = req.body;

    const group = await PeerGroup.create({
      name,
      skill,
      level: level || 'beginner',
      maxMembers: maxMembers || 6,
      createdBy: req.user.id,
      members: [{
        userId: req.user.id,
        role: 'leader'
      }]
    });

    res.status(201).json({
      success: true,
      data: group
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Join peer group
// @route   POST /api/peer-groups/:id/join
// @access  Private
exports.joinPeerGroup = async (req, res) => {
  try {
    const group = await PeerGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    if (!group.isActive) {
      return res.status(400).json({ success: false, message: 'Group is no longer active' });
    }

    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ success: false, message: 'Group is full' });
    }

    // Check if user is already a member
    const isMember = group.members.some(member => member.userId.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this group' });
    }

    group.members.push({
      userId: req.user.id,
      role: 'member'
    });

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Successfully joined the group'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Leave peer group
// @route   POST /api/peer-groups/:id/leave
// @access  Private
exports.leavePeerGroup = async (req, res) => {
  try {
    const group = await PeerGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    const memberIndex = group.members.findIndex(member => member.userId.toString() === req.user.id);
    if (memberIndex === -1) {
      return res.status(400).json({ success: false, message: 'Not a member of this group' });
    }

    // If leaving member is leader, assign new leader or disband
    if (group.members[memberIndex].role === 'leader' && group.members.length > 1) {
      group.members[1].role = 'leader';
    }

    group.members.splice(memberIndex, 1);

    // If no members left, deactivate group
    if (group.members.length === 0) {
      group.isActive = false;
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Send message in peer group
// @route   POST /api/peer-groups/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const group = await PeerGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    const isMember = group.members.some(member => member.userId.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    group.chatMessages.push({
      userId: req.user.id,
      message: message.trim()
    });

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update peer group
// @route   PUT /api/peer-groups/:id
// @access  Private (Group leader only)
exports.updatePeerGroup = async (req, res) => {
  try {
    const group = await PeerGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    const isLeader = group.members.some(member =>
      member.userId.toString() === req.user.id && member.role === 'leader'
    );

    if (!isLeader) {
      return res.status(403).json({ success: false, message: 'Only group leader can update' });
    }

    const { name, skill, level, maxMembers } = req.body;

    if (name) group.name = name;
    if (skill) group.skill = skill;
    if (level) group.level = level;
    if (maxMembers) group.maxMembers = maxMembers;

    await group.save();

    res.status(200).json({
      success: true,
      data: group
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete peer group
// @route   DELETE /api/peer-groups/:id
// @access  Private (Group leader only)
exports.deletePeerGroup = async (req, res) => {
  try {
    const group = await PeerGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: 'Peer group not found' });
    }

    const isLeader = group.members.some(member =>
      member.userId.toString() === req.user.id && member.role === 'leader'
    );

    if (!isLeader) {
      return res.status(403).json({ success: false, message: 'Only group leader can delete' });
    }

    group.isActive = false;
    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group deactivated successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};