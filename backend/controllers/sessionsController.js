const StudySession = require("../models/StudySession");
const Note = require("../models/Note");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
      expireAt: endTime, // Auto-delete session after it ends
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

      // Update expireAt if endTime changes
      if (req.body.endTime) {
        session.expireAt = req.body.endTime;
      }

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

// @desc    Complete a study session and generate notes for all participants
// @route   POST /api/sessions/:id/complete
// @access  Private (Creator only)
const completeSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id).populate(
      "participants",
      "_id name"
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only the creator can complete the session
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "User not authorized" });
    }

    // Update session status to completed
    session.status = "completed";
    await session.save();

    console.log(`Completing session: ${session.title}`);
    console.log(`Participants count: ${session.participants.length}`);

    // Generate notes using AI
    try {
      console.log("Calling AI backend to generate notes...");
      const aiResponse = await fetch(
        "http://localhost:5001/api/generate-session-notes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: session.title,
            subject: session.subject,
            description: session.description || "",
          }),
        }
      );

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI backend error: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      const generatedContent = aiData.content;

      console.log("AI content generated successfully");
      console.log(`Content length: ${generatedContent.length} characters`);

      // Create notes for all participants
      const createdNotes = [];
      for (const participant of session.participants) {
        try {
          console.log(`Creating note for participant: ${participant._id}`);
          console.log(`Participant object:`, participant);
          
          const noteData = {
            title: session.title,
            subject: session.subject,
            content: `${session.description ? session.description + "\n\n" : ""}${generatedContent}`,
            userId: participant._id,
            starred: false,
          };
          
          console.log(`Note data to save:`, noteData);
          
          const note = new Note(noteData);
          const savedNote = await note.save();
          
          console.log(`Note saved with ID: ${savedNote._id}`);
          console.log(`Note userId: ${savedNote.userId}`);
          
          createdNotes.push(savedNote);
          console.log(`✅ Note created successfully for user ${participant._id}`);
        } catch (noteError) {
          console.error(`❌ Error creating note for participant ${participant._id}:`, noteError);
          console.error(`Error details:`, noteError.message);
        }
      }

      console.log(`Successfully created ${createdNotes.length} notes`);

      res.json({
        message: "Session completed and notes generated for all participants",
        session: session,
        notesCount: createdNotes.length,
        success: true,
      });
    } catch (aiError) {
      console.error("Error generating notes:", aiError);
      // Still mark session as completed even if note generation fails
      res.status(500).json({
        message:
          "Session completed but failed to generate notes. AI backend may not be running.",
        session: session,
        error: aiError.message,
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in completeSession:", error);
    res.status(500).json({ message: error.message, success: false });
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
  completeSession,
};
