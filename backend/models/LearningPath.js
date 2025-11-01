const mongoose = require("mongoose");

const learningPathSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  skillLevel: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  duration: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
learningPathSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("LearningPath", learningPathSchema);