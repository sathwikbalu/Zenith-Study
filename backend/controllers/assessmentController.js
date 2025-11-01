const Assessment = require("../models/Assessment");
const AssessmentSubmission = require("../models/AssessmentSubmission");
const StudySession = require("../models/StudySession");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// @desc    Generate assessment for a completed session
// @route   POST /api/assessments/generate/:sessionId
// @access  Private (Tutor only)
const generateAssessment = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`Generating assessment for session ID: ${sessionId}`);

    // Only tutors can generate assessments
    if (req.user.role !== "tutor") {
      console.log(`User ${req.user._id} is not a tutor`);
      return res
        .status(403)
        .json({ message: "Only tutors can generate assessments" });
    }

    // Get the session
    const session = await StudySession.findById(sessionId);
    if (!session) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({ message: "Session not found" });
    }

    console.log(`Found session: ${session.title}, status: ${session.status}`);

    // Only the creator can generate assessment
    if (session.createdBy.toString() !== req.user._id.toString()) {
      console.log(
        `User ${req.user._id} is not the creator of session ${sessionId}`
      );
      return res.status(403).json({ message: "User not authorized" });
    }

    // Check if session is completed
    if (session.status !== "completed") {
      console.log(
        `Session ${sessionId} is not completed, status: ${session.status}`
      );
      return res.status(400).json({
        message: "Session must be completed to generate assessment",
        sessionStatus: session.status,
        sessionId: sessionId,
      });
    }

    // Check if assessment already exists for this session
    const existingAssessment = await Assessment.findOne({ sessionId });
    if (existingAssessment) {
      console.log(`Assessment already exists for session ${sessionId}`);
      return res.status(400).json({
        message: "Assessment already exists for this session",
        assessmentId: existingAssessment._id,
      });
    }

    // Generate MCQs using AI
    try {
      console.log("Calling AI backend to generate assessment...");
      const aiResponse = await fetch(
        "http://localhost:5001/api/generate-quiz",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: `${session.title}\n${session.subject}\n${session.description}`,
            num_questions: 5,
          }),
        }
      );

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error(`AI backend error: ${errorText}`);
        throw new Error(`AI backend error: ${errorText}`);
      }

      const aiData = await aiResponse.json();
      console.log("AI response received:", JSON.stringify(aiData, null, 2));

      // Use the new structured format from the improved AI backend
      let questions = [];
      if (aiData.quiz && aiData.quiz.questions) {
        // New format - structured JSON
        questions = aiData.quiz.questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
        }));
      } else if (aiData.quiz) {
        // Old format - parse the text content
        const quizContent = aiData.quiz;
        // Parse the quiz content to extract questions
        // This is a simplified parser - in a real application, you might want a more robust solution
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
            (currentQuestion && line.match(/^[A-D]\)/)) ||
            line.match(/^[A-D]\./)
          ) {
            currentQuestion.options.push(line);
          } else if (currentQuestion && line.match(/^Correct answer:/i)) {
            currentQuestion.correctAnswer = line.replace(
              /^Correct answer:\s*/i,
              ""
            );
          } else if (currentQuestion && line.match(/^Explanation:/i)) {
            currentQuestion.explanation = line.replace(/^Explanation:\s*/i, "");
          } else if (currentQuestion && line.startsWith("Explanation:")) {
            currentQuestion.explanation = line.substring(12).trim();
          }
        }

        // Add the last question
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
      }

      console.log(`Parsed ${questions.length} questions`);

      // Create assessment
      const assessment = new Assessment({
        sessionId,
        title: session.title,
        subject: session.subject,
        questions: questions.slice(0, 5), // Limit to 5 questions
        createdBy: req.user._id,
      });

      const createdAssessment = await assessment.save();
      console.log(`Assessment created with ID: ${createdAssessment._id}`);

      res.status(201).json({
        message: "Assessment generated successfully",
        assessment: createdAssessment,
      });
    } catch (aiError) {
      console.error("Error generating assessment:", aiError);
      res.status(500).json({
        message:
          "Failed to generate assessment. AI backend may not be running.",
        error: aiError.message,
      });
    }
  } catch (error) {
    console.error("Error in generateAssessment:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assessment by session ID
// @route   GET /api/assessments/session/:sessionId
// @access  Private
const getAssessmentBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    console.log(`Fetching assessment for session ID: ${sessionId}`);

    // First check if session exists
    const session = await StudySession.findById(sessionId);
    if (!session) {
      console.log(`Session ${sessionId} not found`);
      return res.status(404).json({
        message: "Session not found",
        sessionId: sessionId,
      });
    }

    console.log(`Found session: ${session.title}, status: ${session.status}`);

    const assessment = await Assessment.findOne({ sessionId }).populate(
      "createdBy",
      "name"
    );

    if (assessment) {
      console.log(`Found assessment: ${assessment._id}`);
      res.json(assessment);
    } else {
      console.log(`No assessment found for session ID: ${sessionId}`);
      res.status(404).json({
        message: "Assessment not found",
        sessionId: sessionId,
        sessionStatus: session.status,
      });
    }
  } catch (error) {
    console.error("Error in getAssessmentBySession:", error);
    res.status(500).json({
      message: error.message,
      error: error.toString(),
    });
  }
};

