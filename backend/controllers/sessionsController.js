const StudySession = require("../models/StudySession");
const Note = require("../models/Note");
const Assessment = require("../models/Assessment");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { createNotification } = require("./notificationController");
const User = require("../models/User");

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
    // Verify user is a tutor
    if (req.user.role !== "tutor") {
      return res.status(403).json({ message: "Access denied. Tutors only." });
    }

    const { title, description, subject, startTime, endTime, maxParticipants } =
      req.body;

    // Validate required fields
    if (!title || !subject || !startTime || !endTime) {
      return res.status(400).json({
        message: "Title, subject, start time, and end time are required",
      });
    }

    // Validate time
    if (new Date(startTime) >= new Date(endTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const session = new StudySession({
      title,
      description,
      subject,
      tutor: req.user._id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      maxParticipants,
      participants: [req.user._id], // Add tutor as first participant
    });

    const createdSession = await session.save();
    await createdSession.populate("tutor", "name");

    // Send notification to all students
    try {
      const students = await User.find({ role: "student" });
      const studentIds = students.map(student => student._id);
      
      await createNotification(studentIds, {
        type: "session_created",
        title: "New Study Session",
        message: `A new session "${title}" has been created by ${req.user.name}`,
        relatedId: createdSession._id,
      });
      
      // Emit socket event to notify all connected students
      io.emit("new-session", createdSession);
    } catch (notificationError) {
      console.error("Error sending notifications:", notificationError);
    }

    res.status(201).json(createdSession);
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
            content: `${
              session.description ? session.description + "\n\n" : ""
            }${generatedContent}`,
            userId: participant._id,
            starred: false,
          };

          console.log(`Note data to save:`, noteData);

          const note = new Note(noteData);
          const savedNote = await note.save();

          console.log(`Note saved with ID: ${savedNote._id}`);
          console.log(`Note userId: ${savedNote.userId}`);

          createdNotes.push(savedNote);
          console.log(
            `✅ Note created successfully for user ${participant._id}`
          );
        } catch (noteError) {
          console.error(
            `❌ Error creating note for participant ${participant._id}:`,
            noteError
          );
          console.error(`Error details:`, noteError.message);
        }
      }

      console.log(`Successfully created ${createdNotes.length} notes`);

      // Generate assessment after notes are created
      try {
        console.log("Generating assessment for session...");
        const aiAssessmentResponse = await fetch(
          "http://localhost:5001/api/generate-quiz",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content: `${session.title}\n${session.subject}\n${
                session.description || ""
              }`,
              num_questions: 5,
            }),
          }
        );

        if (aiAssessmentResponse.ok) {
          const aiAssessmentData = await aiAssessmentResponse.json();

          // Use the new structured format from the improved AI backend
          let questions = [];
          if (aiAssessmentData.quiz && aiAssessmentData.quiz.questions) {
            // New format - structured JSON
            questions = aiAssessmentData.quiz.questions.map((q) => ({
              question: q.question,
              options: q.options,
              correctAnswer: q.correct_answer,
              explanation: q.explanation,
            }));
          } else if (aiAssessmentData.quiz) {
            // Old format - parse the text content
            const quizContent = aiAssessmentData.quiz;
            const lines = quizContent.split("\n");
            let currentQuestion = null;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i].trim();

              // Check if this line starts a new question
              if (line.match(/^\d+\./) || line.match(/^Question/)) {
                if (currentQuestion) {
                  questions.push(currentQuestion);
                }

                currentQuestion = {
                  question: line,
                  options: [],
                  correctAnswer: "",
                  explanation: "",
                };
              } else if (
                currentQuestion &&
                (line.match(/^[A-D]\)/) || line.match(/^[A-D]\./))
              ) {
                currentQuestion.options.push(line);
              } else if (currentQuestion && line.match(/^Correct answer:/i)) {
                currentQuestion.correctAnswer = line.replace(
                  /^Correct answer:\s*/i,
                  ""
                );
              } else if (currentQuestion && line.match(/^Explanation:/i)) {
                currentQuestion.explanation = line.replace(
                  /^Explanation:\s*/i,
                  ""
                );
              } else if (currentQuestion && line.startsWith("Explanation:")) {
                currentQuestion.explanation = line.substring(12).trim();
              }
            }

            // Add the last question
            if (currentQuestion) {
              questions.push(currentQuestion);
            }
          }

          // Create assessment in database
          const assessment = new Assessment({
            sessionId: session._id,
            title: session.title,
            subject: session.subject,
            questions: questions.slice(0, 5), // Limit to 5 questions
            createdBy: session.createdBy,
          });

          await assessment.save();
          console.log("Assessment generated and saved successfully");
        } else {
          console.error("Failed to generate assessment from AI backend");
        }
      } catch (assessmentError) {
        console.error("Error generating assessment:", assessmentError);
      }

      res.json({
        message:
          "Session completed, notes generated, and assessment created for all participants",
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
