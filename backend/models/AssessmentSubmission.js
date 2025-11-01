const mongoose = require("mongoose");

const assessmentSubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assessment",
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudySession",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      selectedOption: {
        type: String,
        required: true,
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
    },
  ],
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  // This field will be used for TTL index to auto-delete submissions after session ends
  expireAt: {
    type: Date,
    required: true,
  },
});

// Index for efficient querying by sessionId and userId
assessmentSubmissionSchema.index({ sessionId: 1, userId: 1 });

// TTL index to automatically delete submissions after session ends
// Documents will be deleted shortly after the expireAt time
assessmentSubmissionSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model(
  "AssessmentSubmission",
  assessmentSubmissionSchema
);
