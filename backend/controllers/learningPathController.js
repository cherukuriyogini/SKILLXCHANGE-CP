const LearningPath = require('../models/LearningPath');

// @desc    Get user learning paths
// @route   GET /api/learning-path/:userId
// @access  Private
exports.getLearningPaths = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const paths = await LearningPath.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: paths.length, data: paths });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create learning path
// @route   POST /api/learning-path
// @access  Private
exports.createLearningPath = async (req, res) => {
  try {
    req.body.userId = req.user.id;
    const path = await LearningPath.create(req.body);
    res.status(201).json({ success: true, data: path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update learning path
// @route   PUT /api/learning-path/:id
// @access  Private
exports.updateLearningPath = async (req, res) => {
  try {
    const path = await LearningPath.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    res.status(200).json({ success: true, data: path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
