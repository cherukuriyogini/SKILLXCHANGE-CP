const Report = require('../models/Report');

// @desc    Create a report
// @route   POST /api/reports
// @access  Private
exports.createReport = async (req, res) => {
  try {
    const { reportedUserId, sessionId, type, reason } = req.body;
    
    const report = await Report.create({
      reporterId: req.user.id,
      reportedUserId,
      sessionId,
      type,
      reason
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all reports
// @route   GET /api/reports
// @access  Private/Admin/Moderator
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .populate('reportedUserId', 'name email')
      .populate('sessionId', 'topic status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Private/Admin/Moderator
exports.updateReport = async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