// @desc    Submit assessment answers
// @route   POST /api/assessments/submit
// @access  Private
const submitAssessment = async (req, res) => {
  try {
    const { assessmentId, answers } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    // Get the assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Get the session to find its end time for expiration
    const session = await StudySession.findById(assessment.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user has already submitted
    const existingSubmission = await AssessmentSubmission.findOne({
      assessmentId,
      userId,
    });

    if (existingSubmission) {
      return res.status(400).json({ message: "Assessment already submitted" });
    }

    // Evaluate answers
    let score = 0;
    const evaluatedAnswers = assessment.questions.map((question, index) => {
      const userAnswer = answers.find(
        (ans) => ans.questionId.toString() === question._id.toString()
      );

      const isCorrect =
        userAnswer && userAnswer.selectedOption === question.correctAnswer;

      if (isCorrect) {
        score++;
      }

      return {
        questionId: question._id,
        selectedOption: userAnswer ? userAnswer.selectedOption : "",
        isCorrect,
      };
    });

    // Create submission
    const submission = new AssessmentSubmission({
      assessmentId,
      sessionId: assessment.sessionId,
      userId,
      userName,
      answers: evaluatedAnswers,
      score,
      totalQuestions: assessment.questions.length,
      expireAt: session.endTime, // Submissions expire when session ends
    });

    const savedSubmission = await submission.save();

    res.status(201).json({
      message: "Assessment submitted successfully",
      submission: savedSubmission,
    });
  } catch (error) {
    console.error("Error in submitAssessment:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assessment submissions for a session (tutor only)
// @route   GET /api/assessments/submissions/:sessionId
// @access  Private (Tutor only)
const getSubmissionsBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Only tutors can view submissions
    if (req.user.role !== "tutor") {
      return res
        .status(403)
        .json({ message: "Only tutors can view submissions" });
    }

    // Get the session
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only the creator can view submissions
    if (session.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "User not authorized" });
    }

    const submissions = await AssessmentSubmission.find({ sessionId }).populate(
      "userId",
      "name"
    );

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's submission for an assessment
// @route   GET /api/assessments/submission/:assessmentId
// @access  Private
const getUserSubmission = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user._id;

    const submission = await AssessmentSubmission.findOne({
      assessmentId,
      userId,
    })
      .populate("assessmentId")
      .populate("userId", "name");

    if (submission) {
      res.json(submission);
    } else {
      res.status(404).json({ message: "Submission not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions for a user (for progress tracking)
// @route   GET /api/assessments/user/submissions
// @access  Private
const getUserSubmissions = async (req, res) => {
  try {
    const userId = req.user._id;

    const submissions = await AssessmentSubmission.find({ userId })
      .populate({
        path: "assessmentId",
        select: "title subject createdBy",
        populate: {
          path: "createdBy",
          select: "name",
        },
      })
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Error in getUserSubmissions:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateAssessment,
  getAssessmentBySession,
  submitAssessment,
  getSubmissionsBySession,
  getUserSubmission,
  getUserSubmissions,
};
