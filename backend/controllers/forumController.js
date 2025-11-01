const Forum = require("../models/Forum");
const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Create a new forum
// @route   POST /api/forums
// @access  Private
const createForum = async (req, res) => {
  try {
    const { topic, description } = req.body;

    // Check if forum with this topic already exists
    const existingForum = await Forum.findOne({ topic });
    if (existingForum) {
      return res.status(400).json({ message: "Forum already exists" });
    }

    const forum = new Forum({
      topic,
      description,
      createdBy: req.user._id,
      members: [req.user._id], // Add creator as first member
    });

    const createdForum = await forum.save();

    // Populate the createdBy field with user details
    await createdForum.populate("createdBy", "name");

    res.status(201).json(createdForum);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all forums
// @route   GET /api/forums
// @access  Private
const getForums = async (req, res) => {
  try {
    const forums = await Forum.find()
      .populate("createdBy", "name")
      .populate("members", "name");

    // Add member count and unread message count for each forum
    const forumsWithDetails = await Promise.all(
      forums.map(async (forum) => {
        const memberCount = forum.members.length;

        // Count unread messages for the current user
        const unreadCount = await Message.countDocuments({
          forumId: forum._id,
          senderId: { $ne: req.user._id }, // Not sent by the user
          readBy: { $ne: req.user._id }, // Not read by the user
        });

        return {
          ...forum._doc,
          members: forum.members.map(member => member._id || member), // Include member IDs
          memberCount,
          unreadCount,
        };
      })
    );

    res.json(forumsWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a forum
// @route   POST /api/forums/:id/join
// @access  Private
const joinForum = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);

    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check if user is already a member
    if (forum.members.includes(req.user._id)) {
      return res.status(400).json({ message: "Already a member" });
    }

    forum.members.push(req.user._id);
    await forum.save();

    res.json({ message: "Successfully joined forum", forum });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all messages of a forum
// @route   GET /api/forums/:id/messages
// @access  Private
const getForumMessages = async (req, res) => {
  try {
    const forum = await Forum.findById(req.params.id);
    
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check if user is a member of the forum
    if (!forum.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a member of this forum" });
    }

    const messages = await Message.find({ forumId: req.params.id })
      .populate("senderId", "name")
      .sort({ createdAt: 1 });

    // Mark messages as read by the current user
    await Message.updateMany(
      {
        forumId: req.params.id,
        senderId: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      {
        $push: { readBy: req.user._id },
      }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message to a forum
// @route   POST /api/forums/:id/messages
// @access  Private
const sendForumMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const forumId = req.params.id;

    const forum = await Forum.findById(forumId);
    
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check if user is a member of the forum
    if (!forum.members.includes(req.user._id)) {
      return res.status(403).json({ message: "Not a member of this forum" });
    }

    const message = new Message({
      forumId,
      senderId: req.user._id,
      text,
      readBy: [req.user._id], // Mark as read by sender
    });

    const createdMessage = await message.save();
    
    // Populate sender details
    await createdMessage.populate("senderId", "name");

    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unread message count for a user in a forum
// @route   GET /api/forums/:id/unread/:userId
// @access  Private
const getUnreadCount = async (req, res) => {
  try {
    const { id: forumId, userId } = req.params;

    const forum = await Forum.findById(forumId);
    
    if (!forum) {
      return res.status(404).json({ message: "Forum not found" });
    }

    // Check if user is a member of the forum
    if (!forum.members.includes(userId)) {
      return res.status(403).json({ message: "Not a member of this forum" });
    }

    const unreadCount = await Message.countDocuments({
      forumId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    });

    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createForum,
  getForums,
  joinForum,
  getForumMessages,
  sendForumMessage,
  getUnreadCount,
};