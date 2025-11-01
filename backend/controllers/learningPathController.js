const LearningPath = require("../models/LearningPath");

// @desc    Get all learning paths for a user
// @route   GET /api/learning-paths
// @access  Private
const getLearningPaths = async (req, res) => {
  try {
    const learningPaths = await LearningPath.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });
    res.json(learningPaths);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single learning path
// @route   GET /api/learning-paths/:id
// @access  Private
const getLearningPathById = async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (
      learningPath &&
      learningPath.userId.toString() === req.user._id.toString()
    ) {
      res.json(learningPath);
    } else {
      res.status(404).json({ message: "Learning path not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new learning path
// @route   POST /api/learning-paths
// @access  Private
const createLearningPath = async (req, res) => {
  try {
    const { topic, skillLevel, duration, goal, content } = req.body;

    const learningPath = new LearningPath({
      topic,
      skillLevel,
      duration,
      goal,
      content,
      userId: req.user._id,
    });

    const createdLearningPath = await learningPath.save();
    res.status(201).json(createdLearningPath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a learning path
// @route   DELETE /api/learning-paths/:id
// @access  Private
const deleteLearningPath = async (req, res) => {
  try {
    const learningPath = await LearningPath.findById(req.params.id);

    if (
      learningPath &&
      learningPath.userId.toString() === req.user._id.toString()
    ) {
      await learningPath.deleteOne();
      res.json({ message: "Learning path removed" });
    } else {
      res.status(404).json({ message: "Learning path not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getLearningPaths,
  getLearningPathById,
  createLearningPath,
  deleteLearningPath,
};
