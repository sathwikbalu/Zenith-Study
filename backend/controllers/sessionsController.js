const StudySession = require("../models/StudySession");

// @desc    Get all study sessions
// @route   GET /api/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const sessions = await StudySession.find({})
      .populate("createdBy", "name")
      .populate("participants", "name")
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single study session
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id)
      .populate("createdBy", "name")
      .populate("participants", "name");

    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new study session
// @route   POST /api/sessions
// @access  Private (Tutors only)
const createSession = async (req, res) => {
  try {
    // Only tutors can create sessions
    if (req.user.role !== "tutor") {
      return res
        .status(403)
        .json({ message: "Only tutors can create sessions" });
    }

    const { title, subject, description, startTime, endTime, maxParticipants } =
      req.body;

    const session = new StudySession({
      title,
      subject,
      description,
      startTime,
      endTime,
      createdBy: req.user._id,
      maxParticipants,
      participants: [req.user._id], // Creator is automatically a participant
    });

    const createdSession = await session.save();

    // Populate the references before sending response
    const populatedSession = await StudySession.findById(createdSession._id)
      .populate("createdBy", "name")
      .populate("participants", "name");

    res.status(201).json(populatedSession);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a study session
// @route   PUT /api/sessions/:id
// @access  Private (Creator only)
const updateSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (session) {
      // Only the creator can update the session
      if (session.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "User not authorized" });
      }

      session.title = req.body.title || session.title;
      session.subject = req.body.subject || session.subject;
      session.description = req.body.description || session.description;
      session.startTime = req.body.startTime || session.startTime;
      session.endTime = req.body.endTime || session.endTime;
      session.status = req.body.status || session.status;
      session.maxParticipants =
        req.body.maxParticipants || session.maxParticipants;

      const updatedSession = await session.save();

      // Populate the references before sending response
      const populatedSession = await StudySession.findById(updatedSession._id)
        .populate("createdBy", "name")
        .populate("participants", "name");

      res.json(populatedSession);
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a study session
// @route   DELETE /api/sessions/:id
// @access  Private (Creator only)
const deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (session) {
      // Only the creator can delete the session
      if (session.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "User not authorized" });
      }

      await session.remove();
      res.json({ message: "Session removed" });
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a study session
// @route   POST /api/sessions/:id/join
// @access  Private
const joinSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (session) {
      // Check if user is already a participant
      if (session.participants.includes(req.user._id)) {
        return res.status(400).json({ message: "Already joined this session" });
      }

      // Check if session is full
      if (session.participants.length >= session.maxParticipants) {
        return res.status(400).json({ message: "Session is full" });
      }

      // Add user to participants
      session.participants.push(req.user._id);
      const updatedSession = await session.save();

      // Populate the references before sending response
      const populatedSession = await StudySession.findById(updatedSession._id)
        .populate("createdBy", "name")
        .populate("participants", "name");

      res.json(populatedSession);
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a study session
// @route   POST /api/sessions/:id/leave
// @access  Private
const leaveSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);

    if (session) {
      // Check if user is a participant
      const participantIndex = session.participants.indexOf(req.user._id);
      if (participantIndex === -1) {
        return res
          .status(400)
          .json({ message: "Not a participant of this session" });
      }

      // Remove user from participants
      session.participants.splice(participantIndex, 1);
      const updatedSession = await session.save();

      // Populate the references before sending response
      const populatedSession = await StudySession.findById(updatedSession._id)
        .populate("createdBy", "name")
        .populate("participants", "name");

      res.json(populatedSession);
    } else {
      res.status(404).json({ message: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  joinSession,
  leaveSession,
};
